export type CalendarEventType = 'class'|'study_session'|'deadline'|'progress_review'|'habit'|'goal'|'exam'|'assignment'|'custom'
export type CalendarEventStatus = 'active'|'completed'|'cancelled'|'deleted'
export type PrivacyMode = 'full'|'minimal'|'title_only'|'busy_only'

export type CalendarFeedSettings = {
  userId: string
  status: 'active'|'disabled'|'revoked'
  tokenPrefix: string
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
  privacyMode: PrivacyMode
  defaultReminderMinutes: number
  pastWindowDays: number
  futureWindowDays: number
  maxEventsPerFeed: number
}
