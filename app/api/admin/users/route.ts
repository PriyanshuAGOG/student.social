import { Query } from 'node-appwrite'
import { adminJson, redactUser, withAdminApi } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/server/appwrite'

export const GET = withAdminApi('users.read', async ({ request, admin, correlationId }) => {
  const { users } = await createAdminClient()
  const search = request.nextUrl.searchParams.get('q')?.trim()
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 25), 100)
  const queries = [Query.limit(limit)]

  if (search) {
    queries.push(Query.search('email', search))
  }

  const response = await users.list(queries).catch(async () => {
    if (!search) return users.list([Query.limit(limit)])
    return users.list([Query.limit(limit)])
  })

  const documents = response.users.map((user: any) => redactUser(user, admin.role))
  return adminJson({ documents, total: response.total, pageInfo: { limit } }, correlationId)
})
