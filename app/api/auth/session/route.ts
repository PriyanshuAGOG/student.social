import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { Client, Account } from 'node-appwrite'
import { normalizeAppwriteEndpoint, getSessionCookieSecret } from '@/lib/env'
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

    if (!sessionCookie?.userId || !sessionCookie?.secret) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    if (!endpoint || !project) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(sessionCookie.secret)
    const sessionAccount = new Account(sessionClient)
    const accountUser = await sessionAccount.get().catch(() => null)
    if (!accountUser?.$id) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', Pragma: 'no-cache', Expires: '0' } })
    }

    const { databases } = createAdminClient()
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
