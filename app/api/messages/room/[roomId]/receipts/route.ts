import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Query, Role } from 'node-appwrite'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'
import { parseStringList } from '@/lib/calls/domain'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const MESSAGE_RECEIPTS_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGE_RECEIPTS_COLLECTION_ID || 'message_receipts'

const receiptSchema = z.object({
  messageIds: z.array(z.string().trim().min(1).max(255)).min(1).max(200),
  state: z.enum(['delivered', 'read']).default('read'),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'messages:receipts', max: 120, windowMs: 60_000 })
    const auth = requireUser(req)
    const durableLimit = await checkDurableRateLimit(`messages:receipts:${auth.userId}`, 120, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many receipt updates')
    const { roomId } = await params
    const { messageIds, state } = await parseJsonBody(req, receiptSchema, 16 * 1024)
    const uniqueMessageIds = Array.from(new Set(messageIds))

    const { databases } = await createAdminClient()
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
    const members = parseStringList(room?.members || room?.participants)
    if (!members.includes(auth.userId)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation')

    const messages = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
      Query.equal('$id', uniqueMessageIds),
      Query.equal('roomId', roomId),
      Query.limit(uniqueMessageIds.length),
    ])
    const validMessages = (messages.documents || []).filter((message: any) => message.senderId !== auth.userId)
    if (validMessages.length === 0) return NextResponse.json({ success: true, updated: 0 })

    const validIds = validMessages.map((message: any) => message.$id)
    const existing = await databases.listDocuments(DATABASE_ID, MESSAGE_RECEIPTS_COLLECTION_ID, [
      Query.equal('messageId', validIds),
      Query.equal('userId', auth.userId),
      Query.limit(Math.min(validIds.length, 200)),
    ])
    const existingByMessage = new Map((existing.documents || []).map((receipt: any) => [receipt.messageId, receipt]))
    const now = new Date().toISOString()
    const permissions = members.map((memberId) => Permission.read(Role.user(memberId)))

    await Promise.all(validIds.map(async (messageId: string) => {
      const receipt: any = existingByMessage.get(messageId)
      const payload = {
        deliveredAt: receipt?.deliveredAt || now,
        ...(state === 'read' ? { readAt: now } : {}),
        updatedAt: now,
      }
      if (receipt) {
        await databases.updateDocument(DATABASE_ID, MESSAGE_RECEIPTS_COLLECTION_ID, receipt.$id, payload)
      } else {
        await databases.createDocument(DATABASE_ID, MESSAGE_RECEIPTS_COLLECTION_ID, ID.unique(), {
          messageId,
          roomId,
          userId: auth.userId,
          ...payload,
          createdAt: now,
        }, permissions)
      }
    }))

    return NextResponse.json({ success: true, updated: validIds.length, state })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[messages/receipts] Failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to update message receipts' }, { status: 500 })
  }
}
