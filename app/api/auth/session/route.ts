import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getSessionCookieSecret } from '@/lib/env'
import crypto from 'crypto'

type SessionCookie = {
  sessionId?: string
  userId?: string
  email?: string
  secret?: string
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('peerspark_session')?.value
    if (!raw) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    const cookieSecret = getSessionCookieSecret()

    const [encodedPayload, signature] = raw.split('.')
    if (!encodedPayload || !signature) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    const expectedSignature = crypto.createHmac('sha256', cookieSecret).update(encodedPayload).digest('hex')
    if (signature !== expectedSignature) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    let sessionCookie: SessionCookie | null = null
    try {
      sessionCookie = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookie
    } catch {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    if (!sessionCookie?.userId || (!sessionCookie?.secret && !sessionCookie?.sessionId)) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
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
      const activeSession = await users.getSession(userId, sessionCookie.sessionId).catch(() => null)
      if (activeSession?.$id) {
        accountUser = await users.get(userId).catch(() => null)
      }
    }

    if (!accountUser?.$id) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }
    const profile = await databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || '', 'profiles', accountUser.$id).catch(() => null)

    return NextResponse.json({
      authenticated: true,
      user: accountUser,
      profile,
    }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load session' }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
  }
}
