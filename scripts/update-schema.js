// Production-ready Appwrite schema updater
// Ensures database, collections, attributes, and buckets exist with required fields
// Usage: APPWRITE_API_KEY must be set; endpoint/project/database are read from .env.local

const fs = require('fs')
const path = require('path')
const https = require('https')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const env = {}
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      if ((val.startsWith('\"') && val.endsWith('\"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

const env = loadEnv()
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || env.APPWRITE_DATABASE_ID || env.NEXT_PUBLIC_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY
const ALLOW_DESTRUCTIVE_SCHEMA_CHANGES = (process.env.ALLOW_DESTRUCTIVE_SCHEMA_CHANGES || env.ALLOW_DESTRUCTIVE_SCHEMA_CHANGES) === 'true'
const APPLY_COLLECTION_PERMISSIONS = (process.env.APPLY_COLLECTION_PERMISSIONS || env.APPLY_COLLECTION_PERMISSIONS) === 'true'
const SCHEMA_COLLECTIONS = String(process.env.SCHEMA_COLLECTIONS || '').split(',').map((value) => value.trim()).filter(Boolean)

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('Missing Appwrite configuration. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY.')
  process.exit(1)
}

// Simple REST client for Appwrite management operations
function makeRequest(method, route, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT)
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname.replace(/\/$/, '') + route,
      method,
      headers: {
        'X-Appwrite-Key': API_KEY,
        'X-Appwrite-Project': PROJECT_ID,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {}
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, data: parsed })
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function isNotFound(error) {
  return error && error.status === 404
}

const notificationCategories = [
  'study', 'class', 'deadline', 'calendar', 'progress', 'streak', 'goal', 'habit',
  'social', 'system', 'security', 'admin', 'marketing', 'reengagement', 'digest',
]

function notificationPreferenceAttributes() {
  const categoryAttributes = notificationCategories.flatMap((category) =>
    ['Push', 'Email', 'Sms'].map((channel) => ({
      key: `${category}${channel}`,
      type: 'boolean',
      defaultValue: !(['marketing', 'reengagement'].includes(category) && channel === 'Push'),
    })),
  )

  return [
    { key: 'userId', type: 'string', size: 255, required: true },
    { key: 'inAppEnabled', type: 'boolean', defaultValue: true },
    { key: 'pushEnabled', type: 'boolean', defaultValue: false },
    { key: 'emailEnabled', type: 'boolean', defaultValue: true },
    { key: 'smsEnabled', type: 'boolean', defaultValue: false },
    ...categoryAttributes,
    { key: 'quietHoursEnabled', type: 'boolean', defaultValue: true },
    { key: 'quietHoursStart', type: 'string', size: 16, defaultValue: '22:00' },
    { key: 'quietHoursEnd', type: 'string', size: 16, defaultValue: '07:00' },
    { key: 'timezone', type: 'string', size: 80, defaultValue: 'UTC' },
    { key: 'dailyDigestEnabled', type: 'boolean', defaultValue: true },
    { key: 'weeklyDigestEnabled', type: 'boolean', defaultValue: true },
    { key: 'digestTime', type: 'string', size: 16, defaultValue: '20:00' },
    { key: 'defaultStudyReminderMinutes', type: 'integer', defaultValue: 15 },
    { key: 'defaultClassReminderMinutes', type: 'integer', defaultValue: 10 },
    { key: 'defaultDeadlineReminderHours', type: 'integer', defaultValue: 24 },
    { key: 'maxPushPerHour', type: 'integer', defaultValue: 3 },
    { key: 'maxPushPerDay', type: 'integer', defaultValue: 8 },
    { key: 'maxEmailsPerDay', type: 'integer', defaultValue: 2 },
    { key: 'maxSmsPerDay', type: 'integer', defaultValue: 1 },
    { key: 'criticalAlertsAlwaysOn', type: 'boolean', defaultValue: true },
    { key: 'createdAt', type: 'datetime', required: true },
    { key: 'updatedAt', type: 'datetime', required: true },
  ]
}

const collections = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'username', type: 'string', size: 120 },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'bio', type: 'string', size: 1000 },
      { key: 'location', type: 'string', size: 255 },
      { key: 'website', type: 'string', size: 500 },
      { key: 'avatar', type: 'string', size: 500 },
      { key: 'avatarFileId', type: 'string', size: 255 },
      { key: 'interests', type: 'string', size: 255, array: true },
      { key: 'identity', type: 'string', size: 100 },
      { key: 'vibes', type: 'string', size: 100, array: true },
      { key: 'learningGoals', type: 'string', size: 2000, array: true },
      { key: 'learningPace', type: 'string', size: 50 },
      { key: 'preferredSessionTypes', type: 'string', size: 500, array: true },
      { key: 'availability', type: 'string', size: 500, array: true },
      { key: 'currentFocusAreas', type: 'string', size: 2000, array: true },
      { key: 'joinedAt', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'lastSeen', type: 'string', size: 255 },
      { key: 'isOnline', type: 'boolean' },
      { key: 'studyStreak', type: 'integer' },
      { key: 'totalPoints', type: 'integer' },
      { key: 'level', type: 'integer' },
      { key: 'badges', type: 'string', size: 100, array: true },
    ],
    indexes: [
      { key: 'idx_profiles_username', type: 'unique', attributes: ['username'], orders: ['ASC'] },
      { key: 'idx_profiles_name', type: 'fulltext', attributes: ['name'] },
    ],
  },
  {
    id: 'posts',
    name: 'Posts',
    attrs: [
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'resourceId', type: 'string', size: 255 },
      { key: 'imageUrl', type: 'string', size: 500 },
      { key: 'imageUrls', type: 'string', size: 500, array: true },
      { key: 'attachments', type: 'string', size: 1000, array: true },
      { key: 'imageFileId', type: 'string', size: 255 },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'comments', type: 'integer' },
      { key: 'saves', type: 'integer' },
      { key: 'shares', type: 'integer' },
      { key: 'isEdited', type: 'boolean' },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'likedBy', type: 'string', size: 255, array: true },
      { key: 'savedBy', type: 'string', size: 255, array: true },
      { key: 'visibility', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'mentions', type: 'string', size: 100, array: true },
      { key: 'authorName', type: 'string', size: 255 },
      { key: 'authorAvatar', type: 'string', size: 500 },
      { key: 'authorUsername', type: 'string', size: 255 },
      { key: 'moderationStatus', type: 'string', size: 80 },
      { key: 'moderatedBy', type: 'string', size: 255 },
      { key: 'moderatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_posts_author_time', type: 'key', attributes: ['authorId', 'timestamp'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'senderId', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'clientMessageId', type: 'string', size: 255 },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'contentType', type: 'string', size: 50 },
      { key: 'deliveryState', type: 'string', size: 50 },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'senderName', type: 'string', size: 255 },
      { key: 'senderAvatar', type: 'string', size: 500 },
      { key: 'readBy', type: 'string', size: 255, array: true },
      { key: 'isEdited', type: 'boolean' },
      { key: 'replyTo', type: 'string', size: 255 },
      { key: 'fileUrl', type: 'string', size: 500 },
      { key: 'reactions', type: 'string', size: 100, array: true },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'deletedAt', type: 'string', size: 255 },
      { key: 'deletedBy', type: 'string', size: 255 },
      { key: 'editedBy', type: 'string', size: 255 },
      { key: 'pinnedAt', type: 'string', size: 255 },
      { key: 'starredAt', type: 'string', size: 255 },
      { key: 'metadata', type: 'string', size: 5000 },
    ],
    indexes: [
      { key: 'idx_messages_room_created', type: 'key', attributes: ['roomId', 'timestamp'], orders: ['ASC', 'DESC'] },
      { key: 'idx_messages_room_client', type: 'key', attributes: ['roomId', 'clientMessageId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_messages_sender_time', type: 'key', attributes: ['senderId', 'timestamp'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'message_receipts',
    name: 'Message Receipts',
    attrs: [
      { key: 'messageId', type: 'string', size: 255, required: true },
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'deliveredAt', type: 'string', size: 255 },
      { key: 'readAt', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_receipts_message_user', type: 'unique', attributes: ['messageId', 'userId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_receipts_room_user', type: 'key', attributes: ['roomId', 'userId'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'chat_presence',
    name: 'Chat Presence',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'isOnline', type: 'boolean' },
      { key: 'isTyping', type: 'boolean' },
      { key: 'lastSeenAt', type: 'string', size: 255 },
      { key: 'typingAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_presence_room_user', type: 'unique', attributes: ['roomId', 'userId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_presence_room_typing', type: 'key', attributes: ['roomId', 'isTyping'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'ai_tasks',
    name: 'AI Summary Tasks',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'messageIds', type: 'string', size: 255, array: true, required: true },
      { key: 'requestedBy', type: 'string', size: 255 },
      { key: 'summaryType', type: 'string', size: 80 },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'summary', type: 'string', size: 5000 },
      { key: 'lastError', type: 'string', size: 1000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'processedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_ai_tasks_room_updated', type: 'key', attributes: ['roomId', 'updatedAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_ai_tasks_status_created', type: 'key', attributes: ['status', 'createdAt'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'comments',
    name: 'Comments',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'postId', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255 },
      { key: 'content', type: 'string', size: 2000, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'likedBy', type: 'string', size: 255, array: true },
      { key: 'authorName', type: 'string', size: 255 },
      { key: 'authorAvatar', type: 'string', size: 500 },
      { key: 'authorUsername', type: 'string', size: 255 },
      { key: 'isEdited', type: 'boolean' },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'replyTo', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_comments_post_time', type: 'key', attributes: ['postId', 'timestamp'], orders: ['ASC', 'ASC'] },
      { key: 'idx_comments_author_time', type: 'key', attributes: ['authorId', 'timestamp'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'saved_posts',
    name: 'Saved Posts',
    attrs: [
      { key: 'postId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'savedAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'pods',
    name: 'Study Pods',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'teamId', type: 'string', size: 255 }, // Auto-generated, not required
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 }, // Optional - empty descriptions allowed
      { key: 'creatorId', type: 'string', size: 255, required: true },
      { key: 'members', type: 'string', size: 255, array: true },
      { key: 'subject', type: 'string', size: 100 },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'matchingTags', type: 'string', size: 2000, array: true },
      { key: 'idealLearnerType', type: 'string', size: 500, array: true },
      { key: 'sessionType', type: 'string', size: 500, array: true },
      { key: 'averageSessionLength', type: 'integer' },
      { key: 'commonAvailability', type: 'string', size: 500, array: true },
      { key: 'isActive', type: 'boolean' },
      { key: 'isPublic', type: 'boolean' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'memberCount', type: 'integer' },
      { key: 'maxMembers', type: 'integer' },
      { key: 'moderationStatus', type: 'string', size: 80 },
      { key: 'moderatedBy', type: 'string', size: 255 },
      { key: 'moderatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    attrs: [
      { key: 'fileId', type: 'string', size: 255, required: true },
      { key: 'fileName', type: 'string', size: 255, required: true },
      { key: 'fileSize', type: 'integer', required: true },
      { key: 'fileType', type: 'string', size: 100, required: true },
      { key: 'fileUrl', type: 'string', size: 500, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'uploadedAt', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'visibility', type: 'string', size: 50 },
      { key: 'downloads', type: 'integer' },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'category', type: 'string', size: 100 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'views', type: 'integer' },
      { key: 'isApproved', type: 'boolean', defaultValue: true },
      { key: 'moderationStatus', type: 'string', size: 80 },
      { key: 'moderatedBy', type: 'string', size: 255 },
      { key: 'moderatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_resources_author_time', type: 'key', attributes: ['authorId', 'uploadedAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_resources_pod_time', type: 'key', attributes: ['podId', 'uploadedAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'isRead', type: 'boolean' },
      { key: 'actionUrl', type: 'string', size: 500 },
      { key: 'actorId', type: 'string', size: 255 },
      { key: 'actorName', type: 'string', size: 255 },
      { key: 'actorAvatar', type: 'string', size: 500 },
      { key: 'metadata', type: 'string', size: 5000 },
    ],
    indexes: [
      { key: 'idx_notifications_user_time', type: 'key', attributes: ['userId', 'timestamp'], orders: ['ASC', 'DESC'] },
      { key: 'idx_notifications_user_read', type: 'key', attributes: ['userId', 'isRead'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'notification_preferences',
    name: 'Notification Preferences',
    attrs: notificationPreferenceAttributes(),
    indexes: [
      { key: 'idx_notification_preferences_user', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
    ],
  },
  {
    id: 'content_reports',
    name: 'Content Reports',
    attrs: [
      { key: 'reporterId', type: 'string', size: 255, required: true },
      { key: 'contentId', type: 'string', size: 255, required: true },
      { key: 'contentType', type: 'string', size: 80, required: true },
      { key: 'reason', type: 'string', size: 120, required: true },
      { key: 'description', type: 'string', size: 1000 },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'priority', type: 'string', size: 80 },
      { key: 'reviewedBy', type: 'string', size: 255 },
      { key: 'reviewedAt', type: 'string', size: 255 },
      { key: 'resolution', type: 'string', size: 255 },
      { key: 'correlationId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_reports_status_created', type: 'key', attributes: ['status', 'createdAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_reports_type', type: 'key', attributes: ['contentType'], orders: ['ASC'] },
    ],
  },
  {
    id: 'admin_roles',
    name: 'Admin Roles',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255 },
      { key: 'role', type: 'string', size: 80, required: true },
      { key: 'permissions', type: 'string', size: 120, array: true },
      { key: 'createdBy', type: 'string', size: 255 },
      { key: 'updatedBy', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'admin_audit_logs',
    name: 'Admin Audit Logs',
    attrs: [
      { key: 'actorId', type: 'string', size: 255, required: true },
      { key: 'actorEmail', type: 'string', size: 255 },
      { key: 'action', type: 'string', size: 160, required: true },
      { key: 'targetType', type: 'string', size: 80, required: true },
      { key: 'targetId', type: 'string', size: 255 },
      { key: 'reason', type: 'string', size: 1000 },
      { key: 'status', type: 'string', size: 80 },
      { key: 'beforeJson', type: 'string', size: 5000 },
      { key: 'afterJson', type: 'string', size: 5000 },
      { key: 'correlationId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_admin_audit_created', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
      { key: 'idx_admin_audit_actor', type: 'key', attributes: ['actorId'], orders: ['ASC'] },
    ],
  },
  {
    id: 'admin_sessions',
    name: 'Admin Sessions',
    attrs: [
      { key: 'adminId', type: 'string', size: 255, required: true },
      { key: 'ipHash', type: 'string', size: 255 },
      { key: 'userAgent', type: 'string', size: 2000 },
      { key: 'startedAt', type: 'string', size: 255, required: true },
      { key: 'lastSeenAt', type: 'string', size: 255 },
      { key: 'status', type: 'string', size: 80 },
    ],
  },
  {
    id: 'moderation_actions',
    name: 'Moderation Actions',
    attrs: [
      { key: 'actorId', type: 'string', size: 255, required: true },
      { key: 'action', type: 'string', size: 160, required: true },
      { key: 'targetType', type: 'string', size: 80, required: true },
      { key: 'targetId', type: 'string', size: 255, required: true },
      { key: 'reportId', type: 'string', size: 255 },
      { key: 'reason', type: 'string', size: 1000 },
      { key: 'status', type: 'string', size: 80 },
      { key: 'metadataJson', type: 'string', size: 5000 },
      { key: 'correlationId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'client_errors',
    name: 'Client Errors',
    attrs: [
      { key: 'type', type: 'string', size: 80, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'stack', type: 'string', size: 5000 },
      { key: 'route', type: 'string', size: 500 },
      { key: 'userAgent', type: 'string', size: 1000 },
      { key: 'userId', type: 'string', size: 255 },
      { key: 'metadataJson', type: 'string', size: 5000 },
      { key: 'fingerprint', type: 'string', size: 80, required: true },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'ownerId', type: 'string', size: 255 },
      { key: 'count', type: 'integer' },
      { key: 'firstSeenAt', type: 'string', size: 255, required: true },
      { key: 'lastSeenAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'correlationId', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_client_errors_status_last', type: 'key', attributes: ['status', 'lastSeenAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_client_errors_fingerprint', type: 'key', attributes: ['fingerprint'], orders: ['ASC'] },
    ],
  },
  {
    id: 'api_error_events',
    name: 'API Error Events',
    attrs: [
      { key: 'route', type: 'string', size: 500, required: true },
      { key: 'method', type: 'string', size: 20, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'stack', type: 'string', size: 5000 },
      { key: 'statusCode', type: 'integer', required: true },
      { key: 'userId', type: 'string', size: 255 },
      { key: 'fingerprint', type: 'string', size: 80, required: true },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'ownerId', type: 'string', size: 255 },
      { key: 'count', type: 'integer' },
      { key: 'firstSeenAt', type: 'string', size: 255, required: true },
      { key: 'lastSeenAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'correlationId', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_api_errors_status_last', type: 'key', attributes: ['status', 'lastSeenAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_api_errors_fingerprint', type: 'key', attributes: ['fingerprint'], orders: ['ASC'] },
    ],
  },
  {
    id: 'system_health_events',
    name: 'System Health Events',
    attrs: [
      { key: 'service', type: 'string', size: 120, required: true },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'message', type: 'string', size: 1000 },
      { key: 'metadataJson', type: 'string', size: 5000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'feature_flags',
    name: 'Feature Flags',
    attrs: [
      { key: 'key', type: 'string', size: 120, required: true },
      { key: 'enabled', type: 'boolean', required: true },
      { key: 'description', type: 'string', size: 1000 },
      { key: 'rollout', type: 'integer' },
      { key: 'updatedBy', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_feature_flags_key', type: 'key', attributes: ['key'], orders: ['ASC'] },
    ],
  },
  {
    id: 'admin_notes',
    name: 'Admin Notes',
    attrs: [
      { key: 'targetType', type: 'string', size: 80, required: true },
      { key: 'targetId', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 4000, required: true },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'support_tickets',
    name: 'Support Tickets',
    attrs: [
      { key: 'userId', type: 'string', size: 255 },
      { key: 'email', type: 'string', size: 255 },
      { key: 'subject', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 4000 },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'priority', type: 'string', size: 80 },
      { key: 'assigneeId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'admin_saved_views',
    name: 'Admin Saved Views',
    attrs: [
      { key: 'ownerId', type: 'string', size: 255, required: true },
      { key: 'module', type: 'string', size: 80, required: true },
      { key: 'name', type: 'string', size: 120, required: true },
      { key: 'filtersJson', type: 'string', size: 5000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'admin_broadcasts',
    name: 'Admin Broadcasts',
    attrs: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 1000, required: true },
      { key: 'category', type: 'string', size: 80, required: true },
      { key: 'channels', type: 'string', size: 255, required: true },
      { key: 'targetSegment', type: 'string', size: 120, required: true },
      { key: 'scheduledFor', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 80, required: true },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
      { key: 'sentAt', type: 'string', size: 255 },
      { key: 'queuedCount', type: 'integer' },
      { key: 'sentCount', type: 'integer' },
      { key: 'failedCount', type: 'integer' },
      { key: 'openedCount', type: 'integer' },
      { key: 'clickedCount', type: 'integer' },
    ],
    indexes: [
      { key: 'idx_broadcast_status_created', type: 'key', attributes: ['status', 'createdAt'], orders: ['ASC', 'DESC'] },
    ],
  },

  {
    id: 'calendar_feed_settings',
    name: 'Calendar Feed Settings',
    permissions: { write: ['role:users'] },
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 32, required: true },
      { key: 'tokenHash', type: 'string', size: 255, required: true },
      { key: 'tokenPrefix', type: 'string', size: 32, required: true },
      { key: 'encryptedToken', type: 'string', size: 4096 },
      { key: 'settingsJson', type: 'string', size: 5000 },
      { key: 'privacyMode', type: 'string', size: 32 },
      { key: 'lastFetchedAt', type: 'string', size: 255 },
      { key: 'lastTokenRotatedAt', type: 'string', size: 255 },
      { key: 'fetchCount', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_feed_user', type: 'key', attributes: ['userId'], orders: ['ASC'] },
      { key: 'idx_feed_token_hash', type: 'key', attributes: ['tokenHash'], orders: ['ASC'] },
      { key: 'idx_feed_status', type: 'key', attributes: ['status'], orders: ['ASC'] },
    ],
  },
  {
    id: 'calendar_feed_access_logs',
    name: 'Calendar Feed Access Logs',
    permissions: { write: ['role:users'] },
    attrs: [
      { key: 'feedId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'tokenPrefix', type: 'string', size: 32, required: true },
      { key: 'providerGuess', type: 'string', size: 120 },
      { key: 'userAgent', type: 'string', size: 2000 },
      { key: 'ipHash', type: 'string', size: 255 },
      { key: 'statusCode', type: 'integer', required: true },
      { key: 'eventCount', type: 'integer' },
      { key: 'responseBytes', type: 'integer' },
      { key: 'errorCode', type: 'string', size: 120 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_access_logs_feed_created', type: 'key', attributes: ['feedId', 'createdAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_access_logs_user_created', type: 'key', attributes: ['userId', 'createdAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'calendar_feed_audit_logs',
    name: 'Calendar Feed Audit Logs',
    permissions: { write: ['role:users'] },
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'feedId', type: 'string', size: 255 },
      { key: 'action', type: 'string', size: 120, required: true },
      { key: 'actor', type: 'string', size: 255, required: true },
      { key: 'ipHash', type: 'string', size: 255 },
      { key: 'userAgent', type: 'string', size: 2000 },
      { key: 'metadata', type: 'string', size: 4096 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'calendar_events',
    name: 'Calendar Events',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'startTime', type: 'string', size: 255, required: true },
      { key: 'endTime', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 50 },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'location', type: 'string', size: 500 },
      { key: 'meetingUrl', type: 'string', size: 500 },
      { key: 'attendees', type: 'string', size: 255, array: true },
      { key: 'isRecurring', type: 'boolean' },
      { key: 'reminders', type: 'integer', array: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'isCompleted', type: 'boolean' },
    ],
    indexes: [
      { key: 'idx_calendar_user_start', type: 'key', attributes: ['userId', 'startTime'], orders: ['ASC', 'ASC'] },
      { key: 'idx_calendar_start', type: 'key', attributes: ['startTime'], orders: ['ASC'] },
    ],
  },
  {
    id: 'chat_rooms',
    name: 'Chat Rooms',
    attrs: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'name', type: 'string', size: 255 },
      { key: 'members', type: 'string', size: 255, array: true },
      { key: 'participants', type: 'string', size: 255, array: true },
      { key: 'admins', type: 'string', size: 255, array: true },
      { key: 'ownerId', type: 'string', size: 255 },
      { key: 'createdBy', type: 'string', size: 255 },
      { key: 'lastMessage', type: 'string', size: 1000 },
      { key: 'lastMessageTime', type: 'string', size: 255 },
      { key: 'lastMessageSenderId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'isActive', type: 'boolean' },
    ],
    indexes: [
      { key: 'idx_chat_rooms_type_activity', type: 'key', attributes: ['type', 'lastMessageTime'], orders: ['ASC', 'DESC'] },
      { key: 'idx_chat_rooms_pod', type: 'key', attributes: ['podId'], orders: ['ASC'] },
    ],
  },
  {
    id: 'calendar_reminder_deliveries',
    name: 'Calendar Reminder Deliveries',
    attrs: [
      { key: 'deliveryKey', type: 'string', size: 500, required: true },
      { key: 'eventId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'reminderMinutes', type: 'integer', required: true },
      { key: 'channel', type: 'string', size: 32, required: true },
      { key: 'status', type: 'string', size: 32, required: true },
      { key: 'deliveredAt', type: 'string', size: 255 },
      { key: 'error', type: 'string', size: 1000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_reminder_delivery_key', type: 'unique', attributes: ['deliveryKey'], orders: ['ASC'] },
      { key: 'idx_reminder_user_created', type: 'key', attributes: ['userId', 'createdAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'call_sessions',
    name: 'Call Sessions',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'roomTitle', type: 'string', size: 120 },
      { key: 'callerId', type: 'string', size: 255, required: true },
      { key: 'participantIds', type: 'string', size: 255, array: true },
      { key: 'mediaType', type: 'string', size: 32, required: true },
      { key: 'provider', type: 'string', size: 50, required: true },
      { key: 'providerSessionId', type: 'string', size: 255, required: true },
      { key: 'joinUrl', type: 'string', size: 500, required: true },
      { key: 'state', type: 'string', size: 50, required: true },
      { key: 'startedAt', type: 'string', size: 255, required: true },
      { key: 'acceptedAt', type: 'string', size: 255 },
      { key: 'declinedAt', type: 'string', size: 255 },
      { key: 'endedAt', type: 'string', size: 255 },
      { key: 'lastActivityAt', type: 'string', size: 255 },
      { key: 'ringTimeoutAt', type: 'string', size: 255 },
      { key: 'endedReason', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_calls_room_started', type: 'key', attributes: ['roomId', 'startedAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_calls_caller_state_started', type: 'key', attributes: ['callerId', 'state', 'startedAt'], orders: ['ASC', 'ASC', 'DESC'] },
      { key: 'idx_calls_provider', type: 'unique', attributes: ['providerSessionId'], orders: ['ASC'] },
    ],
  },
  {
    id: 'call_participants',
    name: 'Call Participants',
    attrs: [
      { key: 'callSessionId', type: 'string', size: 255, required: true },
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 32, required: true },
      { key: 'state', type: 'string', size: 50, required: true },
      { key: 'joinedAt', type: 'string', size: 255 },
      { key: 'leftAt', type: 'string', size: 255 },
      { key: 'muted', type: 'boolean' },
      { key: 'videoEnabled', type: 'boolean' },
      { key: 'connectionState', type: 'string', size: 50 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'idx_call_participants_session_user', type: 'unique', attributes: ['callSessionId', 'userId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_call_participants_user_state', type: 'key', attributes: ['userId', 'state'], orders: ['ASC', 'ASC'] },
    ],
  },
  {
    id: 'call_diagnostics',
    name: 'Call Diagnostics',
    attrs: [
      { key: 'callSessionId', type: 'string', size: 255, required: true },
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'reporterId', type: 'string', size: 255, required: true },
      { key: 'metrics', type: 'string', size: 30000, required: true },
      { key: 'logs', type: 'string', size: 100000, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_call_diagnostics_session_created', type: 'key', attributes: ['callSessionId', 'createdAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_call_diagnostics_room', type: 'key', attributes: ['roomId'], orders: ['ASC'] },
    ],
  },
  {
    id: 'match_experiments',
    name: 'Match Experiments',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'variant', type: 'string', size: 100, required: true },
      { key: 'recommended', type: 'string', size: 255, array: true },
      { key: 'joined', type: 'string', size: 255, array: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'study_plans',
    name: 'Study Plans',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'date', type: 'string', size: 50, required: true },
      { key: 'items', type: 'string', size: 5000, array: true },
      { key: 'completedIds', type: 'string', size: 255, array: true },
      { key: 'sourceSignals', type: 'string', size: 255, array: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_reactions',
    name: 'Pod Reactions',
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'itemId', type: 'string', size: 255, required: true },
      { key: 'itemType', type: 'string', size: 50, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'count', type: 'integer' },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_commitments',
    name: 'Pod Commitments',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'pledge', type: 'string', size: 2000 },
      { key: 'weekOf', type: 'string', size: 50 },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_check_ins',
    name: 'Pod Check Ins',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'userName', type: 'string', size: 255 },
      { key: 'note', type: 'string', size: 4000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'pod_rsvps',
    name: 'Pod RSVPs',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'eventId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'isGoing', type: 'boolean' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_courses',
    name: 'Pod Courses',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'courseTitle', type: 'string', size: 255, required: true },
      { key: 'youtubeUrl', type: 'string', size: 500 },
      { key: 'videoId', type: 'string', size: 100 },
      { key: 'status', type: 'string', size: 50 }, // structuring, generating, completed, error
      { key: 'progress', type: 'integer' },
      { key: 'totalChapters', type: 'integer' },
      { key: 'completedChapters', type: 'integer' },
      { key: 'chapters', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'assignments', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'notes', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'dailyTasks', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'generationStartedAt', type: 'string', size: 255 },
      { key: 'generationCompletedAt', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'createdBy', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'correlationId', type: 'string', size: 100 },
      { key: 'errorMessage', type: 'string', size: 1000 },
    ],
    indexes: [
      { key: 'pod_courses_pod', type: 'key', attributes: ['podId'] },
    ],
  },
  {
    id: 'courses',
    name: 'Courses',
    attrs: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'instructorId', type: 'string', size: 255, required: true },
      { key: 'language', type: 'string', size: 50 },
      { key: 'duration', type: 'integer' },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'prerequisites', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'coverImage', type: 'string', size: 255 },
      { key: 'youtubeLink', type: 'string', size: 255 },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'isMonetized', type: 'boolean' },
      { key: 'price', type: 'double' },
      { key: 'enrollmentCount', type: 'integer', defaultValue: 0 },
      { key: 'avgRating', type: 'double' },
      { key: 'totalReviews', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'course_chapters',
    name: 'Course Chapters',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'sequenceNumber', type: 'integer' },
      { key: 'duration', type: 'integer' },
      { key: 'videoStartTime', type: 'integer' },
      { key: 'videoEndTime', type: 'integer' },
      { key: 'learningObjectives', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'contentType', type: 'string', size: 50 },
      { key: 'transcript', type: 'string', size: 5000 },
      { key: 'transcriptCleaned', type: 'string', size: 5000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'course_content',
    name: 'Course Content',
    attrs: [
      { key: 'chapterId', type: 'string', size: 255, required: true },
      { key: 'summaries', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'keyTakeaways', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'detailedNotes', type: 'string', size: 5000 },
      { key: 'concepts', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'formulas', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'realWorldApplications', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'generatedAt', type: 'string', size: 255, required: true },
      { key: 'llmModel', type: 'string', size: 255 },
      { key: 'promptHash', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'content_chapter', type: 'key', attributes: ['chapterId'] },
    ],
  },
  {
    id: 'course_assignments',
    name: 'Course Assignments',
    attrs: [
      { key: 'chapterId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'estimatedTime', type: 'integer' },
      { key: 'questionText', type: 'string', size: 4000 },
      { key: 'options', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'rubric', type: 'string', size: 2000 }, // JSON stringified object
      { key: 'gradingCriteria', type: 'string', size: 1500 },
      { key: 'sequenceNumber', type: 'integer' },
      { key: 'variations', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'assignments_chapter_sequence', type: 'key', attributes: ['chapterId', 'sequenceNumber'] },
    ],
  },
  {
    id: 'user_course_progress',
    name: 'User Course Progress',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrolledAt', type: 'string', size: 255, required: true },
      { key: 'completionPercentage', type: 'integer' },
      { key: 'chaptersCompleted', type: 'integer' },
      { key: 'totalChapters', type: 'integer' },
      { key: 'averageScore', type: 'double' },
      { key: 'finalScore', type: 'double' },
      { key: 'courseStatus', type: 'string', size: 50 },
      { key: 'certificateEarned', type: 'boolean' },
      { key: 'certificateId', type: 'string', size: 255 },
      { key: 'timeSpent', type: 'integer' },
      { key: 'lastAccessedAt', type: 'string', size: 255 },
      { key: 'bookmarkedChapters', type: 'string', size: 5000 }, // JSON stringified array
      { key: 'attemptedAssignments', type: 'integer' },
      { key: 'completedAssignments', type: 'integer' },
      { key: 'completedChapterIds', type: 'string', size: 50000 }, // JSON stringified lesson IDs
      { key: 'quizScores', type: 'string', size: 50000 }, // JSON object keyed by lesson ID
      { key: 'quizAttempts', type: 'string', size: 50000 }, // JSON object keyed by lesson ID
      { key: 'currentChapterId', type: 'string', size: 255 },
    ],
    indexes: [
      { key: 'progress_user_course', type: 'key', attributes: ['userId', 'courseId'] },
    ],
  },
  {
    id: 'assignment_submissions',
    name: 'Assignment Submissions',
    attrs: [
      { key: 'assignmentId', type: 'string', size: 255, required: true },
      { key: 'courseId', type: 'string', size: 255 },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'submissionText', type: 'string', size: 5000 },
      { key: 'submissionFile', type: 'string', size: 500 },
      { key: 'submittedAt', type: 'string', size: 255, required: true },
      { key: 'score', type: 'double' },
      { key: 'confidence', type: 'double' },
      { key: 'aiGeneratedFeedback', type: 'string', size: 2000 },
      { key: 'isAutoGraded', type: 'boolean' },
      { key: 'flaggedForReview', type: 'boolean' },
      { key: 'reviewedBy', type: 'string', size: 255 },
      { key: 'manualScore', type: 'double' },
      { key: 'gradedAt', type: 'string', size: 255 },
      { key: 'revisionCount', type: 'integer' },
      { key: 'status', type: 'string', size: 50 },
    ],
  },
  {
    id: 'course_enrollments',
    name: 'Course Enrollments',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrolledAt', type: 'string', size: 255, required: true },
      { key: 'enrollmentType', type: 'string', size: 50 },
      { key: 'paymentId', type: 'string', size: 255 },
      { key: 'cohortId', type: 'string', size: 255 },
      { key: 'status', type: 'string', size: 50 },
    ],
  },
  {
    id: 'course_stats',
    name: 'Course Stats',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrollmentCount', type: 'integer' },
      { key: 'completionCount', type: 'integer' },
      { key: 'avgCompletionTime', type: 'integer' },
      { key: 'avgScore', type: 'double' },
      { key: 'churnRate', type: 'double' },
      { key: 'totalRevenue', type: 'double' },
      { key: 'instructorEarnings', type: 'double' },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'course_reviews',
    name: 'Course Reviews',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'rating', type: 'integer' },
      { key: 'reviewText', type: 'string', size: 5000 },
      { key: 'verifiedCompletion', type: 'boolean' },
      { key: 'helpfulCount', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'certificates',
    name: 'Certificates',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'certificateId', type: 'string', size: 255, required: true },
      { key: 'score', type: 'double' },
      { key: 'completionDate', type: 'string', size: 255 },
      { key: 'instructorName', type: 'string', size: 255 },
      { key: 'signatureUrl', type: 'string', size: 500 },
      { key: 'qrCodeUrl', type: 'string', size: 500 },
      { key: 'verificationUrl', type: 'string', size: 500 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'follows',
    name: 'Profile Follows',
    attrs: [
      { key: 'followerId', type: 'string', size: 255, required: true },
      { key: 'followingId', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_follows_pair', type: 'unique', attributes: ['followerId', 'followingId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_follows_follower_time', type: 'key', attributes: ['followerId', 'createdAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_follows_following_time', type: 'key', attributes: ['followingId', 'createdAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'focus_sessions',
    name: 'Focus Sessions',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'plannedMinutes', type: 'integer', required: true },
      { key: 'actualMinutes', type: 'integer' },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'startedAt', type: 'string', size: 255, required: true },
      { key: 'endedAt', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_focus_user_time', type: 'key', attributes: ['userId', 'startedAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_focus_user_status', type: 'key', attributes: ['userId', 'status'], orders: ['ASC', 'ASC'] },
      { key: 'idx_focus_pod_time', type: 'key', attributes: ['podId', 'startedAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'challenges',
    name: 'Learning Challenges',
    attrs: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'creatorId', type: 'string', size: 255, required: true },
      { key: 'scope', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'metric', type: 'string', size: 80, required: true },
      { key: 'goalValue', type: 'integer', required: true },
      { key: 'durationDays', type: 'integer', required: true },
      { key: 'points', type: 'integer', required: true },
      { key: 'visibility', type: 'string', size: 50, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'startsAt', type: 'string', size: 255, required: true },
      { key: 'endsAt', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_challenges_status_start', type: 'key', attributes: ['status', 'startsAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_challenges_scope_time', type: 'key', attributes: ['scope', 'createdAt'], orders: ['ASC', 'DESC'] },
      { key: 'idx_challenges_pod_time', type: 'key', attributes: ['podId', 'createdAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'challenge_participants',
    name: 'Challenge Participants',
    attrs: [
      { key: 'challengeId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'progress', type: 'integer', required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'points', type: 'integer', required: true },
      { key: 'joinedAt', type: 'string', size: 255, required: true },
      { key: 'completedAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_challenge_participant', type: 'unique', attributes: ['challengeId', 'userId'], orders: ['ASC', 'ASC'] },
      { key: 'idx_challenge_rank', type: 'key', attributes: ['challengeId', 'points'], orders: ['ASC', 'DESC'] },
      { key: 'idx_participant_user_time', type: 'key', attributes: ['userId', 'joinedAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'user_achievements',
    name: 'User Achievements',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'achievementKey', type: 'string', size: 120, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000 },
      { key: 'progress', type: 'integer', required: true },
      { key: 'target', type: 'integer', required: true },
      { key: 'earnedAt', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_achievement_user_key', type: 'unique', attributes: ['userId', 'achievementKey'], orders: ['ASC', 'ASC'] },
      { key: 'idx_achievement_user_time', type: 'key', attributes: ['userId', 'earnedAt'], orders: ['ASC', 'DESC'] },
    ],
  },
  {
    id: 'user_settings',
    name: 'User Settings',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'preferences', type: 'string', size: 10000, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_user_settings_user', type: 'unique', attributes: ['userId'], orders: ['ASC'] },
    ],
  },
]

const buckets = [
  { id: 'avatars', name: 'User Avatars' },
  { id: 'resources', name: 'Study Resources' },
  { id: 'attachments', name: 'Message Attachments' },
  { id: 'post_images', name: 'Post Images' },
  { id: 'pod_images', name: 'Pod Images' },
]

async function ensureDatabase() {
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}`)
    console.log(`Database exists: ${DATABASE_ID}`)
  } catch (e) {
    if (!isNotFound(e)) throw e
    console.log(`Creating database: ${DATABASE_ID}`)
    await makeRequest('POST', '/databases', {
      databaseId: DATABASE_ID,
      name: 'PeerSpark Main Database',
    })
  }
}

async function ensureCollection(col) {
  let exists = false
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`)
    console.log(`Collection exists: ${col.id}`)
    exists = true
  } catch (e) {
    if (!isNotFound(e)) throw e
    console.log(`Creating collection: ${col.id}`)
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
      collectionId: col.id,
      name: col.name,
      documentSecurity: true,
    })
  }
  
  // Always update permissions if defined (for both new and existing collections)
  if (col.permissions && (!exists || APPLY_COLLECTION_PERMISSIONS)) {
    try {
      // Appwrite expects flat arrays for permissions
      const perms = []
      if (col.permissions.read) perms.push(...col.permissions.read.map(r => `read("${r.replace('role:', '')}")`))
      if (col.permissions.write) perms.push(...col.permissions.write.map(r => `create("${r.replace('role:', '')}")`))
      if (col.permissions.update) perms.push(...col.permissions.update.map(r => `update("${r.replace('role:', '')}")`))
      if (col.permissions.delete) perms.push(...col.permissions.delete.map(r => `delete("${r.replace('role:', '')}")`))
      
      await makeRequest('PUT', `/databases/${DATABASE_ID}/collections/${col.id}`, {
        name: col.name,
        permissions: perms,
        documentSecurity: true, // enforce row-level document permissions (user:{userId}) set at write-time
        enabled: true,
      })
      console.log(`  Permissions updated for ${col.id}`)
    } catch (permErr) {
      console.warn(`Could not set permissions for ${col.id}:`, permErr.data || permErr)
    }
  }
}

const collectionEmptyCache = new Map()

async function isCollectionEmpty(colId) {
  if (collectionEmptyCache.has(colId)) return collectionEmptyCache.get(colId)
  const result = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/documents`)
  const empty = Number(result.total || 0) === 0
  collectionEmptyCache.set(colId, empty)
  return empty
}

async function waitForAttribute(colId, key) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const attribute = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/attributes/${key}`)
      if (!attribute.status || attribute.status === 'available') return
      if (attribute.status === 'failed') throw new Error(`Attribute ${colId}.${key} entered failed state`)
    } catch (error) {
      if (!isNotFound(error)) throw error
    }
    await sleep(500)
  }
  throw new Error(`Timed out waiting for attribute ${colId}.${key}`)
}

async function waitForAttributes(colId, attrs) {
  for (const attr of attrs) await waitForAttribute(colId, attr.key)
}


async function ensureIndex(colId, idx) {
  try {
    const existing = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/indexes/${idx.key}`)
    if (existing && existing.key) return
  } catch (_) {}
  try {
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/indexes`, idx)
    console.log(`  + index ${colId}.${idx.key}`)
  } catch (e) {
    const msg = JSON.stringify(e.data || e)
    if (!msg.includes('already')) console.warn(`Could not create index ${colId}.${idx.key}:`, e.data || e)
  }
}

async function ensureAttribute(colId, attr) {
  let existing = null
  try {
    const res = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/attributes`)
    if (Array.isArray(res.attributes)) {
      existing = res.attributes.find((a) => a.key === attr.key) || null
    }
  } catch (e) {
    console.warn(`Could not list attributes for ${colId}:`, e.data || e)
  }
  if (existing) {
    const typeMismatch = existing.type !== attr.type
    const arrayMismatch = !!existing.array !== !!attr.array
    const sizeMismatch = attr.type === 'string' && attr.size && existing.size !== attr.size
    if (!typeMismatch && !arrayMismatch && !sizeMismatch) return

    const canReplace = ALLOW_DESTRUCTIVE_SCHEMA_CHANGES || await isCollectionEmpty(colId)
    if (!canReplace) {
      console.warn(`  ! schema mismatch for ${colId}.${attr.key}; skipped because the collection contains documents`)
      return
    }

    console.log(`  ~ replacing ${colId}.${attr.key} (schema mismatch in empty collection)`)
    try {
      await makeRequest('DELETE', `/databases/${DATABASE_ID}/collections/${colId}/attributes/${attr.key}`)
      // Wait for attribute removal to propagate to avoid attribute_limit_exceeded on re-create
      for (let i = 0; i < 8; i++) {
        try {
          const check = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/attributes`)
          const stillThere = Array.isArray(check.attributes) && check.attributes.some((a) => a.key === attr.key)
          if (!stillThere) break
        } catch (_) {
          break
        }
        await sleep(500)
      }
    } catch (e) {
      console.warn(`    could not delete old attribute ${colId}.${attr.key}:`, e.data || e)
    }
  }

  const payload = {
    key: attr.key,
    required: !!attr.required,
    array: !!attr.array,
  }

  try {
    if (attr.type === 'string') {
      payload.size = attr.size || 255
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/string`, payload)
    } else if (attr.type === 'integer') {
      if (attr.min !== undefined) payload.min = attr.min
      if (attr.max !== undefined) payload.max = attr.max
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/integer`, payload)
    } else if (attr.type === 'double' || attr.type === 'float') {
      if (attr.min !== undefined) payload.min = attr.min
      if (attr.max !== undefined) payload.max = attr.max
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/float`, payload)
    } else if (attr.type === 'boolean') {
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/boolean`, payload)
    } else if (attr.type === 'datetime') {
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/datetime`, payload)
    } else {
      throw new Error(`Unsupported attribute type: ${attr.type}`)
    }
    console.log(`  + ${colId}.${attr.key}`)
    await waitForAttribute(colId, attr.key)
  } catch (e) {
    if (e.status === 409) return
    console.error(`Failed to create attribute ${colId}.${attr.key}:`, e.data || e)
    throw e
  }
}

async function ensureBucket(bucket) {
  try {
    await makeRequest('GET', `/storage/buckets/${bucket.id}`)
    console.log(`Bucket exists: ${bucket.id}`)
  } catch (e) {
    if (!isNotFound(e)) throw e
    console.log(`Creating bucket: ${bucket.id}`)
    await makeRequest('POST', '/storage/buckets', {
      bucketId: bucket.id,
      name: bucket.name,
      fileSecurity: true,
    })
  }
}

async function main() {
  console.log('Starting Appwrite schema update...')
  console.log(`Endpoint: ${ENDPOINT}`)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Database: ${DATABASE_ID}`)
  
  await ensureDatabase()

  const selectedCollections = SCHEMA_COLLECTIONS.length ? collections.filter((collection) => SCHEMA_COLLECTIONS.includes(collection.id)) : collections
  for (const col of selectedCollections) {
    try {
      await ensureCollection(col)
      for (const attr of col.attrs) {
        try {
          await ensureAttribute(col.id, attr)
        } catch (attrErr) {
          console.error(`Error creating attribute ${col.id}.${attr.key}:`, attrErr.message || attrErr)
        }
      }
      await waitForAttributes(col.id, col.attrs)
      for (const idx of col.indexes || []) {
        await ensureIndex(col.id, idx)
      }
    } catch (colErr) {
      console.error(`Error with collection ${col.id}:`, colErr.message || colErr)
    }
  }

  for (const bucket of SCHEMA_COLLECTIONS.length ? [] : buckets) {
    try {
      await ensureBucket(bucket)
    } catch (bucketErr) {
      console.error(`Error with bucket ${bucket.id}:`, bucketErr.message || bucketErr)
    }
  }

  console.log('Schema update complete.')
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Schema update failed:', err.message || err)
    process.exit(1)
  })
}

module.exports = { collections, buckets }
