import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { ApiError, requireVerifiedUser } from '@/lib/api-security'
import { buildAchievements, calculateStudyStreak, type LearningStats } from '@/lib/profile/achievements'
import { COLLECTIONS, createAdminClient, getDatabaseId } from '@/lib/server/appwrite'
import { canAccessResource } from '@/lib/server/resource-access'

type Databases = ReturnType<typeof createAdminClient>['databases']

async function safeList(databases: Databases, collectionId: string, queries: string[]) {
  try {
    return await databases.listDocuments(getDatabaseId(), collectionId, queries)
  } catch (error: any) {
    if (error?.code === 404 || String(error?.message || '').includes('Attribute not found')) return { documents: [], total: 0 }
    throw error
  }
}

function slug(value: unknown) {
  return String(value || '').trim().replace(/^@+/, '').replace(/[\s_]+/g, '-').toLowerCase()
}

async function resolveProfile(databases: Databases, identifier: string) {
  try {
    return await databases.getDocument(getDatabaseId(), COLLECTIONS.profiles, identifier)
  } catch (error: any) {
    if (error?.code !== 404) throw error
  }

  const byUser = await safeList(databases, COLLECTIONS.profiles, [Query.equal('userId', identifier), Query.limit(1)])
  if (byUser.documents[0]) return byUser.documents[0]
  const all = await safeList(databases, COLLECTIONS.profiles, [Query.limit(100)])
  return all.documents.find((profile: any) => {
    const candidates = [profile.username, profile.name, String(profile.email || '').split('@')[0], profile.userId, profile.$id]
    return candidates.some((candidate) => slug(candidate) === slug(identifier))
  }) || null
}

