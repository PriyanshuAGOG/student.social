import crypto from 'crypto'
import { Account, Client } from 'node-appwrite'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'
import { getSessionCookieSecret, normalizeAppwriteEndpoint } from '@/lib/env'
import { isAdminUser } from '@/lib/admin-access'

type SessionCookie = {
  secret?: string
  userId?: string
  email?: string
  sessionId?: string
  expire?: string
}

type CookieStore = {
  get(name: string): { value?: string } | undefined
}

function getCookieValue(cookieStore: CookieStore, name: string): string | null {
  return cookieStore.get(name)?.value || null
}

function isExpired(expire?: string) {
  if (!expire) return false
  const expiresAt = Date.parse(expire)
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

function verifySignedSession(raw: string): SessionCookie | null {
  const [encodedPayload, signature] = raw.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = crypto.createHmac('sha256', getSessionCookieSecret()).update(encodedPayload).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookie
  } catch {
    return null
  }
}

async function getUserFromSignedSession(raw: string): Promise<any | null> {
  const sessionCookie = verifySignedSession(raw)
  if (!sessionCookie?.userId || (!sessionCookie.secret && !sessionCookie.sessionId) || isExpired(sessionCookie.expire)) {
    return null
  }

  const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT)
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
  if (!endpoint || !project) {
    return null
  }

  if (sessionCookie.secret) {
    const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(sessionCookie.secret)
    const account = new Account(sessionClient)
    const user = await account.get().catch(() => null)
    if (user) return user
  }

  // Some Appwrite session types cannot be replayed through Account.get even
  // though their server-side session ID is still valid. Match the same
  // canonical fallback used by requireAdmin and /api/auth/session.
  if (sessionCookie.sessionId) {
    const { users } = createAdminClient()
    const sessions = await users.listSessions(sessionCookie.userId, false).catch(() => null)
    const active = sessions?.sessions?.some((session: any) => session.$id === sessionCookie.sessionId)
    if (active) return users.get(sessionCookie.userId).catch(() => null)
  }

  return null
}

export async function getAdminUserFromCookies(cookieStore: CookieStore) {
  const signedSession = getCookieValue(cookieStore, 'peerspark_session')
  if (signedSession) {
    const signedUser = await getUserFromSignedSession(signedSession)
    if (signedUser && isAdminUser(signedUser)) {
      return signedUser
    }
  }

  const appwriteSession = getCookieValue(cookieStore, 'appwrite-session')
  if (!appwriteSession) {
    return null
  }

  try {
    const { account } = await createSessionClient({ cookies: cookieStore } as any)
    const user = await account.get().catch(() => null)
    if (user && isAdminUser(user)) {
      return user
    }
  } catch {
    return null
  }

  return null
}
