import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { Client, Account } from 'node-appwrite'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    if (!endpoint || !project) return NextResponse.json({ error: 'Server config missing.' }, { status: 500 })

    const client = new Client().setEndpoint(endpoint).setProject(project)
    const account = new Account(client)
    const session = await account.createEmailPasswordSession(payload.email, payload.password)
    return NextResponse.json({ success: true, sessionId: session.$id }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 400 })
  }
}
