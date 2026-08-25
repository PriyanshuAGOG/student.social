import { adminJson, ADMIN_COLLECTIONS, DATABASE_ID, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/server/appwrite'

export const PATCH = withAdminApi('errors.manage', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').pop() || ''
  const body = await request.json().catch(() => ({}))
  const status = ['open', 'investigating', 'resolved', 'ignored'].includes(body.status) ? body.status : 'investigating'
  const source = body.source === 'api' ? ADMIN_COLLECTIONS.apiErrors : ADMIN_COLLECTIONS.clientErrors
  const { databases } = await createAdminClient()
  const error = await databases.updateDocument(DATABASE_ID, source, id, {
    status,
    ownerId: body.ownerId || admin.userId,
    updatedAt: new Date().toISOString(),
  })

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `errors.${status}`,
    targetType: body.source === 'api' ? 'api_error' : 'client_error',
    targetId: id,
    reason: body.reason || `Marked ${status}`,
    after: error,
    correlationId,
  })

  return adminJson({ error }, correlationId)
})
