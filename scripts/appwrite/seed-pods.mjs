import "dotenv/config"
import { Client, Databases, ID, Permission, Role } from "node-appwrite"
import { databaseId } from "./pod-schema.mjs"

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed Pod 2.0 data in production.")
}

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const key = process.env.APPWRITE_API_KEY
const creatorId = process.env.APPWRITE_SEED_USER_ID || "dev-seed-user"

if (!project || !key) {
  throw new Error("APPWRITE_PROJECT_ID/NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required.")
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)
const databases = new Databases(client)
const now = new Date().toISOString()
const readWrite = [Permission.read(Role.users()), Permission.update(Role.user(creatorId)), Permission.delete(Role.user(creatorId))]

const pod = await databases.createDocument(databaseId, "pods", ID.unique(), {
  name: "Full Stack Sprint",
  slug: `full-stack-sprint-${Date.now()}`,
  shortOutcome: "Ship a small production-ready full stack app in 30 days.",
  description: "A focused cohort for building, reviewing, and shipping one real project.",
  category: "Programming",
  difficulty: "intermediate",
  language: "English",
  creatorId,
  type: "cohort_30_day",
  visibility: "public",
  approvalRequired: false,
  maxMembers: 40,
  status: "active",
  currentWeek: 1,
  totalWeeks: 4,
  weeklyRhythm: "Monday planning, Wednesday build room, Saturday demos.",
  timezone: "Asia/Calcutta",
  tags: ["full-stack", "react", "appwrite"],
  memberCount: 1,
  activeMemberCount: 1,
  completionRate: 0,
  weeklyActivityScore: 72,
  healthScore: 80,
  nextSessionAt: new Date(Date.now() + 86400000).toISOString(),
  createdAt: now,
  updatedAt: now,
}, readWrite)

await databases.createDocument(databaseId, "pod_memberships", ID.unique(), {
  podId: pod.$id,
  userId: creatorId,
  role: "owner",
  status: "active",
  joinedAt: now,
  lastActiveAt: now,
  progressPercent: 0,
  currentStreak: 1,
  totalPoints: 0,
  tasksCompleted: 0,
  sessionsAttended: 0,
  resourcesShared: 0,
  peerReviewsCompleted: 0,
  checkInsCount: 0,
  contributionScore: 0,
  skills: ["React", "Appwrite"],
  availability: "weekday-evening",
  notificationPreference: "all",
  createdAt: now,
  updatedAt: now,
}, readWrite)

const channels = ["general", "doubts", "resources", "wins", "announcements", "session-chat", "submissions"]
await Promise.all(channels.map((slug, index) => databases.createDocument(databaseId, "pod_chat_channels", ID.unique(), {
  podId: pod.$id,
  name: slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
  slug,
  description: `${slug} channel`,
  type: slug.replace("-", "_"),
  order: index + 1,
  locked: slug === "announcements",
  postingRole: slug === "announcements" ? "moderators" : "everyone",
  createdBy: creatorId,
  createdAt: now,
  updatedAt: now,
}, readWrite)))

await databases.createDocument(databaseId, "pod_tasks", ID.unique(), {
  podId: pod.$id,
  title: "Define your project scope",
  description: "Write the problem, user, success criteria, and one-week build target.",
  type: "write",
  priority: "high",
  status: "today",
  assignedTo: [creatorId],
  createdBy: creatorId,
  points: 20,
  difficulty: "medium",
  submissionType: "text",
  relatedResourceIds: [],
  required: true,
  allowLateSubmission: true,
  order: 1,
  createdAt: now,
  updatedAt: now,
}, readWrite)

await databases.createDocument(databaseId, "pod_sessions", ID.unique(), {
  podId: pod.$id,
  title: "Sprint kickoff",
  description: "Set expectations, form review pairs, and start the first task.",
  type: "live_class",
  status: "scheduled",
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 90000000).toISOString(),
  timezone: "Asia/Calcutta",
  hostId: creatorId,
  agenda: "Introductions, roadmap, first checkpoint.",
  meetingProvider: "jitsi",
  meetingUrl: "https://meet.jit.si/peerspark-full-stack-sprint",
  reminderSent: false,
  createdAt: now,
  updatedAt: now,
}, readWrite)

console.log(`Seeded Pod 2.0 sample pod: ${pod.$id}`)
