import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

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

  return room
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'chat:presence', max: 120, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const body = await req.json().catch(() => ({}))
    const roomId = String(body?.roomId || '').trim()
    const isTyping = Boolean(body?.isTyping)
    const isOnline = body?.isOnline === undefined ? true : Boolean(body?.isOnline)

    if (!roomId) {
      throw new ApiError(400, 'INVALID_INPUT', 'roomId is required')
    }

    const { databases } = await createAdminClient()
    await getRoomForMember(databases, roomId, auth.userId)

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

    const presence = existing.documents.length > 0
      ? await databases.updateDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, existing.documents[0].$id, basePayload)
      : await databases.createDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, 'unique()', {
          ...basePayload,
          createdAt: now,
        })

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
