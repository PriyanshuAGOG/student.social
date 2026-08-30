import crypto from 'crypto'
import { z } from 'zod'
import { ApiError, jsonError, jsonOk, parseJsonBody, requireUser } from '@/lib/api-security'
import { REMINDER_MINUTES_ALLOWED } from '@/lib/calendar/constants'
import { getDefaultCalendarSyncSettings, normalizeCalendarSyncSettings } from '@/lib/calendar/settings'
import { decryptCalendarToken, encryptCalendarToken, generateCalendarToken, hashCalendarToken } from '@/lib/calendar/token'
import { createAdminClient } from '@/lib/server/appwrite'
import { Query } from 'node-appwrite'

const secret = process.env.CALENDAR_FEED_SECRET || process.env.SESSION_COOKIE_SECRET || process.env.APPWRITE_API_KEY || 'dev-secret'
const encKey = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY || process.env.SESSION_COOKIE_SECRET || process.env.APPWRITE_API_KEY || 'dev-encryption-key'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALENDAR_FEED_SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_FEED_SETTINGS_COLLECTION_ID || 'calendar_feed_settings'

const settingsSchema = z.object({
  feedName: z.string().min(1).max(120).optional(),
  privacyMode: z.enum(['full', 'minimal', 'title_only', 'busy_only']).optional(),
  defaultReminderMinutes: z.number().refine((v) => REMINDER_MINUTES_ALLOWED.includes(v)).optional(),
  pastWindowDays: z.number().min(0).max(365).optional(),
  futureWindowDays: z.number().min(7).max(730).optional(),
  maxEventsPerFeed: z.number().min(10).max(3000).optional(),
  includeClasses: z.boolean().optional(),
  includeStudySessions: z.boolean().optional(),
  includeDeadlines: z.boolean().optional(),
  includeProgressReviews: z.boolean().optional(),
  includeHabits: z.boolean().optional(),
  includeGoals: z.boolean().optional(),
  includeExams: z.boolean().optional(),
  includeAssignments: z.boolean().optional(),
  includeCustomEvents: z.boolean().optional(),
  includeCompleted: z.boolean().optional(),
  includeCancelled: z.boolean().optional(),
  includeDescriptions: z.boolean().optional(),
  includeLocations: z.boolean().optional(),
  includeReminders: z.boolean().optional(),
  includeDeepLinks: z.boolean().optional(),
})

type CalendarFeedRecord = {
  $id: string
  userId: string
  status: 'active' | 'disabled' | 'revoked'
  tokenHash: string
  tokenPrefix: string
  encryptedToken: string
  settingsJson?: string
  lastFetchedAt?: string
  fetchCount?: number
  lastTokenRotatedAt?: string
  createdAt?: string
  updatedAt?: string
}

const buildUrls = (rawToken: string, requestUrl: string) => {
  const configured = process.env.CALENDAR_ICS_FUNCTION_URL?.trim()
  const baseFeedUrl = configured || `${new URL(requestUrl).origin}/api/calendar-sync/feed`
  return {
    feedUrl: `${baseFeedUrl}?token=${rawToken}`,
    webcalUrl: `webcal://${baseFeedUrl.replace(/^https?:\/\//, '')}?token=${rawToken}`,
  }
}

async function getPreviewEvents(userId: string) {
  const databases = await getFeedCollection()
  const result = await databases.listDocuments(DATABASE_ID, process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events', [
    Query.equal('userId', userId),
    Query.greaterThanEqual('endTime', new Date().toISOString()),
    Query.orderAsc('endTime'),
    Query.limit(12),
  ])
  return result.documents.map((event: any) => ({
    id: event.$id,
    title: event.title || 'Event',
    type: event.type || 'custom',
    startAt: event.startTime,
    endAt: event.endTime,
    location: event.location || '',
  }))
}

async function getFeedCollection() {
  const { databases } = await createAdminClient()
  return databases
}

async function getFeedRecord(userId: string) {
  const databases = await getFeedCollection()
  try {
    const result = await databases.listDocuments(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.limit(1),
    ])
    return result.documents[0] as unknown as CalendarFeedRecord | undefined
  } catch (error: any) {
    if (error?.code === 404 || String(error?.message || '').includes('not found')) {
      return undefined
    }
    throw error
  }
}

