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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || ''
  const appBaseUrl = baseUrl.startsWith('http') ? baseUrl : baseUrl ? `https://${baseUrl}` : ''
  return `${appBaseUrl}/app/chat?call=${encodeURIComponent(sessionId)}`
}

function normalizeMediaType(input: unknown): 'voice' | 'video' {
  return input === 'voice' ? 'voice' : 'video'
}

function isNotFound(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 404 || message.includes('not found') || message.includes('could not be found')
}


function getUnknownAttribute(error: any): string | null {
  const message = String(error?.message || '')
  return message.match(/Unknown attribute:\s*"([^"]+)"/)?.[1] || null
}

function isSchemaOrCollectionError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 401 || error?.code === 403 || isNotFound(error) || Boolean(getUnknownAttribute(error)) || message.includes('attribute') || message.includes('collection') || message.includes('index') || message.includes('permission')
}

async function createDocumentWithSchemaRetry(databases: any, collectionId: string, payload: Record<string, unknown>) {
  const data = { ...payload }
  const removed = new Set<string>()

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await databases.createDocument(DATABASE_ID, collectionId, 'unique()', data)
    } catch (error: any) {
      const unknownAttribute = getUnknownAttribute(error)
      if (!unknownAttribute || removed.has(unknownAttribute)) throw error
      removed.add(unknownAttribute)
      delete data[unknownAttribute]
    }
  }

  throw new Error(`Unable to create ${collectionId} after schema compatibility retries`)
}

function buildEphemeralSession(roomId: string, callerId: string, mediaType: 'voice' | 'video', startedAt: string, providerSessionId: string, joinUrl: string) {
  return {
    $id: providerSessionId,
    roomId,
    callerId,
    participantIds: [],
    mediaType,
    provider: 'livekit',
    providerSessionId,
    joinUrl,
    state: 'ringing',
    startedAt,
    lastActivityAt: startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    degraded: true,
  }
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

  const members = parseMembers(room)
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
    const body = await req.json().catch(() => ({}))
    const roomId = String(body?.roomId || '').trim()
    const mediaType = normalizeMediaType(body?.mediaType)

    if (!roomId) {
      throw new ApiError(400, 'INVALID_INPUT', 'roomId is required')
    }

    const { databases } = await createAdminClient()
    const { members } = await getRoomForMember(databases, roomId, auth.userId)

    const invitedParticipantIds = members.filter((memberId) => memberId && memberId !== auth.userId)
    const participantIds = invitedParticipantIds
    const isSoloFallback = invitedParticipantIds.length === 0

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

    let session
    try {
      session = await createDocumentWithSchemaRetry(databases, CALL_SESSIONS_COLLECTION_ID, {
        roomId,
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
      })
    } catch (sessionError: any) {
      if (!isSchemaOrCollectionError(sessionError)) throw sessionError
      console.warn('[calls/sessions POST] Durable call session unavailable; returning ephemeral call:', sessionError?.message || sessionError)
      session = buildEphemeralSession(roomId, auth.userId, mediaType, startedAt, providerSessionId, joinUrl)
    }

    try {
      await createDocumentWithSchemaRetry(databases, CALL_PARTICIPANTS_COLLECTION_ID, {
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
      })
    } catch (participantError: any) {
      console.warn('[calls/sessions POST] Caller participant write skipped:', participantError?.message || participantError)
    }

    for (const participantId of participantIds) {
      try {
        await createDocumentWithSchemaRetry(databases, CALL_PARTICIPANTS_COLLECTION_ID, {
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
      } catch (participantError: any) {
        console.warn('[calls/sessions POST] Guest participant write skipped:', participantError?.message || participantError)
      }

      try {
        await createDocumentWithSchemaRetry(databases, NOTIFICATIONS_COLLECTION_ID, {
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

    let sessions: any = { documents: [] }
    try {
      sessions = await databases.listDocuments(DATABASE_ID, CALL_SESSIONS_COLLECTION_ID, [
        Query.equal('roomId', roomId),
        Query.orderDesc('startedAt'),
        Query.limit(limit),
      ])
    } catch (sessionsError: any) {
      if (!isSchemaOrCollectionError(sessionsError)) throw sessionsError
      console.warn('[calls/sessions GET] Durable call history unavailable; returning empty history:', sessionsError?.message || sessionsError)
      return NextResponse.json({ success: true, degraded: true, sessions: [], total: 0 })
    }

    const visibleSessions = (sessions.documents || []).filter((session: any) => {
      const participants = Array.isArray(session.participantIds) ? session.participantIds : []
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
