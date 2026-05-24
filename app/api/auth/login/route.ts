import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { AUTH_COOKIE_NAME, authErrorResponse, mapAppwriteAuthError, parseJsonSafe, requireAuthEnv, signCookiePayload } from '@/lib/auth-route-utils'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })


export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const cookieSecret = process.env.APPWRITE_SESSION_COOKIE_SECRET
    const envCheck = requireAuthEnv(['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', 'APPWRITE_SESSION_COOKIE_SECRET'])
    if (!envCheck.ok || !endpoint || !project || !cookieSecret) return authErrorResponse({ status: 500, code: 'AUTH_ENV_MISSING', message: 'Authentication server is misconfigured.', details: { missing: envCheck.ok ? [] : envCheck.missing } })

    const base = endpoint.replace(/\/v1\/?$/i, '')
    const appwriteResp = await fetch(`${base}/v1/account/sessions/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': project,
      },
      body: JSON.stringify({ email: payload.email.toLowerCase(), password: payload.password }),
    })

    const appwriteData = await parseJsonSafe(appwriteResp)
    if (!appwriteResp.ok) {
      const mapped = mapAppwriteAuthError(appwriteResp.status, appwriteData, 'LOGIN_FAILED', 'Login failed')
      return authErrorResponse({ status: appwriteResp.status || 401, code: mapped.code, message: mapped.message, details: { appwriteType: appwriteData?.type || null } })
    }
    const session = appwriteData

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
    const signedValue = `${encodedPayload}.${signCookiePayload(encodedPayload, cookieSecret)}`

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
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
