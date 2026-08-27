import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { requireUser, enforceRateLimit, ApiError } from '@/lib/api-security'
import { isCallExpired, isParticipantInvitationCurrent, parseStringList, shouldSurfaceActiveCall, TERMINAL_CALL_STATES } from '@/lib/calls/domain'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'
function normalizeCall(session: any, userId: string, caller: any, participantState?: string) {
  const mediaType = session.mediaType === 'voice' ? 'voice' : 'video'
  const effectiveState = session.callerId !== userId && participantState === 'invited' ? 'ringing' : session.state
  return {
    ...session,
    id: session.$id,
    chatId: session.roomId,
    roomName: session.providerSessionId,
    callType: mediaType === 'voice' ? 'audio' : 'video',
    state: effectiveState,
    status: effectiveState === 'active' ? 'accepted' : effectiveState,
    direction: session.callerId === userId ? 'outgoing' : 'incoming',
    participantIds: parseStringList(session.participantIds),
    caller,
  }
}

export async function GET(req: NextRequest) {
  try {
    enforceRateLimit(req, { key: 'calls:active', max: 60, windowMs: 60_000 })
    const auth = requireUser(req)
    const { databases } = await createAdminClient()

    const [asCaller, asCallerResolved, activeParticipantRecords, resolvedParticipantRecords] = await Promise.all([
      databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
        Query.equal('callerId', auth.userId),
        Query.equal('state', ['ringing', 'active']),
        Query.orderDesc('startedAt'),
        Query.limit(25),
      ]),
      databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
        Query.equal('callerId', auth.userId),
        Query.equal('state', Array.from(TERMINAL_CALL_STATES)),
        Query.orderDesc('startedAt'),
        Query.limit(10),
      ]),
      databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('userId', auth.userId),
        Query.equal('state', ['invited', 'joined']),
        Query.limit(25),
      ]),
      databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('userId', auth.userId),
        Query.equal('state', ['declined', 'left']),
        Query.limit(10),
      ]),
    ])

    const participantRecords = {
      documents: [...(activeParticipantRecords.documents || []), ...(resolvedParticipantRecords.documents || [])],
    }

    const participantSessions = await Promise.all(
      (participantRecords.documents || []).map((participant: any) =>
        databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, participant.callSessionId).catch(() => null),
      ),
    )
    const now = Date.now()
    const uniqueSessions = new Map<string, any>()
    for (const session of [...(asCaller.documents || []), ...(asCallerResolved.documents || []), ...participantSessions]) {
      if (session?.$id) uniqueSessions.set(session.$id, session)
    }

    // Ring timeouts are resolved lazily by whichever participant checks first.
    // The update emits a realtime event, so both sides close without a cron job.
    for (const [sessionId, session] of uniqueSessions) {
      if (!isCallExpired(session, now)) continue
      const endedAt = new Date(now).toISOString()
      const resolved = await databases.updateDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId, {
        state: 'missed',
        endedAt,
        endedReason: 'no_answer',
        lastActivityAt: endedAt,
        updatedAt: endedAt,
      }).catch(() => null)
      if (resolved) uniqueSessions.set(sessionId, resolved)
    }

    const sessionById = new Map(Array.from(uniqueSessions.values()).map((session: any) => [session.$id, session]))
    const activeParticipantSessionIds = new Set(
      (participantRecords.documents || [])
        // An old invited participant row must never replay as a fresh call on login.
        .filter((participant: any) => isParticipantInvitationCurrent(participant, sessionById.get(participant.callSessionId), now))
        .map((participant: any) => participant.callSessionId),
    )
    const participantStateBySessionId = new Map(
      (participantRecords.documents || []).map((participant: any) => [participant.callSessionId, participant.state]),
    )

    const sessions = new Map<string, any>()
    for (const session of uniqueSessions.values()) {
      if (session && shouldSurfaceActiveCall(session, activeParticipantSessionIds, now)) sessions.set(session.$id, session)
    }

    const callerProfiles = new Map<string, any>()
    const calls = await Promise.all(Array.from(sessions.values()).sort((a, b) => Date.parse(b.startedAt || '') - Date.parse(a.startedAt || '')).map(async (session) => {
      let caller = callerProfiles.get(session.callerId)
      if (!caller) {
        try {
          const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, session.callerId)
          caller = { id: profile.$id, name: profile.name || profile.username || 'User', avatar: profile.profilePictureUrl || profile.avatar || null }
        } catch {
          caller = { id: session.callerId, name: 'User', avatar: null }
        }
        callerProfiles.set(session.callerId, caller)
      }
      return normalizeCall(session, auth.userId, caller, participantStateBySessionId.get(session.$id))
    }))

    const recentCutoff = now - 5 * 60_000
    const resolvedCalls = await Promise.all(Array.from(uniqueSessions.values())
      .filter((session: any) => {
        const resolvedAt = Date.parse(String(session.endedAt || session.updatedAt || ''))
        return TERMINAL_CALL_STATES.has(session.state) && Number.isFinite(resolvedAt) && resolvedAt >= recentCutoff
      })
      .sort((a: any, b: any) => Date.parse(b.endedAt || b.updatedAt || '') - Date.parse(a.endedAt || a.updatedAt || ''))
      .map(async (session: any) => {
        let caller = callerProfiles.get(session.callerId)
        if (!caller) {
          try {
            const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, session.callerId)
            caller = { id: profile.$id, name: profile.name || profile.username || 'User', avatar: profile.profilePictureUrl || profile.avatar || null }
          } catch {
            caller = { id: session.callerId, name: 'User', avatar: null }
          }
          callerProfiles.set(session.callerId, caller)
        }
        return normalizeCall(session, auth.userId, caller, participantStateBySessionId.get(session.$id))
      }))

    return NextResponse.json({ success: true, calls, resolvedCalls, count: calls.length }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[Calls Active API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch active calls' }, { status: 500 })
  }
}
