import "dotenv/config"
import { Client, Databases, ID, Permission, Role } from "node-appwrite"

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""
const apiKey = process.env.APPWRITE_API_KEY || ""
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed pods in production.")
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
const databases = new Databases(client)
const now = new Date().toISOString()

async function main() {
  if (!project || !apiKey) throw new Error("Missing Appwrite project/api key.")
  const creatorId = process.env.SEED_USER_ID || "seed_owner"
  const pod = await databases.createDocument(databaseId, "pods", ID.unique(), {
    name: "Appwrite Mastery Cohort",
    slug: `appwrite-mastery-${Date.now()}`,
    shortOutcome: "Build a production-ready Appwrite and Next.js learning system.",
    description: "A seeded Pod 2.0 cohort for local development and QA.",
    category: "Programming",
    difficulty: "intermediate",
    language: "English",
    coverImageId: "",
    coverImageUrl: "",
    creatorId,
    mentorId: "",
    type: "cohort_30_day",
    visibility: "public",
    approvalRequired: false,
    maxMembers: 50,
    status: "active",
    currentSprintId: "",
    currentWeek: 1,
    totalWeeks: 4,
    weeklyRhythm: "Monday kickoff, daily check-ins, midweek doubt session, weekend review.",
    defaultSessionDay: "Saturday",
    defaultSessionTime: "10:00",
    timezone: "UTC",
    tags: ["appwrite", "nextjs", "full-stack"],
    members: [creatorId],
    memberCount: 1,
    activeMemberCount: 1,
    completionRate: 12,
    weeklyActivityScore: 88,
    healthScore: 91,
    nextSessionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  }, [Permission.read(Role.any()), Permission.update(Role.user(creatorId)), Permission.delete(Role.user(creatorId))])

  await databases.createDocument(databaseId, "pod_memberships", ID.unique(), {
    podId: pod.$id, userId: creatorId, role: "owner", status: "active", joinedAt: now, lastActiveAt: now,
    progressPercent: 12, currentStreak: 3, totalPoints: 75, tasksCompleted: 2, sessionsAttended: 1, resourcesShared: 1,
    peerReviewsCompleted: 0, checkInsCount: 3, contributionScore: 30, skills: ["Next.js"], availability: "Weekends", notificationPreference: "all", createdAt: now, updatedAt: now,
  })

  const general = await databases.createDocument(databaseId, "pod_chat_channels", ID.unique(), {
    podId: pod.$id, name: "General", slug: "general", description: "Daily discussion and updates.", type: "general", order: 0,
    locked: false, postingRole: "everyone", createdBy: creatorId, createdAt: now, updatedAt: now,
  })

  await databases.createDocument(databaseId, "pod_roadmap_items", ID.unique(), {
    podId: pod.$id, parentId: "", phaseId: "", title: "Week 1: Appwrite foundations", description: "Auth, database, storage, permissions, and realtime basics.",
    type: "phase", week: 1, day: 1, order: 100, status: "available", estimatedMinutes: 120, difficulty: "easy", points: 0,
    resourceIds: [], taskIds: [], sessionId: "", unlockRule: "", createdBy: creatorId, createdAt: now, updatedAt: now,
  })

  await databases.createDocument(databaseId, "pod_tasks", ID.unique(), {
    podId: pod.$id, roadmapItemId: "", title: "Create your first secure Appwrite collection", description: "Define fields, indexes, and role-safe permissions.",
    type: "build", priority: "high", status: "today", assignedTo: [], assignedRole: "member", createdBy: creatorId,
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), points: 20, difficulty: "medium", submissionType: "text",
    relatedResourceIds: [], required: true, allowLateSubmission: true, order: 1, createdAt: now, updatedAt: now,
  })

  await databases.createDocument(databaseId, "pod_sessions", ID.unique(), {
    podId: pod.$id, title: "Launch workshop", description: "Walk through the roadmap and first task.", type: "study_session", status: "scheduled",
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), endsAt: "", timezone: "UTC", hostId: creatorId,
    agenda: "Roadmap, permissions, realtime, first task.", meetingProvider: "internal", meetingUrl: "", recordingUrl: "",
    whiteboardStateId: "", notesResourceId: "", maxParticipants: 50, reminderSent: false, createdAt: now, updatedAt: now,
  })

  await databases.createDocument(databaseId, "pod_messages", ID.unique(), {
    podId: pod.$id, channelId: general.$id, senderId: "system", senderName: "PeerSpark", content: "Welcome to the seeded Pod 2.0 workspace.",
    type: "system", label: "announcement", replyToMessageId: "", threadRootId: "", attachmentIds: [], pinned: true, important: true,
    edited: false, deleted: false, createdAt: now, updatedAt: now,
  })

  console.log(`Seeded pod ${pod.$id}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
