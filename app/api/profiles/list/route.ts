import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

function publicProfile(profile: any) {
  const allowed = [
    '$id', 'userId', 'name', 'username', 'bio', 'avatar', 'profilePictureUrl',
    'interests', 'identity', 'vibes', 'learningGoals', 'learningPace',
    'preferredSessionTypes', 'availability', 'currentFocusAreas', 'isOnline',
    'studyStreak', 'totalPoints', 'level', 'badges', 'location', 'website',
    'joinedAt', 'createdAt', 'lastSeen',
  ]
  return Object.fromEntries(allowed.filter((key) => profile?.[key] !== undefined).map((key) => [key, profile[key]]))
}

export async function GET(request: NextRequest) {
  try {
    requireUser(request)

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const query = searchParams.get('query')?.trim() || ''
    const username = searchParams.get('username')?.trim() || ''
    const userId = searchParams.get('userId')?.trim() || ''

    const { databases } = await createAdminClient()
    if (userId) {
      const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId)
      return NextResponse.json({ success: true, profile: publicProfile(profile) })
    }
    const queries = [Query.limit(limit), Query.offset(offset)]

    if (username) {
      queries.unshift(Query.equal('username', username.replace(/^@+/, '').toLowerCase()))
    } else if (query) {
      queries.unshift(Query.search('name', query))
    }

    const result = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID, queries)

    return NextResponse.json({ success: true, profiles: result.documents.map(publicProfile), total: result.total })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Profile list API error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to list profiles' }, { status: 500 })
  }
}
