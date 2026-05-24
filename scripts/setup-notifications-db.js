#!/usr/bin/env node

/**
 * Setup script for Notification System Database Collections
 * Run this to create all required collections in Appwrite
 * 
 * Usage:
 *   node scripts/setup-notifications-db.js
 * 
 * Environment variables required:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *   APPWRITE_DATABASE_ID
 */

const { Client, Databases } = require('node-appwrite')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const endpoint = process.env.APPWRITE_ENDPOINT
const projectId = process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error('Missing required environment variables:')
  console.error('  - APPWRITE_ENDPOINT')
  console.error('  - APPWRITE_PROJECT_ID')
  console.error('  - APPWRITE_API_KEY')
  console.error('  - APPWRITE_DATABASE_ID')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey)

const databases = new Databases(client)

const collections = [
  {
    name: 'Notification Preferences',
    id: 'notification_preferences',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'inAppEnabled', type: 'boolean', default: true },
      { name: 'pushEnabled', type: 'boolean', default: false },
      { name: 'emailEnabled', type: 'boolean', default: true },
      { name: 'smsEnabled', type: 'boolean', default: false },
      // Category preferences (42 attributes for 14 categories × 3 channels)
      ...generateCategoryPreferences(),
      // Quiet hours
      { name: 'quietHoursEnabled', type: 'boolean', default: true },
      { name: 'quietHoursStart', type: 'string', default: '22:00' },
      { name: 'quietHoursEnd', type: 'string', default: '07:00' },
      { name: 'timezone', type: 'string', default: 'Asia/Kolkata' },
      // Digest settings
      { name: 'dailyDigestEnabled', type: 'boolean', default: true },
      { name: 'weeklyDigestEnabled', type: 'boolean', default: true },
      { name: 'digestTime', type: 'string', default: '20:00' },
      // Default reminder times
      { name: 'defaultStudyReminderMinutes', type: 'integer', default: 15 },
      { name: 'defaultClassReminderMinutes', type: 'integer', default: 10 },
      { name: 'defaultDeadlineReminderHours', type: 'integer', default: 24 },
      // Rate limits
      { name: 'maxPushPerHour', type: 'integer', default: 3 },
      { name: 'maxPushPerDay', type: 'integer', default: 8 },
      { name: 'maxEmailsPerDay', type: 'integer', default: 2 },
      { name: 'maxSmsPerDay', type: 'integer', default: 1 },
      { name: 'criticalAlertsAlwaysOn', type: 'boolean', default: true },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_notification_preferences_user', attributes: ['userId'], unique: true },
    ],
  },
  {
    name: 'Notification Templates',
    id: 'notification_templates',
    attributes: [
      { name: 'templateKey', type: 'string', required: true },
      { name: 'channel', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'titleTemplate', type: 'string' },
      { name: 'subjectTemplate', type: 'string' },
      { name: 'bodyTemplate', type: 'string', required: true },
      { name: 'htmlTemplate', type: 'string' },
      { name: 'ctaLabelTemplate', type: 'string' },
      { name: 'ctaUrlTemplate', type: 'string' },
      { name: 'locale', type: 'string', default: 'en' },
      { name: 'status', type: 'string', default: 'active' },
      { name: 'version', type: 'integer', default: 1 },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_templates_key_channel_locale', attributes: ['templateKey', 'channel', 'locale'] },
      { name: 'idx_templates_status', attributes: ['status'] },
    ],
  },
  {
    name: 'Notification Queue',
    id: 'notification_queue',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'templateKey', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'priority', type: 'string', default: 'normal' },
      { name: 'channels', type: 'string', required: true },
      { name: 'payloadJson', type: 'string', required: true },
      { name: 'scheduledFor', type: 'datetime', required: true },
      { name: 'expiresAt', type: 'datetime' },
      { name: 'status', type: 'string', default: 'queued' },
      { name: 'dedupeKey', type: 'string', required: true },
      { name: 'attemptCount', type: 'integer', default: 0 },
      { name: 'maxAttempts', type: 'integer', default: 3 },
      { name: 'lockedAt', type: 'datetime' },
      { name: 'lockedBy', type: 'string' },
      { name: 'lastError', type: 'string' },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
      { name: 'processedAt', type: 'datetime' },
    ],
    indexes: [
      { name: 'idx_queue_due', attributes: ['status', 'scheduledFor'] },
      { name: 'idx_queue_user_status', attributes: ['userId', 'status'] },
      { name: 'idx_queue_dedupe', attributes: ['dedupeKey'], unique: true },
      { name: 'idx_queue_category', attributes: ['category'] },
      { name: 'idx_queue_priority', attributes: ['priority'] },
    ],
  },
  {
    name: 'Notification Delivery Logs',
    id: 'notification_delivery_logs',
    attributes: [
      { name: 'notificationId', type: 'string', required: true },
      { name: 'userId', type: 'string', required: true },
      { name: 'channel', type: 'string', required: true },
      { name: 'provider', type: 'string' },
      { name: 'providerMessageId', type: 'string' },
      { name: 'targetId', type: 'string' },
      { name: 'status', type: 'string', required: true },
      { name: 'errorCode', type: 'string' },
      { name: 'errorMessage', type: 'string' },
      { name: 'sentAt', type: 'datetime' },
      { name: 'deliveredAt', type: 'datetime' },
      { name: 'openedAt', type: 'datetime' },
      { name: 'clickedAt', type: 'datetime' },
      { name: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_delivery_user_created', attributes: ['userId', 'createdAt'] },
      { name: 'idx_delivery_notification', attributes: ['notificationId'] },
      { name: 'idx_delivery_status', attributes: ['status'] },
      { name: 'idx_delivery_channel_created', attributes: ['channel', 'createdAt'] },
    ],
  },
  {
    name: 'In-App Notifications',
    id: 'in_app_notifications',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'priority', type: 'string', default: 'normal' },
      { name: 'icon', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'ctaLabel', type: 'string' },
      { name: 'ctaUrl', type: 'string' },
      { name: 'isRead', type: 'boolean', default: false },
      { name: 'readAt', type: 'datetime' },
      { name: 'expiresAt', type: 'datetime' },
      { name: 'metadataJson', type: 'string' },
      { name: 'createdAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_inapp_user_created', attributes: ['userId', 'createdAt'] },
      { name: 'idx_inapp_user_read', attributes: ['userId', 'isRead'] },
      { name: 'idx_inapp_category', attributes: ['category'] },
      { name: 'idx_inapp_expires', attributes: ['expiresAt'] },
    ],
  },
  {
    name: 'Notification Device Targets',
    id: 'notification_device_targets',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'targetId', type: 'string', required: true },
      { name: 'provider', type: 'string', default: 'fcm' },
      { name: 'platform', type: 'string', required: true },
      { name: 'deviceName', type: 'string' },
      { name: 'browserName', type: 'string' },
      { name: 'osName', type: 'string' },
      { name: 'fcmTokenHash', type: 'string' },
      { name: 'status', type: 'string', default: 'active' },
      { name: 'lastSeenAt', type: 'datetime' },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_device_user_status', attributes: ['userId', 'status'] },
      { name: 'idx_device_target', attributes: ['targetId'], unique: true },
    ],
  },
  {
    name: 'User Activity State',
    id: 'user_activity_state',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'lastSeenAt', type: 'datetime' },
      { name: 'lastStudySessionAt', type: 'datetime' },
      { name: 'lastClassInteractionAt', type: 'datetime' },
      { name: 'lastProgressUpdateAt', type: 'datetime' },
      { name: 'lastGoalUpdateAt', type: 'datetime' },
      { name: 'lastCalendarEventCreatedAt', type: 'datetime' },
      { name: 'currentStreak', type: 'integer', default: 0 },
      { name: 'longestStreak', type: 'integer', default: 0 },
      { name: 'weeklyStudyMinutes', type: 'integer', default: 0 },
      { name: 'monthlyStudyMinutes', type: 'integer', default: 0 },
      { name: 'sessionsCompletedThisWeek', type: 'integer', default: 0 },
      { name: 'sessionsMissedThisWeek', type: 'integer', default: 0 },
      { name: 'engagementScore', type: 'integer', default: 0 },
      { name: 'riskLevel', type: 'string', default: 'healthy' },
      { name: 'lastReengagementSentAt', type: 'datetime' },
      { name: 'lastDigestSentAt', type: 'datetime' },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_activity_user', attributes: ['userId'], unique: true },
      { name: 'idx_activity_last_seen', attributes: ['lastSeenAt'] },
      { name: 'idx_activity_risk', attributes: ['riskLevel'] },
      { name: 'idx_activity_reengagement', attributes: ['lastReengagementSentAt'] },
    ],
  },
  {
    name: 'Notification Rate Limits',
    id: 'notification_rate_limits',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'channel', type: 'string', required: true },
      { name: 'windowKey', type: 'string', required: true },
      { name: 'count', type: 'integer', default: 0 },
      { name: 'windowStart', type: 'datetime', required: true },
      { name: 'windowEnd', type: 'datetime', required: true },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { name: 'idx_rate_user_channel_window', attributes: ['userId', 'channel', 'windowKey'], unique: true },
      { name: 'idx_rate_window_end', attributes: ['windowEnd'] },
    ],
  },
  {
    name: 'Notification Suppression',
    id: 'notification_suppression',
    attributes: [
      { name: 'userId', type: 'string', required: true },
      { name: 'channel', type: 'string', required: true },
      { name: 'category', type: 'string' },
      { name: 'reason', type: 'string', required: true },
      { name: 'status', type: 'string', default: 'active' },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ],
  },
  {
    name: 'Admin Broadcasts',
    id: 'admin_broadcasts',
    attributes: [
      { name: 'title', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
      { name: 'category', type: 'string', default: 'admin' },
      { name: 'channels', type: 'string', required: true },
      { name: 'targetSegment', type: 'string', required: true },
      { name: 'scheduledFor', type: 'datetime', required: true },
      { name: 'status', type: 'string', default: 'draft' },
      { name: 'createdBy', type: 'string', required: true },
      { name: 'payloadJson', type: 'string' },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
      { name: 'sentAt', type: 'datetime' },
    ],
  },
]

