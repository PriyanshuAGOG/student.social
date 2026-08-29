import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireVerifiedUser } from '@/lib/api-security'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'resources:like', max: 60, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const { databases } = await createAdminClient()

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
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error toggling resource like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
