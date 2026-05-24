import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Client, Users } from 'node-appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const COOKIE_NAME = 'peerspark_session'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(COOKIE_NAME)?.value
    if (raw) {
      const [encodedPayload] = raw.split('.')
      const parsed = encodedPayload
        ? (JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { userId?: string; sessionId?: string })
        : null
      const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
      const apiKey = process.env.APPWRITE_API_KEY
      if (parsed?.userId && parsed?.sessionId && endpoint && project && apiKey) {
        const users = new Users(new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey))
        await users.deleteSession(parsed.userId, parsed.sessionId).catch(() => null)
      }
    }
  } catch {
    // Continue clearing cookie even if provider logout fails.
  }

  const response = NextResponse.json({ success: true }, { status: 200 })
  response.cookies.set({
    name: 'peerspark_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
