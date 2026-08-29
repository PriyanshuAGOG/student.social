import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { canAccessResource } from '@/lib/server/resource-access'

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
