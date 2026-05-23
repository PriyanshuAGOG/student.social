import crypto from 'crypto'
import { z } from 'zod'
import { ApiError, jsonError, jsonOk, parseJsonBody, requireUser } from '@/lib/api-security'
import { REMINDER_MINUTES_ALLOWED } from '@/lib/calendar/constants'
import { decryptCalendarToken, encryptCalendarToken, generateCalendarToken, hashCalendarToken } from '@/lib/calendar/token'

const secret = process.env.CALENDAR_FEED_SECRET || 'dev-secret'
const encKey = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY || 'dev-encryption-key'
const baseFeedUrl = process.env.CALENDAR_ICS_FUNCTION_URL || 'http://localhost:3000/api/calendar-sync/feed'

const store = new Map<string, any>()

const settingsSchema = z.object({
  feedName: z.string().min(1).max(120).optional(),
  privacyMode: z.enum(['full', 'minimal', 'title_only', 'busy_only']).optional(),
  defaultReminderMinutes: z.number().refine((v) => REMINDER_MINUTES_ALLOWED.includes(v)).optional(),
  pastWindowDays: z.number().min(0).max(365).optional(),
  futureWindowDays: z.number().min(7).max(730).optional(),
  maxEventsPerFeed: z.number().min(10).max(3000).optional(),
})

const buildUrls = (rawToken: string) => ({
  feedUrl: `${baseFeedUrl}?token=${rawToken}`,
  webcalUrl: `webcal://${baseFeedUrl.replace(/^https?:\/\//, '')}?token=${rawToken}`,
})

export async function GET(request: Request) {
  const c = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const action = new URL(request.url).searchParams.get('action') || 'status'
    const rec = store.get(auth.userId)
    if (!rec) return jsonOk({ status: 'not_enabled' }, 200, c)

    if (action === 'preview') {
      return jsonOk({ events: [{ title: '[Study] DSA Session', type: 'study_session', startAt: new Date().toISOString() }] }, 200, c)
    }

    if (action === 'download') {
      const raw = decryptCalendarToken(rec.encryptedToken, encKey)
      return jsonOk({ ...buildUrls(raw), tokenPrefix: rec.tokenPrefix, status: rec.status }, 200, c)
    }

    const raw = decryptCalendarToken(rec.encryptedToken, encKey)
    return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: rec.settings, fetchCount: rec.fetchCount || 0, lastFetchedAt: rec.lastFetchedAt || null, providerDiagnostics: rec.providerDiagnostics || 'Never fetched yet', ...buildUrls(raw) }, 200, c)
  } catch (e) {
    return jsonError(e, c)
  }
}

export async function POST(request: Request) {
  const c = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const action = new URL(request.url).searchParams.get('action') || 'create'
    const existing = store.get(auth.userId)

    if (action === 'create') {
      if (existing) return jsonOk(existing, 200, c)
      const raw = generateCalendarToken()
      const rec = {
        userId: auth.userId,
        status: 'active',
        tokenPrefix: raw.slice(0, 14),
        tokenHash: hashCalendarToken(raw, secret),
        encryptedToken: encryptCalendarToken(raw, encKey),
        settings: { privacyMode: 'full', futureWindowDays: 180, pastWindowDays: 14, maxEventsPerFeed: 1000, defaultReminderMinutes: 15 },
      }
      store.set(auth.userId, rec)
      return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: rec.settings, ...buildUrls(raw) }, 201, c)
    }

    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Feed not found')
    if (action === 'rotate') {
      const raw = generateCalendarToken()
      existing.tokenHash = hashCalendarToken(raw, secret)
      existing.tokenPrefix = raw.slice(0, 14)
      existing.encryptedToken = encryptCalendarToken(raw, encKey)
      existing.lastTokenRotatedAt = new Date().toISOString()
      return jsonOk({ status: existing.status, tokenPrefix: existing.tokenPrefix, ...buildUrls(raw) }, 200, c)
    }
    if (action === 'disable') {
      existing.status = 'disabled'
      return jsonOk({ status: 'disabled' }, 200, c)
    }
    if (action === 'enable') {
      existing.status = 'active'
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
    const rec = store.get(auth.userId)
    if (!rec) throw new ApiError(404, 'NOT_FOUND', 'Feed not found')
    const patch = await parseJsonBody(request, settingsSchema)
    rec.settings = { ...rec.settings, ...patch }
    return jsonOk({ status: rec.status, tokenPrefix: rec.tokenPrefix, settings: rec.settings }, 200, c)
  } catch (e) {
    return jsonError(e, c)
  }
}
