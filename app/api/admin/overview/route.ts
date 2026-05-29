import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeGetCount, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('overview.read', async ({ admin, correlationId }) => {
  const [
    users,
    posts,
    comments,
    pods,
    messages,
    resources,
    reports,
    clientErrors,
    apiErrors,
    notifications,
    audits,
  ] = await Promise.all([
    safeGetCount(COLLECTIONS.PROFILES),
    safeGetCount(COLLECTIONS.POSTS),
    safeGetCount(COLLECTIONS.COMMENTS),
    safeGetCount(COLLECTIONS.PODS),
    safeGetCount(COLLECTIONS.MESSAGES),
    safeGetCount(COLLECTIONS.RESOURCES),
    safeGetCount(ADMIN_COLLECTIONS.contentReports, [Query.equal('status', 'open')]),
    safeGetCount(ADMIN_COLLECTIONS.clientErrors, [Query.equal('status', 'open')]),
    safeGetCount(ADMIN_COLLECTIONS.apiErrors, [Query.equal('status', 'open')]),
    safeGetCount(COLLECTIONS.NOTIFICATIONS),
    safeListDocuments(ADMIN_COLLECTIONS.auditLogs, [Query.orderDesc('createdAt'), Query.limit(8)]),
  ])

  const modules = [
    { id: 'users', label: 'Users', value: users, status: 'online' },
    { id: 'feed', label: 'Feed posts', value: posts, status: reports > 0 ? 'attention' : 'online' },
    { id: 'comments', label: 'Comments', value: comments, status: 'online' },
    { id: 'pods', label: 'Pods', value: pods, status: 'online' },
    { id: 'chat', label: 'Messages', value: messages, status: 'privacy-safe' },
    { id: 'vault', label: 'Vault files', value: resources, status: 'online' },
    { id: 'notifications', label: 'Notifications', value: notifications, status: 'online' },
    { id: 'reports', label: 'Open reports', value: reports, status: reports > 0 ? 'attention' : 'clear' },
    { id: 'errors', label: 'Open errors', value: clientErrors + apiErrors, status: clientErrors + apiErrors > 0 ? 'attention' : 'clear' },
  ]

  return adminJson(
    {
      admin: {
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
      health: {
        appwrite: 'reachable',
        databaseId: 'configured',
        privacyMode: 'enforced',
        auditLogging: audits.total > 0 ? 'active' : 'ready',
      },
      metrics: { users, posts, comments, pods, messages, resources, reports, clientErrors, apiErrors, notifications },
      modules,
      recentAudit: audits.documents,
    },
    correlationId,
  )
})
