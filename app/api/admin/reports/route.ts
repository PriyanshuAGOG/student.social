import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeListDocuments, withAdminApi } from '@/lib/admin-server'

export const GET = withAdminApi('reports.review', async ({ request, correlationId }) => {
  const status = request.nextUrl.searchParams.get('status') || 'open'
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const reports = await safeListDocuments(ADMIN_COLLECTIONS.contentReports, [
    Query.equal('status', status),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ])

  return adminJson({ documents: reports.documents, total: reports.total, pageInfo: { limit, status } }, correlationId)
})
