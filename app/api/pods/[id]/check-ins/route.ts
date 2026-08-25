import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const POD_CHECK_INS_COLLECTION_ID = process.env.NEXT_PUBLIC_POD_CHECK_INS_COLLECTION_ID || 'pod_check_ins'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const { id: podId } = await params

    const result = await databases.listDocuments(DATABASE_ID, POD_CHECK_INS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.orderDesc('createdAt'),
      Query.limit(20),
    ])

    return NextResponse.json({ success: true, data: result.documents, total: result.total })
  } catch (error: any) {
    console.error('[API] Error fetching check-ins:', error)
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'legacy-pods:checkin', max: 20, windowMs: 60_000 })
    const { userId } = requireUser(req)
    const { databases } = await createAdminClient()

    const { id: podId } = await params
    const body = await parseJsonBody(req, z.object({ note: z.string().trim().min(1).max(2000), userName: z.string().trim().max(120).optional() }))
    const note = body.note

    const now = new Date().toISOString()
    const data = await databases.createDocument(DATABASE_ID, POD_CHECK_INS_COLLECTION_ID, 'unique()', {
      podId,
      userId,
      note,
      userName: body?.userName || 'Member',
      createdAt: now,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error creating check-in:', error)
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
  }
}
