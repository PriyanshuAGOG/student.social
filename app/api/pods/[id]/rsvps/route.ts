import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

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
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: podId } = await params
    const body = await req.json()
    const eventId = String(body?.eventId || '').trim()
    const isGoing = Boolean(body?.isGoing)

    if (!eventId) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

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
    console.error('[API] Error saving RSVP:', error)
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
  }
}