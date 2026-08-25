import "dotenv/config"
import { Client, Databases, Permission, Query, Role, Storage } from "node-appwrite"

const POD_COLLECTIONS = {
  pods: "pods",
  memberships: "pod_memberships",
  roadmapItems: "pod_roadmap_items",
  tasks: "pod_tasks",
  taskSubmissions: "pod_task_submissions",
  sessions: "pod_sessions",
  sessionAttendance: "pod_session_attendance",
  resources: "pod_resources",
  checkins: "pod_checkins",
  channels: "pod_chat_channels",
  messages: "pod_messages",
  reactions: "pod_message_reactions",
  insights: "pod_insights",
  invites: "pod_invites",
  notificationsQueue: "pod_notifications_queue",
} as const

const POD_BUCKETS = {
  covers: "pod-covers",
  resources: "pod-resources",
  chatAttachments: "pod-chat-attachments",
  sessionRecordings: "pod-session-recordings",
} as const

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""
const apiKey = process.env.APPWRITE_API_KEY || ""
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"

if (!project || !apiKey) throw new Error("Missing Appwrite project or API key.")

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
const databases = new Databases(client)
const storage = new Storage(client)

const collectionIds = Object.values(POD_COLLECTIONS)

async function listAll(collectionId: string, queries: string[] = []) {
  const documents: any[] = []
  let cursor: string | undefined
  do {
    const page = await databases.listDocuments(databaseId, collectionId, [
      ...queries,
      Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ])
    documents.push(...page.documents)
    cursor = page.documents.length === 100 ? page.documents[page.documents.length - 1].$id : undefined
  } while (cursor)
  return documents
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map(String).filter(Boolean)))
}

function readUsers(userIds: string[]) {
  return userIds.map((userId) => Permission.read(Role.user(userId)))
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "pod"
}

async function main() {
  const [pods, memberships] = await Promise.all([
    listAll(POD_COLLECTIONS.pods),
    listAll(POD_COLLECTIONS.memberships),
  ])

  const membershipsByPod = new Map<string, any[]>()
  for (const membership of memberships) {
    const existing = membershipsByPod.get(membership.podId) || []
    existing.push(membership)
    membershipsByPod.set(membership.podId, existing)
  }

  const accessByPod = new Map<string, { creatorId: string; members: string[]; moderators: string[]; visibility: string }>()
  for (const pod of pods) {
    const podMemberships = membershipsByPod.get(pod.$id) || []
    const members = unique([
      pod.creatorId,
      ...(Array.isArray(pod.members) ? pod.members : []),
      ...podMemberships.filter((membership) => ["active", "muted"].includes(membership.status)).map((membership) => membership.userId),
    ])
    const moderators = unique([
      pod.creatorId,
      ...podMemberships.filter((membership) => ["owner", "mentor", "moderator"].includes(membership.role)).map((membership) => membership.userId),
    ])
    const visibility = pod.visibility || (pod.isPublic === false ? "private" : "public")
    accessByPod.set(pod.$id, { creatorId: String(pod.creatorId || ""), members, moderators, visibility })

    const permissions = [
      ...(visibility === "public" ? [Permission.read(Role.any())] : readUsers(members)),
      ...(pod.creatorId ? [Permission.update(Role.user(pod.creatorId)), Permission.delete(Role.user(pod.creatorId))] : []),
    ]
    const compatibilityBackfill: Record<string, string> = {}
    if (!pod.slug) compatibilityBackfill.slug = `${slugify(String(pod.name || "pod"))}-${String(pod.$id).slice(-8)}`
    if (!pod.shortOutcome) {
      compatibilityBackfill.shortOutcome = String(pod.description || `Learn and make progress together in ${pod.name || "this pod"}.`).slice(0, 240)
    }
    await databases.updateDocument(databaseId, POD_COLLECTIONS.pods, pod.$id, compatibilityBackfill, permissions)
  }

  for (const collectionId of collectionIds.filter((id) => id !== POD_COLLECTIONS.pods)) {
    const documents = collectionId === POD_COLLECTIONS.memberships ? memberships : await listAll(collectionId)
    for (const document of documents) {
      const access = accessByPod.get(String(document.podId || ""))
      if (!access) throw new Error(`Cannot determine pod access for ${collectionId}.${document.$id}`)

      let readers = access.members
      if (collectionId === POD_COLLECTIONS.notificationsQueue) {
        readers = unique([document.userId])
      } else if (collectionId === POD_COLLECTIONS.invites) {
        readers = unique([access.creatorId, document.invitedBy, document.invitedUserId])
      } else if (collectionId === POD_COLLECTIONS.taskSubmissions) {
        readers = unique([...access.moderators, document.userId])
      }
      await databases.updateDocument(databaseId, collectionId, document.$id, {}, readUsers(readers))
    }
  }

  for (const collectionId of collectionIds) {
    const collection = await databases.getCollection(databaseId, collectionId)
    await databases.updateCollection(databaseId, collectionId, collection.name, [], true, true)
  }

  for (const bucketId of Object.values(POD_BUCKETS)) {
    const [bucket, files] = await Promise.all([
      storage.getBucket(bucketId),
      storage.listFiles(bucketId, [Query.limit(1)]),
    ])
    if (!bucket.fileSecurity && files.total > 0) {
      throw new Error(`Refusing to enable file security on non-empty bucket ${bucketId} without a file-permission migration`)
    }
    await storage.updateBucket(
      bucket.$id,
      bucket.name,
      [],
      true,
      bucket.enabled,
      bucket.maximumFileSize,
      bucket.allowedFileExtensions,
      bucket.compression as any,
      bucket.encryption,
      bucket.antivirus,
      bucket.transformations,
    )
  }

  console.log(`Pods permission hardening passed: ${pods.length} pods, ${memberships.length} memberships, ${collectionIds.length} collections, ${Object.values(POD_BUCKETS).length} buckets.`)
}

main().catch((error) => {
  console.error(`Pods permission hardening failed: ${error.message || error}`)
  process.exit(1)
})
