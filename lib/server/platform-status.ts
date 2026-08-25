import 'server-only'

import { RoomServiceClient } from 'livekit-server-sdk'
import { Query } from 'node-appwrite'
import { COLLECTIONS, createAdminClient } from '@/lib/server/appwrite'

export type PlatformStatusValue = 'operational' | 'degraded' | 'unknown'

export type PlatformServiceStatus = {
  id: 'web' | 'appwrite' | 'realtime' | 'calls' | 'rate-limit' | 'ai' | 'email'
  name: string
  description: string
  status: PlatformStatusValue
  detail: string
}

export type PlatformStatusSnapshot = {
  checkedAt: string
  overall: PlatformStatusValue
  summary: string
  services: PlatformServiceStatus[]
  incidentFeedConfigured: boolean
}

const PROBE_TIMEOUT_MS = 5_000
const CACHE_TTL_MS = 20_000

let cachedSnapshot: { expiresAt: number; value: PlatformStatusSnapshot } | null = null

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Health probe timed out')), PROBE_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function probeAppwrite(): Promise<boolean> {
  const { config, databases, storage } = createAdminClient()
  if (!config.apiKey) return false

  const [health] = await withTimeout(Promise.all([
    fetch(`${config.endpoint.replace(/\/$/, '')}/health/version`, {
      headers: { 'x-appwrite-project': config.projectId },
      cache: 'no-store',
    }),
    databases.listDocuments(config.databaseId, COLLECTIONS.profiles, [Query.limit(1)]),
    storage.listBuckets([Query.limit(1)]),
  ]))
  return health.ok
}

async function probeLiveKit(): Promise<boolean> {
  const rawUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || ''
  const apiKey = process.env.LIVEKIT_API_KEY || ''
  const apiSecret = process.env.LIVEKIT_API_SECRET || ''
  if (!rawUrl || !apiKey || !apiSecret) return false

  const apiUrl = new URL(rawUrl)
  if (apiUrl.protocol === 'wss:') apiUrl.protocol = 'https:'
  if (apiUrl.protocol === 'ws:') apiUrl.protocol = 'http:'
  const rooms = new RoomServiceClient(apiUrl.toString(), apiKey, apiSecret)
  await withTimeout(rooms.listRooms())
  return true
}

async function probeRateLimiter(): Promise<boolean> {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  if (!url || !token) return false

  const response = await withTimeout(fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }))
  return response.ok
}

function probeResult(result: PromiseSettledResult<boolean>): boolean {
  return result.status === 'fulfilled' && result.value
}

export async function getPlatformStatusSnapshot(): Promise<PlatformStatusSnapshot> {
  const now = Date.now()
  if (cachedSnapshot && cachedSnapshot.expiresAt > now) return cachedSnapshot.value

  const [appwriteResult, liveKitResult, rateLimitResult] = await Promise.allSettled([
    probeAppwrite(),
    probeLiveKit(),
    probeRateLimiter(),
  ])
  const appwriteReady = probeResult(appwriteResult)
  const liveKitReady = probeResult(liveKitResult)
  const rateLimitReady = probeResult(rateLimitResult)
  const aiConfigured = Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)
  const emailConfigured = Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER))

  const services: PlatformServiceStatus[] = [
    {
      id: 'web',
      name: 'Web application',
      description: 'PeerSpark pages and server routes',
      status: 'operational',
      detail: 'This live status endpoint responded successfully.',
    },
    {
      id: 'appwrite',
      name: 'Data and storage',
      description: 'Appwrite databases, authentication, and file storage',
      status: appwriteReady ? 'operational' : 'degraded',
      detail: appwriteReady ? 'Authenticated database and storage checks succeeded.' : 'The authenticated Appwrite checks did not complete successfully.',
    },
    {
      id: 'realtime',
      name: 'Real-time messaging',
      description: 'Chat, notifications, and realtime subscriptions',
      status: appwriteReady ? 'unknown' : 'degraded',
      detail: appwriteReady ? 'The data provider is reachable; end-to-end realtime delivery is tested separately.' : 'Realtime data depends on the unavailable Appwrite check.',
    },
    {
      id: 'calls',
      name: 'Voice and video calls',
      description: 'LiveKit rooms for one-to-one and group calls',
      status: liveKitReady ? 'operational' : 'degraded',
      detail: liveKitReady ? 'An authenticated LiveKit room-service check succeeded.' : 'The LiveKit room-service check did not complete successfully.',
    },
    {
      id: 'rate-limit',
      name: 'Request protection',
      description: 'Durable distributed rate limiting',
      status: rateLimitReady ? 'operational' : 'degraded',
      detail: rateLimitReady ? 'The durable limiter data store responded to a ping.' : 'The durable limiter data store did not respond successfully.',
    },
    {
      id: 'ai',
      name: 'AI learning tools',
      description: 'Assistant and content-generation providers',
      status: 'unknown',
      detail: aiConfigured ? 'Configured; provider requests are not made from the public status page.' : 'Not configured in this environment.',
    },
    {
      id: 'email',
      name: 'Email delivery',
      description: 'Verification and transactional messages',
      status: 'unknown',
      detail: emailConfigured ? 'Configured; test email is not sent by a status check.' : 'Not configured in this environment.',
    },
  ]

  const coreReady = appwriteReady && liveKitReady && rateLimitReady
  const value: PlatformStatusSnapshot = {
    checkedAt: new Date(now).toISOString(),
    overall: coreReady ? 'operational' : 'degraded',
    summary: coreReady
      ? 'All actively monitored core services responded successfully.'
      : 'One or more actively monitored core services needs attention.',
    services,
    incidentFeedConfigured: false,
  }
  cachedSnapshot = { expiresAt: now + CACHE_TTL_MS, value }
  return value
}
