import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'

const reportSchema = z.object({
  reporterId: z.string().min(1),
  contentId: z.string().min(1),
  contentType: z.enum(['post', 'comment', 'profile', 'message', 'resource', 'pod']),
  reason: z.string().min(1).max(120).default('policy_violation'),
  description: z.string().max(1000).optional().default(''),
})

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const REPORTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CONTENT_REPORTS_COLLECTION_ID || process.env.CONTENT_REPORTS_COLLECTION_ID || 'content_reports'

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'content-report', max: 10, windowMs: 15 * 60 * 1000 })

    const auth = requireUser(request)
    const payload = await parseJsonBody(request, reportSchema)
    requireOwnership(payload.reporterId, auth.userId)

    const reportPayload = {
      reporterId: auth.userId,
      contentId: payload.contentId,
      contentType: payload.contentType,
      reason: payload.reason,
      description: payload.description || '',
      status: 'open',
      priority: payload.contentType === 'message' || payload.contentType === 'profile' ? 'high' : 'normal',
      createdAt: new Date().toISOString(),
      correlationId,
    }

    try {
      const { databases } = await createAdminClient()
      const report = await databases.createDocument(DATABASE_ID, REPORTS_COLLECTION_ID, 'unique()', reportPayload)
      return NextResponse.json({ success: true, reportId: report.$id, stored: true }, { status: 201 })
    } catch (error: any) {
      if (error?.code !== 404 && !String(error?.message || '').includes('could not be found')) {
        throw error
      }

      console.info(JSON.stringify({
        ts: new Date().toISOString(),
        type: 'content_report',
        stored: false,
        ...reportPayload,
      }))

      return NextResponse.json({ success: true, stored: false, message: 'Report accepted for review' }, { status: 202 })
    }
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error, correlationId)
    console.error('[reports] Failed to create content report:', error)
    return jsonError(new ApiError(500, 'REPORT_FAILED', 'Failed to create report'), correlationId)
  }
}
