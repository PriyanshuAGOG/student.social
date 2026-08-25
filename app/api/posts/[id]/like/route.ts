import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'
import { getEnv } from '@/lib/env'

const bodySchema = z.object({ userId: z.string().min(1) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'posts:like', max: 60, windowMs: 60 * 1000 })
    const auth = requireUser(request)
    const { id: postId } = await params
    const { userId } = await parseJsonBody(request, bodySchema)
    requireOwnership(userId, auth.userId)

    const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
    const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts'
    const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

    const { databases } = await createAdminClient()
    const post = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId)
    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : []
    const isLiked = likedBy.includes(userId)
    const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

    const updatedPost = await databases.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId, { likes: newLikedBy.length, likedBy: newLikedBy })

    if (!isLiked && post.authorId !== userId) {
      await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, 'unique()', {
        userId: post.authorId, type: 'like', actor: userId, postId, message: 'Someone liked your post', isRead: false, timestamp: new Date().toISOString(),
      }).catch(() => null)
    }

    return jsonOk({ likes: newLikedBy.length, isLiked: !isLiked, post: updatedPost }, 200, correlationId)
  } catch (error) {
    return jsonError(error instanceof ApiError ? error : new ApiError(500, 'LIKE_FAILED', 'Unable to toggle like'), correlationId)
  }
}
