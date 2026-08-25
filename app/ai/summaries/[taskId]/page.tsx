import { createAdminClient } from '@/lib/server/appwrite'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/api-security'

export default async function SummaryPage({ params }: { params: { taskId: string } }) {
  const { taskId } = params
  const { databases } = await createAdminClient()
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
  const collId = process.env.NEXT_PUBLIC_AI_TASKS_COLLECTION_ID || 'ai_tasks'

  try {
    const task = await databases.getDocument(dbId, collId, taskId)
    // access control: only allow room members to view private summaries
    const cookieHeader = cookies().toString()
    const fakeReq = new Request('https://internal', { headers: { cookie: cookieHeader } })
    const auth = requireUser(fakeReq)
    const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
    if (!task.isPublic) {
      if (!task.roomId) {
        return <div className="p-6">Summary not available</div>
      }
      try {
        const room = await databases.getDocument(dbId, CHAT_ROOMS_COLLECTION_ID, task.roomId)
        const members = Array.isArray(room.members) ? room.members : []
        if (!members.includes(auth.userId)) {
          return <div className="p-6">You do not have permission to view this summary</div>
        }
      } catch (err) {
        return <div className="p-6">You do not have permission to view this summary</div>
      }
    }
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">AI Summary #{String(task.$id).slice(-6)}</h1>
        <p className="text-sm text-muted-foreground mb-4">Status: {task.status}</p>
        {task.summary ? (
          <div className="prose max-w-none whitespace-pre-wrap">{task.summary}</div>
        ) : (
          <p className="text-muted-foreground">No summary yet. Current status: {task.status}</p>
        )}
      </div>
    )
  } catch (err) {
    return <div className="p-6">Summary not found</div>
  }
}
