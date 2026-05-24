import crypto from 'crypto'
import { buildCalendar } from '@/lib/calendar/ics-builder'
import { expandRecurringEvent } from '@/lib/calendar/recurrence'
import { hashCalendarToken, hashIp } from '@/lib/calendar/token'
import { detectCalendarProvider } from '@/lib/calendar/providers'

const secret = process.env.CALENDAR_FEED_SECRET || 'dev-secret'

const settingsStore = new Map<string, any>()
settingsStore.set('demo', { tokenHash: hashCalendarToken('pscal_v1_demo', secret), status: 'active', userId: 'demo', feedName: 'Peerspark Calendar', privacyMode: 'full', includeReminders: true, defaultReminderMinutes: 15, includeCancelled: true, includeCompleted: false, maxEventsPerFeed: 1000 })

const eventStore: any[] = [{ id:'1', userId:'demo', eventType:'study_session', status:'active', title:'DSA Practice Session', description:'Focus Trees', location:'Peerspark', startAt:new Date(Date.now()+3600e3).toISOString(), endAt:new Date(Date.now()+7200e3).toISOString(), updatedAt:new Date().toISOString(), createdAt:new Date().toISOString(), recurrenceRule:'FREQ=WEEKLY' }]

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!/^pscal_v1_[A-Za-z0-9_-]+$/.test(token)) return new Response('not found', { status: 404 })
  const tHash = hashCalendarToken(token, secret)
  const feed = [...settingsStore.values()].find((s) => s.tokenHash === tHash)
  if (!feed) return new Response('not found', { status: 404 })
  if (feed.status !== 'active') return new Response('feed disabled', { status: 410 })

  const now = new Date()
  const windowStart = new Date(now.getTime() - 14 * 86400000)
  const windowEnd = new Date(now.getTime() + 180 * 86400000)

  const raw = eventStore.filter((e) => e.userId === feed.userId)
  const expanded = raw.flatMap((e) => expandRecurringEvent(e, windowStart, windowEnd))
  const filtered = expanded
    .filter((e) => feed.includeCancelled || e.status !== 'cancelled')
    .filter((e) => feed.includeCompleted || e.status !== 'completed')
    .filter((e) => e.status !== 'deleted')
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    .slice(0, Math.min(feed.maxEventsPerFeed || 1000, 3000))

  const ics = buildCalendar({ feedSettings: feed, events: filtered, generatedAt: new Date() })
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
