import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'

async function requireSessionParticipant(databases: any, sessionId: string, userId: string) {
  const session = await databases.getDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId)
  const participants = Array.isArray(session.participantIds) ? session.participantIds : []
  if (session.callerId !== userId && !participants.includes(userId)) throw new ApiError(403, 'FORBIDDEN', 'Call session does not belong to you')
  return session
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'calls:diagnostics', max: 30, windowMs: 60_000 })
    const auth = requireUser(request)
    const { callSessionId, roomId, metrics, logs } = await parseJsonBody(request, z.object({
      callSessionId: z.string().min(1).max(255),
      roomId: z.string().min(1).max(255),
      metrics: z.record(z.unknown()).default({}),
      logs: z.array(z.unknown()).max(100).default([]),
      reporterId: z.string().optional(),
    }), 128 * 1024)

    const { databases } = await createAdminClient()
    const session = await requireSessionParticipant(databases, callSessionId, auth.userId)
    if (session.roomId !== roomId) throw new ApiError(400, 'INVALID_INPUT', 'Call session and room do not match')

    const doc = await databases.createDocument(
      DATABASE_ID,
      process.env.NEXT_PUBLIC_CALL_DIAGNOSTICS_COLLECTION_ID || 'call_diagnostics',
      ID.unique(),
      {
        callSessionId,
        roomId,
        metrics: JSON.stringify(metrics),
        logs: JSON.stringify(logs),
        reporterId: auth.userId,
        createdAt: new Date().toISOString(),
      }
    )

    return NextResponse.json({ success: true, diagnostic: doc }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[calls/diagnostics] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireUser(request)
    const params = request.nextUrl.searchParams
    const sessionId = params.get('callSessionId')
    const { databases } = await createAdminClient()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'callSessionId required' }, { status: 400 })
    }
    await requireSessionParticipant(databases, sessionId, auth.userId)

    const results = await databases.listDocuments(
      DATABASE_ID,
      process.env.NEXT_PUBLIC_CALL_DIAGNOSTICS_COLLECTION_ID || 'call_diagnostics',
      [Query.equal('callSessionId', sessionId), Query.orderDesc('createdAt'), Query.limit(100)]
    )

    const diagnostics = (results.documents || []).map((document: any) => ({
      ...document,
      metrics: JSON.parse(document.metrics || '{}'),
      logs: JSON.parse(document.logs || '[]'),
    }))
    return NextResponse.json({ success: true, diagnostics })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[calls/diagnostics GET] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
