import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { canAccessResource } from '@/lib/server/resource-access'
import { COLLECTIONS } from '@/lib/server/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
const CALENDAR_EVENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID || 'calendar_events'

function compact(value: unknown, max = 180): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function buildAuthorizedAIContext(userId: string, requested: { resources?: boolean; calendar?: boolean } = {}): Promise<string> {
  const includeResources = requested.resources !== false
  const includeCalendar = requested.calendar !== false
  const { databases } = createAdminClient()
  const sections: string[] = []
  const resourceListPromise = includeResources
    ? databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(40)]).catch(() => ({ documents: [] as any[] }))
    : Promise.resolve({ documents: [] as any[] })
  const calendarPromise = includeCalendar
    ? databases.listDocuments(DATABASE_ID, CALENDAR_EVENTS_COLLECTION_ID, [Query.equal('userId', userId), Query.orderAsc('startTime'), Query.limit(30)]).catch(() => ({ documents: [] as any[] }))
    : Promise.resolve({ documents: [] as any[] })
  const [resourceResult, events] = await Promise.all([resourceListPromise, calendarPromise])
  const [profile, memberships, focusSessions, challengeParticipants, connectionCounts] = await Promise.all([
    databases.getDocument(DATABASE_ID, COLLECTIONS.profiles, userId).catch(() => null),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.podMemberships, [Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(30)]).catch(() => ({ documents: [] as any[] })),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.focusSessions, [Query.equal('userId', userId), Query.orderDesc('startedAt'), Query.limit(100)]).catch(() => ({ documents: [] as any[] })),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.challengeParticipants, [Query.equal('userId', userId), Query.limit(30)]).catch(() => ({ documents: [] as any[] })),
    Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.follows, [Query.equal('followingId', userId), Query.limit(1)]).catch(() => ({ total: 0 })),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.follows, [Query.equal('followerId', userId), Query.limit(1)]).catch(() => ({ total: 0 })),
    ]),
  ])

  const completedFocus = focusSessions.documents.filter((session: any) => session.status === 'completed')
  const focusedMinutes = completedFocus.reduce((total: number, session: any) => total + Math.max(0, Number(session.actualMinutes || 0)), 0)
  sections.push(`Signed-in learning profile:
- Name: ${compact(profile?.name || 'Student')}
- Bio: ${compact(profile?.bio || 'not provided', 320)}
- Current focus areas: ${(Array.isArray(profile?.currentFocusAreas) ? profile.currentFocusAreas : []).slice(0, 8).map((item: unknown) => compact(item, 80)).join(', ') || 'not provided'}
- Interests: ${(Array.isArray(profile?.interests) ? profile.interests : []).slice(0, 8).map((item: unknown) => compact(item, 80)).join(', ') || 'not provided'}
- Focus record: ${focusedMinutes} completed minutes across ${completedFocus.length} sessions
- Social learning: ${connectionCounts[0].total || 0} followers, ${connectionCounts[1].total || 0} following`)

  const pods = (await Promise.all(memberships.documents.slice(0, 15).map((membership: any) => databases.getDocument(DATABASE_ID, COLLECTIONS.pods, membership.podId).catch(() => null)))).filter(Boolean)
  sections.push(`Active study Pods (${pods.length}):
${pods.map((pod: any) => `- [${pod.$id}] ${compact(pod.name)} | ${compact(pod.subject, 80) || 'general'} | ${compact(pod.description, 180)}`).join('\n') || '- No active Pods.'}`)

  const challenges = (await Promise.all(challengeParticipants.documents.slice(0, 15).map(async (participant: any) => {
    const challenge = await databases.getDocument(DATABASE_ID, COLLECTIONS.challenges, participant.challengeId).catch(() => null)
    return challenge ? { challenge, participant } : null
  }))).filter(Boolean)
  sections.push(`Joined challenges (${challenges.length}):
${challenges.map((entry: any) => `- [${entry.challenge.$id}] ${compact(entry.challenge.title)} | progress ${entry.participant.progress}/${entry.challenge.goalValue} ${compact(entry.challenge.metric, 40)} | ${compact(entry.participant.status, 40)}`).join('\n') || '- No joined challenges.'}`)

  if (includeResources) {
    const checks = await Promise.all(resourceResult.documents.map((resource: any) => canAccessResource(databases, userId, resource).catch(() => false)))
    const resources = resourceResult.documents.filter((_: any, index: number) => checks[index]).slice(0, 20)
    sections.push(`Authorized Resource Vault index (${resources.length} visible):\n${resources.map((resource: any) => `- [${resource.$id}] ${compact(resource.title || resource.fileName)} | ${compact(resource.fileType, 80)} | tags: ${(Array.isArray(resource.tags) ? resource.tags : []).slice(0, 6).join(', ') || 'none'} | ${compact(resource.description, 220) || 'no description'}`).join('\n') || '- No accessible resources.'}`)
  }

  if (includeCalendar) {
    const upcoming = events.documents.filter((event: any) => !event.endTime || Date.parse(event.endTime) >= Date.now() - 24 * 60 * 60 * 1000).slice(0, 15)
    sections.push(`Authorized calendar (${upcoming.length} current/upcoming):\n${upcoming.map((event: any) => `- [${event.$id}] ${compact(event.title)} | ${compact(event.startTime, 80)} to ${compact(event.endTime, 80)} | ${compact(event.type, 50)} | ${compact(event.description, 180) || 'no description'}`).join('\n') || '- No upcoming events.'}`)
  }

  return sections.join('\n\n').slice(0, 10_000)
}
