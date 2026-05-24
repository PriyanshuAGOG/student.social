/**
 * Notification System Database Schema Definitions
 * All collections follow Appwrite's standards with proper TypeScript types
 */

// ============================================================================
// COLLECTION: notification_preferences
// One document per user, manages all notification settings
// ============================================================================

export interface NotificationPreferences {
  $id?: string
  userId: string
  
  // Channel toggles
  inAppEnabled: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  
  // Per-category channel preferences
  studyPush: boolean
  studyEmail: boolean
  studySms: boolean
  
  classPush: boolean
  classEmail: boolean
  classSms: boolean
  
  deadlinePush: boolean
  deadlineEmail: boolean
  deadlineSms: boolean
  
  calendarPush: boolean
  calendarEmail: boolean
  calendarSms: boolean
  
  progressPush: boolean
  progressEmail: boolean
  progressSms: boolean
  
  streakPush: boolean
  streakEmail: boolean
  streakSms: boolean
  
  goalPush: boolean
  goalEmail: boolean
  goalSms: boolean
  
  habitPush: boolean
  habitEmail: boolean
  habitSms: boolean
  
  socialPush: boolean
  socialEmail: boolean
  socialSms: boolean
  
  systemPush: boolean
  systemEmail: boolean
  systemSms: boolean
  
  securityPush: boolean
  securityEmail: boolean
  securitySms: boolean
  
  adminPush: boolean
  adminEmail: boolean
  adminSms: boolean
  
  marketingPush: boolean
  marketingEmail: boolean
  marketingSms: boolean
  
  reengagementPush: boolean
  reengagementEmail: boolean
  reengagementSms: boolean
  
  digestPush: boolean
  digestEmail: boolean
  digestSms: boolean
  
  // Quiet hours
  quietHoursEnabled: boolean
  quietHoursStart: string // "HH:mm"
  quietHoursEnd: string
  timezone: string
  
  // Digest settings
  dailyDigestEnabled: boolean
  weeklyDigestEnabled: boolean
  digestTime: string // "HH:mm"
  
  // Default reminder minutes
  defaultStudyReminderMinutes: number
  defaultClassReminderMinutes: number
  defaultDeadlineReminderHours: number
  
  // Rate limits
  maxPushPerHour: number
  maxPushPerDay: number
  maxEmailsPerDay: number
  maxSmsPerDay: number
  
