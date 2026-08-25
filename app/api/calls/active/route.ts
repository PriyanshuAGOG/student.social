import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { requireUser, enforceRateLimit, ApiError } from '@/lib/api-security'
import { parseStringList, shouldSurfaceActiveCall } from '@/lib/calls/domain'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

function normalizeCall(session: any, userId: string, caller: any) {
  const mediaType = session.mediaType === 'voice' ? 'voice' : 'video'
  return {
    ...session,
    id: session.$id,
    chatId: session.roomId,
    roomName: session.providerSessionId,
    callType: mediaType === 'voice' ? 'audio' : 'video',
    status: session.state === 'active' ? 'accepted' : session.state,
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

    const [asCaller, participantRecords] = await Promise.all([
      databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
        Query.equal('callerId', auth.userId),
        Query.equal('state', ['ringing', 'active']),
        Query.orderDesc('startedAt'),
        Query.limit(25),
      ]),
      databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('userId', auth.userId),
        Query.equal('state', ['invited', 'joined']),
        Query.limit(25),
      ]),
    ])

    const participantSessions = await Promise.all(
      (participantRecords.documents || []).map((participant: any) =>
        databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, participant.callSessionId).catch(() => null),
      ),
    )
    const activeParticipantSessionIds = new Set(
      (participantRecords.documents || []).map((participant: any) => participant.callSessionId),
    )

    const sessions = new Map<string, any>()
    for (const session of [...(asCaller.documents || []), ...participantSessions]) {
      if (session && shouldSurfaceActiveCall(session, activeParticipantSessionIds)) sessions.set(session.$id, session)
    }

    const callerProfiles = new Map<string, any>()
    const calls = await Promise.all(Array.from(sessions.values()).map(async (session) => {
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
      return normalizeCall(session, auth.userId, caller)
    }))

    return NextResponse.json({ success: true, calls, count: calls.length }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[Calls Active API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch active calls' }, { status: 500 })
  }
}
