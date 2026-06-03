import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { databases, DATABASE_ID } from '@/lib/appwrite'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const CALLS_COLLECTION = 'calls'

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

    // Get active or ringing calls involving this user as receiver
    const incomingCalls = await databases.listDocuments(
      DATABASE_ID,
      CALLS_COLLECTION,
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
            'profiles',
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
