import { NextRequest } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { jsonError, jsonOk, requireUser } from '@/lib/api-security'
import { getEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const userId = request.nextUrl.searchParams.get('userId') || auth.userId
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10)

    const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
    const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts'
    const SAVED_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts'
    const { databases } = await createAdminClient()

    const saved = await databases.listDocuments(DATABASE_ID, SAVED_POSTS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('savedAt'),
      Query.limit(Math.min(limit, 100)),
      Query.offset(Math.max(offset, 0)),
    ])

    const posts = await Promise.all(saved.documents.map(async (entry: any) => {
      try {
        return await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, entry.postId)
      } catch {
        return null
      }
    }))

    return jsonOk({ posts: posts.filter(Boolean), total: posts.filter(Boolean).length, limit, offset }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}