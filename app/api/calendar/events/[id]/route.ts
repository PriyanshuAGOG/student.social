import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, jsonOk, parseJsonBody, requireOwnership, requireVerifiedUser } from '@/lib/api-security'
import { CALENDAR_EVENT_TYPES, CALENDAR_REMINDER_MINUTES, calendarEventInputSchema, normalizeCalendarEventInput } from '@/lib/calendar/event-validation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CALENDAR_EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime: z.string().datetime({ offset: true }).optional(),
  type: z.enum(CALENDAR_EVENT_TYPES).optional(),
  podId: z.string().trim().max(255).optional(),
  location: z.string().trim().max(500).optional(),
  meetingUrl: z.string().trim().max(500).optional(),
  attendees: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
  isRecurring: z.boolean().optional(),
  reminders: z.array(z.number().int().refine((value) => CALENDAR_REMINDER_MINUTES.includes(value as typeof CALENDAR_REMINDER_MINUTES[number]))).max(4).optional(),
  isCompleted: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'calendar:events:update', max: 30, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const { id } = await params
    const updates = await parseJsonBody(request, updateSchema)
    const { databases } = createAdminClient()
    const current = await databases.getDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, id)
    requireOwnership(String(current.userId || ''), auth.userId)

    const parsed = calendarEventInputSchema.safeParse({
      userId: auth.userId,
      title: updates.title ?? current.title,
      startTime: updates.startTime ?? current.startTime,
      endTime: updates.endTime ?? current.endTime,
      metadata: {
        description: updates.description ?? current.description ?? '',
        type: updates.type ?? current.type ?? 'study',
        podId: updates.podId ?? current.podId ?? '',
        location: updates.location ?? current.location ?? '',
        meetingUrl: updates.meetingUrl ?? current.meetingUrl ?? '',
        attendees: updates.attendees ?? current.attendees ?? [],
        isRecurring: updates.isRecurring ?? current.isRecurring ?? false,
        reminders: updates.reminders ?? current.reminders ?? [15],
      },
    })
    if (!parsed.success) throw new ApiError(400, 'INVALID_CALENDAR_EVENT', 'Please correct the event details', parsed.error.flatten())
    const normalized = normalizeCalendarEventInput(parsed.data)
    const event = await databases.updateDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, id, {
      title: normalized.title,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      description: normalized.metadata.description,
      type: normalized.metadata.type,
      podId: normalized.metadata.podId,
      location: normalized.metadata.location,
      meetingUrl: normalized.metadata.meetingUrl,
      attendees: normalized.metadata.attendees,
      isRecurring: normalized.metadata.isRecurring,
      reminders: normalized.metadata.reminders,
      isCompleted: updates.isCompleted ?? current.isCompleted ?? false,
      updatedAt: new Date().toISOString(),
    })
    return jsonOk({ event }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'calendar:events:delete', max: 20, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const { id } = await params
    const { databases } = createAdminClient()
    const current = await databases.getDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, id)
    requireOwnership(String(current.userId || ''), auth.userId)
    await databases.deleteDocument(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, id)
    return jsonOk({ deleted: true, id }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}
