/**
 * Notification System - Utility Functions
 */

import { NotificationChannel, NotificationCategory, NotificationPriority } from './schema'

/**
 * Check if a user is in quiet hours based on their timezone
 */
export function isInQuietHours(
  quietHoursStart: string,
  quietHoursEnd: string,
  timezone: string
): boolean {
  try {
    const now = new Date()

    // Parse times (format: "HH:mm")
    const [startHour, startMin] = quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = quietHoursEnd.split(':').map(Number)

    const currentHour = now.getHours()
    const currentMin = now.getMinutes()

    // If start hour < end hour, quiet hours don't cross midnight
    if (startHour < endHour) {
      return (
        (currentHour > startHour || (currentHour === startHour && currentMin >= startMin)) &&
        (currentHour < endHour || (currentHour === endHour && currentMin < endMin))
      )
    }
    // If start hour > end hour, quiet hours cross midnight
    else {
      return (
        currentHour >= startHour ||
        (currentHour < endHour || (currentHour === endHour && currentMin < endMin))
      )
    }
  } catch (error) {
    return false
  }
}

/**
 * Render a template string with variables
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template

  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(pattern, String(value || ''))
  })

  return result
}

/**
 * Get priority number for sorting (higher = more important)
 */
export function getPriorityLevel(priority: NotificationPriority): number {
  const levels: Record<NotificationPriority, number> = {
    low: 1,
    normal: 2,
    high: 3,
    critical: 4,
  }
  return levels[priority] || 2
}

/**
 * Generate a unique dedupe key
 */
export function generateDedupeKey(
  userId: string,
  templateKey: string,
  variables?: Record<string, any>
): string {
  const varStr = variables ? JSON.stringify(variables) : ''
  return `${userId}_${templateKey}_${varStr}`
}

/**
 * Check if a notification can be sent based on channel preferences
 */
export function canSendOnChannel(
  preferences: any,
  category: NotificationCategory,
  channel: NotificationChannel
): boolean {
  // Check general channel setting
  const channelKey = `${channel}Enabled`
  if (preferences[channelKey] === false) {
    return false
  }

  // Check category-specific setting
  const categoryChannelKey = `${category}${channel.charAt(0).toUpperCase()}${channel.slice(1)}`
  if (preferences[categoryChannelKey] === false) {
    return false
  }

  return true
}

/**
 * Determine which channels should receive a notification
 */
export function getEnabledChannels(
  preferences: any,
  category: NotificationCategory,
  defaultChannels: NotificationChannel[] = ['in_app']
): NotificationChannel[] {
  return defaultChannels.filter((channel) => canSendOnChannel(preferences, category, channel))
}

/**
 * Format notification for display
 */
export function formatNotificationForDisplay(notification: any) {
  return {
    id: notification.$id,
    title: notification.title,
    body: notification.body,
    category: notification.category,
    priority: notification.priority,
    icon: notification.icon,
    imageUrl: notification.imageUrl,
    ctaLabel: notification.ctaLabel,
    ctaUrl: notification.ctaUrl,
    isRead: notification.isRead,
    createdAt: new Date(notification.createdAt),
    expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : null,
  }
}

/**
 * Calculate engagement risk level based on activity
 */
export function calculateRiskLevel(
  lastSeenDaysAgo: number
): 'healthy' | 'slipping' | 'inactive_24h' | 'inactive_3d' | 'inactive_7d' | 'inactive_14d' | 'churn_risk' {
  if (lastSeenDaysAgo < 1) return 'healthy'
  if (lastSeenDaysAgo < 3) return 'slipping'
  if (lastSeenDaysAgo === 1) return 'inactive_24h'
  if (lastSeenDaysAgo < 7) return 'inactive_3d'
  if (lastSeenDaysAgo < 14) return 'inactive_7d'
  if (lastSeenDaysAgo < 30) return 'inactive_14d'
  return 'churn_risk'
}

/**
 * Validate notification payload
 */
export function validateNotificationPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!payload.userId) {
    errors.push('userId is required')
  }

  if (!payload.templateKey) {
    errors.push('templateKey is required')
  }

  if (!payload.category) {
    errors.push('category is required')
  }

  if (payload.priority && !['low', 'normal', 'high', 'critical'].includes(payload.priority)) {
    errors.push('Invalid priority value')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if notification can bypass quiet hours (critical/security only)
 */
export function canBypassQuietHours(category: NotificationCategory, priority: NotificationPriority): boolean {
  return (
    priority === 'critical' ||
    category === 'security' ||
    category === 'system'
  )
}

/**
 * Calculate notification expiry date
 */
export function calculateExpiryDate(category: NotificationCategory): Date {
  const now = new Date()

  const expiryMap: Record<NotificationCategory, number> = {
    study: 7 * 24 * 60 * 60 * 1000, // 7 days
    class: 30 * 24 * 60 * 60 * 1000, // 30 days
    deadline: 24 * 60 * 60 * 1000, // 1 day
    calendar: 7 * 24 * 60 * 60 * 1000, // 7 days
    progress: 30 * 24 * 60 * 60 * 1000, // 30 days
    streak: 3 * 24 * 60 * 60 * 1000, // 3 days
    goal: 30 * 24 * 60 * 60 * 1000, // 30 days
    habit: 7 * 24 * 60 * 60 * 1000, // 7 days
    social: 7 * 24 * 60 * 60 * 1000, // 7 days
    system: 30 * 24 * 60 * 60 * 1000, // 30 days
    security: 90 * 24 * 60 * 60 * 1000, // 90 days
    admin: 30 * 24 * 60 * 60 * 1000, // 30 days
    marketing: 7 * 24 * 60 * 60 * 1000, // 7 days
    reengagement: 14 * 24 * 60 * 60 * 1000, // 14 days
    digest: 1 * 24 * 60 * 60 * 1000, // 1 day
  }

  const expiryTime = expiryMap[category] || 30 * 24 * 60 * 60 * 1000

  return new Date(now.getTime() + expiryTime)
}
