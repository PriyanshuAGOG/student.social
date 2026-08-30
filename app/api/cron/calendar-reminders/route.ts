import crypto from 'crypto'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { createServerNotification } from '@/lib/server/notifications'
import { sendCalendarReminderEmail } from '@/lib/server/calendar-reminder-email'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'
const PREFERENCES_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES_COLLECTION_ID || 'notification_preferences'
const DELIVERIES_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_REMINDER_DELIVERIES_COLLECTION_ID || 'calendar_reminder_deliveries'

function deliveryId(eventId: string, minutes: number, channel: string) {
  return crypto.createHash('sha256').update(`${eventId}:${minutes}:${channel}`).digest('hex').slice(0, 32)
}

function isAuthorized(request: Request) {
  if (process.env.NODE_ENV !== 'production') return true
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

async function reserveDelivery(databases: any, event: any, minutes: number, channel: 'in_app' | 'email') {
  const id = deliveryId(event.$id, minutes, channel)
  try {
    await databases.createDocument(DATABASE_ID, DELIVERIES_COLLECTION_ID, id, {
      deliveryKey: `${event.$id}:${minutes}:${channel}`,
      eventId: event.$id,
      userId: event.userId,
      reminderMinutes: minutes,
      channel,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return id
  } catch (error: any) {
    if (error?.code === 409 || String(error?.message || '').includes('already exists')) return ''
    throw error
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { databases, users } = createAdminClient()
  const now = Date.now()
  const earliest = new Date(now - 6 * 60_000).toISOString()
  const latest = new Date(now + 24 * 60 * 60_000 + 2 * 60_000).toISOString()
  const result = await databases.listDocuments(DATABASE_ID, EVENTS_COLLECTION_ID, [
    Query.greaterThanEqual('startTime', earliest),
    Query.lessThanEqual('startTime', latest),
    Query.orderAsc('startTime'),
    Query.limit(500),
  ])

  let inAppDelivered = 0
  let emailsDelivered = 0
  for (const event of result.documents as any[]) {
    const startMs = Date.parse(event.startTime)
    if (!Number.isFinite(startMs)) continue
    for (const minutes of Array.isArray(event.reminders) ? event.reminders : [15]) {
      const dueAt = startMs - Number(minutes) * 60_000
      if (dueAt < now - 6 * 60_000 || dueAt > now + 2 * 60_000) continue

      const inAppId = await reserveDelivery(databases, event, Number(minutes), 'in_app')
      if (inAppId) {
        try {
          await createServerNotification({
            userId: event.userId,
            title: Number(minutes) === 0 ? 'Event starting now' : 'Upcoming calendar event',
            message: `${event.title} ${Number(minutes) === 0 ? 'is starting now' : `starts in ${minutes} minutes`}.`,
            type: 'calendar_reminder',
            actionUrl: '/app/calendar',
            metadata: { eventId: event.$id, reminderMinutes: Number(minutes) },
          })
          await databases.updateDocument(DATABASE_ID, DELIVERIES_COLLECTION_ID, inAppId, { status: 'sent', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          inAppDelivered += 1
        } catch (error: any) {
          await databases.updateDocument(DATABASE_ID, DELIVERIES_COLLECTION_ID, inAppId, { status: 'failed', error: String(error?.message || error).slice(0, 1000), updatedAt: new Date().toISOString() }).catch(() => undefined)
        }
      }

      const preferences = await databases.listDocuments(DATABASE_ID, PREFERENCES_COLLECTION_ID, [Query.equal('userId', event.userId), Query.limit(1)]).catch(() => ({ documents: [] as any[] }))
      const preference = preferences.documents[0]
      if (preference?.emailEnabled === false || preference?.calendarEmail === false) continue
      // Do not reserve the idempotency key until email delivery is configured.
      // This lets reminders begin working after RESEND_API_KEY is added later.
      if (!process.env.RESEND_API_KEY) continue
      const emailId = await reserveDelivery(databases, event, Number(minutes), 'email')
      if (!emailId) continue
      try {
        const account = await users.get(event.userId)
        const sent = await sendCalendarReminderEmail({ email: account.email, name: account.name, eventId: event.$id, title: event.title, startTime: event.startTime, location: event.location, reminderMinutes: Number(minutes) })
        await databases.updateDocument(DATABASE_ID, DELIVERIES_COLLECTION_ID, emailId, { status: sent.sent ? 'sent' : 'disabled', deliveredAt: sent.sent ? new Date().toISOString() : '', updatedAt: new Date().toISOString() })
        if (sent.sent) emailsDelivered += 1
      } catch (error: any) {
        await databases.updateDocument(DATABASE_ID, DELIVERIES_COLLECTION_ID, emailId, { status: 'failed', error: String(error?.message || error).slice(0, 1000), updatedAt: new Date().toISOString() }).catch(() => undefined)
      }
    }
  }

  return Response.json({ success: true, scanned: result.total, inAppDelivered, emailsDelivered })
}