async function findFeedByTokenHash(tokenHash: string) {
  const databases = await getFeedCollection()
  const result = await databases.listDocuments(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, [
    Query.equal('tokenHash', tokenHash),
    Query.limit(1),
  ])
  return result.documents[0] as unknown as CalendarFeedRecord | undefined
}

function parseSettings(record?: CalendarFeedRecord) {
  const defaultSettings = getDefaultCalendarSyncSettings()
  if (!record?.settingsJson) {
    return defaultSettings
  }

  try {
    return normalizeCalendarSyncSettings(JSON.parse(record.settingsJson))
  } catch {
    return defaultSettings
  }
}

export async function GET(request: Request) {
  const c = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const action = new URL(request.url).searchParams.get('action') || 'status'
    const rec = await getFeedRecord(auth.userId)
    if (!rec) return jsonOk({ status: 'not_enabled' }, 200, c)

    if (action === 'preview') {
      return jsonOk({ events: await getPreviewEvents(auth.userId), settings: parseSettings(rec) }, 200, c)
    }

    if (action === 'download') {
      const raw = decryptCalendarToken(rec.encryptedToken, encKey)
      return jsonOk({ ...buildUrls(raw, request.url), tokenPrefix: rec.tokenPrefix, status: rec.status, settings: parseSettings(rec) }, 200, c)
    }

    const raw = decryptCalendarToken(rec.encryptedToken, encKey)
    return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: parseSettings(rec), fetchCount: rec.fetchCount || 0, lastFetchedAt: rec.lastFetchedAt || null, ...buildUrls(raw, request.url) }, 200, c)
  } catch (e) {
    return jsonError(e, c)
  }
}

export async function POST(request: Request) {
  const c = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const action = new URL(request.url).searchParams.get('action') || 'create'
    const databases = await getFeedCollection()
    const existing = await getFeedRecord(auth.userId)

    if (action === 'create') {
      if (existing) {
        const raw = decryptCalendarToken(existing.encryptedToken, encKey)
        return jsonOk({ status: existing.status, tokenPrefix: existing.tokenPrefix, settings: parseSettings(existing), ...buildUrls(raw, request.url) }, 200, c)
      }
      const raw = generateCalendarToken()
      const rec = {
        userId: auth.userId,
        status: 'active',
        tokenPrefix: raw.slice(0, 14),
        tokenHash: hashCalendarToken(raw, secret),
        encryptedToken: encryptCalendarToken(raw, encKey),
        settingsJson: JSON.stringify(getDefaultCalendarSyncSettings()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await databases.createDocument(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, auth.userId, rec as any)
      return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: normalizeCalendarSyncSettings(JSON.parse(rec.settingsJson)), ...buildUrls(raw, request.url) }, 201, c)
    }

    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Feed not found')
    if (action === 'rotate') {
      const raw = generateCalendarToken()
      await databases.updateDocument(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, existing.$id, {
        tokenHash: hashCalendarToken(raw, secret),
        tokenPrefix: raw.slice(0, 14),
        encryptedToken: encryptCalendarToken(raw, encKey),
        lastTokenRotatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)
      return jsonOk({ status: existing.status, tokenPrefix: raw.slice(0, 14), ...buildUrls(raw, request.url) }, 200, c)
    }
    if (action === 'disable') {
      await databases.updateDocument(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, existing.$id, { status: 'disabled', updatedAt: new Date().toISOString() } as any)
      return jsonOk({ status: 'disabled' }, 200, c)
    }
    if (action === 'enable') {
      await databases.updateDocument(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, existing.$id, { status: 'active', updatedAt: new Date().toISOString() } as any)
      return jsonOk({ status: 'active' }, 200, c)
    }
    throw new ApiError(400, 'BAD_ACTION', 'Unsupported action')
  } catch (e) {
    return jsonError(e, c)
  }
}

export async function PATCH(request: Request) {
  const c = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const databases = await getFeedCollection()
    const rec = await getFeedRecord(auth.userId)
    if (!rec) throw new ApiError(404, 'NOT_FOUND', 'Feed not found')
    const patch = await parseJsonBody(request, settingsSchema)
    const nextSettings = normalizeCalendarSyncSettings({ ...parseSettings(rec), ...patch })
    await databases.updateDocument(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, rec.$id, {
      settingsJson: JSON.stringify(nextSettings),
      updatedAt: new Date().toISOString(),
    } as any)
    return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: nextSettings }, 200, c)
  } catch (e) {
    return jsonError(e, c)
  }
}
