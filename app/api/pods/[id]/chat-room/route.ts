import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'
import { ApiError, requireUser } from '@/lib/api-security'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const PODS_COLLECTION_ID = process.env.NEXT_PUBLIC_PODS_COLLECTION_ID || 'pods'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const { id: podId } = await params
    const { userId } = requireUser(req)

    const pod = await databases.getDocument(DATABASE_ID, PODS_COLLECTION_ID, podId)
    const podMembers = Array.isArray(pod.members) ? pod.members.filter(Boolean) : []

    if (!podMembers.includes(userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this pod')
    }

    const existing = await databases.listDocuments(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.limit(1),
    ])

    if (existing.documents.length > 0) {
      const room = existing.documents[0]
      const roomMembers = Array.isArray(room.members) ? room.members.filter(Boolean) : []

      const shouldSyncMembers =
        roomMembers.length !== podMembers.length ||
        podMembers.some((memberId) => !roomMembers.includes(memberId))

      if (shouldSyncMembers) {
        const updatedRoom = await databases.updateDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, room.$id, {
          members: podMembers,
          lastMessageTime: room.lastMessageTime || new Date().toISOString(),
        })
        return NextResponse.json({ success: true, data: updatedRoom })
      }

      return NextResponse.json({ success: true, data: room })
    }

    const room = await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, 'unique()', {
      podId,
      name: 'Pod Chat',
      type: 'pod',
      members: podMembers,
      createdAt: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      isActive: true,
    })

    return NextResponse.json({ success: true, data: room })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[API] Error creating pod chat room:', error)
    return NextResponse.json({ error: 'Failed to get chat room' }, { status: 500 })
  }
}