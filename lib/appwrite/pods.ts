import { ID, Query } from "appwrite"
import { client, databases, DATABASE_ID } from "@/lib/appwrite"
import { POD_COLLECTION_IDS, type PodTaskDocument } from "./pod-types"
import { generateFallbackRoadmap } from "./pod-calculations"

function now() {
  return new Date().toISOString()
}

export async function listDiscoverPods(filters: { category?: string; difficulty?: string; search?: string } = {}) {
  const queries = [Query.equal("visibility", "public"), Query.equal("status", "active"), Query.orderDesc("weeklyActivityScore"), Query.limit(50)]
  if (filters.category) queries.push(Query.equal("category", filters.category))
  if (filters.difficulty) queries.push(Query.equal("difficulty", filters.difficulty))
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.pods, queries)
}

export async function listRoadmapItems(podId: string) {
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.roadmapItems, [
    Query.equal("podId", podId),
    Query.orderAsc("week"),
    Query.orderAsc("order"),
    Query.limit(100),
  ])
}

export async function listPodTasks(podId: string, status?: string) {
  const queries = [Query.equal("podId", podId), Query.orderAsc("order"), Query.limit(100)]
  if (status) queries.push(Query.equal("status", status))
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.tasks, queries)
}

export async function listPodSessions(podId: string) {
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.sessions, [
    Query.equal("podId", podId),
    Query.orderAsc("startsAt"),
    Query.limit(50),
  ])
}

export async function listPodResources(podId: string) {
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.resources, [
    Query.equal("podId", podId),
    Query.orderDesc("createdAt"),
    Query.limit(50),
  ])
}

export async function listPodChannels(podId: string) {
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.chatChannels, [
    Query.equal("podId", podId),
    Query.orderAsc("order"),
    Query.limit(25),
  ])
}

export async function listPodMessages(podId: string, channelId: string, limit = 50) {
  return databases.listDocuments(DATABASE_ID, POD_COLLECTION_IDS.messages, [
    Query.equal("podId", podId),
    Query.equal("channelId", channelId),
    Query.equal("deleted", false),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ])
}

export async function createPodTask(input: Omit<PodTaskDocument, "$id">) {
  return databases.createDocument(DATABASE_ID, POD_COLLECTION_IDS.tasks, ID.unique(), {
    ...input,
    status: input.status || "backlog",
    createdAt: now(),
    updatedAt: now(),
  })
}

export async function submitTask(input: { podId: string; taskId: string; userId: string; text?: string; link?: string; fileIds?: string[] }) {
  return databases.createDocument(DATABASE_ID, POD_COLLECTION_IDS.taskSubmissions, ID.unique(), {
    ...input,
    fileIds: input.fileIds || [],
    status: "submitted",
    submittedAt: now(),
    createdAt: now(),
    updatedAt: now(),
  })
}

export async function sendPodMessage(input: {
  podId: string
  channelId: string
  senderId: string
  content: string
  label?: string
  replyToMessageId?: string
}) {
  return databases.createDocument(DATABASE_ID, POD_COLLECTION_IDS.messages, ID.unique(), {
    ...input,
    type: "text",
    label: input.label || "none",
    attachmentIds: [],
    pinned: false,
    important: false,
    edited: false,
    deleted: false,
    createdAt: now(),
    updatedAt: now(),
  })
}

export async function editPodMessage(messageId: string, content: string) {
  return databases.updateDocument(DATABASE_ID, POD_COLLECTION_IDS.messages, messageId, {
    content,
    edited: true,
    editedAt: now(),
    updatedAt: now(),
  })
}

export async function deletePodMessage(messageId: string) {
  return databases.updateDocument(DATABASE_ID, POD_COLLECTION_IDS.messages, messageId, {
    deleted: true,
    deletedAt: now(),
    updatedAt: now(),
  })
}

export async function generateRoadmapFromTopic(podId: string, topic: string, createdBy: string) {
  const items = generateFallbackRoadmap(topic)
  return Promise.all(
    items.map((item, index) =>
      databases.createDocument(DATABASE_ID, POD_COLLECTION_IDS.roadmapItems, ID.unique(), {
        podId,
        ...item,
        status: "available",
        order: index + 1,
        createdBy,
        createdAt: now(),
        updatedAt: now(),
      }),
    ),
  )
}

export function subscribeToPodCollections(podId: string, collectionIds: string[], callback: (event: unknown) => void) {
  if (!podId || typeof client.subscribe !== "function") return () => {}
  const channels = collectionIds.map((collectionId) => `databases.${DATABASE_ID}.collections.${collectionId}.documents`)
  const unsubscribe = client.subscribe(channels as any, (event: any) => {
    const payload = event?.payload || {}
    if (payload.podId && payload.podId !== podId) return
    callback(event)
  })
  return typeof unsubscribe === "function" ? unsubscribe : () => {}
}
