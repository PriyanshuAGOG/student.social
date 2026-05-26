import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const { id: podId } = await params
    const userId = req.headers.get('x-user-id')

    const existing = await databases.listDocuments(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.limit(1),
    ])

    if (existing.documents.length > 0) {
      return NextResponse.json({ success: true, data: existing.documents[0] })
    }

    const room = await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, 'unique()', {
      podId,
      name: 'Pod Chat',
      type: 'pod',
      members: userId ? [userId] : [],
      createdAt: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      isActive: true,
    })

    return NextResponse.json({ success: true, data: room })
  } catch (error: any) {
    console.error('[API] Error creating pod chat room:', error)
    return NextResponse.json({ error: 'Failed to get chat room' }, { status: 500 })
  }
}