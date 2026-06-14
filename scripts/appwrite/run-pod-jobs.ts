import "dotenv/config"
import { Client, Databases, ID, Query } from "node-appwrite"

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""
const apiKey = process.env.APPWRITE_API_KEY || ""
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
const databases = new Databases(client)
const now = () => new Date().toISOString()

async function safeList(collection: string, queries: string[] = []) {
  try {
    return await databases.listDocuments(databaseId, collection, queries)
  } catch (error: any) {
    console.warn(`Skipping ${collection}: ${error?.message || error}`)
    return { documents: [], total: 0 } as any
  }
}

async function safeCreate(collection: string, data: Record<string, unknown>) {
  try {
    return await databases.createDocument(databaseId, collection, ID.unique(), data)
  } catch (error: any) {
    console.warn(`Could not create ${collection}: ${error?.message || error}`)
    return null
  }
}

async function run() {
  if (!project || !apiKey) throw new Error("Missing Appwrite project/api key.")
  const pods = await safeList("pods", [Query.equal("status", "active"), Query.limit(200)])
  let notifications = 0
  let insights = 0

  for (const pod of pods.documents) {
    const [memberships, checkins, tasks, submissions, sessions] = await Promise.all([
      safeList("pod_memberships", [Query.equal("podId", pod.$id), Query.equal("status", "active"), Query.limit(200)]),
      safeList("pod_checkins", [Query.equal("podId", pod.$id), Query.limit(500)]),
      safeList("pod_tasks", [Query.equal("podId", pod.$id), Query.limit(500)]),
      safeList("pod_task_submissions", [Query.equal("podId", pod.$id), Query.limit(500)]),
      safeList("pod_sessions", [Query.equal("podId", pod.$id), Query.limit(200)]),
    ])

    const activeMembers = memberships.documents.length
    const inactiveMembers = memberships.documents.filter((member: any) => {
      const lastActive = member.lastActiveAt ? new Date(member.lastActiveAt).getTime() : 0
      return Date.now() - lastActive > 7 * 24 * 60 * 60 * 1000
    }).length
    const completionRate = activeMembers
      ? Math.round(memberships.documents.reduce((sum: number, member: any) => sum + Number(member.progressPercent || 0), 0) / activeMembers)
      : 0
    const taskCompletionRate = tasks.documents.length && activeMembers
      ? Math.round((submissions.documents.length / Math.max(tasks.documents.length * activeMembers, 1)) * 100)
      : 0
    const healthScore = Math.max(0, Math.min(100, Math.round((100 - inactiveMembers * 12) + Math.min(checkins.documents.length, activeMembers * 5))))

    await databases.updateDocument(databaseId, "pods", pod.$id, {
      completionRate,
      healthScore,
      activeMemberCount: activeMembers,
      updatedAt: now(),
    }).catch(() => null)

    const insight = await safeCreate("pod_insights", {
      podId: pod.$id,
      scope: "pod",
      userId: "",
      period: "weekly",
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: now(),
      progressPercent: completionRate,
      consistencyScore: checkins.documents.length ? Math.min(100, Math.round((checkins.documents.length / Math.max(activeMembers * 5, 1)) * 100)) : 0,
      attendanceRate: sessions.documents.length ? 100 : 0,
      taskCompletionRate,
      activeMembers,
      inactiveMembers,
      dropOffRisk: activeMembers ? Math.round((inactiveMembers / activeMembers) * 100) : 0,
      mostAskedTopics: ["tasks", "sessions", "resources"],
      suggestedActions: inactiveMembers ? ["Send inactive member nudges.", "Schedule a revision session."] : ["Publish the next milestone."],
      generatedAt: now(),
    })
    if (insight) insights += 1

    for (const member of memberships.documents) {
      await safeCreate("pod_notifications_queue", {
        podId: pod.$id,
        userId: member.userId,
        type: "checkin_reminder",
        title: `Check in for ${pod.name}`,
        body: "Post today’s plan, blockers, and progress.",
        targetUrl: `/app/pods/${pod.$id}/overview`,
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: "pending",
        sentAt: "",
        metadata: JSON.stringify({ source: "run-pod-jobs" }),
        createdAt: now(),
      })
      notifications += 1
    }
  }

  const expired = await safeList("pod_invites", [Query.equal("status", "pending"), Query.lessThan("expiresAt", now()), Query.limit(200)])
  for (const invite of expired.documents) {
    await databases.updateDocument(databaseId, "pod_invites", invite.$id, { status: "expired", updatedAt: now() }).catch(() => null)
  }

  console.log(JSON.stringify({ pods: pods.documents.length, insights, notifications, expiredInvites: expired.documents.length }, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
