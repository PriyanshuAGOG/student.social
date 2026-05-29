import { Query } from 'node-appwrite'
import { adminJson, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('vault.moderate', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const resources = await safeListDocuments(COLLECTIONS.RESOURCES, [Query.orderDesc('uploadedAt'), Query.limit(limit)])
  return adminJson({ documents: resources.documents, total: resources.total, pageInfo: { limit } }, correlationId)
})
