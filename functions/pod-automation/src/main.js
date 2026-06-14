import { Client, Databases, ID, Query } from "node-appwrite"

const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "peerspark-main-db"
const now = () => new Date().toISOString()

async function safeList(databases, collection, queries = []) {
  try {
    return await databases.listDocuments(databaseId, collection, queries)
  } catch (error) {
    console.warn(`Skipping ${collection}: ${error?.message || error}`)
    return { documents: [], total: 0 }
  }
}

async function safeCreate(databases, collection, data) {
  try {
    return await databases.createDocument(databaseId, collection, ID.unique(), data)
  } catch (error) {
    console.warn(`Could not create ${collection}: ${error?.message || error}`)
    return null
  }
}

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  const databases = new Databases(client)
  const pods = await safeList(databases, "pods", [Query.equal("status", "active"), Query.limit(200)])
  let notifications = 0
  let insights = 0

  for (const pod of pods.documents) {
    const memberships = await safeList(databases, "pod_memberships", [Query.equal("podId", pod.$id), Query.equal("status", "active"), Query.limit(200)])
    const checkins = await safeList(databases, "pod_checkins", [Query.equal("podId", pod.$id), Query.limit(500)])
    const activeMembers = memberships.documents.length
    const inactiveMembers = memberships.documents.filter((member) => {
      const lastActive = member.lastActiveAt ? new Date(member.lastActiveAt).getTime() : 0
      return Date.now() - lastActive > 7 * 24 * 60 * 60 * 1000
    }).length
    const completionRate = activeMembers
      ? Math.round(memberships.documents.reduce((sum, member) => sum + Number(member.progressPercent || 0), 0) / activeMembers)
      : 0
    const healthScore = Math.max(0, Math.min(100, Math.round((100 - inactiveMembers * 12) + Math.min(checkins.documents.length, activeMembers * 5))))

    await databases.updateDocument(databaseId, "pods", pod.$id, { completionRate, healthScore, activeMemberCount: activeMembers, updatedAt: now() }).catch(() => null)
    const insight = await safeCreate(databases, "pod_insights", {
      podId: pod.$id,
      scope: "pod",
      userId: "",
      period: "weekly",
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: now(),
      progressPercent: completionRate,
      consistencyScore: checkins.documents.length ? Math.min(100, Math.round((checkins.documents.length / Math.max(activeMembers * 5, 1)) * 100)) : 0,
      attendanceRate: 0,
      taskCompletionRate: 0,
      activeMembers,
      inactiveMembers,
      dropOffRisk: activeMembers ? Math.round((inactiveMembers / activeMembers) * 100) : 0,
      mostAskedTopics: ["tasks", "sessions", "resources"],
      suggestedActions: inactiveMembers ? ["Send inactive member nudges.", "Schedule a revision session."] : ["Publish the next milestone."],
      generatedAt: now(),
    })
    if (insight) insights += 1

    for (const member of memberships.documents) {
      await safeCreate(databases, "pod_notifications_queue", {
        podId: pod.$id,
        userId: member.userId,
        type: "checkin_reminder",
        title: `Check in for ${pod.name}`,
        body: "Post today’s plan, blockers, and progress.",
        targetUrl: `/app/pods/${pod.$id}/overview`,
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: "pending",
        sentAt: "",
        metadata: JSON.stringify({ source: "appwrite-function" }),
        createdAt: now(),
      })
      notifications += 1
    }
  }

  const result = { pods: pods.documents.length, insights, notifications }
  log(JSON.stringify(result))
  return res.json(result)
}
