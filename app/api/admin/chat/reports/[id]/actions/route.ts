import { adminJson, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'

export const POST = withAdminApi('chat.review', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `chat.${payload.action}`,
    targetType: 'message_report',
    targetId: id || payload.targetId,
    reason: payload.reason,
    metadata: { privacySafe: true, ...payload.metadata },
    correlationId,
  })
  return adminJson({ accepted: true, privacyMode: 'audited-review', action: payload.action }, correlationId, 202)
})
