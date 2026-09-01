import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from '@/lib/api-security'
import { COLLECTIONS, createAdminClient, getDatabaseId } from '@/lib/server/appwrite'

const startSchema = z.object({
  title: z.string().trim().min(2).max(120),
  plannedMinutes: z.number().int().min(5).max(180),
  podId: z.string().trim().max(255).optional().default(''),
})

const finishSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
  action: z.enum(['complete', 'cancel']),
})

function failure(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
  console.error('[focus] Request failed', error)
  return NextResponse.json({ success: false, error: 'Could not update the focus session' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireVerifiedUser(request)
    const { databases } = createAdminClient()
    const result = await databases.listDocuments(getDatabaseId(), COLLECTIONS.focusSessions, [
      Query.equal('userId', userId), Query.orderDesc('startedAt'), Query.limit(50),
    ])
    return NextResponse.json({ success: true, sessions: result.documents, total: result.total })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'focus:start', max: 12, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, startSchema)
    const { databases } = createAdminClient()
    const active = await databases.listDocuments(getDatabaseId(), COLLECTIONS.focusSessions, [
      Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(1),
    ])
    if (active.documents[0]) return NextResponse.json({ success: true, session: active.documents[0], resumed: true })
    const now = new Date().toISOString()
    const session = await databases.createDocument(getDatabaseId(), COLLECTIONS.focusSessions, ID.unique(), {
      userId,
      title: input.title,
      plannedMinutes: input.plannedMinutes,
      actualMinutes: 0,
      status: 'active',
      podId: input.podId,
      startedAt: now,
      endedAt: '',
      createdAt: now,
      updatedAt: now,
    })
    return NextResponse.json({ success: true, session }, { status: 201 })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    const { userId } = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, finishSchema)
    const { databases } = createAdminClient()
    const session = await databases.getDocument(getDatabaseId(), COLLECTIONS.focusSessions, input.sessionId)
    if (session.userId !== userId) throw new ApiError(403, 'FORBIDDEN', 'This focus session belongs to another user')
    if (session.status !== 'active') return NextResponse.json({ success: true, session })

    const endedAt = new Date()
    const elapsedMinutes = Math.max(0, Math.floor((endedAt.getTime() - new Date(session.startedAt).getTime()) / 60_000))
    const actualMinutes = input.action === 'complete' ? Math.min(Number(session.plannedMinutes || 180), elapsedMinutes) : elapsedMinutes
    const updated = await databases.updateDocument(getDatabaseId(), COLLECTIONS.focusSessions, session.$id, {
      status: input.action === 'complete' ? 'completed' : 'cancelled',
      actualMinutes,
      endedAt: endedAt.toISOString(),
      updatedAt: endedAt.toISOString(),
    })
    if (input.action === 'complete' && actualMinutes > 0) {
      const participations = await databases.listDocuments(getDatabaseId(), COLLECTIONS.challengeParticipants, [
        Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(100),
      ]).catch(() => ({ documents: [] as any[] }))
      await Promise.allSettled(participations.documents.map(async (participant: any) => {
        const challenge = await databases.getDocument(getDatabaseId(), COLLECTIONS.challenges, participant.challengeId)
        if (challenge.status !== 'active' || new Date(challenge.endsAt).getTime() <= endedAt.getTime()) return
        const increment = challenge.metric === 'focus_sessions' ? 1 : challenge.metric === 'focus_minutes' ? actualMinutes : 0
        if (!increment) return
        const progress = Math.min(Number(challenge.goalValue || 0), Number(participant.progress || 0) + increment)
        const complete = progress >= Number(challenge.goalValue || 0)
        await databases.updateDocument(getDatabaseId(), COLLECTIONS.challengeParticipants, participant.$id, {
          progress,
          status: complete ? 'completed' : 'active',
          points: complete ? Number(challenge.points || 0) : 0,
          completedAt: complete ? endedAt.toISOString() : '',
          updatedAt: endedAt.toISOString(),
        })
      }))
    }
    return NextResponse.json({ success: true, session: updated })
  } catch (error) {
    return failure(error)
  }
}
