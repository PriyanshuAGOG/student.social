import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Client, Users, ID } from 'node-appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(120).optional(),
})

function safeErrorPayload(error: unknown) {
  const e = error as any
  const code = Number(e?.code ?? e?.response?.statusCode)
  const status = code >= 400 && code < 600 ? code : 500

  const details = {
    type: e?.type || e?.response?.type || 'UNKNOWN_ERROR',
    code: e?.code || e?.response?.code || null,
    responseCode: e?.responseCode || e?.response?.statusCode || null,
  }

  return {
    status,
    body: {
      error: e?.message || 'Registration failed',
      details,
    },
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null)
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid registration payload',
          details: parsed.error.flatten(),
        },
        { status: 422 }
      )
    }

    const endpoint = normalizeAppwriteEndpoint(
      process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    )
    const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!endpoint || !project || !apiKey) {
      return NextResponse.json(
        {
          error: 'Server configuration missing for Appwrite registration',
          details: {
            hasEndpoint: Boolean(endpoint),
            hasProject: Boolean(project),
            hasApiKey: Boolean(apiKey),
          },
        },
        { status: 500 }
      )
    }

    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)

    const email = parsed.data.email.trim().toLowerCase()
    const fallbackName = email.split('@')[0] || 'Peerspark User'
    const safeName = parsed.data.name?.trim() || fallbackName

    const user = await users.create(ID.unique(), email, undefined, parsed.data.password, safeName)

    return NextResponse.json(
      {
        success: true,
        userId: user.$id,
        email: user.email,
        name: user.name,
      },
      { status: 201 }
    )
  } catch (error) {
    const { status, body } = safeErrorPayload(error)
    return NextResponse.json(body, { status })
  }
}
