/**
 * Core Notification Service
 * Handles notification creation, queuing, and lifecycle management
 */

import { databases, functions } from '@/lib/appwrite'
import { getEnv } from '@/lib/env'
import {
  NotificationPayload,
  NotificationQueue,
  NotificationPreferences,
  InAppNotification,
  NotificationDeliveryLog,
  QueueStatus,
  DeliveryStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from './schema'
import { Query, ID } from 'appwrite'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

const COLLECTIONS = {
  PREFERENCES: 'notification_preferences',
  TEMPLATES: 'notification_templates',
  QUEUE: 'notification_queue',
  DELIVERY_LOGS: 'notification_delivery_logs',
  IN_APP: 'in_app_notifications',
  DEVICE_TARGETS: 'notification_device_targets',
  ACTIVITY_STATE: 'user_activity_state',
  RATE_LIMITS: 'notification_rate_limits',
  SUPPRESSION: 'notification_suppression',
  BROADCASTS: 'admin_broadcasts',
}

/**
 * Queue a notification for delivery
 */
export async function queueNotification(payload: NotificationPayload) {
  try {
    const dedupeKey = payload.dedupeKey || generateDedupeKey(payload)
    const scheduledFor = payload.scheduledFor || new Date()

    const queueItem: Partial<NotificationQueue> = {
      userId: payload.userId,
      templateKey: payload.templateKey,
      category: payload.category,
      priority: payload.priority || 'normal',
      channels: (payload.channels || ['in_app', 'push', 'email']).join(','),
      payloadJson: JSON.stringify(payload.variables || {}),
      scheduledFor: scheduledFor.toISOString(),
      status: 'queued' as QueueStatus,
      dedupeKey,
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (payload.expiresAt) {
      queueItem.expiresAt = payload.expiresAt.toISOString()
    }

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.QUEUE,
      ID.unique(),
      queueItem
    )

    console.log('[Notification] Queued notification:', result.$id)
    return result as NotificationQueue
  } catch (error) {
    console.error('[Notification] Failed to queue notification:', error)
    throw error
  }
}

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PREFERENCES, [
      Query.equal('userId', userId),
    ])

    return (response.documents[0] as NotificationPreferences) || null
  } catch (error) {
    console.error('[Notification] Failed to get user preferences:', error)
    return null
  }
}

/**
 * Create or update user notification preferences
 */
export async function upsertUserPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const existing = await getUserPreferences(userId)

    if (existing) {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PREFERENCES,
        existing.$id!,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      )
      return updated as NotificationPreferences
    } else {
      const created = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PREFERENCES,
        ID.unique(),
        {
          userId,
          ...updates,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      )
      return created as NotificationPreferences
    }
  } catch (error) {
    console.error('[Notification] Failed to upsert preferences:', error)
    throw error
  }
}

/**
 * Log a delivery attempt
 */
export async function logDelivery(log: Partial<NotificationDeliveryLog>) {
  try {
    const record: Partial<NotificationDeliveryLog> = {
      ...log,
      createdAt: new Date().toISOString(),
    }

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.DELIVERY_LOGS,
      ID.unique(),
      record
    )

    return result as NotificationDeliveryLog
  } catch (error) {
    console.error('[Notification] Failed to log delivery:', error)
    throw error
  }
}

/**
 * Create in-app notification for user
 */
export async function createInAppNotification(
  userId: string,
  data: {
    title: string
    body: string
    category: NotificationCategory
    priority?: NotificationPriority
    icon?: string
    imageUrl?: string
    ctaLabel?: string
    ctaUrl?: string
    expiresAt?: Date
    metadata?: Record<string, any>
  }
) {
  try {
    const notification: Partial<InAppNotification> = {
      userId,
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority || 'normal',
      icon: data.icon,
      imageUrl: data.imageUrl,
      ctaLabel: data.ctaLabel,
      ctaUrl: data.ctaUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    if (data.expiresAt) {
      notification.expiresAt = data.expiresAt.toISOString()
    }

    if (data.metadata) {
      notification.metadataJson = JSON.stringify(data.metadata)
    }

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.IN_APP,
      ID.unique(),
      notification
    )

    return result as InAppNotification
  } catch (error) {
    console.error('[Notification] Failed to create in-app notification:', error)
    throw error
  }
}

/**
 * Get unread in-app notifications for user
 */
export async function getUnreadNotifications(userId: string, limit: number = 20, offset: number = 0) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.IN_APP,
      [Query.equal('userId', userId), Query.equal('isRead', false), Query.orderDesc('createdAt')],
      limit,
      offset
    )

    return response as any
  } catch (error) {
    console.error('[Notification] Failed to get unread notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const result = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.IN_APP,
      notificationId,
      {
        isRead: true,
        readAt: new Date().toISOString(),
      }
    )

    return result as InAppNotification
  } catch (error) {
    console.error('[Notification] Failed to mark notification as read:', error)
    throw error
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.IN_APP, notificationId)
  } catch (error) {
    console.error('[Notification] Failed to delete notification:', error)
    throw error
  }
}

/**
 * Generate a unique dedupe key for notifications
 */
function generateDedupeKey(payload: NotificationPayload): string {
  return `${payload.userId}_${payload.templateKey}_${JSON.stringify(payload.variables || {})}_${Date.now()}`
}

/**
 * Check if notification should be suppressed
 */
export async function isNotificationSuppressed(userId: string, channel: NotificationChannel, category?: NotificationCategory): Promise<boolean> {
  try {
    const queries = [Query.equal('userId', userId), Query.equal('channel', channel), Query.equal('status', 'active')]

    if (category) {
      queries.push(Query.equal('category', category))
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SUPPRESSION, queries)

    return response.documents.length > 0
  } catch (error) {
    console.error('[Notification] Error checking suppression:', error)
    return false
  }
}

/**
 * Get queue item for processing
 */
export async function getQueueItem(queueId: string): Promise<NotificationQueue | null> {
  try {
    const result = await databases.getDocument(DATABASE_ID, COLLECTIONS.QUEUE, queueId)
    return result as NotificationQueue
  } catch (error) {
    console.error('[Notification] Failed to get queue item:', error)
    return null
  }
}

/**
 * Update queue item status
 */
export async function updateQueueItemStatus(
  queueId: string,
  status: QueueStatus,
  updates?: Partial<NotificationQueue>
) {
  try {
    const result = await databases.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, queueId, {
      status,
      updatedAt: new Date().toISOString(),
      ...updates,
    })

    return result as NotificationQueue
  } catch (error) {
    console.error('[Notification] Failed to update queue item:', error)
    throw error
  }
}

/**
 * Get pending notifications for processing
 */
export async function getPendingNotifications(limit: number = 10): Promise<NotificationQueue[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUEUE,
      [
        Query.equal('status', 'queued'),
        Query.lessThanOrEqual('scheduledFor', new Date().toISOString()),
        Query.orderAsc('priority'),
        Query.orderAsc('scheduledFor'),
      ],
      limit
    )

    return response.documents as NotificationQueue[]
  } catch (error) {
    console.error('[Notification] Failed to get pending notifications:', error)
    return []
  }
}
