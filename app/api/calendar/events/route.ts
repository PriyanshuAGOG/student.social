import { NextRequest } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'
import { z } from 'zod'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALENDAR_EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()

  try {
    const auth = requireUser(request)
    const bodySchema = z.object({
      userId: z.string().min(1),
      title: z.string().min(1).max(255),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      metadata: z.record(z.any()).optional(),
    })

    const { userId, title, startTime, endTime, metadata = {} } = await parseJsonBody(request, bodySchema)
    requireOwnership(userId, auth.userId)

    const { databases } = await createAdminClient()
    const event = await databases.createDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, 'unique()', {
      userId,
      title: title.trim(),
      description: metadata.description || '',
      startTime,
      endTime,
      type: metadata.type || 'study',
      podId: metadata.podId || null,
      location: metadata.location || '',
      meetingUrl: metadata.meetingUrl || '',
      attendees: Array.isArray(metadata.attendees) ? metadata.attendees : [],
      isRecurring: Boolean(metadata.isRecurring),
      reminders: Array.isArray(metadata.reminders) ? metadata.reminders : [],
      createdAt: new Date().toISOString(),
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
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const podId = searchParams.get('podId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const { databases } = await createAdminClient()
    const queries: string[] = []

    if (userId) queries.push(Query.equal('userId', userId))
    if (podId) queries.push(Query.equal('podId', podId))

    queries.push(Query.orderAsc('startTime'))
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))

    const result = await databases.listDocuments(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, queries)
    return jsonOk({ events: result.documents, total: result.total }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}