// Production-ready Appwrite schema updater
// Ensures database, collections, attributes, and buckets exist with required fields
// Usage: APPWRITE_API_KEY must be set; endpoint/project/database are read from .env.local

const fs = require('fs')
const path = require('path')
const https = require('https')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const env = {}
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      env[key] = val
    }
  }
  return env
}

const env = loadEnv()
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing Appwrite configuration. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY.')
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

const collections = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'bio', type: 'string', size: 1000 },
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
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'lastSeen', type: 'string', size: 255 },
      { key: 'isOnline', type: 'boolean' },
      { key: 'studyStreak', type: 'integer' },
      { key: 'totalPoints', type: 'integer' },
      { key: 'level', type: 'integer' },
      { key: 'badges', type: 'string', size: 100, array: true },
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
      { key: 'imageFileId', type: 'string', size: 255 },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'likes', type: 'integer' },
      { key: 'comments', type: 'integer' },
      { key: 'shares', type: 'integer' },
      { key: 'isEdited', type: 'boolean' },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'likedBy', type: 'string', size: 255, array: true },
      { key: 'visibility', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'mentions', type: 'string', size: 100, array: true },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'isEdited', type: 'boolean' },
      { key: 'replyTo', type: 'string', size: 255 },
      { key: 'fileUrl', type: 'string', size: 500 },
      { key: 'reactions', type: 'string', size: 100, array: true },
    ],
  },
  {
    id: 'pods',
    name: 'Study Pods',
    attrs: [
      { key: 'teamId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
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
    ],
  },
  {
    id: 'calendar_events',
    name: 'Calendar Events',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'startTime', type: 'string', size: 255, required: true },
      { key: 'endTime', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 50 },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'isCompleted', type: 'boolean' },
    ],
  },
  {
    id: 'chat_rooms',
    name: 'Chat Rooms',
    attrs: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'name', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'isActive', type: 'boolean' },
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
]

const buckets = [
  { id: 'avatars', name: 'User Avatars' },
  { id: 'resources', name: 'Study Resources' },
  { id: 'attachments', name: 'Message Attachments' },
  { id: 'post_images', name: 'Post Images' },
]

async function ensureDatabase() {
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}`)
    console.log(`Database exists: ${DATABASE_ID}`)
  } catch (e) {
    console.log(`Creating database: ${DATABASE_ID}`)
    await makeRequest('POST', '/databases', {
      databaseId: DATABASE_ID,
      name: 'PeerSpark Main Database',
    })
  }
}

async function ensureCollection(col) {
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`)
    console.log(`Collection exists: ${col.id}`)
  } catch (e) {
    console.log(`Creating collection: ${col.id}`)
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
      collectionId: col.id,
      name: col.name,
      documentSecurity: true,
    })
    if (col.permissions) {
      try {
        await makeRequest('PATCH', `/databases/${DATABASE_ID}/collections/${col.id}`, {
          permissions: {
            read: col.permissions.read,
            write: col.permissions.write,
            update: col.permissions.update,
            delete: col.permissions.delete,
          },
        })
      } catch (permErr) {
        console.warn(`Could not set permissions for ${col.id}:`, permErr.data || permErr)
      }
    }
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

    console.log(`  ~ replacing ${colId}.${attr.key} (schema mismatch)`)
    try {
      await makeRequest('DELETE', `/databases/${DATABASE_ID}/collections/${colId}/attributes/${attr.key}`)
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
    } else if (attr.type === 'boolean') {
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/boolean`, payload)
    } else {
      throw new Error(`Unsupported attribute type: ${attr.type}`)
    }
    console.log(`  + ${colId}.${attr.key}`)
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
  await ensureDatabase()

  for (const col of collections) {
    await ensureCollection(col)
    for (const attr of col.attrs) {
      await ensureAttribute(col.id, attr)
    }
  }

  for (const bucket of buckets) {
    await ensureBucket(bucket)
  }

  console.log('Schema update complete.')
}

main().catch((err) => {
  console.error('Schema update failed:', err.message || err)
  process.exit(1)
})
