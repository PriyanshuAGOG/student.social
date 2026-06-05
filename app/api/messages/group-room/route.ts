import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function getUnknownAttribute(error: any): string | null {
  return String(error?.message || '').match(/Unknown attribute:\s*"([^"]+)"/)?.[1] || null
}

async function createRoomWithSchemaRetry(databases: any, data: Record<string, any>) {
  const payload = { ...data }
  const removed = new Set<string>()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, 'unique()', payload)
    } catch (error: any) {
      const attr = getUnknownAttribute(error)
      if (!attr || removed.has(attr)) throw error
      removed.add(attr)
      delete payload[attr]
    }
  }
  throw new Error('Unable to create group chat after schema retries')
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'messages:group-room', max: 20, windowMs: 60 * 1000 })
    const auth = requireUser(req)
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim().slice(0, 80)
    const requestedMembers = uniqueStrings(body?.memberIds)
    const members = uniqueStrings([auth.userId, ...requestedMembers])

    if (members.length < 2) {
      throw new ApiError(400, 'INVALID_INPUT', 'Select at least one other member')
    }

    const now = new Date().toISOString()
    const { databases } = await createAdminClient()
    const room = await createRoomWithSchemaRetry(databases, {
      name: name || `Group chat (${members.length})`,
      type: 'group',
      members,
      participants: members,
      ownerId: auth.userId,
      createdBy: auth.userId,
      createdAt: now,
      lastMessageTime: now,
      lastMessage: 'Group created',
      isActive: true,
    })

    return NextResponse.json({ success: true, room }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[messages/group-room] Failed to create group chat:', error)
    return NextResponse.json({ success: false, error: 'Failed to create group chat' }, { status: 500 })
  }
}
