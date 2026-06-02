import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const AI_TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'

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
    const body = await request.json().catch(() => ({}))
    const roomId = String(body?.roomId || '').trim()
    const messageIds = Array.isArray(body?.messageIds) ? body.messageIds.filter(Boolean).map(String) : []
    const requestedBy = body?.requestedBy ? String(body.requestedBy) : undefined
    const summaryType = body?.summaryType ? String(body.summaryType) : 'short'

    if (!roomId || messageIds.length === 0) {
      return NextResponse.json({ success: false, error: 'roomId and messageIds are required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()
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
    console.error('[ai/summaries] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue AI summary' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get('roomId')?.trim()
    if (!roomId) return NextResponse.json({ success: false, error: 'roomId required' }, { status: 400 })

    const { databases } = await createAdminClient()
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
    console.error('[ai/summaries GET] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load AI summaries' }, { status: 500 })
  }
}
