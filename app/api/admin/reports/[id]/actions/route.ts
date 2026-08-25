import { ID } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, DATABASE_ID, parseAdminAction, statusFromAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/server/appwrite'

export const POST = withAdminApi('reports.review', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  const { databases } = await createAdminClient()
  const nextStatus = statusFromAction(payload.action)
  const now = new Date().toISOString()

  const report = await databases.updateDocument(DATABASE_ID, ADMIN_COLLECTIONS.contentReports, id || payload.targetId, {
    status: nextStatus,
    reviewedBy: admin.userId,
    reviewedAt: now,
    resolution: payload.action,
  }).catch(() => null)

  await databases.createDocument(DATABASE_ID, ADMIN_COLLECTIONS.moderationActions, ID.unique(), {
    actorId: admin.userId,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reportId: id || payload.targetId,
    reason: payload.reason,
    status: nextStatus,
    metadataJson: JSON.stringify(payload.metadata || {}).slice(0, 5000),
    correlationId,
    createdAt: now,
  }).catch(() => null)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `reports.${payload.action}`,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    after: report,
    correlationId,
  })

  return adminJson({ report, status: nextStatus }, correlationId)
})
