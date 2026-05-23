import { NextRequest } from 'next/server'
import { Query } from 'node-appwrite'
import { z } from 'zod'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'
import { getEnv } from '@/lib/env'

const bodySchema = z.object({ userId: z.string().min(1) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const { id: postId } = await params
    const { userId } = await parseJsonBody(request, bodySchema)
    requireOwnership(userId, auth.userId)

    const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
    const SAVED_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts'
    const { databases } = await createAdminClient()

    const existing = await databases.listDocuments(DATABASE_ID, SAVED_POSTS_COLLECTION_ID, [Query.equal('postId', postId), Query.equal('userId', userId)])
    if (existing.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, SAVED_POSTS_COLLECTION_ID, existing.documents[0].$id)
      return jsonOk({ saved: false, message: 'Post unsaved' }, 200, correlationId)
    }

    const savedPost = await databases.createDocument(DATABASE_ID, SAVED_POSTS_COLLECTION_ID, 'unique()', { postId, userId, savedAt: new Date().toISOString() })
    return jsonOk({ saved: true, savedPost, message: 'Post saved' }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}
