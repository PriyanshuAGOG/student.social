import { Query } from 'node-appwrite'
import { adminJson, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('feed.moderate', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const posts = await safeListDocuments(COLLECTIONS.POSTS, [Query.orderDesc('timestamp'), Query.limit(limit)])
  return adminJson({ documents: posts.documents, total: posts.total, pageInfo: { limit } }, correlationId)
})
