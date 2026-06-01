import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

// Minimal AI summaries scaffold: enqueue summary task for background worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, messageIds = [], requestedBy, summaryType = 'short' } = body

    if (!roomId || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ success: false, error: 'roomId and messageIds are required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    const task = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks',
      'unique()',
      {
        roomId,
        messageIds,
        requestedBy: requestedBy || null,
        summaryType,
        status: 'queued',
        createdAt: new Date().toISOString(),
      }
    )

    return NextResponse.json({ success: true, task }, { status: 202 })
  } catch (error) {
    console.error('[ai/summaries] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const roomId = params.get('roomId')
    if (!roomId) return NextResponse.json({ success: false, error: 'roomId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    const results = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks',
      []
    )

    const filtered = (results.documents || []).filter((d: any) => d.roomId === roomId)
    return NextResponse.json({ success: true, tasks: filtered })
  } catch (error) {
    console.error('[ai/summaries GET] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
