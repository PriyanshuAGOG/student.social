import { adminJson, ADMIN_COLLECTIONS, safeGetCount, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('system.manage', async ({ correlationId }) => {
  const checks = await Promise.all(
    [
      ['profiles', COLLECTIONS.PROFILES],
      ['posts', COLLECTIONS.POSTS],
      ['comments', COLLECTIONS.COMMENTS],
      ['pods', COLLECTIONS.PODS],
      ['messages', COLLECTIONS.MESSAGES],
      ['resources', COLLECTIONS.RESOURCES],
      ['content_reports', ADMIN_COLLECTIONS.contentReports],
      ['admin_audit_logs', ADMIN_COLLECTIONS.auditLogs],
      ['client_errors', ADMIN_COLLECTIONS.clientErrors],
      ['call_diagnostics', ADMIN_COLLECTIONS.callDiagnostics],
      ['feature_flags', ADMIN_COLLECTIONS.featureFlags],
      ['admin_broadcasts', ADMIN_COLLECTIONS.broadcasts],
    ].map(async ([name, collectionId]) => {
      try {
        await safeGetCount(collectionId)
        return { name, collectionId, status: 'ready' }
      } catch (error) {
        return { name, collectionId, status: 'error', message: error instanceof Error ? error.message : 'Unavailable' }
      }
    }),
  )

  return adminJson({ checks, environment: { database: 'configured', appwrite: 'configured', secrets: 'redacted' } }, correlationId)
})
