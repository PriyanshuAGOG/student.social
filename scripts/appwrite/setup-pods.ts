import "dotenv/config"
import { Client, Databases, IndexType, Permission, Query, Role, Storage } from "node-appwrite"

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""
const apiKey = process.env.APPWRITE_API_KEY || ""
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"

if (!project || !apiKey) {
  console.error("Missing APPWRITE_PROJECT_ID/NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY.")
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
const databases = new Databases(client)
const storage = new Storage(client)
const failures: string[] = []

type Field =
  | ["string", string, number, boolean, string?, boolean?]
  | ["enum", string, string[], boolean, string?, boolean?]
  | ["integer", string, boolean, number?, number?, number?, boolean?]
  | ["float", string, boolean, number?, number?, number?, boolean?]
  | ["boolean", string, boolean, boolean?]
  | ["datetime", string, boolean]

type CollectionDef = {
  id: string
  name: string
  fields: Field[]
  indexes: Array<[string, string[], "key" | "unique" | "fulltext"]>
}

const collections: CollectionDef[] = [
  {
    id: "pods",
    name: "Pods",
    fields: [
      ["string", "name", 140, true], ["string", "slug", 120, true], ["string", "shortOutcome", 240, true], ["string", "description", 5000, false],
      ["string", "category", 80, false], ["enum", "difficulty", ["beginner", "intermediate", "advanced", "expert"], false, "beginner"],
      ["string", "language", 60, false, "English"], ["string", "coverImageId", 80, false], ["string", "coverImageUrl", 1000, false],
      ["string", "creatorId", 80, true], ["string", "mentorId", 80, false], ["enum", "type", ["sprint_7_day", "challenge_14_day", "cohort_30_day", "ongoing_community", "project_based", "exam_prep", "mentor_led"], false, "cohort_30_day"],
      ["enum", "visibility", ["public", "private", "invite_only"], false, "public"], ["boolean", "approvalRequired", false, false], ["integer", "maxMembers", false, 1, 10000, 50],
      ["enum", "status", ["draft", "active", "paused", "completed", "archived"], false, "active"], ["string", "currentSprintId", 80, false],
      ["integer", "currentWeek", false, 1, 520, 1], ["integer", "totalWeeks", false, 1, 520, 4], ["string", "weeklyRhythm", 1000, false],
      ["string", "defaultSessionDay", 40, false], ["string", "defaultSessionTime", 40, false], ["string", "timezone", 80, false],
      ["string", "tags", 60, false, undefined, true], ["string", "members", 80, false, undefined, true],
      ["integer", "memberCount", false, 0, 100000, 0], ["integer", "activeMemberCount", false, 0, 100000, 0],
      ["float", "completionRate", false, 0, 100, 0], ["float", "weeklyActivityScore", false, 0, 100, 0], ["float", "healthScore", false, 0, 100, 0],
      ["datetime", "nextSessionAt", false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false],
    ],
    indexes: [["slug_unique", ["slug"], "unique"], ["creatorId", ["creatorId"], "key"], ["category", ["category"], "key"], ["difficulty", ["difficulty"], "key"], ["visibility", ["visibility"], "key"], ["status", ["status"], "key"], ["nextSessionAt", ["nextSessionAt"], "key"], ["weeklyActivityScore", ["weeklyActivityScore"], "key"], ["createdAt", ["createdAt"], "key"]],
  },
  {
    id: "pod_memberships",
    name: "Pod Memberships",
    fields: [["string", "podId", 80, true], ["string", "userId", 80, true], ["enum", "role", ["owner", "mentor", "moderator", "member", "guest"], true], ["enum", "status", ["pending", "active", "muted", "removed", "banned", "invited"], true], ["datetime", "joinedAt", false], ["datetime", "lastActiveAt", false], ["float", "progressPercent", false, 0, 100, 0], ["integer", "currentStreak", false, 0, 10000, 0], ["integer", "totalPoints", false, 0, 1000000, 0], ["integer", "tasksCompleted", false, 0, 100000, 0], ["integer", "sessionsAttended", false, 0, 100000, 0], ["integer", "resourcesShared", false, 0, 100000, 0], ["integer", "peerReviewsCompleted", false, 0, 100000, 0], ["integer", "checkInsCount", false, 0, 100000, 0], ["float", "contributionScore", false, 0, 100, 0], ["string", "skills", 80, false, undefined, true], ["string", "availability", 1000, false], ["enum", "notificationPreference", ["all", "mentions_only", "muted"], false, "all"], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["userId", ["userId"], "key"], ["role", ["role"], "key"], ["status", ["status"], "key"], ["totalPoints", ["totalPoints"], "key"], ["currentStreak", ["currentStreak"], "key"], ["lastActiveAt", ["lastActiveAt"], "key"], ["pod_user_unique", ["podId", "userId"], "unique"]],
  },
  {
    id: "pod_roadmap_items",
    name: "Pod Roadmap Items",
    fields: [["string", "podId", 80, true], ["string", "parentId", 80, false], ["string", "phaseId", 80, false], ["string", "title", 180, true], ["string", "description", 5000, false], ["enum", "type", ["phase", "lesson", "resource", "task", "assignment", "quiz", "session", "project", "milestone", "reflection"], true], ["integer", "week", false, 0, 1000, 0], ["integer", "day", false, 0, 1000, 0], ["integer", "order", false, 0, 1000000, 0], ["enum", "status", ["locked", "available", "in_progress", "completed", "archived"], false, "available"], ["integer", "estimatedMinutes", false, 0, 100000, 0], ["enum", "difficulty", ["easy", "medium", "hard"], false, "medium"], ["integer", "points", false, 0, 100000, 0], ["string", "resourceIds", 80, false, undefined, true], ["string", "taskIds", 80, false, undefined, true], ["string", "sessionId", 80, false], ["string", "unlockRule", 1000, false], ["datetime", "dueAt", false], ["string", "createdBy", 80, false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["type", ["type"], "key"], ["week", ["week"], "key"], ["status", ["status"], "key"], ["order", ["order"], "key"], ["dueAt", ["dueAt"], "key"]],
  },
  {
    id: "pod_tasks",
    name: "Pod Tasks",
    fields: [["string", "podId", 80, true], ["string", "roadmapItemId", 80, false], ["string", "title", 180, true], ["string", "description", 5000, false], ["enum", "type", ["read", "watch", "build", "write", "submit", "peer_review", "attend_session", "reflection", "quiz", "discussion"], true], ["enum", "priority", ["low", "medium", "high", "urgent"], false, "medium"], ["enum", "status", ["backlog", "today", "this_week", "submitted", "reviewed", "completed", "archived"], false, "backlog"], ["string", "assignedTo", 80, false, undefined, true], ["string", "assignedRole", 80, false], ["string", "createdBy", 80, false], ["datetime", "dueAt", false], ["integer", "points", false, 0, 100000, 0], ["enum", "difficulty", ["easy", "medium", "hard"], false, "medium"], ["enum", "submissionType", ["none", "text", "link", "file", "github", "image", "video"], false, "none"], ["string", "relatedResourceIds", 80, false, undefined, true], ["boolean", "required", false, true], ["boolean", "allowLateSubmission", false, true], ["integer", "order", false, 0, 1000000, 0], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["roadmapItemId", ["roadmapItemId"], "key"], ["status", ["status"], "key"], ["dueAt", ["dueAt"], "key"], ["createdBy", ["createdBy"], "key"], ["priority", ["priority"], "key"]],
  },
  {
    id: "pod_task_submissions",
    name: "Pod Task Submissions",
    fields: [["string", "podId", 80, true], ["string", "taskId", 80, true], ["string", "userId", 80, true], ["enum", "status", ["draft", "submitted", "reviewed", "needs_changes", "accepted", "rejected"], true], ["string", "text", 10000, false], ["string", "link", 1000, false], ["string", "fileIds", 80, false, undefined, true], ["string", "feedback", 3000, false], ["string", "reviewedBy", 80, false], ["datetime", "reviewedAt", false], ["datetime", "submittedAt", false], ["integer", "pointsAwarded", false, 0, 100000, 0], ["boolean", "late", false, false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["taskId", ["taskId"], "key"], ["userId", ["userId"], "key"], ["status", ["status"], "key"], ["submittedAt", ["submittedAt"], "key"], ["reviewedBy", ["reviewedBy"], "key"]],
  },
  {
    id: "pod_sessions",
    name: "Pod Sessions",
    fields: [["string", "podId", 80, true], ["string", "title", 180, true], ["string", "description", 5000, false], ["enum", "type", ["study_session", "live_class", "doubt_session", "co_working", "review", "demo_day", "social"], false, "study_session"], ["enum", "status", ["scheduled", "live", "completed", "cancelled"], false, "scheduled"], ["datetime", "startsAt", true], ["datetime", "endsAt", false], ["string", "timezone", 80, false], ["string", "hostId", 80, false], ["string", "agenda", 5000, false], ["enum", "meetingProvider", ["internal", "jitsi", "livekit", "daily", "zoom_link", "google_meet_link"], false, "internal"], ["string", "meetingUrl", 1000, false], ["string", "recordingUrl", 1000, false], ["string", "whiteboardStateId", 80, false], ["string", "notesResourceId", 80, false], ["integer", "maxParticipants", false, 0, 100000, 0], ["boolean", "reminderSent", false, false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["status", ["status"], "key"], ["startsAt", ["startsAt"], "key"], ["hostId", ["hostId"], "key"]],
  },
  {
    id: "pod_session_attendance",
    name: "Pod Session Attendance",
    fields: [["string", "podId", 80, true], ["string", "sessionId", 80, true], ["string", "userId", 80, true], ["datetime", "joinedAt", false], ["datetime", "leftAt", false], ["integer", "durationMinutes", false, 0, 100000, 0], ["enum", "status", ["attended", "missed", "late", "excused"], false, "attended"], ["float", "participationScore", false, 0, 100, 0], ["string", "notes", 5000, false], ["datetime", "createdAt", false]],
    indexes: [["podId", ["podId"], "key"], ["sessionId", ["sessionId"], "key"], ["userId", ["userId"], "key"], ["status", ["status"], "key"]],
  },
  {
    id: "pod_resources",
    name: "Pod Resources",
    fields: [["string", "podId", 80, true], ["string", "uploaderId", 80, true], ["string", "title", 180, true], ["string", "description", 5000, false], ["enum", "type", ["note", "pdf", "video", "link", "image", "code", "flashcard", "template", "assignment", "recording"], true], ["string", "storageFileId", 80, false], ["string", "url", 1000, false], ["string", "content", 7000, false], ["string", "tags", 80, false, undefined, true], ["enum", "visibility", ["private", "pod", "public"], false, "pod"], ["enum", "attachedToType", ["none", "roadmap_item", "task", "session", "message"], false, "none"], ["string", "attachedToId", 80, false], ["integer", "views", false, 0, 1000000, 0], ["integer", "downloads", false, 0, 1000000, 0], ["integer", "bookmarks", false, 0, 1000000, 0], ["integer", "usefulCount", false, 0, 1000000, 0], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["uploaderId", ["uploaderId"], "key"], ["type", ["type"], "key"], ["visibility", ["visibility"], "key"], ["attachedToType", ["attachedToType"], "key"], ["attachedToId", ["attachedToId"], "key"], ["createdAt", ["createdAt"], "key"]],
  },
  {
    id: "pod_checkins",
    name: "Pod Checkins",
    fields: [["string", "podId", 80, true], ["string", "userId", 80, true], ["string", "date", 20, true], ["enum", "mood", ["focused", "okay", "stuck", "tired", "excited"], false, "focused"], ["enum", "status", ["planned", "completed", "blocked", "skipped"], false, "planned"], ["string", "todayPlan", 5000, false], ["string", "yesterdayProgress", 5000, false], ["string", "blocker", 5000, false], ["boolean", "helpNeeded", false, false], ["string", "relatedTaskIds", 80, false, undefined, true], ["integer", "streakCountAfter", false, 0, 100000, 0], ["integer", "pointsAwarded", false, 0, 100000, 0], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["userId", ["userId"], "key"], ["date", ["date"], "key"], ["status", ["status"], "key"], ["helpNeeded", ["helpNeeded"], "key"]],
  },
  {
    id: "pod_chat_channels",
    name: "Pod Chat Channels",
    fields: [["string", "podId", 80, true], ["string", "name", 80, true], ["string", "slug", 80, true], ["string", "description", 1000, false], ["enum", "type", ["general", "doubts", "resources", "wins", "announcements", "session_chat", "submissions", "custom"], true], ["integer", "order", false, 0, 10000, 0], ["boolean", "locked", false, false], ["enum", "postingRole", ["everyone", "moderators", "mentors", "owner"], false, "everyone"], ["string", "createdBy", 80, false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["slug", ["slug"], "key"], ["type", ["type"], "key"], ["order", ["order"], "key"]],
  },
  {
    id: "pod_messages",
    name: "Pod Messages",
    fields: [["string", "podId", 80, true], ["string", "channelId", 80, true], ["string", "senderId", 80, true], ["string", "senderName", 120, false], ["string", "content", 10000, false], ["enum", "type", ["text", "resource", "task", "system", "attachment", "submission", "announcement"], false, "text"], ["enum", "label", ["none", "question", "resource", "update", "blocker", "announcement", "submission"], false, "none"], ["string", "replyToMessageId", 80, false], ["string", "threadRootId", 80, false], ["string", "attachmentIds", 80, false, undefined, true], ["boolean", "pinned", false, false], ["boolean", "important", false, false], ["boolean", "edited", false, false], ["datetime", "editedAt", false], ["boolean", "deleted", false, false], ["datetime", "deletedAt", false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["channelId", ["channelId"], "key"], ["senderId", ["senderId"], "key"], ["label", ["label"], "key"], ["replyToMessageId", ["replyToMessageId"], "key"], ["threadRootId", ["threadRootId"], "key"], ["createdAt", ["createdAt"], "key"], ["pinned", ["pinned"], "key"], ["important", ["important"], "key"]],
  },
  {
    id: "pod_message_reactions",
    name: "Pod Message Reactions",
    fields: [["string", "podId", 80, true], ["string", "messageId", 80, true], ["string", "userId", 80, true], ["string", "emoji", 24, true], ["datetime", "createdAt", false]],
    indexes: [["messageId", ["messageId"], "key"], ["userId", ["userId"], "key"], ["emoji", ["emoji"], "key"], ["unique_reaction", ["messageId", "userId", "emoji"], "unique"], ["podId", ["podId"], "key"]],
  },
  {
    id: "pod_insights",
    name: "Pod Insights",
    fields: [["string", "podId", 80, true], ["enum", "scope", ["user", "pod"], true], ["string", "userId", 80, false], ["enum", "period", ["daily", "weekly", "monthly"], false, "weekly"], ["datetime", "periodStart", false], ["datetime", "periodEnd", false], ["float", "progressPercent", false, 0, 100, 0], ["float", "consistencyScore", false, 0, 100, 0], ["float", "attendanceRate", false, 0, 100, 0], ["float", "taskCompletionRate", false, 0, 100, 0], ["integer", "activeMembers", false, 0, 100000, 0], ["integer", "inactiveMembers", false, 0, 100000, 0], ["float", "dropOffRisk", false, 0, 100, 0], ["string", "mostAskedTopics", 120, false, undefined, true], ["string", "suggestedActions", 240, false, undefined, true], ["datetime", "generatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["userId", ["userId"], "key"], ["scope", ["scope"], "key"], ["period", ["period"], "key"], ["periodStart", ["periodStart"], "key"]],
  },
  {
    id: "pod_invites",
    name: "Pod Invites",
    fields: [["string", "podId", 80, true], ["string", "invitedBy", 80, false], ["string", "invitedEmail", 180, false], ["string", "invitedUserId", 80, false], ["enum", "status", ["pending", "accepted", "rejected", "expired"], false, "pending"], ["string", "inviteCode", 120, true], ["enum", "role", ["member", "mentor", "moderator", "guest"], false, "member"], ["datetime", "expiresAt", false], ["datetime", "createdAt", false], ["datetime", "updatedAt", false]],
    indexes: [["podId", ["podId"], "key"], ["invitedEmail", ["invitedEmail"], "key"], ["invitedUserId", ["invitedUserId"], "key"], ["inviteCode", ["inviteCode"], "unique"], ["status", ["status"], "key"], ["expiresAt", ["expiresAt"], "key"]],
  },
  {
    id: "pod_notifications_queue",
    name: "Pod Notifications Queue",
    fields: [["string", "podId", 80, false], ["string", "userId", 80, false], ["enum", "type", ["task_due", "session_reminder", "checkin_reminder", "inactive_nudge", "review_needed", "announcement"], true], ["string", "title", 180, true], ["string", "body", 1000, false], ["string", "targetUrl", 1000, false], ["datetime", "scheduledFor", false], ["enum", "status", ["pending", "sent", "failed", "cancelled"], false, "pending"], ["datetime", "sentAt", false], ["string", "metadata", 5000, false], ["datetime", "createdAt", false]],
    indexes: [["podId", ["podId"], "key"], ["userId", ["userId"], "key"], ["type", ["type"], "key"], ["scheduledFor", ["scheduledFor"], "key"], ["status", ["status"], "key"]],
  },
]

async function ignoreConflict<T>(label: string, run: () => Promise<T>) {
  try {
    const result = await run()
    console.log(`created ${label}`)
    return result
  } catch (error: any) {
    const message = String(error?.message || "")
    if (error?.code === 409 || message.includes("already exists")) {
      console.log(`exists  ${label}`)
      return null
    }
    console.error(`failed  ${label}: ${message}`)
    failures.push(`${label}: ${message}`)
    return null
  }
}

async function waitForFields(collection: CollectionDef) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await databases.listAttributes(databaseId, collection.id, [Query.limit(100)])
    const byKey = new Map(response.attributes.map((attribute: any) => [attribute.key, attribute]))
    const ready = collection.fields.every((field) => byKey.get(field[1])?.status === "available")
    if (ready) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${collection.id} attributes`)
}

async function createField(collectionId: string, field: Field) {
  const [type, key] = field
  if (type === "string") return databases.createStringAttribute(databaseId, collectionId, key, field[2], field[3], field[4], field[5])
  if (type === "enum") return databases.createEnumAttribute(databaseId, collectionId, key, field[2], field[3], field[4], field[5])
  if (type === "integer") return databases.createIntegerAttribute(databaseId, collectionId, key, field[2], field[3], field[4], field[5], field[6])
  if (type === "float") return databases.createFloatAttribute(databaseId, collectionId, key, field[2], field[3], field[4], field[5], field[6])
  if (type === "boolean") return databases.createBooleanAttribute(databaseId, collectionId, key, field[2], field[3])
  return databases.createDatetimeAttribute(databaseId, collectionId, key, field[2])
}

async function main() {
  await ignoreConflict(`database ${databaseId}`, () => databases.create(databaseId, "PeerSpark Main"))

  for (const collection of collections) {
    await ignoreConflict(`collection ${collection.id}`, () => databases.createCollection(databaseId, collection.id, collection.name, [], true))
    const existingAttributes = await databases.listAttributes(databaseId, collection.id, [Query.limit(100)])
    const attributeKeys = new Set(existingAttributes.attributes.map((attribute: any) => attribute.key))
    for (const field of collection.fields) {
      if (attributeKeys.has(field[1])) {
        console.log(`exists  ${collection.id}.${field[1]}`)
        continue
      }
      const created = await ignoreConflict(`${collection.id}.${field[1]}`, () => createField(collection.id, field))
      if (created) attributeKeys.add(field[1])
    }
    await waitForFields(collection)
    const existingIndexes = await databases.listIndexes(databaseId, collection.id, [Query.limit(100)])
    const indexKeys = new Set(existingIndexes.indexes.map((index: any) => index.key))
    for (const [name, attrs, type] of collection.indexes) {
      if (indexKeys.has(name)) {
        console.log(`exists  ${collection.id}.index.${name}`)
        continue
      }
      await ignoreConflict(`${collection.id}.index.${name}`, () => databases.createIndex(databaseId, collection.id, name, type as IndexType, attrs))
    }
  }

  const buckets = [
    ["pod-covers", "Pod Covers", 5 * 1024 * 1024, ["jpg", "jpeg", "png", "webp"]],
    ["pod-resources", "Pod Resources", 50 * 1024 * 1024, ["pdf", "png", "jpg", "jpeg", "webp", "mp4", "mov", "mp3", "wav", "txt", "md", "zip", "js", "ts", "jsx", "tsx", "py", "java", "cpp", "html", "css"]],
    ["pod-chat-attachments", "Pod Chat Attachments", 25 * 1024 * 1024, ["pdf", "png", "jpg", "jpeg", "webp", "mp4", "mov", "mp3", "wav", "txt", "md", "zip", "js", "ts", "jsx", "tsx", "py", "html", "css"]],
    ["pod-session-recordings", "Pod Session Recordings", 100 * 1024 * 1024, ["mp4", "mov", "mp3", "wav", "txt", "md"]],
  ] as const

  for (const [id, name, maxSize, extensions] of buckets) {
    await ignoreConflict(`bucket ${id}`, () => storage.createBucket(id, name, [], true, true, maxSize, extensions as unknown as string[]))
  }

  if (failures.length > 0) throw new Error(`Pod 2.0 setup completed with ${failures.length} failure(s).`)
  console.log("Pod 2.0 setup complete.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
