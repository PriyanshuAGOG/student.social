import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { deriveCallEncryptionMaterial, generateLiveKitToken } from '@/lib/livekit-service'
import { canAccessCall, isCallExpired, parseStringList, TERMINAL_CALL_STATES } from '@/lib/calls/domain'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'
import { z } from 'zod'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

async function findSession(databases: any, sessionId: string) {
  try {
    return await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)
  } catch (error: any) {
    if (error?.code === 404) return null
    throw error
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:session-token', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const durableLimit = await checkDurableRateLimit(`calls:token:${auth.userId}`, 30, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many call join attempts')
    const { sessionId } = await params
    const parsedSessionId = z.string().trim().min(1).max(255).safeParse(sessionId)
    if (!parsedSessionId.success) throw new ApiError(400, 'INVALID_INPUT', 'sessionId is invalid')
    const cleanSessionId = parsedSessionId.data

    const { databases } = await createAdminClient()
    const session = await findSession(databases, cleanSessionId)
    if (!session?.roomId) {
      throw new ApiError(404, 'CALL_NOT_FOUND', 'Call session not found')
    }
    if (!canAccessCall(session, auth.userId)) throw new ApiError(403, 'FORBIDDEN', 'You are not invited to this call')
    if (TERMINAL_CALL_STATES.has(session.state)) throw new ApiError(409, 'CALL_FINISHED', 'This call has finished')
    if (isCallExpired(session) && session.callerId !== auth.userId) throw new ApiError(410, 'CALL_EXPIRED', 'This call was not answered in time')

    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, session.roomId)
    const members = parseStringList(room?.members || room?.participants)
    if (!members.includes(auth.userId) || !canAccessCall(session, auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this call')
    }

    let displayName = 'PeerSpark user'
    let avatar = ''
    try {
      const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, auth.userId)
      displayName = profile?.name || profile?.username || profile?.email || displayName
      avatar = profile?.avatar || profile?.profilePictureUrl || ''
    } catch {
      // Profile data is optional for token creation.
    }

    const roomName = session.providerSessionId || session.roomName || cleanSessionId
    const encryption = deriveCallEncryptionMaterial(roomName)
    const token = await generateLiveKitToken({
      roomName,
      identity: auth.userId,
      displayName,
      metadata: {
        displayName,
        avatar,
        roomId: session.roomId,
        sessionId: session.$id || cleanSessionId,
      },
    })

    return NextResponse.json({
      success: true,
      token: token.token,
      url: token.url,
      identity: token.identity,
      roomName: token.roomName,
      encryption,
      canEndForEveryone: session.callerId === auth.userId,
      session: {
        $id: session.$id || cleanSessionId,
        roomId: session.roomId,
        mediaType: session.mediaType || 'video',
        state: session.state || 'ringing',
      },
    }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    if (String(error?.message || '').includes('LiveKit configuration missing') || String(error?.message || '').includes('Call E2EE configuration missing')) {
      return NextResponse.json({ success: false, error: 'Calling is not configured. Set LiveKit environment variables before starting calls.' }, { status: 503 })
    }

    console.error('[calls/sessions token] Failed to issue token:', error)
    return NextResponse.json({ success: false, error: 'Failed to prepare call room' }, { status: 500 })
  }
}
