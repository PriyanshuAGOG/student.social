import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { Client, Users, Query } from 'node-appwrite'
import crypto from 'crypto'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

const COOKIE_NAME = 'peerspark_session'

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY
    const cookieSecret = process.env.APPWRITE_SESSION_COOKIE_SECRET
    if (!endpoint || !project || !apiKey || !cookieSecret) return NextResponse.json({ error: 'Server config missing.' }, { status: 500 })

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)

    const matchedUsers = await users.list({
      queries: [Query.equal('email', payload.email.toLowerCase())],
      total: false,
    })
    const matchedUser = matchedUsers.users?.[0]
    if (!matchedUser?.$id) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const session = await users.createSession({ userId: matchedUser.$id })

    const response = NextResponse.json(
      {
        success: true,
        sessionId: session.$id,
        userId: session.userId,
        expire: session.expire,
      },
      { status: 200 }
    )

    const cookiePayload = JSON.stringify({
        sessionId: session.$id,
        userId: session.userId,
        email: payload.email,
        secret: session.secret,
        expire: session.expire,
      })
    const encodedPayload = Buffer.from(cookiePayload).toString('base64url')
    const signedValue = `${encodedPayload}.${sign(encodedPayload, cookieSecret)}`

    response.cookies.set({
      name: COOKIE_NAME,
      value: signedValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error: any) {
    return authErrorResponse({ status: 400, code: 'LOGIN_REQUEST_INVALID', message: error?.message || 'Login failed' })
  }
}
