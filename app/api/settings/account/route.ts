import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from '@/lib/api-security'
import { COLLECTIONS, createAdminClient, getDatabaseId } from '@/lib/server/appwrite'

const confirmationSchema = z.object({ confirmation: z.literal('DELETE') })

export async function DELETE(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'account:delete', max: 2, windowMs: 60 * 60_000 })
    const { userId } = await requireVerifiedUser(request)
    await parseJsonBody(request, confirmationSchema, 1024)
    const { databases, storage, users } = createAdminClient()
    const databaseId = getDatabaseId()

    const deleteMatching = async (collectionId: string, field: string) => {
      while (true) {
        const page = await databases.listDocuments(databaseId, collectionId, [Query.equal(field, userId), Query.limit(100)]).catch(() => ({ documents: [] as any[] }))
        if (!page.documents.length) break
        await Promise.allSettled(page.documents.map((document: any) => databases.deleteDocument(databaseId, collectionId, document.$id)))
        if (page.documents.length < 100) break
      }
    }

    const resources = await databases.listDocuments(databaseId, COLLECTIONS.resources, [Query.equal('authorId', userId), Query.limit(100)]).catch(() => ({ documents: [] as any[] }))
    await Promise.allSettled(resources.documents.map((resource: any) => resource.fileId ? storage.deleteFile(process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources', resource.fileId) : Promise.resolve()))
    await Promise.allSettled([
      deleteMatching(COLLECTIONS.follows, 'followerId'),
      deleteMatching(COLLECTIONS.follows, 'followingId'),
      deleteMatching(COLLECTIONS.posts, 'authorId'),
      deleteMatching(COLLECTIONS.comments, 'authorId'),
      deleteMatching(COLLECTIONS.resources, 'authorId'),
      deleteMatching(COLLECTIONS.focusSessions, 'userId'),
      deleteMatching(COLLECTIONS.challengeParticipants, 'userId'),
      deleteMatching(COLLECTIONS.userAchievements, 'userId'),
      deleteMatching(COLLECTIONS.userSettings, 'userId'),
      deleteMatching(COLLECTIONS.notificationPreferences, 'userId'),
      deleteMatching(COLLECTIONS.notifications, 'userId'),
    ])
    await databases.deleteDocument(databaseId, COLLECTIONS.profiles, userId).catch(() => undefined)
    await users.delete(userId)

    const response = NextResponse.json({ success: true })
    for (const cookie of ['peerspark_session', 'peerspark_jwt', 'appwrite-session']) response.cookies.delete(cookie)
    return response
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[account-delete] Failed', error)
    return NextResponse.json({ success: false, error: 'The account could not be deleted safely' }, { status: 500 })
  }
}