function publicProfile(profile: any) {
  return {
    id: profile.userId || profile.$id,
    name: profile.name || 'Student',
    username: profile.username || slug(profile.name) || `student-${String(profile.$id).slice(0, 6)}`,
    avatar: profile.avatar || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    joinedAt: profile.joinedAt || profile.createdAt || profile.$createdAt,
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    focusAreas: Array.isArray(profile.currentFocusAreas) ? profile.currentFocusAreas : [],
    isOnline: Boolean(profile.isOnline),
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireVerifiedUser(request)
    const { id } = await params
    const { databases, users } = createAdminClient()
    const profile = await resolveProfile(databases, decodeURIComponent(id))
    if (!profile) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'This profile could not be found')
    const profileId = String(profile.userId || profile.$id)
    const isOwnProfile = profileId === auth.userId

    const [followers, following, posts, resources, memberships, sessions, relationship, settings] = await Promise.all([
      safeList(databases, COLLECTIONS.follows, [Query.equal('followingId', profileId), Query.orderDesc('createdAt'), Query.limit(50)]),
      safeList(databases, COLLECTIONS.follows, [Query.equal('followerId', profileId), Query.orderDesc('createdAt'), Query.limit(50)]),
      safeList(databases, COLLECTIONS.posts, [Query.equal('authorId', profileId), Query.orderDesc('timestamp'), Query.limit(30)]),
      safeList(databases, COLLECTIONS.resources, [Query.equal('authorId', profileId), Query.orderDesc('uploadedAt'), Query.limit(30)]),
      safeList(databases, COLLECTIONS.podMemberships, [Query.equal('userId', profileId), Query.equal('status', 'active'), Query.limit(100)]),
      safeList(databases, COLLECTIONS.focusSessions, [Query.equal('userId', profileId), Query.orderDesc('startedAt'), Query.limit(500)]),
      isOwnProfile ? Promise.resolve({ documents: [], total: 0 }) : safeList(databases, COLLECTIONS.follows, [Query.equal('followerId', auth.userId), Query.equal('followingId', profileId), Query.limit(1)]),
      users.get(profileId).catch(() => null),
    ])

    const preferences = (settings?.prefs as Record<string, any> | undefined)?.peersparkSettings || {}
    const isConnection = relationship.total > 0
    if (!isOwnProfile && (preferences?.privacy?.profileVisibility === 'private' || (preferences?.privacy?.profileVisibility === 'friends' && !isConnection))) {
      return NextResponse.json({ success: true, isOwnProfile: false, isPrivate: true, profile: { ...publicProfile(profile), bio: '', location: '', website: '', interests: [], focusAreas: [], isOnline: false }, relationship: { isFollowing: relationship.total > 0 } })
    }

    const completedSessions = sessions.documents.filter((session: any) => session.status === 'completed')
    const visibleFocusSessions = isOwnProfile || preferences?.privacy?.showStudyStats !== false ? completedSessions : []
    const resourceAccess = await Promise.all(resources.documents.map((resource: any) => canAccessResource(databases, auth.userId, resource).catch(() => false)))
    const visibleResources = resources.documents.filter((_: any, index: number) => resourceAccess[index])
    const focusMinutes = completedSessions.reduce((sum: number, session: any) => sum + Math.max(0, Number(session.actualMinutes || 0)), 0)
    const activityDates = completedSessions.map((session: any) => session.endedAt || session.startedAt).filter(Boolean)
    const studyDays = new Set(activityDates.map((date: string) => new Date(date).toISOString().slice(0, 10))).size
    const stats: LearningStats = {
      focusMinutes,
      focusSessions: completedSessions.length,
      studyDays,
      studyStreak: calculateStudyStreak(activityDates),
      podsJoined: memberships.total,
      resourcesShared: isOwnProfile ? resources.total : visibleResources.length,
      postsCreated: posts.total,
      followers: followers.total,
      following: following.total,
    }

    const connectionIds = Array.from(new Set([
      ...followers.documents.slice(0, 5).map((item: any) => item.followerId),
      ...following.documents.slice(0, 5).map((item: any) => item.followingId),
    ])).slice(0, 10)
    const connectionProfiles = await Promise.all(connectionIds.map((userId) => resolveProfile(databases, String(userId))))
    const profileMap = new Map(connectionProfiles.filter(Boolean).map((item: any) => [String(item.userId || item.$id), publicProfile(item)]))
    const podIds = Array.from(new Set(memberships.documents.map((membership: any) => String(membership.podId || '')).filter(Boolean))).slice(0, 20)
    const pods = (await Promise.all(podIds.map((podId) => databases.getDocument(getDatabaseId(), COLLECTIONS.pods, podId).catch(() => null)))).filter(Boolean)

    const visiblePosts = posts.documents.filter((post: any) => isOwnProfile || !post.visibility || post.visibility === 'public')
    const normalizedPosts = visiblePosts.map((post: any) => ({
      ...post,
      authorName: profile.name || post.authorName,
      authorAvatar: profile.avatar || post.authorAvatar || '',
      authorUsername: profile.username || post.authorUsername || '',
    }))
    const activity = [
      ...normalizedPosts.slice(0, 10).map((item: any) => ({ id: item.$id, type: 'post', title: 'Shared a learning update', timestamp: item.timestamp, href: `/app/feed?post=${item.$id}` })),
      ...visibleResources.slice(0, 10).map((item: any) => ({ id: item.$id, type: 'resource', title: `Added ${item.title || item.fileName || 'a resource'}`, timestamp: item.uploadedAt, href: `/app/vault?resource=${item.$id}` })),
      ...visibleFocusSessions.slice(0, 10).map((item: any) => ({ id: item.$id, type: 'focus', title: `Completed ${item.actualMinutes || 0} focused minutes`, timestamp: item.endedAt || item.startedAt, href: '/app/focus' })),
    ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 15)

    return NextResponse.json({
      success: true,
      isOwnProfile,
      isPrivate: false,
      profile: { ...publicProfile(profile), location: isOwnProfile || preferences?.privacy?.showLocation !== false ? profile.location || '' : '', isOnline: isOwnProfile || preferences?.privacy?.showOnlineStatus !== false ? Boolean(profile.isOnline) : false },
      stats: isOwnProfile || preferences?.privacy?.showStudyStats !== false ? { ...stats, studyHours: Math.round((focusMinutes / 60) * 10) / 10 } : { followers: followers.total, following: following.total, postsCreated: posts.total, podsJoined: 0, resourcesShared: 0, focusMinutes: 0, focusSessions: 0, studyDays: 0, studyStreak: 0, studyHours: 0 },
      achievements: isOwnProfile || preferences?.privacy?.showStudyStats !== false ? buildAchievements(stats) : [],
      posts: normalizedPosts,
      resources: visibleResources,
      pods,
      activity,
      relationship: { isFollowing: relationship.total > 0, followerCount: followers.total, followingCount: following.total },
      connections: {
        followers: followers.documents.slice(0, 5).map((item: any) => profileMap.get(String(item.followerId))).filter(Boolean),
        following: following.documents.slice(0, 5).map((item: any) => profileMap.get(String(item.followingId))).filter(Boolean),
      },
    })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[profile-overview] Failed', error)
    return NextResponse.json({ success: false, error: 'Could not load this learning profile' }, { status: 500 })
  }
}
