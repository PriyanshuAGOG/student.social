import { NextResponse } from 'next/server'
import { getAppwriteServerConfig } from '@/lib/env'
import { sendAppwriteVerificationEmail } from '@/lib/appwrite-verification'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body || {}
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

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
    console.error('send-verification error', {
      message: err?.message,
      status: err?.status,
      endpoint: err?.endpoint,
      body: err?.body,
    })
    return NextResponse.json({ error: err?.message || String(err), status: err?.status, body: err?.body, endpoint: err?.endpoint }, { status: 500 })
  }
}
