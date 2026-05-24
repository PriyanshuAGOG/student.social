import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

type SessionCookie = {
  sessionId?: string
  userId?: string
  email?: string
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('peerspark_session')?.value
    if (!raw) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200 })
    }

    let sessionCookie: SessionCookie | null = null
    try {
      sessionCookie = JSON.parse(raw) as SessionCookie
    } catch {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200 })
    }

    if (!sessionCookie?.userId) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 200 })
    }

    const { databases } = createAdminClient()
    const profile = await databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || '', 'profiles', sessionCookie.userId).catch(() => null)

    const user = {
      $id: sessionCookie.userId,
      name: profile?.name || sessionCookie.email?.split('@')[0] || 'User',
      email: profile?.email || sessionCookie.email || '',
      emailVerification: true,
    }

    return NextResponse.json({
      authenticated: true,
      user,
      profile,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load session' }, { status: 500 })
  }
}