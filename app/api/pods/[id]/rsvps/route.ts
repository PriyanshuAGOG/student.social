import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const POD_RSVPS_COLLECTION_ID = process.env.NEXT_PUBLIC_POD_RSVPS_COLLECTION_ID || 'pod_rsvps'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const { id: podId } = await params

    const result = await databases.listDocuments(DATABASE_ID, POD_RSVPS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.orderDesc('updatedAt'),
      Query.limit(100),
    ])

    return NextResponse.json({ success: true, data: result.documents, total: result.total })
  } catch (error: any) {
    console.error('[API] Error fetching RSVPs:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'legacy-pods:rsvp', max: 30, windowMs: 60_000 })
    const { userId } = requireUser(req)
    const { databases } = await createAdminClient()

    const { id: podId } = await params
    const body = await parseJsonBody(req, z.object({ eventId: z.string().trim().min(1).max(255), isGoing: z.boolean() }))
    const eventId = body.eventId
    const isGoing = body.isGoing

    const existing = await databases.listDocuments(DATABASE_ID, POD_RSVPS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.equal('eventId', eventId),
      Query.equal('userId', userId),
      Query.limit(1),
    ])

    const now = new Date().toISOString()
    let data
    if (existing.documents.length > 0) {
      data = await databases.updateDocument(DATABASE_ID, POD_RSVPS_COLLECTION_ID, existing.documents[0].$id, {
        isGoing,
        updatedAt: now,
      })
    } else {
      data = await databases.createDocument(DATABASE_ID, POD_RSVPS_COLLECTION_ID, 'unique()', {
        podId,
        eventId,
        userId,
        isGoing,
        createdAt: now,
        updatedAt: now,
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error saving RSVP:', error)
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
  }
}
