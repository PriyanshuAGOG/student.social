import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { Client, Users, ID } from 'node-appwrite'

const schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const payload = schema.parse(await req.json())
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const envCheck = requireAuthEnv(['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT_ID'])
    if (!envCheck.ok || !endpoint || !project) {
      return authErrorResponse({ status: 500, code: 'AUTH_ENV_MISSING', message: 'Authentication server is misconfigured.', details: { missing: envCheck.ok ? [] : envCheck.missing } })
    }

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)
    const user = await users.create(ID.unique(), payload.email, undefined, payload.password, payload.name)

    return NextResponse.json({ success: true, userId: user.$id, email: user.email, name: user.name }, { status: 201 })
  } catch (error: any) {
    return authErrorResponse({ status: 400, code: 'REGISTER_REQUEST_INVALID', message: error?.message || 'Registration failed' })
  }
}
