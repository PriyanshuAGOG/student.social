import crypto from 'crypto'
import { buildCalendar } from '@/lib/calendar/ics-builder'
import { expandRecurringEvent } from '@/lib/calendar/recurrence'
import { hashCalendarToken, hashIp } from '@/lib/calendar/token'
import { detectCalendarProvider } from '@/lib/calendar/providers'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { normalizeCalendarSyncSettings } from '@/lib/calendar/settings'

const secret = process.env.CALENDAR_FEED_SECRET || 'dev-secret'
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALENDAR_FEED_SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_FEED_SETTINGS_COLLECTION_ID || 'calendar_feed_settings'
const CALENDAR_EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'

async function getFeedByTokenHash(tokenHash: string) {
  const { databases } = createAdminClient()
  const response = await databases.listDocuments(DATABASE_ID, CALENDAR_FEED_SETTINGS_COLLECTION_ID, [
    Query.equal('tokenHash', tokenHash),
    Query.limit(1),
  ])

  return response.documents[0] as any | undefined
}

async function getEventsForUser(userId: string, startDate: Date, endDate: Date) {
  const { databases } = createAdminClient()
  const response = await databases.listDocuments(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, [
    Query.equal('userId', userId),
    Query.greaterThanEqual('startTime', startDate.toISOString()),
    Query.lessThanEqual('endTime', endDate.toISOString()),
    Query.orderAsc('startTime'),
    Query.limit(3000),
  ])

  return response.documents.map((event: any) => ({
    ...event,
    id: event.$id,
    eventType: event.type || 'custom',
    startAt: event.startTime,
    endAt: event.endTime,
    status: event.isCompleted ? 'completed' : 'active',
    deepLinkPath: event.podId ? `/app/pods/${event.podId}` : '/app/calendar',
  }))
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!/^pscal_v1_[A-Za-z0-9_-]+$/.test(token)) return new Response('not found', { status: 404 })
  const tHash = hashCalendarToken(token, secret)
  const feed = await getFeedByTokenHash(tHash)
  if (!feed) return new Response('not found', { status: 404 })
  if (feed.status !== 'active') return new Response('feed disabled', { status: 410 })

  const now = new Date()
  const settings = normalizeCalendarSyncSettings(feed.settingsJson ? JSON.parse(feed.settingsJson) : {})
  const windowStart = new Date(now.getTime() - Math.max(settings.pastWindowDays, 0) * 86400000)
  const windowEnd = new Date(now.getTime() + Math.max(settings.futureWindowDays, 7) * 86400000)

  const raw = await getEventsForUser(feed.userId, windowStart, windowEnd)
  const expanded = raw.flatMap((e) => expandRecurringEvent(e, windowStart, windowEnd))
  const filtered = expanded
    .filter((e) => settings.includeCancelled || e.status !== 'cancelled')
    .filter((e) => settings.includeCompleted || e.status !== 'completed')
    .filter((e) => e.status !== 'deleted')
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    .slice(0, Math.min(settings.maxEventsPerFeed || 1000, 3000))

  const ics = buildCalendar({ feedSettings: settings, events: filtered, generatedAt: new Date() })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const provider = detectCalendarProvider(request.headers.get('user-agent') || '')
  const _diag = { provider, ipHash: hashIp(ip, secret), eventCount: filtered.length }

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="peerspark-calendar.ics"',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
      ETag: crypto.createHash('sha1').update(ics).digest('hex'),
      'Last-Modified': new Date().toUTCString(),
    },
  })
}
