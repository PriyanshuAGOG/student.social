import { z } from 'zod'
import { isHumanReadableText, normalizeHumanText } from '@/lib/validation/human-text'

export const CALENDAR_EVENT_TYPES = ['study', 'meeting', 'deadline', 'exam', 'break'] as const
export const CALENDAR_REMINDER_MINUTES = [0, 5, 10, 15, 30, 60, 1440] as const
export const MAX_EVENT_YEARS_AHEAD = 5

const isoDateTime = z.string().datetime({ offset: true })

export const calendarEventInputSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(120).refine((value) => isHumanReadableText(value, 3), {
    message: 'Event title must include a descriptive word, not only numbers or symbols.',
  }),
  startTime: isoDateTime,
  endTime: isoDateTime,
  metadata: z.object({
    description: z.string().trim().max(2000).optional(),
    type: z.enum(CALENDAR_EVENT_TYPES).default('study'),
    podId: z.string().trim().max(255).optional(),
    location: z.string().trim().max(500).optional(),
    meetingUrl: z.string().trim().max(500).optional(),
    attendees: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
    isRecurring: z.boolean().optional(),
    reminders: z.array(z.number().int().refine((value) => CALENDAR_REMINDER_MINUTES.includes(value as typeof CALENDAR_REMINDER_MINUTES[number]))).max(4).optional(),
  }).default({ type: 'study' }),
}).superRefine((value, context) => {
  const start = new Date(value.startTime)
  const end = new Date(value.endTime)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const latest = new Date(today)
  latest.setFullYear(latest.getFullYear() + MAX_EVENT_YEARS_AHEAD)

  if (start < today) context.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: 'Start date cannot be in the past.' })
  if (start > latest) context.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: `Events can be scheduled up to ${MAX_EVENT_YEARS_AHEAD} years ahead.` })
  if (end <= start) context.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'End time must be after start time.' })
  if (end.getTime() - start.getTime() > 7 * 24 * 60 * 60 * 1000) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'A single event cannot be longer than 7 days.' })
  }
})

export type CalendarEventInput = z.infer<typeof calendarEventInputSchema>

export function normalizeCalendarEventInput(input: CalendarEventInput) {
  return {
    userId: input.userId,
    title: normalizeHumanText(input.title, 120),
    startTime: new Date(input.startTime).toISOString(),
    endTime: new Date(input.endTime).toISOString(),
    metadata: {
      description: normalizeHumanText(input.metadata.description, 2000),
      type: input.metadata.type,
      podId: normalizeHumanText(input.metadata.podId, 255),
      location: normalizeHumanText(input.metadata.location, 500),
      meetingUrl: normalizeHumanText(input.metadata.meetingUrl, 500),
      attendees: Array.from(new Set(input.metadata.attendees || [])).slice(0, 100),
      isRecurring: Boolean(input.metadata.isRecurring),
      reminders: Array.from(new Set(input.metadata.reminders || [15])).sort((a, b) => a - b),
    },
  }
}
