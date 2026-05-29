import { Query } from 'node-appwrite'
import { adminJson, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('pods.moderate', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const pods = await safeListDocuments(COLLECTIONS.PODS, [Query.orderDesc('createdAt'), Query.limit(limit)])
  const documents = pods.documents.map((pod: any) => ({
    ...pod,
    healthScore: Math.max(0, Math.min(100, 75 + Number(pod.memberCount || 0) - (pod.isActive === false ? 35 : 0))),
  }))
  return adminJson({ documents, total: pods.total, pageInfo: { limit } }, correlationId)
})
