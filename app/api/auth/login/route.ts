import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

    if (!endpoint || !project) {
      return NextResponse.json({ error: 'Server config missing. Set APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID.' }, { status: 500 })
    }

    const resp = await fetch(`${endpoint}/account/sessions/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': project },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) return NextResponse.json({ error: data?.message || 'Login failed' }, { status: resp.status })

    return NextResponse.json({ success: true, sessionId: data?.$id || null }, { status: 200 })
  } catch (error: any) {
    const code = Number(error?.code) || 400
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: code >= 400 && code < 600 ? code : 400 })
  }
}
