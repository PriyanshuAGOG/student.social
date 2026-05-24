import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { ID } from 'node-appwrite'
import { authErrorResponse, mapAppwriteAuthError, parseJsonSafe, requireAuthEnv } from '@/lib/auth-route-utils'

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

    const base = endpoint.replace(/\/v1\/?$/i, '')
    const appwriteResp = await fetch(`${base}/v1/account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': project,
      },
      body: JSON.stringify({ userId: ID.unique(), email: payload.email.toLowerCase(), password: payload.password, name: payload.name }),
    })
    const user = await parseJsonSafe(appwriteResp)
    if (!appwriteResp.ok) {
      const mapped = mapAppwriteAuthError(appwriteResp.status, user, 'REGISTRATION_FAILED', 'Registration failed')
      return authErrorResponse({ status: appwriteResp.status || 400, code: mapped.code, message: mapped.message, details: { appwriteType: user?.type || null } })
    }

    return NextResponse.json({ success: true, userId: user.$id, email: user.email, name: user.name }, { status: 201 })
  } catch (error: any) {
    return authErrorResponse({ status: 400, code: 'REGISTER_REQUEST_INVALID', message: error?.message || 'Registration failed' })
  }
}