  criticalAlertsAlwaysOn: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: notification_templates
// Reusable templates for all notification channels
// ============================================================================

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms'
export type NotificationCategory =
  | 'study'
  | 'class'
  | 'deadline'
  | 'calendar'
  | 'progress'
  | 'streak'
  | 'goal'
  | 'habit'
  | 'social'
  | 'system'
  | 'security'
  | 'admin'
  | 'marketing'
  | 'reengagement'
  | 'digest'

export interface NotificationTemplate {
  $id?: string
  templateKey: string // e.g., "study_session_starting"
  channel: NotificationChannel
  category: NotificationCategory
  titleTemplate?: string
  subjectTemplate?: string // For email
  bodyTemplate: string
  htmlTemplate?: string // For email
  ctaLabelTemplate?: string
  ctaUrlTemplate?: string
  locale: string
  status: 'active' | 'draft' | 'disabled' | 'archived'
  version: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: notification_queue
// Main notification queue, processed by workers
// ============================================================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'
export type QueueStatus =
  | 'queued'
  | 'processing'
  | 'sent'
  | 'partial'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'expired'

export interface NotificationQueue {
  $id?: string
  userId: string
  templateKey: string
  category: NotificationCategory
  priority: NotificationPriority
  channels: string // comma-separated: "in_app,push,email"
  payloadJson: string // JSON stringified payload
  scheduledFor: string // ISO datetime
  expiresAt?: string
  status: QueueStatus
  dedupeKey: string // Unique key for deduplication
  attemptCount: number
  maxAttempts: number
  lockedAt?: string
  lockedBy?: string
  lastError?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
}

// ============================================================================
// COLLECTION: notification_delivery_logs
// Tracks delivery attempt for each channel
// ============================================================================

export type DeliveryStatus =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'blocked'
  | 'rate_limited'
  | 'quiet_hours_delayed'
  | 'provider_missing'
  | 'target_missing'
  | 'delivered'
  | 'opened'
  | 'clicked'

export interface NotificationDeliveryLog {
  $id?: string
  notificationId: string
  userId: string
  channel: NotificationChannel
  provider?: string
  providerMessageId?: string
  targetId?: string
  status: DeliveryStatus
  errorCode?: string
  errorMessage?: string
  sentAt?: string
  deliveredAt?: string
  openedAt?: string
  clickedAt?: string
  createdAt: string
}

// ============================================================================
// COLLECTION: in_app_notifications
// User notification inbox
// ============================================================================

export interface InAppNotification {
  $id?: string
  userId: string
  title: string
  body: string
  category: NotificationCategory
  priority: NotificationPriority
  icon?: string
  imageUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  isRead: boolean
  readAt?: string
  expiresAt?: string
  metadataJson?: string // Additional context
  createdAt: string
}

// ============================================================================
// COLLECTION: notification_device_targets
// Device tracking for push notifications
// ============================================================================

export type DevicePlatform = 'web' | 'android' | 'ios' | 'desktop' | 'unknown'
export type DeviceStatus = 'active' | 'revoked' | 'expired' | 'disabled'

export interface NotificationDeviceTarget {
  $id?: string
  userId: string
  targetId: string // Appwrite Messaging target ID
  provider: string
  platform: DevicePlatform
  deviceName?: string
  browserName?: string
  osName?: string
  fcmTokenHash?: string // Never store raw token
  status: DeviceStatus
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: user_activity_state
// Track user engagement for re-engagement campaigns
// ============================================================================

export type RiskLevel =
  | 'new'
  | 'healthy'
  | 'slipping'
  | 'inactive_24h'
  | 'inactive_3d'
  | 'inactive_7d'
  | 'inactive_14d'
  | 'churn_risk'
  | 'dormant'

export interface UserActivityState {
  $id?: string
  userId: string
  lastSeenAt?: string
  lastStudySessionAt?: string
  lastClassInteractionAt?: string
  lastProgressUpdateAt?: string
  lastGoalUpdateAt?: string
  lastCalendarEventCreatedAt?: string
  currentStreak: number
  longestStreak: number
  weeklyStudyMinutes: number
  monthlyStudyMinutes: number
  sessionsCompletedThisWeek: number
  sessionsMissedThisWeek: number
  engagementScore: number
  riskLevel: RiskLevel
  lastReengagementSentAt?: string
  lastDigestSentAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: notification_rate_limits
// Per-user, per-channel rate limit tracking
// ============================================================================

export interface NotificationRateLimit {
  $id?: string
  userId: string
  channel: NotificationChannel
  windowKey: string // e.g., "daily_2024-05-24"
  count: number
  windowStart: string
  windowEnd: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: notification_suppression
// User unsubscribes and suppressions
// ============================================================================

export type SuppressionReason =
  | 'user_disabled'
  | 'unsubscribe'
  | 'bounce'
  | 'complaint'
  | 'admin_suppressed'
  | 'provider_error'

export interface NotificationSuppression {
  $id?: string
  userId: string
  channel: NotificationChannel
  category?: NotificationCategory
  reason: SuppressionReason
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// COLLECTION: admin_broadcasts
// Admin campaigns and broadcasts
// ============================================================================

export type BroadcastStatus =
  | 'draft'
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled'

export type TargetSegment =
  | 'all_users'
  | 'active_users'
  | 'inactive_3d'
  | 'inactive_7d'
  | 'new_users'
  | 'students_with_sessions'
  | 'students_without_sessions'
  | 'streak_users'
  | 'custom'

export interface AdminBroadcast {
  $id?: string
  title: string
  body: string
  category: NotificationCategory
  channels: string // "in_app,push,email"
  targetSegment: TargetSegment
  scheduledFor: string
  status: BroadcastStatus
  createdBy: string
  payloadJson?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface NotificationPayload {
  userId: string
  templateKey: string
  category: NotificationCategory
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  variables?: Record<string, string | number | boolean>
  scheduledFor?: Date
  expiresAt?: Date
  dedupeKey?: string
}

export interface NotificationContext {
  userId: string
  templateKey: string
  category: NotificationCategory
  variables: Record<string, any>
  locale: string
  timezone: string
  channels: NotificationChannel[]
}
