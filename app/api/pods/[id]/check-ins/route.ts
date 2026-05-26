import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

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
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: podId } = await params
    const body = await req.json()
    const note = String(body?.note || '').trim()

    if (!note) return NextResponse.json({ error: 'Note is required' }, { status: 400 })

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
    console.error('[API] Error creating check-in:', error)
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
  }
}