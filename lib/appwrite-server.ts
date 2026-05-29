import { Client, Databases, Storage, Users } from 'node-appwrite'
import { getEnv, normalizeAppwriteEndpoint } from '@/lib/env'

const env = getEnv()

const endpoint = normalizeAppwriteEndpoint(
  env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT,
)
const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ''
const apiKey = process.env.APPWRITE_API_KEY || ''

if (!endpoint) {
  throw new Error('Missing Appwrite endpoint for server client')
}

if (!projectId) {
  throw new Error('Missing Appwrite project ID for server client')
}

if (!apiKey) {
  throw new Error('Missing APPWRITE_API_KEY for server Appwrite client')
}

const serverClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)

export const serverDatabases = new Databases(serverClient)
export const serverStorage = new Storage(serverClient)
export const serverUsers = new Users(serverClient)

export const DATABASE_ID =
  env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  process.env.APPWRITE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_DATABASE_ID ||
  'peerspark-main-db'

export const COLLECTIONS = {
  PROFILES: process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles',
  POSTS: process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts',
  COMMENTS: process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments',
  PODS: process.env.NEXT_PUBLIC_PODS_COLLECTION_ID || 'pods',
  MESSAGES: process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages',
  CHAT_ROOMS: process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms',
  RESOURCES: process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources',
  NOTIFICATIONS: process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications',
  CALENDAR_EVENTS: process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events',
  SAVED_POSTS: process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts',
  POD_COURSES: process.env.NEXT_PUBLIC_POD_COURSES_COLLECTION_ID || 'pod_courses',
  COURSES: process.env.NEXT_PUBLIC_COURSES_COLLECTION_ID || 'courses',
  CHAPTERS: process.env.NEXT_PUBLIC_CHAPTERS_COLLECTION_ID || 'course_chapters',
}
