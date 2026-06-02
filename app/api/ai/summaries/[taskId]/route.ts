import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params
    if (!taskId) return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
    const collId = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

    const doc = await databases.getDocument(dbId, collId, taskId)
    if (!doc) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })

    return NextResponse.json({ success: true, task: doc })
  } catch (error) {
    console.error('[ai/summaries/:taskId] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
