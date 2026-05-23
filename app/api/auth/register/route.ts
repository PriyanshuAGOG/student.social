import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Client, Account, ID } from 'node-appwrite'
import { getAppwriteEndpoint } from '@/lib/env'

const schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = getAppwriteEndpoint()
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY
    if (!endpoint || !project || !apiKey) {
      return NextResponse.json({ error: 'Server configuration missing for Appwrite registration.' }, { status: 500 })
    }

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const account = new Account(client)
    const user = await account.create(ID.unique(), payload.email, payload.password, payload.name)

    return NextResponse.json({ success: true, userId: user.$id, email: user.email, name: user.name }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 })
  }
}
