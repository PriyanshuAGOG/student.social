import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeListDocuments, withAdminApi } from '@/lib/admin-server'

export const GET = withAdminApi('errors.manage', async ({ request, correlationId }) => {
  const status = request.nextUrl.searchParams.get('status') || 'open'
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const [clientErrors, apiErrors] = await Promise.all([
    safeListDocuments(ADMIN_COLLECTIONS.clientErrors, [Query.equal('status', status), Query.orderDesc('lastSeenAt'), Query.limit(limit)]),
    safeListDocuments(ADMIN_COLLECTIONS.apiErrors, [Query.equal('status', status), Query.orderDesc('lastSeenAt'), Query.limit(limit)]),
  ])

  return adminJson(
    {
      documents: [
        ...clientErrors.documents.map((item: any) => ({ ...item, source: 'client' })),
        ...apiErrors.documents.map((item: any) => ({ ...item, source: 'api' })),
      ],
      total: clientErrors.total + apiErrors.total,
      pageInfo: { limit, status },
    },
    correlationId,
  )
})
