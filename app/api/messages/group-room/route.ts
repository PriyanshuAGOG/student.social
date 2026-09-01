import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireVerifiedUser } from '@/lib/api-security'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/api-security'
import { ID, Permission, Role } from 'node-appwrite'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'messages:group-room', max: 20, windowMs: 60 * 1000 })
    const auth = await requireVerifiedUser(req)
    const durableLimit = await checkDurableRateLimit(`messages:group-room:${auth.userId}`, 20, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many group creation requests')
    const body = await parseJsonBody(req, z.object({
      name: z.string().trim().min(2).max(80),
      description: z.string().trim().max(500).optional().default(''),
      access: z.enum(['invite_only', 'members_can_invite']).optional().default('invite_only'),
      memberIds: z.array(z.string().min(1).max(255)).min(1).max(100),
    }))
    const name = body.name
    const requestedMembers = uniqueStrings(body.memberIds)
    const members = uniqueStrings([auth.userId, ...requestedMembers])

    if (members.length < 2) {
      throw new ApiError(400, 'INVALID_INPUT', 'Select at least one other member')
    }

    const now = new Date().toISOString()
    const { databases } = await createAdminClient()
    const room = await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, ID.unique(), {
      name,
      description: body.description,
      access: body.access,
      type: 'group',
      members,
      participants: members,
      admins: [auth.userId],
      ownerId: auth.userId,
      createdBy: auth.userId,
      createdAt: now,
      updatedAt: now,
      lastMessageTime: now,
      lastMessage: 'Group created',
      isActive: true,
    }, members.map((memberId) => Permission.read(Role.user(memberId))))

    return NextResponse.json({ success: true, room }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[messages/group-room] Failed to create group chat:', { message: error?.message, code: error?.code, type: error?.type })
    return NextResponse.json({ success: false, error: 'Failed to create group chat' }, { status: 500 })
  }
}
