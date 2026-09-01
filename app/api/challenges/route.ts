import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from '@/lib/api-security'
import { COLLECTIONS, createAdminClient, getDatabaseId } from '@/lib/server/appwrite'

const createSchema = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().max(500).optional().default(''),
  metric: z.enum(['focus_minutes', 'focus_sessions']),
  goalValue: z.number().int().min(1).max(20_000),
  durationDays: z.number().int().min(1).max(90),
  scope: z.enum(['community', 'pod']).default('community'),
  podId: z.string().trim().max(255).optional().default(''),
})

const joinSchema = z.object({ challengeId: z.string().trim().min(1).max(255), action: z.enum(['join', 'leave']) })

function failure(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
  console.error('[challenges] Request failed', error)
  return NextResponse.json({ success: false, error: 'Could not update challenges' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireVerifiedUser(request)
    const { databases } = createAdminClient()
    const challenges = await databases.listDocuments(getDatabaseId(), COLLECTIONS.challenges, [Query.equal('status', 'active'), Query.orderDesc('createdAt'), Query.limit(50)])
    const memberships = await databases.listDocuments(getDatabaseId(), COLLECTIONS.podMemberships, [Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(100)]).catch(() => ({ documents: [] as any[] }))
    const podIds = new Set(memberships.documents.map((membership: any) => membership.podId))
    const visibleChallenges = challenges.documents.filter((challenge: any) => challenge.scope === 'community' || podIds.has(challenge.podId))
    const entries = await Promise.all(visibleChallenges.map(async (challenge: any) => {
      const participants = await databases.listDocuments(getDatabaseId(), COLLECTIONS.challengeParticipants, [Query.equal('challengeId', challenge.$id), Query.limit(100)])
      const rankedParticipants = [...participants.documents].sort((left: any, right: any) => Number(right.progress || 0) - Number(left.progress || 0) || new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime())
      const current = rankedParticipants.find((item: any) => item.userId === userId) || null
      const leaders = await Promise.all(rankedParticipants.slice(0, 5).map(async (item: any) => {
        const profile = await databases.getDocument(getDatabaseId(), COLLECTIONS.profiles, item.userId).catch(() => null)
        return { ...item, name: profile?.name || 'Student', username: profile?.username || item.userId, avatar: profile?.avatar || '' }
      }))
      return { ...challenge, participantCount: participants.total, currentParticipant: current, leaders }
    }))
    return NextResponse.json({ success: true, challenges: entries })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'challenges:create', max: 8, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, createSchema)
    if (input.scope === 'pod' && !input.podId) throw new ApiError(400, 'INVALID_INPUT', 'Choose a Pod for this challenge')
    const { databases } = createAdminClient()
    if (input.scope === 'pod') {
      const podId = input.podId || ''
      const membership = await databases.listDocuments(getDatabaseId(), COLLECTIONS.podMemberships, [Query.equal('podId', podId), Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(1)])
      if (!membership.documents[0]) throw new ApiError(403, 'FORBIDDEN', 'Join this Pod before creating its challenge')
    }
    const now = new Date()
    const endsAt = new Date(now.getTime() + input.durationDays * 86_400_000)
    const challenge = await databases.createDocument(getDatabaseId(), COLLECTIONS.challenges, ID.unique(), {
      ...input,
      creatorId: userId,
      points: Math.min(500, Math.max(25, Math.round(input.goalValue / (input.metric === 'focus_minutes' ? 10 : 1)))),
      visibility: input.scope === 'community' ? 'public' : 'pod',
      status: 'active',
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    const participant = await databases.createDocument(getDatabaseId(), COLLECTIONS.challengeParticipants, ID.unique(), {
      challengeId: challenge.$id, userId, progress: 0, status: 'active', points: 0,
      joinedAt: now.toISOString(), completedAt: '', updatedAt: now.toISOString(),
    })
    return NextResponse.json({ success: true, challenge: { ...challenge, participantCount: 1, currentParticipant: participant, leaders: [] } }, { status: 201 })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    const { userId } = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, joinSchema)
    const { databases } = createAdminClient()
    const challenge = await databases.getDocument(getDatabaseId(), COLLECTIONS.challenges, input.challengeId)
    if (challenge.status !== 'active' || new Date(challenge.endsAt).getTime() <= Date.now()) throw new ApiError(409, 'CHALLENGE_CLOSED', 'This challenge has ended')
    const existing = await databases.listDocuments(getDatabaseId(), COLLECTIONS.challengeParticipants, [Query.equal('challengeId', input.challengeId), Query.equal('userId', userId), Query.limit(1)])
    if (input.action === 'leave') {
      if (existing.documents[0]) await databases.deleteDocument(getDatabaseId(), COLLECTIONS.challengeParticipants, existing.documents[0].$id)
      return NextResponse.json({ success: true, joined: false })
    }
    if (existing.documents[0]) return NextResponse.json({ success: true, joined: true, participant: existing.documents[0] })
    const now = new Date().toISOString()
    const participant = await databases.createDocument(getDatabaseId(), COLLECTIONS.challengeParticipants, ID.unique(), {
      challengeId: input.challengeId, userId, progress: 0, status: 'active', points: 0, joinedAt: now, completedAt: '', updatedAt: now,
    })
    return NextResponse.json({ success: true, joined: true, participant })
  } catch (error) {
    return failure(error)
  }
}
