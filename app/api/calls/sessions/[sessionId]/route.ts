import { after, NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api-security'
import { assertCallActionAllowed, canAccessCall, getSessionUpdates, hasRemainingCallParticipants, parseStringList, shouldEndCallWhenParticipantLeaves } from '@/lib/calls/domain'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'
import { sendCallResolvedPush } from '@/lib/server/web-push'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const auth = requireUser(req)
    const { sessionId } = await params
    const { databases } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)

    if (!canAccessCall(session, auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not allowed to view this call session')
    }

    const participants = await databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
      Query.equal('callSessionId', sessionId),
    ])
    const sessionParticipants = (participants.documents || []).filter((participant: any) => participant.callSessionId === sessionId)

    return NextResponse.json({ success: true, session, participants: sessionParticipants })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to fetch call session:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch call session' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:update-session', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const durableLimit = await checkDurableRateLimit(`calls:update:${auth.userId}`, 90, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many call updates')
    const { sessionId } = await params
    const body = await parseJsonBody(req, z.object({ action: z.enum(['accept', 'decline', 'end', 'join', 'leave']), reason: z.string().trim().max(255).optional() }))
    const action = body.action

    const { databases, users } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)

    if (!canAccessCall(session, auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not allowed to update this call session')
    }

    const now = new Date().toISOString()
    let updates: Record<string, any>
    try {
      assertCallActionAllowed(session, auth.userId, action)
      updates = getSessionUpdates(session, auth.userId, action, now, body.reason)
    } catch (transitionError: any) {
      const code = String(transitionError?.message || '')
      if (code === 'CALL_ACCESS_DENIED') throw new ApiError(403, 'FORBIDDEN', 'You are not allowed to update this call session')
      if (code === 'CALL_END_REQUIRES_CALLER') throw new ApiError(403, 'FORBIDDEN', 'Only the caller can end the call for everyone')
      if (code === 'CALL_ALREADY_FINISHED') throw new ApiError(409, 'CALL_ALREADY_FINISHED', 'This call has already finished')
      throw new ApiError(409, 'INVALID_CALL_TRANSITION', 'That action is not valid for the current call state')
    }

    if (action === 'join' || action === 'leave' || action === 'accept' || action === 'decline') {
      const participants = await databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('callSessionId', sessionId),
      ])
      const participantRecord = (participants.documents || []).find((participant: any) => participant.userId === auth.userId)

      if (!participantRecord) throw new ApiError(409, 'PARTICIPANT_STATE_MISSING', 'Call participant state is missing')
      const joined = action === 'join' || action === 'accept'
      await databases.updateDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, participantRecord.$id, {
          state: joined ? 'joined' : action === 'decline' ? 'declined' : 'left',
          joinedAt: joined ? participantRecord.joinedAt || now : participantRecord.joinedAt,
          leftAt: action === 'leave' ? now : participantRecord.leftAt,
          connectionState: joined ? 'connected' : 'disconnected',
          updatedAt: now,
      })

      if (action === 'leave') {
        if (shouldEndCallWhenParticipantLeaves(session, auth.userId)) {
          updates = { ...updates, state: 'ended', endedAt: now, endedReason: 'participant_left' }
        } else if (!hasRemainingCallParticipants(participants.documents || [], auth.userId)) {
          updates = { ...updates, state: 'ended', endedAt: now, endedReason: 'last_participant_left' }
        }
      }

      if (action === 'decline' && parseStringList(session.participantIds).length > 1) {
        const remaining = (participants.documents || []).filter((participant: any) =>
          participant.userId !== auth.userId && ['invited', 'joined'].includes(participant.state),
        )
        if (remaining.length === 0) {
          updates = { ...updates, state: 'declined', declinedAt: now, endedAt: now, endedReason: 'all_declined' }
        }
      }
    }

    const updatedSession = await databases.updateDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId, updates)

    if (action === 'end' || action === 'decline' || updates.state === 'ended') {
      const recipients = new Set([session.callerId, ...parseStringList(session.participantIds)])
      recipients.delete(auth.userId)
      after(async () => {
        await Promise.allSettled(Array.from(recipients).map((participantId) =>
          sendCallResolvedPush(users, participantId, { sessionId, roomTitle: session.roomTitle }),
        ))
      })
    }

    return NextResponse.json({ success: true, session: updatedSession })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to update call session:', error)
    return NextResponse.json({ success: false, error: 'Failed to update call session' }, { status: 500 })
  }
}
