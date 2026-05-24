/**
 * Appwrite Function: notification-worker
 * 
 * Scheduled execution: every 1 minute
 * Purpose: Process notification queue, apply preferences, and deliver via Appwrite Messaging
 */

import { Client, Databases, Query, Messaging } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '')

const db = new Databases(client)
const messaging = new Messaging(client)

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || ''
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
}

const BATCH_SIZE = 10
const LOCK_DURATION_MS = 30000 // 30 seconds

type Logger = (message: string, data?: any) => void

const createLogger = (context: string): Logger => {
  return (message: string, data?: any) => {
    console.log(`[${context}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }
}

export default async function handler(req: any, res: any) {
  const log = createLogger('NotificationWorker')

  try {
    log('Worker started', {
      timestamp: new Date().toISOString(),
      batchSize: BATCH_SIZE,
    })

    // Get pending notifications
    const pendingResponse = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUEUE,
      [
        Query.equal('status', 'queued'),
        Query.lessThanOrEqual('scheduledFor', new Date().toISOString()),
        Query.orderAsc('priority'),
        Query.limit(BATCH_SIZE),
      ]
    )

    const pendingNotifications = pendingResponse.documents

    log(`Found ${pendingNotifications.length} pending notifications`)

    for (const notification of pendingNotifications) {
      await processNotification(notification, log)
    }

    log('Worker completed', {
      processed: pendingNotifications.length,
      timestamp: new Date().toISOString(),
    })

    return res.json({
      success: true,
      processed: pendingNotifications.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    log('Worker error', {
      error: error.message,
      stack: error.stack,
    })

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

async function processNotification(notification: any, log: Logger) {
  const notificationId = notification.$id
  const userId = notification.userId

  try {
    log(`Processing notification ${notificationId}`, {
      userId,
      templateKey: notification.templateKey,
      category: notification.category,
    })

    // Acquire lock
    const lockKey = `${notificationId}_lock`
    const nowISO = new Date().toISOString()
    const lockUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString()

    try {
      await db.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, notificationId, {
        status: 'processing',
        lockedAt: nowISO,
        lockedBy: process.env.APPWRITE_FUNCTION_ID || 'worker',
      })
    } catch (error) {
      log(`Failed to acquire lock for ${notificationId}`)
      return
    }

    // Get user preferences
    const preferencesResponse = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PREFERENCES,
      [Query.equal('userId', userId)]
    )

    const preferences = preferencesResponse.documents[0]

    if (!preferences) {
      log(`No preferences found for user ${userId}, creating defaults`)
      // Create default preferences
      await db.createDocument(
        DATABASE_ID,
        COLLECTIONS.PREFERENCES,
        'unique()',
        {
          userId,
          inAppEnabled: true,
          pushEnabled: false,
          emailEnabled: true,
          smsEnabled: false,
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          timezone: 'UTC',
          createdAt: nowISO,
          updatedAt: nowISO,
        }
      )
    }

    // Parse channels
    const channels = (notification.channels || 'in_app,push,email').split(',')

    // Check quiet hours if applicable
    if (preferences?.quietHoursEnabled && notification.priority !== 'critical') {
      const isQuietHour = checkQuietHours(preferences)
      if (isQuietHour) {
        log(`User ${userId} is in quiet hours, delaying notification`)
        await db.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, notificationId, {
          status: 'queued',
          lockedAt: null,
          lockedBy: null,
        })
        return
      }
    }

    // Process each channel
    for (const channel of channels) {
      await processChannel(notification, preferences, channel, log)
    }

    // Mark as sent
    await db.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, notificationId, {
      status: 'sent',
      processedAt: nowISO,
      lockedAt: null,
      lockedBy: null,
    })

    log(`Notification ${notificationId} sent successfully`)
  } catch (error: any) {
    log(`Failed to process notification ${notificationId}`, {
      error: error.message,
    })

    // Update attempt count and retry logic
    const currentAttempts = notification.attemptCount || 0
    const maxAttempts = notification.maxAttempts || 3

    if (currentAttempts < maxAttempts) {
      await db.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, notificationId, {
        status: 'queued',
        attemptCount: currentAttempts + 1,
        lastError: error.message,
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await db.updateDocument(DATABASE_ID, COLLECTIONS.QUEUE, notificationId, {
        status: 'failed',
        lastError: error.message,
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date().toISOString(),
      })
    }
  }
}

async function processChannel(notification: any, preferences: any, channel: string, log: Logger) {
  const userId = notification.userId

  try {
    // Check suppression
    const suppressionResponse = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SUPPRESSION,
      [Query.equal('userId', userId), Query.equal('channel', channel), Query.equal('status', 'active')]
    )

    if (suppressionResponse.documents.length > 0) {
      log(`User ${userId} has suppressed ${channel} notifications`)
      await logDelivery({
        notificationId: notification.$id,
        userId,
        channel,
        status: 'blocked',
      })
      return
    }

    // Check channel enabled in preferences
    const channelEnabledKey = `${channel}Enabled`
    if (preferences && !preferences[channelEnabledKey]) {
      log(`${channel} is disabled for user ${userId}`)
      await logDelivery({
        notificationId: notification.$id,
        userId,
        channel,
        status: 'skipped',
      })
      return
    }

    // Check rate limits
    if (await isRateLimited(userId, channel)) {
      log(`User ${userId} is rate-limited for ${channel}`)
      await logDelivery({
        notificationId: notification.$id,
        userId,
        channel,
        status: 'rate_limited',
      })
      return
    }

    // Deliver based on channel
    switch (channel) {
      case 'in_app':
        await deliverInApp(notification, userId, log)
        break
      case 'push':
        await deliverPush(notification, userId, log)
        break
      case 'email':
        await deliverEmail(notification, userId, log)
        break
      case 'sms':
        if (process.env.SMS_ENABLED === 'true') {
          await deliverSMS(notification, userId, log)
        } else {
          log(`SMS disabled, skipping for user ${userId}`)
          await logDelivery({
            notificationId: notification.$id,
            userId,
            channel,
            status: 'skipped',
          })
        }
        break
    }

    // Increment rate limit
    await incrementRateLimit(userId, channel)
  } catch (error: any) {
    log(`Error processing ${channel} for user ${userId}`, {
      error: error.message,
    })
  }
}

async function deliverInApp(notification: any, userId: string, log: Logger) {
  try {
    const payload = JSON.parse(notification.payloadJson || '{}')

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.IN_APP,
      'unique()',
      {
        userId,
        title: payload.title || 'Notification',
        body: payload.body || '',
        category: notification.category,
        priority: notification.priority,
        isRead: false,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      }
    )

    await logDelivery({
      notificationId: notification.$id,
      userId,
      channel: 'in_app',
      status: 'sent',
      sentAt: now.toISOString(),
    })

    log(`In-app notification delivered to user ${userId}`)
  } catch (error: any) {
    log(`Failed to deliver in-app notification to ${userId}`, {
      error: error.message,
    })
  }
}

async function deliverPush(notification: any, userId: string, log: Logger) {
  try {
    // Get user's devices
    const devicesResponse = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DEVICE_TARGETS,
      [Query.equal('userId', userId), Query.equal('status', 'active')]
    )

    if (devicesResponse.documents.length === 0) {
      log(`No active devices for user ${userId}`)
      await logDelivery({
        notificationId: notification.$id,
        userId,
        channel: 'push',
        status: 'target_missing',
      })
      return
    }

    const payload = JSON.parse(notification.payloadJson || '{}')

    for (const device of devicesResponse.documents) {
      try {
        await messaging.sendMessage({
          targetId: device.targetId,
          data: {
            title: payload.title || 'Notification',
            body: payload.body || '',
            category: notification.category,
            priority: notification.priority,
          },
        })

        await logDelivery({
          notificationId: notification.$id,
          userId,
          channel: 'push',
          targetId: device.targetId,
          status: 'sent',
          sentAt: new Date().toISOString(),
        })

        log(`Push notification sent to device ${device.targetId}`)
      } catch (error: any) {
        log(`Failed to send push to device ${device.targetId}`, {
          error: error.message,
        })
      }
    }
  } catch (error: any) {
    log(`Failed to deliver push notification to ${userId}`, {
      error: error.message,
    })
  }
}

async function deliverEmail(notification: any, userId: string, log: Logger) {
  try {
    const payload = JSON.parse(notification.payloadJson || '{}')

    // In production, you would integrate with email provider here
    // For now, we'll just log delivery
    log(`Email notification queued for user ${userId}`)

    await logDelivery({
      notificationId: notification.$id,
      userId,
      channel: 'email',
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
  } catch (error: any) {
    log(`Failed to deliver email to ${userId}`, {
      error: error.message,
    })
  }
}

async function deliverSMS(notification: any, userId: string, log: Logger) {
  try {
    const payload = JSON.parse(notification.payloadJson || '{}')

    // SMS delivery would be integrated here
    log(`SMS notification queued for user ${userId}`)

    await logDelivery({
      notificationId: notification.$id,
      userId,
      channel: 'sms',
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
  } catch (error: any) {
    log(`Failed to deliver SMS to ${userId}`, {
      error: error.message,
    })
  }
}

function checkQuietHours(preferences: any): boolean {
  const timezone = preferences.timezone || 'UTC'
  const now = new Date()

  const start = preferences.quietHoursStart.split(':')
  const end = preferences.quietHoursEnd.split(':')

  const startHour = parseInt(start[0])
  const startMin = parseInt(start[1])
  const endHour = parseInt(end[0])
  const endMin = parseInt(end[1])

  const currentHour = now.getHours()
  const currentMin = now.getMinutes()

  if (startHour < endHour) {
    return currentHour >= startHour && (currentHour < endHour || (currentHour === endHour && currentMin < endMin))
  } else {
    return currentHour >= startHour || currentHour < endHour
  }
}

async function isRateLimited(userId: string, channel: string): Promise<boolean> {
  try {
    const now = new Date()
    const windowKey = `${channel}_${now.toISOString().split('T')[0]}_daily`

    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.RATE_LIMITS,
      [Query.equal('userId', userId), Query.equal('windowKey', windowKey)]
    )

    if (response.documents.length === 0) return false

    const limit = response.documents[0]
    const limits: any = {
      push: 8,
      email: 2,
      sms: 1,
      in_app: 999,
    }

    return limit.count >= (limits[channel] || 999)
  } catch (error) {
    return false
  }
}

async function incrementRateLimit(userId: string, channel: string) {
  try {
    const now = new Date()
    const windowKey = `${channel}_${now.toISOString().split('T')[0]}_daily`

    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.RATE_LIMITS,
      [Query.equal('userId', userId), Query.equal('windowKey', windowKey)]
    )

    if (response.documents.length > 0) {
      const limit = response.documents[0]
      await db.updateDocument(DATABASE_ID, COLLECTIONS.RATE_LIMITS, limit.$id, {
        count: (limit.count || 0) + 1,
      })
    } else {
      await db.createDocument(DATABASE_ID, COLLECTIONS.RATE_LIMITS, 'unique()', {
        userId,
        channel,
        windowKey,
        count: 1,
        windowStart: now.toISOString(),
        windowEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
    }
  } catch (error) {
    // Silently fail rate limit increment
  }
}

async function logDelivery(data: any) {
  try {
    await db.createDocument(DATABASE_ID, COLLECTIONS.DELIVERY_LOGS, 'unique()', {
      ...data,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    // Silently fail logging
  }
}
