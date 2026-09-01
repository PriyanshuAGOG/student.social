import 'server-only'

import { Account, Client, Databases, Storage, Teams, Users } from 'node-appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const DEFAULT_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'
const DEFAULT_DATABASE_ID = 'peerspark-main-db'

export type AppwriteAdminClient = ReturnType<typeof createAdminClient>

function chooseConsistentValue(name: string, serverValue?: string, publicValue?: string): string {
  if (serverValue && publicValue && serverValue !== publicValue) {
    throw new Error(`${name} is inconsistent between server and NEXT_PUBLIC configuration`)
  }
  return serverValue || publicValue || ''
}

export function getServerAppwriteConfig() {
  const endpoint = normalizeAppwriteEndpoint(
    chooseConsistentValue(
      'Appwrite endpoint',
      process.env.APPWRITE_ENDPOINT,
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    ) || DEFAULT_ENDPOINT,
  ) || DEFAULT_ENDPOINT
  const projectId = chooseConsistentValue(
    'Appwrite project ID',
    process.env.APPWRITE_PROJECT_ID,
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  )
  const databaseId = chooseConsistentValue(
    'Appwrite database ID',
    process.env.APPWRITE_DATABASE_ID,
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  ) || DEFAULT_DATABASE_ID
  const apiKey = process.env.APPWRITE_API_KEY || ''

  if (!projectId) {
    throw new Error('Missing APPWRITE_PROJECT_ID (or NEXT_PUBLIC_APPWRITE_PROJECT_ID)')
  }
  if (!apiKey && process.env.NODE_ENV === 'production') {
    throw new Error('Missing APPWRITE_API_KEY for server-side Appwrite access')
  }

  return { endpoint, projectId, databaseId, apiKey }
}

/**
 * Canonical server-side Appwrite entry point. It is deliberately lazy so builds
 * can compile without production secrets; configuration is validated on use.
 */
export function createAdminClient() {
  const config = getServerAppwriteConfig()
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId)

  if (config.apiKey) {
    client.setKey(config.apiKey)
  }

  return {
    client,
    config,
    databases: new Databases(client),
    storage: new Storage(client),
    account: new Account(client),
    teams: new Teams(client),
    users: new Users(client),
  }
}

type CookieReader = { cookies: { get(name: string): { value?: string } | undefined } }

export async function createSessionClient(request: CookieReader) {
  const config = getServerAppwriteConfig()
  const session = request.cookies.get('appwrite-session')?.value
  if (!session) throw new Error('No Appwrite session cookie')

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setSession(session)

  return { client, account: new Account(client) }
}

export function getDatabaseId(): string {
  return getServerAppwriteConfig().databaseId
}

export const COLLECTIONS = {
  profiles: process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles',
  posts: process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts',
  comments: process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments',
  pods: process.env.NEXT_PUBLIC_PODS_COLLECTION_ID || 'pods',
  podMemberships: process.env.NEXT_PUBLIC_POD_MEMBERSHIPS_COLLECTION_ID || 'pod_memberships',
  messages: process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages',
  chatRooms: process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms',
  resources: process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources',
  notifications: process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications',
  notificationPreferences: process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES_COLLECTION_ID || 'notification_preferences',
  calendarEvents: process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events',
  follows: process.env.NEXT_PUBLIC_FOLLOWS_COLLECTION_ID || 'follows',
  focusSessions: process.env.NEXT_PUBLIC_FOCUS_SESSIONS_COLLECTION_ID || 'focus_sessions',
  challenges: process.env.NEXT_PUBLIC_CHALLENGES_COLLECTION_ID || 'challenges',
  challengeParticipants: process.env.NEXT_PUBLIC_CHALLENGE_PARTICIPANTS_COLLECTION_ID || 'challenge_participants',
  userAchievements: process.env.NEXT_PUBLIC_USER_ACHIEVEMENTS_COLLECTION_ID || 'user_achievements',
  userSettings: process.env.NEXT_PUBLIC_USER_SETTINGS_COLLECTION_ID || 'user_settings',
} as const
