import { adminJson, redactUser, withAdminApi } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export const GET = withAdminApi('users.read', async ({ request, admin, correlationId }) => {
  const id = request.nextUrl.pathname.split('/').pop() || ''
  const { users } = await createAdminClient()
  const user = await users.get(id)
  return adminJson({ user: redactUser(user, admin.role) }, correlationId)
})
