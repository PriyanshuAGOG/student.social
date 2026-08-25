import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const POD_COMMITMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POD_COMMITMENTS_COLLECTION_ID || 'pod_commitments'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'legacy-pods:commitment', max: 20, windowMs: 60_000 })
    const { userId } = requireUser(req)
    const { databases } = await createAdminClient()

    const { id: podId } = await params
    const result = await databases.listDocuments(DATABASE_ID, POD_COMMITMENTS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.equal('userId', userId),
      Query.limit(1),
    ])

    return NextResponse.json({ success: true, data: result.documents[0] || null })
  } catch (error: any) {
    console.error('[API] Error fetching pod commitment:', error)
    return NextResponse.json({ error: 'Failed to fetch commitment' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: podId } = await params
    const body = await parseJsonBody(req, z.object({ pledge: z.string().trim().min(1).max(1000), weekOf: z.string().max(32).optional() }))
    const pledge = body.pledge

    const existing = await databases.listDocuments(DATABASE_ID, POD_COMMITMENTS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.equal('userId', userId),
      Query.limit(1),
    ])

    const now = new Date().toISOString()
    const payload = {
      podId,
      userId,
      pledge,
      weekOf: body?.weekOf || now.slice(0, 10),
      updatedAt: now,
    }

    const data = existing.documents.length > 0
      ? await databases.updateDocument(DATABASE_ID, POD_COMMITMENTS_COLLECTION_ID, existing.documents[0].$id, payload)
      : await databases.createDocument(DATABASE_ID, POD_COMMITMENTS_COLLECTION_ID, 'unique()', { ...payload, createdAt: now })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error saving pod commitment:', error)
    return NextResponse.json({ error: 'Failed to save commitment' }, { status: 500 })
  }
}
