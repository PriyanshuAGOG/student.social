import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body || {}
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
    const apiKey = process.env.APPWRITE_API_KEY || ''

    if (!apiKey) {
      console.error('APPWRITE_API_KEY missing in env')
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
    }

    const redirectUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/verify-email'

    // Normalize endpoint to ensure single /v1
    const base = endpoint.replace(/\/v1\/?$/i, '')
    const url = `${base}/v1/users/${userId}/verification`

    // Use Appwrite REST API to create verification
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Key': apiKey,
        'X-Appwrite-Project': projectId,
      },
      body: JSON.stringify({ url: redirectUrl }),
    })

    const text = await resp.text()
    let data: any = text
    try { data = JSON.parse(text) } catch (e) { /* not JSON */ }

    if (!resp.ok) {
      console.error('send-verification failed', { status: resp.status, body: data, url })
      return NextResponse.json({ error: data?.message || data || 'Failed to create verification', status: resp.status, body: data, url }, { status: 500 })
    }

    console.log(`[Verification] Sent verification link to user ${userId}`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-verification error', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
