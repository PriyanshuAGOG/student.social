import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Query, Role } from 'node-appwrite'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_PRESENCE_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_PRESENCE_COLLECTION_ID || 'chat_presence'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID || process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

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

function isNotFound(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 404 || message.includes('not found') || message.includes('could not be found')
}

async function writePresenceDocument(
  databases: any,
  existingId: string | null,
  payload: Record<string, unknown>,
  permissions: string[],
  createOnlyPayload: Record<string, unknown> = {},
) {
  return existingId
    ? databases.updateDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, existingId, payload, permissions)
    : databases.createDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, ID.unique(), { ...payload, ...createOnlyPayload }, permissions)
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
    enforceRateLimit(req, { key: 'chat:presence', max: 120, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const durableLimit = await checkDurableRateLimit(`chat:presence:${auth.userId}`, 120, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many presence updates')
    const body = await parseJsonBody(req, z.object({
      roomId: z.string().trim().min(1).max(255),
      isTyping: z.boolean().optional(),
      isOnline: z.boolean().optional(),
    }), 4096)
    const { roomId } = body
    const isTyping = Boolean(body.isTyping)
    const isOnline = body.isOnline === undefined ? true : body.isOnline

    const { databases } = await createAdminClient()
    const { members } = await getRoomForMember(databases, roomId, auth.userId)

    const now = new Date().toISOString()
    const existing = await databases.listDocuments(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, [
      Query.equal('roomId', roomId),
      Query.equal('userId', auth.userId),
      Query.limit(1),
    ])

    const basePayload = {
      roomId,
      userId: auth.userId,
      isOnline,
      isTyping,
      lastSeenAt: now,
      typingAt: isTyping ? now : '',
      updatedAt: now,
    }

    const presence = await writePresenceDocument(
      databases,
      existing.documents.length > 0 ? existing.documents[0].$id : null,
      { ...basePayload },
      members.map((memberId) => Permission.read(Role.user(memberId))),
      { createdAt: now },
    )

    return NextResponse.json({ success: true, presence })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[chat/presence POST] Failed to update chat presence:', error)
    return internalError('Failed to update chat presence', error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req)
    const roomId = req.nextUrl.searchParams.get('roomId')?.trim()

    if (!roomId) {
      throw new ApiError(400, 'INVALID_INPUT', 'roomId is required')
    }

    const { databases } = await createAdminClient()
    await getRoomForMember(databases, roomId, auth.userId)

    const presence = await databases.listDocuments(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, [
      Query.equal('roomId', roomId),
      Query.limit(50),
    ])

    return NextResponse.json({
      success: true,
      presence: (presence.documents || []).filter((entry: any) => entry.userId === auth.userId || entry.isOnline),
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[chat/presence GET] Failed to fetch chat presence:', error)
    return internalError('Failed to fetch chat presence', error)
  }
}
