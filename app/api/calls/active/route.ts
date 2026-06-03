import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CALLS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALLS_COLLECTION_ID || 'calls'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

export async function GET(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { max: 30, windowMs: 60000 })

    // Authenticate user
    const auth = requireUser(req)
    if (!auth?.userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const userId = auth.userId
    const { databases } = createAdminClient()

    // Get active or ringing calls involving this user as receiver
    const incomingCalls = await databases.listDocuments(
      DATABASE_ID,
      CALLS_COLLECTION_ID,
      [
        Query.equal('receiverId', userId),
        Query.or([
          Query.equal('status', 'ringing'),
          Query.equal('status', 'accepted'),
        ]),
      ]
    )

    // Enrich with caller profile info
    const enrichedCalls = await Promise.all(
      incomingCalls.documents.map(async (call: any) => {
        try {
          const callerProfile = await databases.getDocument(
            DATABASE_ID,
            PROFILES_COLLECTION_ID,
            call.callerId
          )
          return {
            ...call,
            caller: {
              id: callerProfile['$id'],
              name: callerProfile.name || 'User',
              avatar: callerProfile.profilePictureUrl || null,
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
      })
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
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch active calls' },
      { status: 500 }
    )
  }
}
