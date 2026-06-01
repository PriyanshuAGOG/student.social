import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId } = body
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
    const collId = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

    const original = await databases.getDocument(dbId, collId, taskId)
    if (!original) return NextResponse.json({ success: false, error: 'task not found' }, { status: 404 })

    const now = new Date().toISOString()
    // Update the existing task in-place to requeue it
    const updated = await databases.updateDocument(dbId, collId, taskId, {
      status: 'queued',
      lastError: null,
      summary: null,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, task: updated }, { status: 200 })
  } catch (error) {
    console.error('[ai/summaries/retry] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
