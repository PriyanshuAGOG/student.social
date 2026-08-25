import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const AI_TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

function roomMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.map(String)
  try { return JSON.parse(String(room?.members || '[]')).map(String) } catch { return [] }
}

async function requireRoomMember(databases: any, roomId: string, userId: string) {
  const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
  if (!roomMembers(room).includes(userId)) throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this conversation')
}

function isMissingCollectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  const code = typeof error === 'object' && error && 'code' in error ? Number((error as { code?: number }).code) : 0
  return code === 404 || /collection|document.*not found|not found/i.test(message)
}

function buildFallbackSummary(messages: any[]) {
  const text = messages
    .map((message) => String(message?.content || '').trim())
    .filter(Boolean)
    .join('\n')

  if (!text) return 'No message content was available to summarize yet.'
  return text.length > 1000 ? `${text.slice(0, 1000)}...` : text
}

async function loadMessagesById(databases: any, messageIds: string[]) {
  if (messageIds.length === 0) return []

  try {
    const response = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
      Query.limit(Math.min(Math.max(messageIds.length, 1), 100)),
    ])
    return (response.documents || []).filter((message: any) => messageIds.includes(message.$id || message.id))
  } catch (error) {
    console.warn('[ai/summaries] Could not load messages for fallback summary:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'ai:summaries', max: 10, windowMs: 60_000 })
    const auth = requireUser(request)
    const { roomId, messageIds, summaryType } = await parseJsonBody(request, z.object({
      roomId: z.string().trim().min(1).max(255),
      messageIds: z.array(z.string().min(1).max(255)).min(1).max(100),
      requestedBy: z.string().optional(),
      summaryType: z.enum(['short', 'detailed', 'action_items']).default('short'),
    }))
    const requestedBy = auth.userId

    const { databases } = await createAdminClient()
    await requireRoomMember(databases, roomId, auth.userId)
    const now = new Date().toISOString()

    try {
      const task = await databases.createDocument(DATABASE_ID, AI_TASKS_COLLECTION_ID, 'unique()', {
        roomId,
        messageIds,
        ...(requestedBy ? { requestedBy } : {}),
        summaryType,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      })

      return NextResponse.json({ success: true, task }, { status: 202 })
    } catch (error) {
      if (!isMissingCollectionError(error)) throw error

      console.warn('[ai/summaries] ai_tasks collection is unavailable; returning inline fallback task:', error)
      const messages = await loadMessagesById(databases, messageIds)
      const task = {
        $id: `inline_${Date.now()}`,
        roomId,
        messageIds,
        requestedBy: requestedBy || null,
        summaryType,
        status: 'done',
        summary: buildFallbackSummary(messages),
        createdAt: now,
        updatedAt: now,
        processedAt: now,
        transient: true,
      }

      return NextResponse.json({ success: true, task, warning: 'AI task storage is not configured; returned an inline summary.' })
    }
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[ai/summaries] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue AI summary' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireUser(request)
    const roomId = request.nextUrl.searchParams.get('roomId')?.trim()
    if (!roomId) return NextResponse.json({ success: false, error: 'roomId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    await requireRoomMember(databases, roomId, auth.userId)
    try {
      const results = await databases.listDocuments(DATABASE_ID, AI_TASKS_COLLECTION_ID, [
        Query.equal('roomId', roomId),
        Query.orderDesc('updatedAt'),
        Query.limit(25),
      ])

      return NextResponse.json({ success: true, tasks: results.documents || [] })
    } catch (error) {
      if (isMissingCollectionError(error)) {
        console.warn('[ai/summaries GET] ai_tasks collection is unavailable; returning empty task list:', error)
        return NextResponse.json({ success: true, tasks: [], warning: 'AI task storage is not configured.' })
      }
      throw error
    }
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[ai/summaries GET] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load AI summaries' }, { status: 500 })
  }
}