function generateCategoryPreferences() {
  const categories = [
    'study',
    'class',
    'deadline',
    'calendar',
    'progress',
    'streak',
    'goal',
    'habit',
    'social',
    'system',
    'security',
    'admin',
    'marketing',
    'reengagement',
    'digest',
  ]
  const channels = ['Push', 'Email', 'Sms']
  const attrs = []

  for (const cat of categories) {
    for (const chan of channels) {
      attrs.push({
        name: `${cat}${chan}`,
        type: 'boolean',
        default: ['marketing', 'reengagement'].includes(cat) && chan === 'Push' ? false : true,
      })
    }
  }

  return attrs
}

async function setupCollections() {
  try {
    console.log('Connecting to Appwrite...')
    console.log(`Endpoint: ${endpoint}`)
    console.log(`Database: ${databaseId}\n`)

    for (const collection of collections) {
      try {
        console.log(`Creating collection: ${collection.name} (${collection.id})...`)

        const created = await databases.createCollection(
          databaseId,
          collection.id,
          collection.name
        )

        console.log(`  ✓ Collection created with ID: ${created.$id}`)

        // Add attributes
        for (const attr of collection.attributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                databaseId,
                collection.id,
                attr.name,
                attr.name.length < 50 ? 50 : 255,
                attr.required || false,
                attr.default || null,
                true
              )
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                databaseId,
                collection.id,
                attr.name,
                attr.required || false,
                attr.default || null,
                true
              )
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                databaseId,
                collection.id,
                attr.name,
                attr.required || false,
                attr.default || null,
                true
              )
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                databaseId,
                collection.id,
                attr.name,
                attr.required || false,
                attr.default || null,
                true
              )
            }
            console.log(`    ✓ Attribute: ${attr.name}`)
          } catch (error) {
            console.log(`    ! Attribute already exists: ${attr.name}`)
          }
        }

        // Add indexes
        if (collection.indexes) {
          for (const index of collection.indexes) {
            try {
              await databases.createIndex(
                databaseId,
                collection.id,
                index.name,
                'key',
                index.attributes,
                undefined,
                index.unique || false
              )
              console.log(`    ✓ Index: ${index.name}`)
            } catch (error) {
              console.log(`    ! Index already exists: ${index.name}`)
            }
          }
        }
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`  ! Collection already exists: ${collection.id}`)
        } else {
          throw error
        }
      }
    }

    console.log('\n✓ Database setup complete!')
  } catch (error) {
    console.error('Error setting up database:', error.message)
    process.exit(1)
  }
}

setupCollections()
