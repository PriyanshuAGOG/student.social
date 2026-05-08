import { NextRequest, NextResponse } from 'next/server'
import { Permission, Role } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

const PROFILE_FIELDS = new Set([
  'userId',
  'name',
  'email',
  'bio',
  'avatar',
  'avatarFileId',
  'interests',
  'identity',
  'vibes',
  'learningGoals',
  'learningPace',
  'preferredSessionTypes',
  'availability',
  'currentFocusAreas',
  'joinedAt',
  'createdAt',
  'updatedAt',
  'lastSeen',
  'isOnline',
  'studyStreak',
  'totalPoints',
  'level',
  'badges',
])

function sanitizeProfileData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => PROFILE_FIELDS.has(key) && value !== undefined)
  )
}

function profilePermissions(userId: string) {
  return [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const defaults = typeof body.defaults === 'object' && body.defaults !== null ? body.defaults : {}
    const updates = typeof body.updates === 'object' && body.updates !== null ? body.updates : null

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    try {
      const existing = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId)
      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        userId,
        sanitizeProfileData({ ...(updates || {}), updatedAt: updates ? new Date().toISOString() : existing.updatedAt || new Date().toISOString() }),
        profilePermissions(userId)
      )

      return NextResponse.json({ success: true, profile: updatedProfile, created: false })
    } catch (error: any) {
      if (error?.code !== 404 && !error?.message?.includes('not found')) {
        throw error
      }
    }

    const now = new Date().toISOString()
    const baseProfile = sanitizeProfileData({
      userId,
      name: typeof defaults.name === 'string' && defaults.name.trim() ? defaults.name.trim() : `User_${userId.slice(0, 6)}`,
      email: typeof defaults.email === 'string' ? defaults.email : '',
      bio: '',
      interests: [],
      avatar: '',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      isOnline: true,
      studyStreak: 0,
      totalPoints: 0,
      level: 1,
      badges: [],
      learningGoals: [],
      learningPace: '',
      preferredSessionTypes: [],
      availability: [],
      currentFocusAreas: [],
      ...(updates ? sanitizeProfileData(updates) : {}),
    })

    const profile = await databases.createDocument(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      userId,
      baseProfile,
      profilePermissions(userId)
    )

    return NextResponse.json({ success: true, profile, created: true }, { status: 201 })
  } catch (error: any) {
    console.error('Ensure profile API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to ensure profile' },
      { status: error?.code === 401 ? 503 : 500 }
    )
  }
}
