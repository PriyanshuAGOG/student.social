import { adminJson, DATABASE_ID, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const POST = withAdminApi('pods.moderate', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  const { databases } = await createAdminClient()
  const updates = payload.action.includes('restore')
    ? { isActive: true, moderationStatus: 'visible' }
    : payload.action.includes('close')
      ? { isActive: false, moderationStatus: 'closed' }
      : { moderationStatus: payload.action }

  const pod = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, id || payload.targetId, {
    ...updates,
    moderatedBy: admin.userId,
    moderatedAt: new Date().toISOString(),
  }).catch(() => null)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `pods.${payload.action}`,
    targetType: 'pod',
    targetId: id || payload.targetId,
    reason: payload.reason,
    after: pod,
    correlationId,
  })

  return adminJson({ pod, updates }, correlationId)
})
