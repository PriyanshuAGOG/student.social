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
  'updatedAt',
  'lastSeen',
  'isOnline',
  'studyStreak',
  'totalPoints',
  'level',
  'badges',
])

const SYSTEM_PROFILE_FIELDS = new Set(['$id', '$createdAt', '$updatedAt', '$permissions', '$databaseId', '$collectionId', 'createdAt'])

function sanitizeProfileData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => PROFILE_FIELDS.has(key) && !SYSTEM_PROFILE_FIELDS.has(key) && value !== undefined)
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) return String((error as { message?: unknown }).message)
  return String(error || '')
}

function getUnknownAttribute(error: unknown) {
  return getErrorMessage(error).match(/Unknown attribute:\s*["'`]?([^"'`\s.]+)["'`]?/)?.[1]
}

async function writeProfileDocument<T>(operation: (data: Record<string, unknown>) => Promise<T>, data: Record<string, unknown>) {
  const payload = { ...sanitizeProfileData(data) }
  SYSTEM_PROFILE_FIELDS.forEach((field) => delete payload[field])
  const removed = new Set<string>()

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await operation(payload)
    } catch (error) {
      const unknownAttribute = getUnknownAttribute(error)

      if (!unknownAttribute || removed.has(unknownAttribute)) {
        throw error
      }

      removed.add(unknownAttribute)
      delete payload[unknownAttribute]
    }
  }

  return operation(payload)
}


function createProfileFallback(userId: string, defaults: Record<string, unknown> = {}, updates: Record<string, unknown> | null = null) {
  const now = new Date().toISOString()
  const profile = sanitizeProfileData({
    userId,
    name: typeof defaults.name === 'string' && defaults.name.trim() ? defaults.name.trim() : `User_${userId.slice(0, 6)}`,
    email: typeof defaults.email === 'string' ? defaults.email : '',
    bio: '',
    interests: [],
    avatar: '',
    joinedAt: now,
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

  return { ...profile, $id: userId }
}

function profilePermissions(userId: string) {
  return [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

export async function POST(request: NextRequest) {
  let userId = ''
  let defaults: Record<string, unknown> = {}
  let updates: Record<string, unknown> | null = null

  try {
    const body = await request.json()
    userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    defaults = typeof body.defaults === 'object' && body.defaults !== null ? body.defaults : {}
    updates = typeof body.updates === 'object' && body.updates !== null ? body.updates : null

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    try {
      const existing = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId)
      const updatedProfile = await writeProfileDocument(
        (data) => databases.updateDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          userId,
          data,
          profilePermissions(userId)
        ),
        { ...(updates || {}), updatedAt: updates ? new Date().toISOString() : existing.updatedAt || new Date().toISOString() }
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

    const profile = await writeProfileDocument(
      (data) => databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        userId,
        data,
        profilePermissions(userId)
      ),
      baseProfile
    )

    return NextResponse.json({ success: true, profile, created: true }, { status: 201 })
  } catch (error: any) {
    console.warn('Ensure profile API could not persist profile; returning session fallback:', error)

    if (userId) {
      return NextResponse.json({
        success: true,
        profile: createProfileFallback(userId, defaults, updates),
        created: false,
        persisted: false,
        warning: error?.message || 'Profile could not be persisted',
      })
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to ensure profile' },
      { status: error?.code === 401 ? 503 : 500 }
    )
  }
}
