import { Query } from 'node-appwrite'
import { adminJson, ADMIN_COLLECTIONS, safeListDocuments, withAdminApi } from '@/lib/admin-server'

export const GET = withAdminApi('errors.manage', async ({ request, correlationId }) => {
  const status = request.nextUrl.searchParams.get('status') || 'open'
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const [clientErrors, apiErrors, callDiagnostics] = await Promise.all([
    safeListDocuments(ADMIN_COLLECTIONS.clientErrors, [Query.equal('status', status), Query.orderDesc('lastSeenAt'), Query.limit(limit)]),
    safeListDocuments(ADMIN_COLLECTIONS.apiErrors, [Query.equal('status', status), Query.orderDesc('lastSeenAt'), Query.limit(limit)]),
    status === 'open'
      ? safeListDocuments(ADMIN_COLLECTIONS.callDiagnostics, [Query.orderDesc('createdAt'), Query.limit(limit)])
      : Promise.resolve({ documents: [], total: 0 }),
  ])

  const callRows = callDiagnostics.documents.map((item: any) => {
    let metrics: Record<string, unknown> = {}
    let logs: Array<{ message?: string; level?: string }> = []
    try { metrics = JSON.parse(item.metrics || '{}') } catch {}
    try { logs = JSON.parse(item.logs || '[]') } catch {}
    const firstLog = logs.find((entry) => entry?.message)
    return {
      ...item,
      source: 'call',
      route: '/app/call',
      message: firstLog?.message || `Call diagnostic: ${String(metrics.kind || 'connection issue')}`,
      count: 1,
      status: 'open',
      userId: item.reporterId,
      lastSeenAt: item.createdAt,
      fingerprint: `call:${item.callSessionId}:${String(metrics.kind || 'diagnostic')}`,
      metadataJson: JSON.stringify({ callSessionId: item.callSessionId, roomId: item.roomId, ...metrics }),
    }
  })
  const errorRows = [
    ...clientErrors.documents.map((item: any) => ({ ...item, source: 'client' })),
    ...apiErrors.documents.map((item: any) => ({ ...item, source: 'api' })),
    ...callRows,
  ].sort((a, b) => Date.parse(String(b.lastSeenAt || '')) - Date.parse(String(a.lastSeenAt || ''))).slice(0, limit)

  return adminJson(
    {
      documents: errorRows,
      total: clientErrors.total + apiErrors.total + callDiagnostics.total,
      pageInfo: { limit, status },
    },
    correlationId,
  )
})
