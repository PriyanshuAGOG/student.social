import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const AI_TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

function isNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  const code = typeof error === 'object' && error && 'code' in error ? Number((error as { code?: number }).code) : 0
  return code === 404 || /not found|collection/i.test(message)
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'ai:summaries:retry', max: 10, windowMs: 60_000 })
    const auth = requireUser(request)
    const { taskId } = await parseJsonBody(request, z.object({ taskId: z.string().trim().min(1).max(255) }))

    const { databases } = await createAdminClient()
    const now = new Date().toISOString()

    try {
      const existing = await databases.getDocument(DATABASE_ID, AI_TASKS_COLLECTION_ID, taskId)
      if (existing.requestedBy !== auth.userId) throw new ApiError(403, 'FORBIDDEN', 'This summary task does not belong to you')
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
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[ai/summaries/retry] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to retry AI summary task' }, { status: 500 })
  }
}
