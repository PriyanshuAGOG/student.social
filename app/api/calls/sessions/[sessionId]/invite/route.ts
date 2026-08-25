import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Query, Role } from 'node-appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'
import { canAccessCall, parseStringList, TERMINAL_CALL_STATES } from '@/lib/calls/domain'
import { createAdminClient } from '@/lib/server/appwrite'
import { sendIncomingCallPush } from '@/lib/server/web-push'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

function profileSummary(profile: any, invited: Set<string>) {
  return {
    userId: profile.$id,
    name: profile.name || profile.username || 'Student.social member',
    username: profile.username || '',
    avatar: profile.profilePictureUrl || profile.avatar || null,
    invited: invited.has(profile.$id),
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const auth = requireUser(req)
    const { sessionId } = await params
    const query = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase().slice(0, 80)
    const { databases } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)
    if (!canAccessCall(session, auth.userId)) throw new ApiError(403, 'FORBIDDEN', 'You are not part of this call')
    if (TERMINAL_CALL_STATES.has(session.state)) throw new ApiError(409, 'CALL_FINISHED', 'This call has finished')

    const result = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID, [Query.limit(100)])
    const invited = new Set([session.callerId, ...parseStringList(session.participantIds)])
    const candidates = (result.documents || [])
      .filter((profile: any) => profile.$id !== auth.userId)
      .filter((profile: any) => !query || `${profile.name || ''} ${profile.username || ''}`.toLowerCase().includes(query))
      .slice(0, 30)
      .map((profile: any) => profileSummary(profile, invited))

    return NextResponse.json({ success: true, candidates })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[calls/invite GET] Failed to load candidates:', error)
    return NextResponse.json({ success: false, error: 'Failed to load people' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:invite-participant', max: 30, windowMs: 60_000 })
    const auth = requireUser(req)
    const { sessionId } = await params
    const { userId } = await parseJsonBody(req, z.object({ userId: z.string().trim().min(1).max(255) }), 2048)
    if (userId === auth.userId) throw new ApiError(400, 'INVALID_INPUT', 'You are already in this call')

    const { databases, users } = await createAdminClient()
    const session = await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)
    if (!canAccessCall(session, auth.userId)) throw new ApiError(403, 'FORBIDDEN', 'You are not part of this call')
    if (TERMINAL_CALL_STATES.has(session.state)) throw new ApiError(409, 'CALL_FINISHED', 'This call has finished')

    const targetProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId).catch(() => null)
    if (!targetProfile) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'That person could not be found')

    const participantIds = Array.from(new Set([...parseStringList(session.participantIds), userId]))
    const permittedUserIds = Array.from(new Set([session.callerId, ...participantIds]))
    const permissions = permittedUserIds.map((id) => Permission.read(Role.user(id)))
    const now = new Date().toISOString()

    const participantResult = await databases.listDocuments(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, [
      Query.equal('callSessionId', sessionId),
      Query.equal('userId', userId),
      Query.limit(1),
    ])
    const existingParticipant = participantResult.documents?.[0]
    if (existingParticipant) {
      await databases.updateDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, existingParticipant.$id, {
        state: existingParticipant.state === 'joined' ? 'joined' : 'invited',
        connectionState: existingParticipant.state === 'joined' ? 'connected' : 'waiting',
        updatedAt: now,
      }, permissions)
    } else {
      await databases.createDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, ID.unique(), {
        callSessionId: sessionId,
        roomId: session.roomId,
        userId,
        role: 'guest',
        state: 'invited',
        muted: false,
        videoEnabled: session.mediaType === 'video',
        connectionState: 'waiting',
        createdAt: now,
        updatedAt: now,
      }, permissions)
    }

    const updatedSession = await databases.updateDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId, {
      participantIds,
      lastActivityAt: now,
      updatedAt: now,
    }, permissions)

    const inviterProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, auth.userId).catch(() => null)
    const callerName = inviterProfile?.name || inviterProfile?.username || 'Someone'
    const joinUrl = session.joinUrl || `/app/chat?call=${encodeURIComponent(sessionId)}`
    await Promise.allSettled([
      databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
        userId,
        title: `${callerName} invited you to a call`,
        message: `Join the ${session.mediaType === 'video' ? 'video' : 'voice'} call now`,
        type: 'call',
        timestamp: now,
        isRead: false,
        actionUrl: joinUrl,
        actorId: auth.userId,
        actorName: callerName,
        metadata: JSON.stringify({ roomId: session.roomId, sessionId, mediaType: session.mediaType }),
      }),
      sendIncomingCallPush(users, userId, {
        sessionId,
        callerName,
        callerAvatar: inviterProfile?.profilePictureUrl || inviterProfile?.avatar || null,
        mediaType: session.mediaType === 'voice' ? 'voice' : 'video',
        joinUrl,
      }),
    ])

    return NextResponse.json({ success: true, session: updatedSession, participant: profileSummary(targetProfile, new Set(participantIds)) })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[calls/invite POST] Failed to invite participant:', error)
    return NextResponse.json({ success: false, error: 'Failed to invite participant' }, { status: 500 })
  }
}
