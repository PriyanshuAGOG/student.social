import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Query, Role } from 'node-appwrite'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'
import { parseStringList } from '@/lib/calls/domain'
import { sendIncomingCallPush } from '@/lib/server/web-push'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

const createCallSchema = z.object({
  roomId: z.string().trim().min(1).max(255),
  mediaType: z.enum(['voice', 'video']).default('video'),
  roomTitle: z.string().trim().min(1).max(120).optional(),
})

function buildJoinUrl(sessionId: string, mediaType: 'voice' | 'video' = 'video'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || ''
  const appBaseUrl = baseUrl.startsWith('http') ? baseUrl : baseUrl ? `https://${baseUrl}` : ''
  return `${appBaseUrl}/app/chat?call=${encodeURIComponent(sessionId)}&callType=${encodeURIComponent(mediaType)}`
}

function isNotFound(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 404 || message.includes('not found') || message.includes('could not be found')
}


function internalError(message: string, error: any) {
  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' ? `${message}: ${error?.message || 'Unknown error'}` : message,
    },
    { status: 500 },
  )
}

async function getRoomForMember(databases: any, roomId: string, userId: string) {
  let room
  try {
    room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
  } catch (error: any) {
    if (isNotFound(error)) {
      throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
    }
    throw error
  }

  const members = parseStringList(room?.members || room?.participants)
  if (!members.includes(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this conversation')
  }

  return { room, members }
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:create-session', max: 30, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const durableLimit = await checkDurableRateLimit(`calls:create:${auth.userId}`, 12, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many calls started; wait before trying again')
    const { roomId, mediaType, roomTitle } = await parseJsonBody(req, createCallSchema, 4096)

    const { databases, users } = await createAdminClient()
    const { members } = await getRoomForMember(databases, roomId, auth.userId)

    const invitedParticipantIds = members.filter((memberId) => memberId && memberId !== auth.userId)
    const participantIds = invitedParticipantIds
    const isSoloFallback = invitedParticipantIds.length === 0

    const startedAt = new Date().toISOString()
    const sessionId = ID.unique()
    const providerSessionId = `student-social-${sessionId}`
    const joinUrl = buildJoinUrl(sessionId, mediaType)
    const readPermissions = members.map((memberId) => Permission.read(Role.user(memberId)))

    let callerName = 'Someone'
    let callerAvatar: string | null = null
    try {
      const callerProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, auth.userId)
      callerName = callerProfile?.name || callerName
      callerAvatar = callerProfile?.profilePictureUrl || callerProfile?.avatar || null
    } catch {
      // Use fallback display name if the profile lookup fails.
    }

    const session = await databases.createDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, sessionId, {
        roomId,
        ...(roomTitle ? { roomTitle } : {}),
        callerId: auth.userId,
        participantIds,
        mediaType,
        provider: 'livekit',
        providerSessionId,
        joinUrl,
        state: 'ringing',
        startedAt,
        lastActivityAt: startedAt,
        ringTimeoutAt: new Date(Date.now() + 60_000).toISOString(),
        createdAt: startedAt,
        updatedAt: startedAt,
      }, readPermissions)

    try {
      await databases.createDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, ID.unique(), {
        callSessionId: session.$id,
        roomId,
        userId: auth.userId,
        role: 'caller',
        state: 'joined',
        joinedAt: startedAt,
        muted: false,
        videoEnabled: mediaType === 'video',
        connectionState: 'connected',
        createdAt: startedAt,
        updatedAt: startedAt,
      }, readPermissions)

      await Promise.all(participantIds.map((participantId) =>
        databases.createDocument(DATABASE_ID, CALL_PARTICIPANTS_COLLECTION_ID, ID.unique(), {
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
        }, readPermissions),
      ))
    } catch (participantError: any) {
      await databases.updateDocument(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, session.$id, {
        state: 'failed',
        endedAt: new Date().toISOString(),
        endedReason: 'participant_state_write_failed',
        updatedAt: new Date().toISOString(),
      }).catch(() => undefined)
      throw participantError
    }

    await Promise.allSettled(participantIds.map(async (participantId) => {
      await Promise.allSettled([
        databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
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
        }),
        sendIncomingCallPush(users, participantId, {
          sessionId: session.$id,
          callerName,
          callerAvatar,
          mediaType: mediaType || 'video',
          joinUrl,
        }),
      ])
    }))

    return NextResponse.json({
      success: true,
      session,
      joinUrl,
      participants: isSoloFallback ? [auth.userId] : participantIds,
      invitedParticipants: participantIds,
      participantMessage: isSoloFallback ? 'You are alone in this room, so the call was started solo.' : undefined,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[calls/sessions POST] Failed to create call session:', error)
    return internalError('Failed to create call session', error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req)
    const roomId = req.nextUrl.searchParams.get('roomId')?.trim()
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20, 100)

    if (!roomId) {
      throw new ApiError(400, 'INVALID_INPUT', 'roomId is required')
    }

    const { databases } = await createAdminClient()
    await getRoomForMember(databases, roomId, auth.userId)

    const sessions = await databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
      Query.equal('roomId', roomId),
      Query.orderDesc('startedAt'),
      Query.limit(limit),
    ])

    const visibleSessions = (sessions.documents || []).filter((session: any) => {
      const participants = parseStringList(session.participantIds)
      return session.callerId === auth.userId || participants.includes(auth.userId)
    })

    return NextResponse.json({ success: true, sessions: visibleSessions, total: visibleSessions.length })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[calls/sessions GET] Failed to fetch call sessions:', error)
    return internalError('Failed to load call sessions', error)
  }
}
