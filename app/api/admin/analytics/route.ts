import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeGetCount, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('analytics.read', async ({ correlationId }) => {
  const [users, posts, comments, pods, messages, resources, notifications, reports, errors] = await Promise.all([
    safeGetCount(COLLECTIONS.PROFILES),
    safeGetCount(COLLECTIONS.POSTS),
    safeGetCount(COLLECTIONS.COMMENTS),
    safeGetCount(COLLECTIONS.PODS),
    safeGetCount(COLLECTIONS.MESSAGES),
    safeGetCount(COLLECTIONS.RESOURCES),
    safeGetCount(COLLECTIONS.NOTIFICATIONS),
    safeGetCount(ADMIN_COLLECTIONS.contentReports),
    safeGetCount(ADMIN_COLLECTIONS.clientErrors),
  ])
  const recentReports = await safeListDocuments(ADMIN_COLLECTIONS.contentReports, [Query.orderDesc('createdAt'), Query.limit(20)])

  return adminJson(
    {
      growth: [{ name: 'Users', value: users }, { name: 'Pods', value: pods }],
      engagement: [
        { name: 'Posts', value: posts },
        { name: 'Comments', value: comments },
        { name: 'Messages', value: messages },
        { name: 'Resources', value: resources },
      ],
      reliability: [
        { name: 'Notifications', value: notifications },
        { name: 'Reports', value: reports },
        { name: 'Client errors', value: errors },
      ],
      safety: recentReports.documents,
    },
    correlationId,
  )
})
