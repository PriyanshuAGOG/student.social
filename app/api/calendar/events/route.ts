import { NextRequest } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, jsonOk, parseJsonBody, requireOwnership, requireVerifiedUser } from '@/lib/api-security'
import { calendarEventInputSchema, normalizeCalendarEventInput } from '@/lib/calendar/event-validation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALENDAR_EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'calendar:events:create', max: 20, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const parsed = await parseJsonBody(request, calendarEventInputSchema)
    const { userId, title, startTime, endTime, metadata } = normalizeCalendarEventInput(calendarEventInputSchema.parse(parsed))
    requireOwnership(userId, auth.userId)

    const { databases } = await createAdminClient()
    const event = await databases.createDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, 'unique()', {
      userId,
      title: title.trim(),
      description: metadata.description || '',
      startTime,
      endTime,
      type: metadata.type,
      podId: metadata.podId,
      location: metadata.location,
      meetingUrl: metadata.meetingUrl,
      attendees: metadata.attendees,
      isRecurring: metadata.isRecurring,
      reminders: metadata.reminders,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
    })

    return jsonOk({ event }, 201, correlationId)
  } catch (error) {
    return jsonError(error instanceof ApiError ? error : new ApiError(500, 'CALENDAR_EVENT_CREATE_FAILED', 'Unable to create calendar event'), correlationId)
  }
}

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    const auth = await requireVerifiedUser(request)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || auth.userId
    const podId = searchParams.get('podId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    requireOwnership(userId, auth.userId)
    const { databases } = await createAdminClient()
    const queries: string[] = []

    if (userId) queries.push(Query.equal('userId', userId))
    if (podId) queries.push(Query.equal('podId', podId))
    if (startDate) queries.push(Query.greaterThanEqual('startTime', startDate))
    if (endDate) queries.push(Query.lessThanEqual('endTime', endDate))

    queries.push(Query.orderAsc('startTime'))
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))

    const result = await databases.listDocuments(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, queries)
    return jsonOk({ events: result.documents, total: result.total }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}
