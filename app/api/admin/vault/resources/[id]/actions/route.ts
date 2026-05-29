import { adminJson, DATABASE_ID, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const POST = withAdminApi('vault.moderate', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  const status = payload.action.includes('restore') ? 'approved' : payload.action.includes('quarantine') ? 'quarantined' : 'hidden'
  const { databases } = await createAdminClient()
  const resource = await databases.updateDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id || payload.targetId, {
    moderationStatus: status,
    isApproved: status === 'approved',
    moderatedBy: admin.userId,
    moderatedAt: new Date().toISOString(),
  }).catch(() => null)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `vault.resource.${payload.action}`,
    targetType: 'resource',
    targetId: id || payload.targetId,
    reason: payload.reason,
    after: resource,
    correlationId,
  })

  return adminJson({ resource, status }, correlationId)
})
