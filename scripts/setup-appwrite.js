#!/usr/bin/env node
// Appwrite setup bootstrapper.
// - Normalizes Appwrite env aliases used across older routes.
// - Keeps secrets in .env.local (git-ignored) and never prints API keys.
// - Runs the schema sync script end-to-end.

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_PATH = path.join(process.cwd(), '.env.local')
const DEFAULT_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'
const DEFAULT_PROJECT_ID = '694ed12f003c942317f4'
const DEFAULT_DATABASE_ID = 'peerspark-main-db'

function parseEnvFile(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }

  return env
}

function serializeEnv(env) {
  const preferredOrder = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'NEXT_PUBLIC_DATABASE_ID',
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY',
    'NEXT_PUBLIC_PROFILES_COLLECTION_ID',
    'NEXT_PUBLIC_POSTS_COLLECTION_ID',
    'NEXT_PUBLIC_COMMENTS_COLLECTION_ID',
    'NEXT_PUBLIC_MESSAGES_COLLECTION_ID',
    'NEXT_PUBLIC_RESOURCES_COLLECTION_ID',
    'NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID',
    'NEXT_PUBLIC_PODS_COLLECTION_ID',
    'NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID',
    'NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID',
    'NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID',
    'NEXT_PUBLIC_COURSES_COLLECTION_ID',
    'NEXT_PUBLIC_CHAPTERS_COLLECTION_ID',
    'NEXT_PUBLIC_AVATARS_BUCKET_ID',
    'NEXT_PUBLIC_RESOURCES_BUCKET_ID',
    'NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID',
    'NEXT_PUBLIC_POST_IMAGES_BUCKET_ID',
    'NEXT_PUBLIC_POD_IMAGES_BUCKET_ID',
    'NEXT_PUBLIC_ENABLE_APPWRITE_DEBUG',
  ]

  const keys = [...preferredOrder, ...Object.keys(env).filter((key) => !preferredOrder.includes(key)).sort()]
  return `${keys.filter((key) => env[key] !== undefined && env[key] !== '').map((key) => `${key}=${env[key]}`).join('\n')}\n`
}

function normalizeEnv() {
  const fileEnv = parseEnvFile(ENV_PATH)
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || fileEnv.NEXT_PUBLIC_APPWRITE_ENDPOINT || fileEnv.APPWRITE_ENDPOINT || DEFAULT_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || fileEnv.NEXT_PUBLIC_APPWRITE_PROJECT_ID || fileEnv.APPWRITE_PROJECT_ID || DEFAULT_PROJECT_ID
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || fileEnv.NEXT_PUBLIC_APPWRITE_DATABASE_ID || fileEnv.APPWRITE_DATABASE_ID || fileEnv.NEXT_PUBLIC_DATABASE_ID || DEFAULT_DATABASE_ID
  const apiKey = process.env.APPWRITE_API_KEY || fileEnv.APPWRITE_API_KEY || ''

  const merged = {
    ...fileEnv,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: projectId,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: databaseId,
    // Legacy/server aliases still referenced by older routes and docs.
    NEXT_PUBLIC_DATABASE_ID: databaseId,
    APPWRITE_ENDPOINT: endpoint,
    APPWRITE_PROJECT_ID: projectId,
    APPWRITE_DATABASE_ID: databaseId,
    APPWRITE_API_KEY: apiKey,
    NEXT_PUBLIC_PROFILES_COLLECTION_ID: fileEnv.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles',
    NEXT_PUBLIC_POSTS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts',
    NEXT_PUBLIC_COMMENTS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments',
    NEXT_PUBLIC_MESSAGES_COLLECTION_ID: fileEnv.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages',
    NEXT_PUBLIC_RESOURCES_COLLECTION_ID: fileEnv.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources',
    NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications',
    NEXT_PUBLIC_PODS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_PODS_COLLECTION_ID || 'pods',
    NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events',
    NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms',
    NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts',
    NEXT_PUBLIC_COURSES_COLLECTION_ID: fileEnv.NEXT_PUBLIC_COURSES_COLLECTION_ID || 'courses',
    NEXT_PUBLIC_CHAPTERS_COLLECTION_ID: fileEnv.NEXT_PUBLIC_CHAPTERS_COLLECTION_ID || 'course_chapters',
    NEXT_PUBLIC_AVATARS_BUCKET_ID: fileEnv.NEXT_PUBLIC_AVATARS_BUCKET_ID || 'avatars',
    NEXT_PUBLIC_RESOURCES_BUCKET_ID: fileEnv.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources',
    NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID: fileEnv.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments',
    NEXT_PUBLIC_POST_IMAGES_BUCKET_ID: fileEnv.NEXT_PUBLIC_POST_IMAGES_BUCKET_ID || 'post_images',
    NEXT_PUBLIC_POD_IMAGES_BUCKET_ID: fileEnv.NEXT_PUBLIC_POD_IMAGES_BUCKET_ID || 'pod_images',
  }

  fs.writeFileSync(ENV_PATH, serializeEnv(merged), { mode: 0o600 })

  if (!apiKey) {
    console.error('Missing APPWRITE_API_KEY. Add it to .env.local or export APPWRITE_API_KEY before running setup.')
    process.exit(1)
  }

  return { endpoint, projectId, databaseId, apiKey }
}

const normalized = normalizeEnv()
console.log('Appwrite environment normalized:')
console.log(`  Endpoint: ${normalized.endpoint}`)
console.log(`  Project: ${normalized.projectId}`)
console.log(`  Database: ${normalized.databaseId}`)
console.log('  API key: [redacted]')

const result = spawnSync(process.execPath, ['scripts/update-schema.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: normalized.endpoint,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: normalized.projectId,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: normalized.databaseId,
    NEXT_PUBLIC_DATABASE_ID: normalized.databaseId,
    APPWRITE_ENDPOINT: normalized.endpoint,
    APPWRITE_PROJECT_ID: normalized.projectId,
    APPWRITE_DATABASE_ID: normalized.databaseId,
    APPWRITE_API_KEY: normalized.apiKey,
  },
})

process.exit(result.status ?? 1)
