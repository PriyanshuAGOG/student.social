/**
 * Compatibility aliases for older route handlers. New server code must import
 * directly from `@/lib/server/appwrite`.
 */
import { COLLECTIONS as canonicalCollections } from '@/lib/server/appwrite'

export const DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  'peerspark-main-db'

export const COLLECTIONS = {
  PROFILES: canonicalCollections.profiles,
  POSTS: canonicalCollections.posts,
  COMMENTS: canonicalCollections.comments,
  PODS: canonicalCollections.pods,
  MESSAGES: canonicalCollections.messages,
  CHAT_ROOMS: canonicalCollections.chatRooms,
  RESOURCES: canonicalCollections.resources,
  NOTIFICATIONS: canonicalCollections.notifications,
  CALENDAR_EVENTS: canonicalCollections.calendarEvents,
  SAVED_POSTS: process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts',
  POD_COURSES: process.env.NEXT_PUBLIC_POD_COURSES_COLLECTION_ID || 'pod_courses',
  COURSES: process.env.NEXT_PUBLIC_COURSES_COLLECTION_ID || 'courses',
  CHAPTERS: process.env.NEXT_PUBLIC_CHAPTERS_COLLECTION_ID || 'course_chapters',
} as const
