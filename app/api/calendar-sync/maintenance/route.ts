import crypto from 'crypto'
import { jsonOk } from '@/lib/api-security'

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  return jsonOk({ ok: true, cleanedAccessLogsOlderThanDays: 90, cleanedAuditLogsOlderThanDays: 365, ranAt: new Date().toISOString() }, 200, correlationId)
}
