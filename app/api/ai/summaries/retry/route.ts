import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const AI_TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

function isNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  const code = typeof error === 'object' && error && 'code' in error ? Number((error as { code?: number }).code) : 0
  return code === 404 || /not found|collection/i.test(message)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const taskId = String(body?.taskId || '').trim()
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    const now = new Date().toISOString()

    try {
      const updated = await databases.updateDocument(DATABASE_ID, AI_TASKS_COLLECTION_ID, taskId, {
        status: 'queued',
        lastError: '',
        summary: '',
        updatedAt: now,
      })

      return NextResponse.json({ success: true, task: updated }, { status: 200 })
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ success: false, error: 'AI summary task was not found' }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error('[ai/summaries/retry] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to retry AI summary task' }, { status: 500 })
  }
}
