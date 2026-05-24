import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
    if (!project) {
      return NextResponse.json({ error: 'Server config missing.' }, { status: 500 })
    }

    const base = endpoint.replace(/\/v1\/?$/i, '')
    const response = await fetch(`${base}/v1/account/verification`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': project,
      },
      body: JSON.stringify({ userId: payload.userId, secret: payload.secret }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return NextResponse.json({ error: data?.message || 'Failed to verify email' }, { status: response.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to verify email' }, { status: 400 })
  }
}
