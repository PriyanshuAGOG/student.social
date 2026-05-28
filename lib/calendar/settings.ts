import type { PrivacyMode } from './types'

export type CalendarSyncSettings = {
  feedName: string
  privacyMode: PrivacyMode
  includeClasses: boolean
  includeStudySessions: boolean
  includeDeadlines: boolean
  includeProgressReviews: boolean
  includeHabits: boolean
  includeGoals: boolean
  includeExams: boolean
  includeAssignments: boolean
  includeCustomEvents: boolean
  includeCompleted: boolean
  includeCancelled: boolean
  includeDescriptions: boolean
  includeLocations: boolean
  includeReminders: boolean
  includeDeepLinks: boolean
  defaultReminderMinutes: number
  pastWindowDays: number
  futureWindowDays: number
  maxEventsPerFeed: number
}

const DEFAULT_CALENDAR_SYNC_SETTINGS: CalendarSyncSettings = {
  feedName: 'Peerspark Calendar',
  privacyMode: 'full',
  includeClasses: true,
  includeStudySessions: true,
  includeDeadlines: true,
  includeProgressReviews: true,
  includeHabits: true,
  includeGoals: true,
  includeExams: true,
  includeAssignments: true,
  includeCustomEvents: true,
  includeCompleted: false,
  includeCancelled: true,
  includeDescriptions: true,
  includeLocations: true,
  includeReminders: true,
  includeDeepLinks: true,
  defaultReminderMinutes: 15,
  pastWindowDays: 14,
  futureWindowDays: 180,
  maxEventsPerFeed: 1000,
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toPositiveInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
  return Math.min(max, Math.max(min, parsed))
}

export function getDefaultCalendarSyncSettings(): CalendarSyncSettings {
  return { ...DEFAULT_CALENDAR_SYNC_SETTINGS }
}

export function normalizeCalendarSyncSettings(value: unknown): CalendarSyncSettings {
  if (!isRecord(value)) {
    return getDefaultCalendarSyncSettings()
  }

  return {
    ...DEFAULT_CALENDAR_SYNC_SETTINGS,
    feedName: typeof value.feedName === 'string' && value.feedName.trim() ? value.feedName.trim() : DEFAULT_CALENDAR_SYNC_SETTINGS.feedName,
    privacyMode: value.privacyMode === 'minimal' || value.privacyMode === 'title_only' || value.privacyMode === 'busy_only' ? value.privacyMode : DEFAULT_CALENDAR_SYNC_SETTINGS.privacyMode,
    includeClasses: value.includeClasses !== undefined ? Boolean(value.includeClasses) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeClasses,
    includeStudySessions: value.includeStudySessions !== undefined ? Boolean(value.includeStudySessions) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeStudySessions,
    includeDeadlines: value.includeDeadlines !== undefined ? Boolean(value.includeDeadlines) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeDeadlines,
    includeProgressReviews: value.includeProgressReviews !== undefined ? Boolean(value.includeProgressReviews) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeProgressReviews,
    includeHabits: value.includeHabits !== undefined ? Boolean(value.includeHabits) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeHabits,
    includeGoals: value.includeGoals !== undefined ? Boolean(value.includeGoals) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeGoals,
    includeExams: value.includeExams !== undefined ? Boolean(value.includeExams) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeExams,
    includeAssignments: value.includeAssignments !== undefined ? Boolean(value.includeAssignments) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeAssignments,
    includeCustomEvents: value.includeCustomEvents !== undefined ? Boolean(value.includeCustomEvents) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeCustomEvents,
    includeCompleted: value.includeCompleted !== undefined ? Boolean(value.includeCompleted) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeCompleted,
    includeCancelled: value.includeCancelled !== undefined ? Boolean(value.includeCancelled) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeCancelled,
    includeDescriptions: value.includeDescriptions !== undefined ? Boolean(value.includeDescriptions) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeDescriptions,
    includeLocations: value.includeLocations !== undefined ? Boolean(value.includeLocations) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeLocations,
    includeReminders: value.includeReminders !== undefined ? Boolean(value.includeReminders) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeReminders,
    includeDeepLinks: value.includeDeepLinks !== undefined ? Boolean(value.includeDeepLinks) : DEFAULT_CALENDAR_SYNC_SETTINGS.includeDeepLinks,
    defaultReminderMinutes: toPositiveInt(value.defaultReminderMinutes, DEFAULT_CALENDAR_SYNC_SETTINGS.defaultReminderMinutes, 0, 180),
    pastWindowDays: toPositiveInt(value.pastWindowDays, DEFAULT_CALENDAR_SYNC_SETTINGS.pastWindowDays, 0, 365),
    futureWindowDays: toPositiveInt(value.futureWindowDays, DEFAULT_CALENDAR_SYNC_SETTINGS.futureWindowDays, 7, 730),
    maxEventsPerFeed: toPositiveInt(value.maxEventsPerFeed, DEFAULT_CALENDAR_SYNC_SETTINGS.maxEventsPerFeed, 10, 3000),
  }
}