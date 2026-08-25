import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'
import { getEnv } from '@/lib/env'

const bodySchema = z.object({ userId: z.string().min(1) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const { id: commentId } = await params
    const { userId } = await parseJsonBody(request, bodySchema)
    requireOwnership(userId, auth.userId)

    const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
    const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments'
    const { databases } = await createAdminClient()

    const comment = await databases.getDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, commentId)
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : []
    const isLiked = likedBy.includes(userId)
    const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

    const updated = await databases.updateDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, commentId, {
      likes: newLikedBy.length,
      likedBy: newLikedBy,
    })

    return jsonOk({ likes: newLikedBy.length, isLiked: !isLiked, comment: updated }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}