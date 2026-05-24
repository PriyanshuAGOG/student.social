import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { Client, Account } from 'node-appwrite'

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

    const client = new Client().setEndpoint(endpoint).setProject(project)
    const account = new Account(client)
    await account.updateVerification(payload.userId, payload.secret)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to verify email' }, { status: 400 })
  }
}