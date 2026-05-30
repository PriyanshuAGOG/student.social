import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'

function canAccessSession(session: any, userId: string): boolean {
  const participantIds = Array.isArray(session?.participantIds) ? session.participantIds : []
  return session?.callerId === userId || participantIds.includes(userId)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const auth = requireUser(req)
    const { sessionId } = await params
    const { databases } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)

    if (!canAccessSession(session, auth.userId)) {
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
    const { sessionId } = await params
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()

    if (!action) {
      throw new ApiError(400, 'INVALID_INPUT', 'action is required')
    }

    const { databases } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)

    if (!canAccessSession(session, auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not allowed to update this call session')
    }

    const now = new Date().toISOString()
    const updates: Record<string, any> = {
      lastActivityAt: now,
      updatedAt: now,
    }

    if (action === 'accept') {
      updates.state = 'active'
      updates.acceptedAt = now
    } else if (action === 'decline') {
      updates.state = 'declined'
      updates.declinedAt = now
      updates.endedAt = now
      updates.endedReason = 'declined'
    } else if (action === 'end') {
      updates.state = 'ended'
      updates.endedAt = now
      updates.endedReason = String(body?.reason || 'ended')
    } else if (action === 'join') {
      updates.state = session.state === 'ringing' ? 'active' : session.state
    } else if (action === 'leave') {
      updates.state = session.state === 'active' ? 'active' : session.state
    } else {
      throw new ApiError(400, 'INVALID_INPUT', 'Unsupported action')
    }

    const updatedSession = await databases.updateDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId, updates)

    if (action === 'join' || action === 'leave') {
      const participants = await databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('callSessionId', sessionId),
      ])
      const participantRecord = (participants.documents || []).find((participant: any) => participant.userId === auth.userId)

      if (participantRecord) {
        await databases.updateDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, participantRecord.$id, {
          state: action === 'join' ? 'joined' : 'left',
          joinedAt: action === 'join' ? participantRecord.joinedAt || now : participantRecord.joinedAt,
          leftAt: action === 'leave' ? now : participantRecord.leftAt || null,
          updatedAt: now,
        })
      }
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