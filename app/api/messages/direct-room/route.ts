import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

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
    enforceRateLimit(req, { key: 'messages:direct-room', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const body = await req.json().catch(() => ({}))
    const recipientId = String(body?.recipientId || '').trim()
    const recipientUsername = String(body?.recipientUsername || '').trim()

    if (!recipientId && !recipientUsername) {
      throw new ApiError(400, 'INVALID_INPUT', 'recipientId or recipientUsername is required')
    }

    const { databases } = await createAdminClient()

    let targetUserId = recipientId
    if (!targetUserId && recipientUsername) {
      const normalized = normalizeUsername(recipientUsername)
      if (!normalized) {
        throw new ApiError(400, 'INVALID_INPUT', 'recipientUsername is invalid')
      }

      const profileLookup = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID, [
        Query.limit(200),
      ])

      const matchingProfile = (profileLookup.documents || []).find((profile: any) => {
        const username = normalizeUsername(String(profile?.username || ''))
        const name = normalizeUsername(String(profile?.name || ''))
        const emailHandle = normalizeUsername(String(profile?.email || '').split('@')[0] || '')
        return username === normalized || name === normalized || emailHandle === normalized
      })

      if (!matchingProfile?.$id) {
        throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Recipient username was not found')
      }

      targetUserId = matchingProfile.$id
    }

    if (!targetUserId) {
      throw new ApiError(400, 'INVALID_INPUT', 'Could not resolve recipient')
    }

    if (targetUserId === auth.userId) {
      throw new ApiError(400, 'INVALID_INPUT', 'Cannot create direct room with yourself')
    }

    const sortedMembers = [auth.userId, targetUserId].sort()

    const existingRooms = await databases.listDocuments(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, [
      Query.equal('type', ['direct', 'dm']),
      Query.limit(200),
    ])

    const existingRoom = (existingRooms.documents || []).find((room: any) => {
      const members = parseMembers(room).sort()
      return members.length === 2 && members[0] === sortedMembers[0] && members[1] === sortedMembers[1]
    })

    if (existingRoom) {
      if (existingRoom.type !== 'direct') {
        const updated = await databases.updateDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, existingRoom.$id, {
          type: 'direct',
          members: sortedMembers,
        })
        return NextResponse.json({ success: true, room: updated, created: false })
      }

      return NextResponse.json({ success: true, room: existingRoom, created: false })
    }

    const createdRoom = await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, 'unique()', {
      name: 'Direct Messages',
      type: 'direct',
      members: sortedMembers,
      createdAt: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      isActive: true,
    })

    return NextResponse.json({ success: true, room: createdRoom, created: true }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to create/get direct room:', error)
    return NextResponse.json({ success: false, error: 'Failed to resolve direct room' }, { status: 500 })
  }
}
