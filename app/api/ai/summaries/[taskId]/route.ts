import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const AI_TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

function isNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  const code = typeof error === 'object' && error && 'code' in error ? Number((error as { code?: number }).code) : 0
  return code === 404 || /not found|collection/i.test(message)
}

export async function GET(request: NextRequest, context: { params: Promise<{ taskId: string }> | { taskId: string } }) {
  try {
    const maybeParams = context?.params
    const resolvedParams = typeof (maybeParams as Promise<{ taskId: string }> & { then?: unknown })?.then === 'function'
      ? await maybeParams
      : maybeParams
    const taskId = (resolvedParams as { taskId?: string } | undefined)?.taskId
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    try {
      const task = await databases.getDocument(DATABASE_ID, AI_TASKS_COLLECTION_ID, taskId)
      return NextResponse.json({ success: true, task })
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ success: false, error: 'AI summary task was not found' }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error('[ai/summaries/:taskId] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load AI summary task' }, { status: 500 })
  }
}
