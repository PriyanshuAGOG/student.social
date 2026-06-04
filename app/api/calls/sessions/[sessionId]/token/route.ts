import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { generateLiveKitToken } from '@/lib/livekit-service'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

function parseMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.filter(Boolean)
  if (Array.isArray(room?.participants)) return room.participants.filter(Boolean)
  if (typeof room?.members === 'string') {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  if (typeof room?.participants === 'string') {
    try {
      const parsed = JSON.parse(room.participants)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function parseRoomIdFromProviderSession(sessionId: string): string | null {
  const prefix = 'student-social-'
  if (!sessionId.startsWith(prefix)) return null
  const withoutPrefix = sessionId.slice(prefix.length)
  const lastDash = withoutPrefix.lastIndexOf('-')
  if (lastDash <= 0) return null
  return withoutPrefix.slice(0, lastDash)
}

async function findSession(databases: any, sessionId: string) {
  try {
    return await databases.getDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId)
  } catch {
    const byProvider = await databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
      Query.equal('providerSessionId', sessionId),
      Query.limit(1),
    ]).catch(() => ({ documents: [] }))
    if (byProvider.documents?.[0]) return byProvider.documents[0]
  }

  const fallbackRoomId = parseRoomIdFromProviderSession(sessionId)
  if (!fallbackRoomId) return null
  return {
    $id: sessionId,
    roomId: fallbackRoomId,
    mediaType: 'video',
    provider: 'livekit',
    providerSessionId: sessionId,
    state: 'ringing',
    degraded: true,
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:session-token', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const { sessionId } = await params
    const cleanSessionId = String(sessionId || '').trim()
    if (!cleanSessionId) {
      throw new ApiError(400, 'INVALID_INPUT', 'sessionId is required')
    }

    const { databases } = await createAdminClient()
    const session = await findSession(databases, cleanSessionId)
    if (!session?.roomId) {
      throw new ApiError(404, 'CALL_NOT_FOUND', 'Call session not found')
    }

    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, session.roomId)
    const members = parseMembers(room)
    if (!members.includes(auth.userId) && session.callerId !== auth.userId) {
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
      session: {
        $id: session.$id || cleanSessionId,
        roomId: session.roomId,
        mediaType: session.mediaType || 'video',
        state: session.state || 'ringing',
      },
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    if (String(error?.message || '').includes('LiveKit configuration missing')) {
      return NextResponse.json({ success: false, error: 'Calling is not configured. Set LiveKit environment variables before starting calls.' }, { status: 503 })
    }

    console.error('[calls/sessions token] Failed to issue token:', error)
    return NextResponse.json({ success: false, error: 'Failed to prepare call room' }, { status: 500 })
  }
}
