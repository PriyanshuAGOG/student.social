import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Client, Users, ID } from 'node-appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!endpoint || !project || !apiKey) {
      return NextResponse.json({ error: 'Server configuration missing for Appwrite registration.' }, { status: 500 })
    }

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)
    const user = await users.create(ID.unique(), payload.email, undefined, payload.password, payload.name)

    return NextResponse.json({ success: true, userId: user.$id, email: user.email, name: user.name }, { status: 201 })
  } catch (error: any) {
    const code = Number(error?.code) || Number(error?.response?.statusCode) || 400
    return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: code >= 400 && code < 600 ? code : 400 })
  }
}
