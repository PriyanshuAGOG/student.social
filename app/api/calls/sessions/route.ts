import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

function parseMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.filter(Boolean)
  if (typeof room?.members === 'string') {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function buildJoinUrl(sessionId: string): string {
  return `https://meet.jit.si/student-social-${sessionId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

function normalizeMediaType(input: unknown): 'voice' | 'video' {
  return input === 'voice' ? 'voice' : 'video'
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:create-session', max: 30, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const body = await req.json().catch(() => ({}))
    const roomId = String(body?.roomId || '').trim()
    const mediaType = normalizeMediaType(body?.mediaType)

    if (!roomId) {
      throw new ApiError(400, 'INVALID_INPUT', 'roomId is required')
    }

    const { databases } = await createAdminClient()
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
    const members = parseMembers(room)

    if (!members.includes(auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this conversation')
    }

    const participantIds = members.filter((memberId) => memberId && memberId !== auth.userId)
    if (participantIds.length === 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'No participants available for this call')
    }

    const startedAt = new Date().toISOString()
    const providerSessionId = `student-social-${roomId}-${Date.now()}`
    const joinUrl = buildJoinUrl(providerSessionId)

    let callerName = 'Someone'
    try {
      const callerProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, auth.userId)
      callerName = callerProfile?.name || callerName
    } catch {
      // Use fallback display name if the profile lookup fails.
    }

    const session = await databases.createDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, 'unique()', {
      roomId,
      callerId: auth.userId,
      participantIds,
      mediaType,
      provider: 'jitsi',
      providerSessionId,
      joinUrl,
      state: 'ringing',
      startedAt,
      lastActivityAt: startedAt,
      ringTimeoutAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: startedAt,
      updatedAt: startedAt,
    })

    await databases.createDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, 'unique()', {
      callSessionId: session.$id,
      roomId,
      userId: auth.userId,
      role: 'caller',
      state: 'joined',
      joinedAt: startedAt,
      muted: mediaType === 'video' ? false : false,
      videoEnabled: mediaType === 'video',
      connectionState: 'connected',
      createdAt: startedAt,
      updatedAt: startedAt,
    })

    for (const participantId of participantIds) {
      await databases.createDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, 'unique()', {
        callSessionId: session.$id,
        roomId,
        userId: participantId,
        role: 'guest',
        state: 'invited',
        muted: false,
        videoEnabled: mediaType === 'video',
        connectionState: 'waiting',
        createdAt: startedAt,
        updatedAt: startedAt,
      })

      try {
        await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, 'unique()', {
          userId: participantId,
          title: `${callerName} is calling`,
          message: `${callerName} started a ${mediaType} call`,
          type: 'call',
          timestamp: startedAt,
          isRead: false,
          actionUrl: joinUrl,
          actorId: auth.userId,
          actorName: callerName,
          metadata: JSON.stringify({ roomId, sessionId: session.$id, mediaType }),
        })
      } catch (notificationError) {
        console.error('[calls/sessions] Failed to create call notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      session,
      joinUrl,
      participants: participantIds,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to create call session:', error)
    return NextResponse.json({ success: false, error: 'Failed to create call session' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req)
    const roomId = req.nextUrl.searchParams.get('roomId')?.trim()
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20, 100)

    const { databases } = await createAdminClient()
    const query = roomId
      ? [Query.equal('roomId', roomId), Query.orderDesc('startedAt'), Query.limit(limit)]
      : [Query.orderDesc('startedAt'), Query.limit(limit)]

    const sessions = await databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, query)

    const visibleSessions = (sessions.documents || []).filter((session: any) => {
      if (roomId && session.roomId !== roomId) return false
      const participants = Array.isArray(session.participantIds) ? session.participantIds : []
      return session.callerId === auth.userId || participants.includes(auth.userId)
    })

    return NextResponse.json({ success: true, sessions: visibleSessions, total: visibleSessions.length })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to fetch call sessions:', error)
    return NextResponse.json({ success: false, error: 'Failed to load call sessions' }, { status: 500 })
  }
}