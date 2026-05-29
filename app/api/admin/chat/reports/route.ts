import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeListDocuments, withAdminApi } from '@/lib/admin-server'

export const GET = withAdminApi('chat.review', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const reports = await safeListDocuments(ADMIN_COLLECTIONS.contentReports, [
    Query.equal('contentType', 'message'),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ])
  const documents = reports.documents.map((report: any) => ({
    ...report,
    privacyMode: 'content available only from report context',
  }))
  return adminJson({ documents, total: reports.total, pageInfo: { limit } }, correlationId)
})
