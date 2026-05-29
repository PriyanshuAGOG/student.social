import { adminJson, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'

export const POST = withAdminApi('users.write', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `users.${payload.action}`,
    targetType: 'user',
    targetId: id || payload.targetId,
    reason: payload.reason,
    metadata: payload.metadata,
    correlationId,
  })

  return adminJson(
    {
      accepted: true,
      targetId: id || payload.targetId,
      action: payload.action,
      mode: 'audit-only',
      message: 'User action was recorded. Destructive Appwrite user mutations require an owner-reviewed follow-up.',
    },
    correlationId,
    202,
  )
})
