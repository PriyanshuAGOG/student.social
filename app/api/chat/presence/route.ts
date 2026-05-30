import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_PRESENCE_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_PRESENCE_COLLECTION_ID || 'chat_presence'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

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
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
    const members = parseMembers(room)

    if (!members.includes(auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this conversation')
    }

    const now = new Date().toISOString()
    const existing = await databases.listDocuments(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, [
      Query.equal('roomId', roomId),
      Query.equal('userId', auth.userId),
      Query.limit(1),
    ])

    const payload = {
      roomId,
      userId: auth.userId,
      isOnline,
      isTyping,
      lastSeenAt: now,
      typingAt: isTyping ? now : null,
      updatedAt: now,
      createdAt: now,
    }

    let presence
    if (existing.documents.length > 0) {
      presence = await databases.updateDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, existing.documents[0].$id, payload)
    } else {
      presence = await databases.createDocument(DATABASE_ID, CHAT_PRESENCE_COLLECTION_ID, 'unique()', payload)
    }

    return NextResponse.json({ success: true, presence })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to update chat presence:', error)
    return NextResponse.json({ success: false, error: 'Failed to update chat presence' }, { status: 500 })
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

    console.error('[API] Failed to fetch chat presence:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch chat presence' }, { status: 500 })
  }
}