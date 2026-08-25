import { NextRequest, NextResponse } from 'next/server'
import { Permission, Role } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'

const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

const PROFILE_FIELDS = new Set([
  'userId',
  'name',
  'username',
  'email',
  'bio',
  'location',
  'website',
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
    Permission.read(Role.user(userId)),
    Permission.write(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    const { userId } = requireUser(request)
    const body = await parseJsonBody(request, z.object({
      userId: z.string().min(1).optional(),
      defaults: z.record(z.unknown()).default({}),
      updates: z.record(z.unknown()).nullable().default(null),
    }))
    if (body.userId && body.userId !== userId) throw new ApiError(403, 'FORBIDDEN', 'Cannot modify another user profile')
    const defaults = body.defaults || {}
    const updates = body.updates || null

    const { databases, config } = await createAdminClient()

    let existing = null
    try {
      existing = await databases.getDocument(config.databaseId, PROFILES_COLLECTION_ID, userId)
    } catch (error: any) {
      if (error?.code !== 404 && !error?.message?.includes('not found')) throw error
    }

    if (existing) {
      const { userId: _ignoredUserId, ...sanitizedUpdates } = sanitizeProfileData(updates || {})
      if (Object.keys(sanitizedUpdates).length === 0) {
        return NextResponse.json({ success: true, profile: existing, created: false })
      }

      enforceRateLimit(request, { key: 'profiles:ensure:update', max: 20, windowMs: 60_000 })
      const updatedProfile = await databases.updateDocument(
        config.databaseId,
        PROFILES_COLLECTION_ID,
        userId,
        { ...sanitizedUpdates, updatedAt: new Date().toISOString() },
      )

      return NextResponse.json({ success: true, profile: updatedProfile, created: false })
    }

    enforceRateLimit(request, { key: 'profiles:ensure:create', max: 5, windowMs: 60_000 })
    const now = new Date().toISOString()
    const baseProfile = sanitizeProfileData({
      name: typeof defaults.name === 'string' && defaults.name.trim() ? defaults.name.trim() : `User_${userId.slice(0, 6)}`,
      username: typeof defaults.username === 'string' && defaults.username.trim() ? defaults.username.trim() : `user_${userId.slice(0, 6)}`,
      email: typeof defaults.email === 'string' ? defaults.email : '',
      bio: '',
      location: '',
      website: '',
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
      userId,
    })

    try {
      const profile = await databases.createDocument(
        config.databaseId,
        PROFILES_COLLECTION_ID,
        userId,
        baseProfile,
        profilePermissions(userId)
      )

      return NextResponse.json({ success: true, profile, created: true }, { status: 201 })
    } catch (createError: any) {
      if (createError?.code === 409 || String(createError?.message || '').includes('already exists')) {
        const profile = await databases.getDocument(config.databaseId, PROFILES_COLLECTION_ID, userId)
        return NextResponse.json({ success: true, profile, created: false })
      }

      const isUnknownAttribute = String(createError?.message || '').includes('Unknown attribute: "username"')

      if (!isUnknownAttribute) {
        throw createError
      }

      const fallbackProfile = sanitizeProfileData({
        ...baseProfile,
        username: undefined,
      })

      let profile
      try {
        profile = await databases.createDocument(
          config.databaseId,
          PROFILES_COLLECTION_ID,
          userId,
          fallbackProfile,
          profilePermissions(userId)
        )
      } catch (fallbackError: any) {
        if (fallbackError?.code !== 409 && !String(fallbackError?.message || '').includes('already exists')) {
          throw fallbackError
        }
        profile = await databases.getDocument(config.databaseId, PROFILES_COLLECTION_ID, userId)
      }

      return NextResponse.json({ success: true, profile, created: true, schemaFallback: true }, { status: 201 })
    }
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Ensure profile API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to ensure profile' },
      { status: error?.code === 401 ? 503 : 500 }
    )
  }
}
