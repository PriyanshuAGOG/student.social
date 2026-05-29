import crypto from 'crypto'
import { ID } from 'node-appwrite'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, jsonError, parseJsonBody, requireUser } from '@/lib/api-security'
import { ADMIN_COLLECTIONS, DATABASE_ID } from '@/lib/admin-server'

const clientErrorSchema = z.object({
  type: z.enum(['runtime', 'unhandledrejection', 'console', 'network', 'bug_report']),
  message: z.string().min(1).max(1000),
  stack: z.string().max(5000).optional().default(''),
  route: z.string().max(500).optional().default('/'),
  userAgent: z.string().max(1000).optional().default(''),
  metadata: z.record(z.unknown()).optional().default({}),
})

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    enforceRateLimit(request, { key: 'client-errors', max: 30, windowMs: 60 * 1000 })
    const auth = (() => {
      try {
        return requireUser(request)
      } catch {
        return null
      }
    })()
    const payload = await parseJsonBody(request, clientErrorSchema, 1024 * 16)
    const fingerprint = crypto.createHash('sha256').update(`${payload.type}:${payload.route}:${payload.message}`).digest('hex').slice(0, 32)
    const doc = {
      type: payload.type,
      message: payload.message,
      stack: payload.stack,
      route: payload.route,
      userAgent: payload.userAgent || request.headers.get('user-agent') || '',
      userId: auth?.userId || '',
      metadataJson: JSON.stringify(payload.metadata || {}).slice(0, 5000),
      fingerprint,
      status: 'open',
      ownerId: '',
      count: 1,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      correlationId,
    }

    try {
      const { databases } = await createAdminClient()
      await databases.createDocument(DATABASE_ID, ADMIN_COLLECTIONS.clientErrors, ID.unique(), doc)
    } catch {
      console.info(JSON.stringify({ eventType: 'client_error_fallback', ...doc }))
    }

    return NextResponse.json({ success: true, data: { accepted: true }, correlationId }, { status: 202 })
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error, correlationId)
    return jsonError(new ApiError(500, 'CLIENT_ERROR_INGEST_FAILED', 'Failed to record client error'), correlationId)
  }
}
