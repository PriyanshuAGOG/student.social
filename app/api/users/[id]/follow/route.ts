import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireVerifiedUser } from '@/lib/api-security'
import { COLLECTIONS, createAdminClient, getDatabaseId } from '@/lib/server/appwrite'
import { createServerNotification } from '@/lib/server/notifications'

async function countConnections(databases: ReturnType<typeof createAdminClient>['databases'], userId: string) {
  const [followers, following] = await Promise.all([
    databases.listDocuments(getDatabaseId(), COLLECTIONS.follows, [Query.equal('followingId', userId), Query.limit(1)]),
    databases.listDocuments(getDatabaseId(), COLLECTIONS.follows, [Query.equal('followerId', userId), Query.limit(1)]),
  ])
  return { followerCount: followers.total, followingCount: following.total }
}

async function findProfile(databases: ReturnType<typeof createAdminClient>['databases'], userId: string) {
  try {
    return await databases.getDocument(getDatabaseId(), COLLECTIONS.profiles, userId)
  } catch (error: any) {
    if (error?.code !== 404) throw error
    const result = await databases.listDocuments(getDatabaseId(), COLLECTIONS.profiles, [Query.equal('userId', userId), Query.limit(1)])
    return result.documents[0] || null
  }
}

function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
  }
  console.error('[follow] Relationship request failed', error)
  return NextResponse.json({ success: false, error: 'Could not update this connection' }, { status: 500 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireVerifiedUser(request)
    const { id: targetUserId } = await params
    const { databases } = createAdminClient()
    const relationship = targetUserId === userId
      ? { documents: [] }
      : await databases.listDocuments(getDatabaseId(), COLLECTIONS.follows, [
          Query.equal('followerId', userId), Query.equal('followingId', targetUserId), Query.limit(1),
        ])
    return NextResponse.json({ success: true, isFollowing: relationship.documents.length > 0, ...(await countConnections(databases, targetUserId)) })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'users:follow', max: 40, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const { id: targetUserId } = await params
    const body = await request.json().catch(() => ({}))
    const action = body?.action === 'follow' || body?.action === 'unfollow' ? body.action : 'toggle'
    if (!targetUserId) throw new ApiError(400, 'INVALID_INPUT', 'A profile is required')
    if (targetUserId === userId) throw new ApiError(400, 'CANNOT_FOLLOW_SELF', 'You cannot follow yourself')

    const { databases } = createAdminClient()
    const [actor, target] = await Promise.all([findProfile(databases, userId), findProfile(databases, targetUserId)])
    if (!target) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'This profile is no longer available')

    const existing = await databases.listDocuments(getDatabaseId(), COLLECTIONS.follows, [
      Query.equal('followerId', userId), Query.equal('followingId', targetUserId), Query.limit(1),
    ])
    let isFollowing = Boolean(existing.documents[0])
    if (existing.documents[0] && action !== 'follow') {
      await databases.deleteDocument(getDatabaseId(), COLLECTIONS.follows, existing.documents[0].$id)
      isFollowing = false
    } else if (!existing.documents[0] && action !== 'unfollow') {
      await databases.createDocument(getDatabaseId(), COLLECTIONS.follows, ID.unique(), {
        followerId: userId, followingId: targetUserId, createdAt: new Date().toISOString(),
      })
      isFollowing = true
      await createServerNotification({
        userId: targetUserId,
        title: 'New learning connection',
        message: `${actor?.name || 'A student'} started following you.`,
        type: 'follow',
        actionUrl: `/app/profile/${encodeURIComponent(actor?.username || userId)}`,
        actorId: userId,
        actorName: actor?.name || 'A student',
        actorAvatar: actor?.avatar || '',
      }).catch((error) => console.error('[follow] Notification failed', error))
    }

    return NextResponse.json({
      success: true,
      isFollowing,
      ...(await countConnections(databases, targetUserId)),
      message: isFollowing ? `You are now following ${target.name || 'this student'}` : `You unfollowed ${target.name || 'this student'}`,
    })
  } catch (error) {
    return apiError(error)
  }
}
