import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases } = await createAdminClient()
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: resourceId } = await params
    const resource = await databases.getDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId)
    const likedBy = Array.isArray(resource.likedBy) ? resource.likedBy : []
    const isLiked = likedBy.includes(userId)
    const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

    const updated = await databases.updateDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId, {
      likedBy: newLikedBy,
      likes: newLikedBy.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, isLiked: !isLiked, likes: newLikedBy.length, resource: updated })
  } catch (error: any) {
    console.error('[API] Error toggling resource like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}