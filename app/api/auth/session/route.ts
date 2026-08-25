import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { getSessionCookieSecret } from '@/lib/env'
import { createSessionClient } from '@/lib/server/appwrite'
import crypto from 'crypto'

type SessionCookie = {
  sessionId?: string
  userId?: string
  email?: string
  secret?: string
  expire?: string
}

function sanitizeAccountUser(user: any) {
  if (!user) return null

  const {
    password,
    hash,
    hashOptions,
    tokens,
    sessions,
    mfaRecoveryCodes,
    ...safeUser
  } = user

  return safeUser
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}

function signaturesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}

function isExpired(expire?: string) {
  if (!expire) return false
  const expiresAt = Date.parse(expire)
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

export async function GET(request: NextRequest) {
  try {
    const appwriteSession = request.cookies.get('appwrite-session')?.value

    // Preferred for SSR OAuth flow: validate Appwrite session secret directly.
    if (appwriteSession) {
      const { account } = await createSessionClient(request)
      const accountUser = await account.get().catch(() => null)

      if (accountUser?.$id) {
        const { databases } = createAdminClient()
        const profile = await databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || '', 'profiles', accountUser.$id).catch(() => null)

        return NextResponse.json({
          authenticated: true,
          user: sanitizeAccountUser(accountUser),
          profile,
        }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
      }
    }

    const raw = request.cookies.get('peerspark_session')?.value
    if (!raw) {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }

    const cookieSecret = getSessionCookieSecret()

    const [encodedPayload, signature] = raw.split('.')
    if (!encodedPayload || !signature) {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }

    const expectedSignature = crypto.createHmac('sha256', cookieSecret).update(encodedPayload).digest('hex')
    if (!signaturesMatch(expectedSignature, signature)) {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }

    let sessionCookie: SessionCookie | null = null
    try {
      sessionCookie = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookie
    } catch {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }

    if (!sessionCookie?.userId || (!sessionCookie?.secret && !sessionCookie?.sessionId) || isExpired(sessionCookie.expire)) {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }

    const { users, databases } = createAdminClient()
    const userId = sessionCookie.userId
    let accountUser: any = null

    // Preferred: validate by session secret if present.
    if (sessionCookie.secret) {
      const userSessions = await users.listSessions(userId, false).catch(() => null)
      const matched = userSessions?.sessions?.find((s: any) => s.secret === sessionCookie.secret)
      if (matched?.$id) {
        accountUser = await users.get(userId).catch(() => null)
      }
    }

    // Fallback: validate by sessionId for environments where session secret is unavailable.
    if (!accountUser?.$id && sessionCookie.sessionId) {
      const userSessions = await users.listSessions(userId, false).catch(() => null)
      const activeSession = userSessions?.sessions?.find((s: any) => s.$id === sessionCookie.sessionId)
      if (activeSession?.$id) {
        accountUser = await users.get(userId).catch(() => null)
      }
    }

    if (!accountUser?.$id) {
      return noStoreJson({ authenticated: false, user: null, profile: null })
    }
    const profile = await databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || '', 'profiles', accountUser.$id).catch(() => null)

    return NextResponse.json({
      authenticated: true,
      user: sanitizeAccountUser(accountUser),
      profile,
    }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
  } catch (error: any) {
    return noStoreJson({ error: error?.message || 'Failed to load session' }, 500)
  }
}
