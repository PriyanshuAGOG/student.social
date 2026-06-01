/**
 * Appwrite Function: ai-summary-worker
 * Purpose: Process queued AI summary tasks from `ai_tasks` collection.
 * This is a minimal local worker that creates short summaries by concatenating
 * message content and truncating. Replace with a real LLM integration in prod.
 */

import { Client, Databases, Query } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_ENDPOINT || '')
  .setProject(process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY || '')

const db = new Databases(client)

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || ''
const AI_TASKS = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'
const MESSAGES_COL = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'

export default async function handler(req: any, res: any) {
  try {
    // Fetch queued tasks
    const tasksResp = await db.listDocuments(DATABASE_ID, AI_TASKS, [Query.equal('status', 'queued'), Query.limit(10)])
    const tasks = tasksResp.documents || []

    for (const task of tasks) {
      try {
        await db.updateDocument(DATABASE_ID, AI_TASKS, task.$id, { status: 'processing', updatedAt: new Date().toISOString() })

        const messageIds = task.messageIds || []
        const msgsResp = await db.listDocuments(DATABASE_ID, MESSAGES_COL, [Query.limit(100)])
        const msgs = (msgsResp.documents || []).filter((m: any) => messageIds.includes(m.$id || m.id))

        const text = msgs.map((m: any) => m.content || '').join('\n')
        const summary = text.length > 1000 ? text.slice(0, 1000) + '...' : text

        await db.updateDocument(DATABASE_ID, AI_TASKS, task.$id, {
          status: 'done',
          summary,
          processedAt: new Date().toISOString(),
        })
      } catch (taskErr) {
        console.error('Failed to process AI task', task.$id, taskErr)
        try {
          await db.updateDocument(DATABASE_ID, AI_TASKS, task.$id, { status: 'failed', lastError: String(taskErr), updatedAt: new Date().toISOString() })
        } catch {}
      }
    }

    return res.json({ success: true, processed: tasks.length })
  } catch (error) {
    console.error('AI summary worker error:', error)
    return res.status(500).json({ success: false, error: String(error) })
  }
}
