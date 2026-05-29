import { adminJson, parseAdminAction, withAdminApi, writeAdminAudit } from '@/lib/admin-server'

export const POST = withAdminApi('courses.manage', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').at(-2) || ''
  const payload = await parseAdminAction(request)
  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `courses.${payload.action}`,
    targetType: 'course',
    targetId: id || payload.targetId,
    reason: payload.reason,
    metadata: payload.metadata,
    correlationId,
  })

  return adminJson(
    {
      accepted: true,
      action: payload.action,
      message: 'Course action recorded. Job execution can be connected to the course generation worker.',
    },
    correlationId,
    202,
  )
})
