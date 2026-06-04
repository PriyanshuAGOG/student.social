import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  process.env.APPWRITE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_DATABASE_ID ||
  'peerspark-main-db'
const CALLS_COLLECTION = process.env.NEXT_PUBLIC_CALLS_COLLECTION_ID || 'calls'
const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

function isMissingOrSchemaError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === 401 ||
    error?.code === 403 ||
    error?.code === 404 ||
    message.includes('not found') ||
    message.includes('could not be found') ||
    message.includes('collection') ||
    message.includes('attribute') ||
    message.includes('index')
  )
}

function normalizeCall(call: any) {
  return {
    ...call,
    id: call?.$id || call?.id,
  }
}

export async function GET(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'calls:active', max: 60, windowMs: 60000 })

    const auth = requireUser(req)
    const userId = auth.userId
    const { databases } = await createAdminClient()

    let activeCalls: any[] = []
    try {
      const [ringing, acceptedAsReceiver, acceptedAsCaller] = await Promise.all([
        databases.listDocuments(DATABASE_ID, CALLS_COLLECTION, [
          Query.equal('receiverId', userId),
          Query.equal('status', 'ringing'),
          Query.limit(25),
        ]),
        databases.listDocuments(DATABASE_ID, CALLS_COLLECTION, [
          Query.equal('receiverId', userId),
          Query.equal('status', 'accepted'),
          Query.limit(25),
        ]),
        databases.listDocuments(DATABASE_ID, CALLS_COLLECTION, [
          Query.equal('callerId', userId),
          Query.equal('status', 'accepted'),
          Query.limit(25),
        ]),
      ])

      const byId = new Map<string, any>()
      for (const doc of [
        ...(ringing.documents || []),
        ...(acceptedAsReceiver.documents || []),
        ...(acceptedAsCaller.documents || []),
      ]) {
        byId.set(doc.$id || doc.id, normalizeCall(doc))
      }
      activeCalls = Array.from(byId.values())
    } catch (callsError: any) {
      if (!isMissingOrSchemaError(callsError)) throw callsError
      console.warn('[Calls Active API] Calls collection unavailable; returning no active calls:', callsError?.message || callsError)
      activeCalls = []
    }

    const enrichedCalls = await Promise.all(
      activeCalls.map(async (call: any) => {
        try {
          const callerProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, call.callerId)
          return {
            ...call,
            caller: {
              id: callerProfile['$id'],
              name: callerProfile.name || callerProfile.username || 'User',
              avatar: callerProfile.profilePictureUrl || callerProfile.avatar || null,
            },
          }
        } catch {
          return {
            ...call,
            caller: {
              id: call.callerId,
              name: 'User',
              avatar: null,
            },
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      calls: enrichedCalls,
      count: enrichedCalls.length,
    })
  } catch (error: any) {
    console.error('[Calls Active API] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch active calls' },
      { status: 500 },
    )
  }
}
