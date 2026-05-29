import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeListDocuments, withAdminApi } from '@/lib/admin-server'

export const GET = withAdminApi('audit.read', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 100), 200)
  const logs = await safeListDocuments(ADMIN_COLLECTIONS.auditLogs, [Query.orderDesc('createdAt'), Query.limit(limit)])
  return adminJson({ documents: logs.documents, total: logs.total, pageInfo: { limit } }, correlationId)
})
