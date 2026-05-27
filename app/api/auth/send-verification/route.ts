import { NextResponse, type NextRequest } from 'next/server'
import { getAppwriteServerConfig } from '@/lib/env'
import { sendAppwriteVerificationEmail } from '@/lib/appwrite-verification'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireOwnership, requireUser } from '@/lib/api-security'
import { authErrorResponse } from '@/lib/auth-route-utils'

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'auth:send-verification', max: 3, windowMs: 15 * 60 * 1000 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    const { userId } = body || {}
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const auth = requireUser(req)
    requireOwnership(userId, auth.userId)

    const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

    if (!endpoint || !projectId || !apiKey) {
      console.error('Appwrite verification env missing in env', {
        endpoint: Boolean(endpoint),
        projectId: Boolean(projectId),
        apiKey: Boolean(apiKey),
      })
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
    }

    const redirectUrl = new URL('/verify-email', process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app').toString()

    const result = await sendAppwriteVerificationEmail({
      endpoint,
      projectId,
      apiKey,
      userId,
      redirectUrl,
    })

    console.log(`[Verification] Sent verification link to user ${userId}`)
    return NextResponse.json({ ok: true, status: result.status })
  } catch (err: any) {
    if (err instanceof ApiError) {
      return authErrorResponse({
        status: err.status,
        code: err.code,
        message: err.message,
      })
    }

    console.error('send-verification error', {
      message: err?.message,
      status: err?.status,
      endpoint: err?.endpoint,
      body: err?.body,
    })
    return NextResponse.json({ error: err?.message || String(err), status: err?.status, body: err?.body, endpoint: err?.endpoint }, { status: 500 })
  }
}
