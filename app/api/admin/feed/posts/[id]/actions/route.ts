import { adminJson, DATABASE_ID, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const POST = withAdminApi('feed.moderate', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  const targetId = id || payload.targetId
  const { databases } = await createAdminClient()
  const moderationStatus = payload.action.includes('restore') ? 'visible' : payload.action.includes('delete') ? 'deleted' : 'hidden'

  const post = await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, targetId, {
    moderationStatus,
    moderatedBy: admin.userId,
    moderatedAt: new Date().toISOString(),
  }).catch(() => null)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `feed.post.${payload.action}`,
    targetType: 'post',
    targetId,
    reason: payload.reason,
    after: post,
    correlationId,
  })

  return adminJson({ post, moderationStatus }, correlationId)
})
