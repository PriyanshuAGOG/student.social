import { NextRequest, NextResponse } from "next/server"
import { ID, Permission, Query, Role } from "node-appwrite"
import { InputFile } from "node-appwrite/file"
import { createAdminClient } from "@/lib/appwrite-comprehensive-fixes"
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from "@/lib/api-security"
import { calculateLeaderboard, calculatePodCompletionRate, calculatePodHealthScore } from "@/lib/pods/calculations"
import { extractYouTubeId, generateStarterRoadmap } from "@/lib/pods/generator"
import { POD_COLLECTIONS, type PodRole } from "@/lib/pods/types"
import { normalizeAppwriteEndpoint } from "@/lib/env"
import { scanUploadMeta } from "@/lib/upload-security"
import { generateLiveKitToken } from "@/lib/livekit-service"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || "profiles"
const APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT) || "https://fra.cloud.appwrite.io/v1"
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ""
const POD_RESOURCES_BUCKET_ID = "pod-resources"
const POD_CHAT_ATTACHMENTS_BUCKET_ID = "pod-chat-attachments"
const MAX_RESOURCE_BYTES = 50 * 1024 * 1024
const MAX_CHAT_ATTACHMENT_BYTES = 25 * 1024 * 1024

type Params = { params: Promise<{ path?: string[] }> }

const now = () => new Date().toISOString()
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || `pod-${Date.now()}`
const oneYear = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

function response(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

function safeFileName(input: string) {
  const fallback = `pod-file-${Date.now()}`
  return (input || fallback).replace(/[\r\n]/g, " ").replace(/[\\/]/g, "-").slice(0, 180) || fallback
}

function fileViewUrl(bucketId: string, fileId: string) {
  const endpoint = APPWRITE_ENDPOINT.replace(/\/$/, "")
  return `${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
}

function resourceTypeFromFile(file: File) {
  const type = (file.type || "").toLowerCase()
  const name = file.name.toLowerCase()
  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf"
  if (type.startsWith("video/")) return "video"
  if (type.startsWith("image/")) return "image"
  if ([".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".html", ".css"].some((ext) => name.endsWith(ext))) return "code"
  return "note"
}

function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : "Unexpected server error"
  return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message } }, { status: 500 })
}

function publicPodPermissions(creatorId: string) {
  return [
    Permission.read(Role.any()),
    Permission.update(Role.user(creatorId)),
    Permission.delete(Role.user(creatorId)),
  ]
}

function memberDocPermissions(userId: string, creatorId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(creatorId)),
  ]
}

async function safeList(databases: any, collection: string, queries: string[] = []) {
  try {
    return await databases.listDocuments(DATABASE_ID, collection, queries)
  } catch (error: any) {
    const message = String(error?.message || "").toLowerCase()
    if (error?.code === 404 || message.includes("not found") || message.includes("could not be found") || message.includes("invalid query")) {
      return { documents: [], total: 0 }
    }
    throw error
  }
}

async function safeCreate(databases: any, collection: string, id: string, data: Record<string, unknown>, permissions?: string[]) {
  try {
    return await databases.createDocument(DATABASE_ID, collection, id, data, permissions)
  } catch (error: any) {
    if (String(error?.message || "").includes("Unknown attribute")) {
      const cleaned = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== null))
      return databases.createDocument(DATABASE_ID, collection, id, cleaned, permissions)
    }
    throw error
  }
}

function normalizeProfile(profile: any, userId: string) {
  if (!profile) return null
  return {
    userId,
    name: String(profile.name || profile.displayName || profile.fullName || profile.username || "").trim(),
    username: String(profile.username || "").trim(),
    email: String(profile.email || "").trim(),
    avatar: String(profile.avatar || profile.profilePictureUrl || profile.photoURL || "").trim(),
  }
}

async function hydrateProfiles(databases: any, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter((id) => id && id !== "system")))
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId)
        return [userId, normalizeProfile(profile, userId)] as const
      } catch {
        return [userId, null] as const
      }
    }),
  )
  return Object.fromEntries(entries.filter(([, profile]) => Boolean(profile)))
}

async function getMembership(databases: any, podId: string, userId: string) {
  const memberships = await safeList(databases, POD_COLLECTIONS.memberships, [
    Query.equal("podId", podId),
    Query.equal("userId", userId),
    Query.limit(1),
  ])
  return memberships.documents[0] || null
}

async function assertPodRole(databases: any, podId: string, userId: string, allowed: PodRole[]) {
  const membership = await getMembership(databases, podId, userId)
  if (!membership || membership.status !== "active" || !allowed.includes(membership.role)) {
    throw new ApiError(403, "POD_FORBIDDEN", "You do not have permission to perform this action.")
  }
  return membership
}

async function getPod(databases: any, podId: string) {
  try {
    return await databases.getDocument(DATABASE_ID, POD_COLLECTIONS.pods, podId)
  } catch {
    const pods = await safeList(databases, POD_COLLECTIONS.pods, [Query.equal("slug", podId), Query.limit(1)])
    if (pods.documents[0]) return pods.documents[0]
    throw new ApiError(404, "POD_NOT_FOUND", "Pod not found.")
  }
}

function normalizePod(pod: any) {
  const tags = Array.isArray(pod.tags) ? pod.tags : Array.isArray(pod.matchingTags) ? pod.matchingTags : []
  const visibility = pod.visibility || (pod.isPublic === false ? "private" : "public")
  const type = pod.type || (Array.isArray(pod.sessionType) && pod.sessionType.includes("mentor") ? "mentor_led" : "cohort_30_day")
  const difficulty = String(pod.difficulty || "beginner").toLowerCase()
  return {
    ...pod,
    slug: pod.slug || slugify(pod.name || pod.$id),
    shortOutcome: pod.shortOutcome || pod.description?.slice(0, 120) || "Build consistent progress with a focused learning group.",
    category: pod.category || pod.subject || "General",
    difficulty,
    language: pod.language || "English",
    type,
    visibility,
    status: pod.status || (pod.isActive === false ? "paused" : "active"),
    currentWeek: Number(pod.currentWeek || 1),
    totalWeeks: Number(pod.totalWeeks || 4),
    weeklyRhythm: pod.weeklyRhythm || "Daily check-ins, one midweek doubt session, and a weekend review.",
    timezone: pod.timezone || "UTC",
    tags,
    memberCount: Number(pod.memberCount || (Array.isArray(pod.members) ? pod.members.length : 0)),
    activeMemberCount: Number(pod.activeMemberCount || pod.memberCount || 0),
    completionRate: Number(pod.completionRate || 0),
    weeklyActivityScore: Number(pod.weeklyActivityScore || 0),
    healthScore: Number(pod.healthScore || 0),
    createdAt: pod.createdAt || pod.$createdAt,
    updatedAt: pod.updatedAt || pod.$updatedAt,
  }
}

async function createDefaultChannels(databases: any, podId: string, userId: string) {
  const defaults = [
    ["General", "general", "general", "Daily discussion and updates."],
    ["Doubts", "doubts", "doubts", "Questions, blockers, and unblock requests."],
    ["Resources", "resources", "resources", "Links, files, notes, and references."],
    ["Wins", "wins", "wins", "Finished tasks and progress worth sharing."],
    ["Announcements", "announcements", "announcements", "Owner and mentor announcements."],
    ["Session Chat", "session-chat", "session_chat", "Live-session backchannel."],
    ["Submissions", "submissions", "submissions", "Submission coordination and review notes."],
  ]
  const created = []
  for (let index = 0; index < defaults.length; index += 1) {
    const [name, slug, type, description] = defaults[index]
    created.push(await safeCreate(databases, POD_COLLECTIONS.channels, ID.unique(), {
      podId,
      name,
      slug,
      type,
      description,
      order: index,
      locked: type === "announcements",
      postingRole: type === "announcements" ? "mentors" : "everyone",
      createdBy: userId,
      createdAt: now(),
      updatedAt: now(),
    }))
  }
  return created
}

async function writeInsightSnapshot(databases: any, podId: string) {
  const [memberships, checkins, tasks, submissions, sessions] = await Promise.all([
    safeList(databases, POD_COLLECTIONS.memberships, [Query.equal("podId", podId), Query.limit(200)]),
    safeList(databases, POD_COLLECTIONS.checkins, [Query.equal("podId", podId), Query.limit(500)]),
    safeList(databases, POD_COLLECTIONS.tasks, [Query.equal("podId", podId), Query.limit(500)]),
    safeList(databases, POD_COLLECTIONS.taskSubmissions, [Query.equal("podId", podId), Query.limit(500)]),
    safeList(databases, POD_COLLECTIONS.sessions, [Query.equal("podId", podId), Query.limit(200)]),
  ])
  const activeMembers = memberships.documents.filter((m: any) => m.status === "active").length
  const inactiveMembers = memberships.documents.filter((m: any) => {
    const lastActive = m.lastActiveAt ? new Date(m.lastActiveAt).getTime() : 0
    return m.status === "active" && Date.now() - lastActive > 7 * 24 * 60 * 60 * 1000
  }).length
  const completionRate = calculatePodCompletionRate(memberships.documents as any)
  const healthScore = calculatePodHealthScore({ memberships: memberships.documents as any, checkins: checkins.documents as any, tasks: tasks.documents as any, submissions: submissions.documents as any, sessions: sessions.documents as any })
  await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.pods, podId, {
    completionRate,
    healthScore,
    activeMemberCount: activeMembers,
    updatedAt: now(),
  }).catch(() => null)
  return safeCreate(databases, POD_COLLECTIONS.insights, ID.unique(), {
    podId,
    scope: "pod",
    userId: "",
    period: "weekly",
    periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: now(),
    progressPercent: completionRate,
    consistencyScore: checkins.documents.length ? Math.min(100, Math.round((checkins.documents.length / Math.max(activeMembers * 5, 1)) * 100)) : 0,
    attendanceRate: sessions.documents.length ? 100 : 0,
    taskCompletionRate: tasks.documents.length ? Math.round((submissions.documents.length / Math.max(tasks.documents.length * Math.max(activeMembers, 1), 1)) * 100) : 0,
    activeMembers,
    inactiveMembers,
    dropOffRisk: inactiveMembers ? Math.min(100, Math.round((inactiveMembers / Math.max(activeMembers, 1)) * 100)) : 0,
    mostAskedTopics: ["blockers", "tasks", "sessions"],
    suggestedActions: inactiveMembers
      ? ["Send inactive member nudges.", "Schedule a short revision session.", "Pin one task to Today’s Focus."]
      : ["Publish the next milestone.", "Ask members to share one useful resource."],
    generatedAt: now(),
  })
}

export async function GET(request: NextRequest, ctx: Params) {
  try {
    const path = (await ctx.params).path || []
    const { databases } = await createAdminClient()
    const searchParams = request.nextUrl.searchParams

    if (path[0] === "invites" && path[1]) {
      const invites = await safeList(databases, POD_COLLECTIONS.invites, [
        Query.equal("inviteCode", path[1]),
        Query.limit(1),
      ])
      const invite = invites.documents[0]
      if (!invite) throw new ApiError(404, "INVITE_NOT_FOUND", "Invite not found.")
      if (invite.status !== "pending") throw new ApiError(410, "INVITE_CLOSED", "This invite is no longer active.")
      if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
        await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.invites, invite.$id, { status: "expired", updatedAt: now() }).catch(() => null)
        throw new ApiError(410, "INVITE_EXPIRED", "This invite has expired.")
      }
      const pod = normalizePod(await getPod(databases, invite.podId))
      return response({ invite, pod })
    }

    if (path.length === 0) {
      const search = searchParams.get("search") || ""
      const category = searchParams.get("category") || ""
      const difficulty = searchParams.get("difficulty") || ""
      const queries = [Query.orderDesc("weeklyActivityScore"), Query.orderDesc("createdAt"), Query.limit(80)]
      if (category && category !== "All") queries.unshift(Query.equal("category", category))
      if (difficulty && difficulty !== "All") queries.unshift(Query.equal("difficulty", difficulty))
      if (search) queries.unshift(Query.search("name", search))
      const result = await safeList(databases, POD_COLLECTIONS.pods, queries)
      const pods = result.documents.map(normalizePod)

      let myPods: any[] = []
      try {
        const auth = requireUser(request)
        const memberships = await safeList(databases, POD_COLLECTIONS.memberships, [Query.equal("userId", auth.userId), Query.equal("status", "active"), Query.limit(100)])
        const ids = new Set(memberships.documents.map((membership: any) => membership.podId))
        myPods = pods.filter((pod: any) => ids.has(pod.$id) || (Array.isArray(pod.members) && pod.members.includes(auth.userId)))
      } catch {
        myPods = []
      }
      return response({ pods, myPods })
    }

    const [podId, action] = path
    if (action === "bundle") {
      const pod = normalizePod(await getPod(databases, podId))
      let authUserId = ""
      try {
        authUserId = requireUser(request).userId
      } catch {}
      const [memberships, roadmap, tasks, submissions, sessions, resources, checkins, channels, messages, reactions, insights] = await Promise.all([
        safeList(databases, POD_COLLECTIONS.memberships, [Query.equal("podId", pod.$id), Query.limit(100)]),
        safeList(databases, POD_COLLECTIONS.roadmapItems, [Query.equal("podId", pod.$id), Query.orderAsc("order"), Query.limit(200)]),
        safeList(databases, POD_COLLECTIONS.tasks, [Query.equal("podId", pod.$id), Query.orderAsc("order"), Query.limit(200)]),
        safeList(databases, POD_COLLECTIONS.taskSubmissions, [Query.equal("podId", pod.$id), Query.limit(200)]),
        safeList(databases, POD_COLLECTIONS.sessions, [Query.equal("podId", pod.$id), Query.orderAsc("startsAt"), Query.limit(80)]),
        safeList(databases, POD_COLLECTIONS.resources, [Query.equal("podId", pod.$id), Query.orderDesc("createdAt"), Query.limit(100)]),
        safeList(databases, POD_COLLECTIONS.checkins, [Query.equal("podId", pod.$id), Query.orderDesc("createdAt"), Query.limit(100)]),
        safeList(databases, POD_COLLECTIONS.channels, [Query.equal("podId", pod.$id), Query.orderAsc("order"), Query.limit(30)]),
        safeList(databases, POD_COLLECTIONS.messages, [Query.equal("podId", pod.$id), Query.orderDesc("createdAt"), Query.limit(80)]),
        safeList(databases, POD_COLLECTIONS.reactions, [Query.equal("podId", pod.$id), Query.limit(200)]),
        safeList(databases, POD_COLLECTIONS.insights, [Query.equal("podId", pod.$id), Query.orderDesc("generatedAt"), Query.limit(20)]),
      ])
      const profiles = await hydrateProfiles(databases, [
        ...memberships.documents.map((item: any) => item.userId),
        ...messages.documents.map((item: any) => item.senderId),
        ...checkins.documents.map((item: any) => item.userId),
        ...submissions.documents.map((item: any) => item.userId),
      ])
      const hydratedMemberships = memberships.documents.map((item: any) => ({
        ...item,
        profile: profiles[item.userId] || item.profile || null,
      }))
      const hydratedMessages = messages.documents.reverse().map((item: any) => {
        const senderProfile = profiles[item.senderId] || item.senderProfile || null
        return {
          ...item,
          senderProfile,
          senderName: item.senderName || senderProfile?.name || senderProfile?.username || (item.senderId === "system" ? "PeerSpark" : `Member ${String(item.senderId || "").slice(0, 5)}`),
        }
      })
      const hydratedCheckins = checkins.documents.map((item: any) => ({
        ...item,
        profile: profiles[item.userId] || item.profile || null,
      }))
      const membership = authUserId ? hydratedMemberships.find((item: any) => item.userId === authUserId) || null : null
      const leaderboard = calculateLeaderboard(hydratedMemberships as any)
      return response({
        pod,
        membership,
        memberships: hydratedMemberships,
        roadmap: roadmap.documents,
        tasks: tasks.documents,
        submissions: submissions.documents,
        sessions: sessions.documents,
        resources: resources.documents,
        checkins: hydratedCheckins,
        channels: channels.documents,
        messages: hydratedMessages,
        reactions: reactions.documents,
        insights: insights.documents,
        leaderboard,
      })
    }

    return response({ pod: normalizePod(await getPod(databases, podId)) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: "pods2:write", max: 60, windowMs: 60 * 1000 })
    const auth = requireUser(request)
    const path = (await ctx.params).path || []
    const { databases, storage } = await createAdminClient()

    if (path[0] === "jobs" && path[1] === "run") {
      const role = request.headers.get("x-user-role") || "user"
      if (role !== "admin" && process.env.NODE_ENV === "production") {
        throw new ApiError(403, "ADMIN_ONLY", "Only admins can run pod automation jobs.")
      }
      const pods = await safeList(databases, POD_COLLECTIONS.pods, [Query.equal("status", "active"), Query.limit(200)])
      const results = []
      for (const pod of pods.documents) {
        const insight = await writeInsightSnapshot(databases, pod.$id)
        const memberships = await safeList(databases, POD_COLLECTIONS.memberships, [Query.equal("podId", pod.$id), Query.equal("status", "active"), Query.limit(200)])
        for (const membership of memberships.documents) {
          await safeCreate(databases, POD_COLLECTIONS.notificationsQueue, ID.unique(), {
            podId: pod.$id,
            userId: membership.userId,
            type: "checkin_reminder",
            title: `Check in for ${pod.name}`,
            body: "Post today’s plan, blockers, and progress so the pod can help you move.",
            targetUrl: `/app/pods/${pod.$id}/overview`,
            scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: "pending",
            sentAt: "",
            metadata: JSON.stringify({ source: "pod-automation" }),
            createdAt: now(),
          }).catch(() => null)
        }
        results.push({ podId: pod.$id, insightId: insight?.$id || null })
      }
      const expired = await safeList(databases, POD_COLLECTIONS.invites, [Query.equal("status", "pending"), Query.lessThan("expiresAt", now()), Query.limit(100)])
      for (const invite of expired.documents) {
        await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.invites, invite.$id, { status: "expired", updatedAt: now() }).catch(() => null)
      }
      return response({ processed: results.length, results, expiredInvites: expired.documents.length })
    }

    if (path[0] === "invites" && path[1] && path[2] === "accept") {
      const invites = await safeList(databases, POD_COLLECTIONS.invites, [Query.equal("inviteCode", path[1]), Query.limit(1)])
      const invite = invites.documents[0]
      if (!invite) throw new ApiError(404, "INVITE_NOT_FOUND", "Invite not found.")
      if (invite.status !== "pending") throw new ApiError(410, "INVITE_CLOSED", "This invite is no longer active.")
      if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
        await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.invites, invite.$id, { status: "expired", updatedAt: now() }).catch(() => null)
        throw new ApiError(410, "INVITE_EXPIRED", "This invite has expired.")
      }
      if (invite.invitedUserId && invite.invitedUserId !== auth.userId) throw new ApiError(403, "INVITE_FORBIDDEN", "This invite belongs to another user.")
      const pod = await getPod(databases, invite.podId)
      const existing = await getMembership(databases, pod.$id, auth.userId)
      const membership = existing || await safeCreate(databases, POD_COLLECTIONS.memberships, ID.unique(), {
        podId: pod.$id,
        userId: auth.userId,
        role: invite.role || "member",
        status: "active",
        joinedAt: now(),
        lastActiveAt: now(),
        progressPercent: 0,
        currentStreak: 0,
        totalPoints: 0,
        tasksCompleted: 0,
        sessionsAttended: 0,
        resourcesShared: 0,
        peerReviewsCompleted: 0,
        checkInsCount: 0,
        contributionScore: 0,
        skills: [],
        availability: "",
        notificationPreference: "all",
        createdAt: now(),
        updatedAt: now(),
      }, memberDocPermissions(auth.userId, pod.creatorId))
      const members = Array.isArray(pod.members) ? Array.from(new Set([...pod.members, auth.userId])) : [auth.userId]
      await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.pods, pod.$id, { members, memberCount: members.length, activeMemberCount: members.length, updatedAt: now() }).catch(() => null)
      await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.invites, invite.$id, { status: "accepted", invitedUserId: auth.userId, updatedAt: now() }).catch(() => null)
      return response({ pod: normalizePod(pod), membership })
    }

    if (path.length >= 3 && path[1] === "resources" && path[2] === "upload") {
      const pod = await getPod(databases, path[0])
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const formData = await request.formData().catch(() => null)
      const file = formData?.get("file")
      if (!(file instanceof File)) throw new ApiError(400, "INVALID_INPUT", "A file is required.")
      if (file.size <= 0) throw new ApiError(400, "INVALID_INPUT", "The selected file is empty.")
      if (file.size > MAX_RESOURCE_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Pod resources must be 50MB or smaller.")
      const scanned = scanUploadMeta({ name: file.name, type: file.type, size: Math.min(file.size, 8 * 1024 * 1024) })
      if (!scanned.ok && scanned.reason !== "file too large") throw new ApiError(400, "UNSAFE_UPLOAD", `Rejected upload: ${scanned.reason}`)
      const fileName = safeFileName(file.name)
      const uploaded = await storage.createFile(
        POD_RESOURCES_BUCKET_ID,
        ID.unique(),
        InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), fileName),
        [Permission.read(Role.users()), Permission.update(Role.user(auth.userId)), Permission.delete(Role.user(auth.userId))],
      )
      const resource = await safeCreate(databases, POD_COLLECTIONS.resources, ID.unique(), {
        podId: pod.$id,
        uploaderId: auth.userId,
        title: String(formData?.get("title") || fileName).slice(0, 180),
        description: String(formData?.get("description") || ""),
        type: String(formData?.get("type") || resourceTypeFromFile(file)),
        storageFileId: uploaded.$id,
        url: fileViewUrl(POD_RESOURCES_BUCKET_ID, uploaded.$id),
        content: "",
        tags: String(formData?.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
        visibility: String(formData?.get("visibility") || "pod"),
        attachedToType: String(formData?.get("attachedToType") || "none"),
        attachedToId: String(formData?.get("attachedToId") || ""),
        views: 0,
        downloads: 0,
        bookmarks: 0,
        usefulCount: 0,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ resource, file: { fileId: uploaded.$id, fileName, fileUrl: fileViewUrl(POD_RESOURCES_BUCKET_ID, uploaded.$id), fileSize: file.size, fileType: file.type } }, 201)
    }

    if (path.length >= 3 && path[1] === "chat-attachments" && path[2] === "upload") {
      const pod = await getPod(databases, path[0])
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const formData = await request.formData().catch(() => null)
      const file = formData?.get("file")
      if (!(file instanceof File)) throw new ApiError(400, "INVALID_INPUT", "A file is required.")
      if (file.size <= 0) throw new ApiError(400, "INVALID_INPUT", "The selected file is empty.")
      if (file.size > MAX_CHAT_ATTACHMENT_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Chat attachments must be 25MB or smaller.")
      const fileName = safeFileName(file.name)
      const uploaded = await storage.createFile(
        POD_CHAT_ATTACHMENTS_BUCKET_ID,
        ID.unique(),
        InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), fileName),
        [Permission.read(Role.users()), Permission.update(Role.user(auth.userId)), Permission.delete(Role.user(auth.userId))],
      )
      return response({ attachment: { fileId: uploaded.$id, fileName, fileUrl: fileViewUrl(POD_CHAT_ATTACHMENTS_BUCKET_ID, uploaded.$id), fileSize: file.size, fileType: file.type } }, 201)
    }

    const body = await request.json().catch(() => ({}))

    if (path.length === 0) {
      const name = String(body.name || "").trim()
      if (name.length < 3) throw new ApiError(400, "INVALID_POD", "Pod name must be at least 3 characters.")
      const slug = slugify(String(body.slug || name))
      const pod = await safeCreate(databases, POD_COLLECTIONS.pods, ID.unique(), {
        name,
        slug,
        shortOutcome: String(body.shortOutcome || body.outcome || "Make measurable progress with a focused learning cohort.").slice(0, 180),
        description: String(body.description || ""),
        category: String(body.category || "General"),
        difficulty: String(body.difficulty || "beginner").toLowerCase(),
        language: String(body.language || "English"),
        coverImageId: "",
        coverImageUrl: String(body.coverImageUrl || ""),
        creatorId: auth.userId,
        mentorId: String(body.mentorId || ""),
        type: String(body.type || "cohort_30_day"),
        visibility: String(body.visibility || "public"),
        approvalRequired: Boolean(body.approvalRequired),
        maxMembers: Number(body.maxMembers || 50),
        status: "active",
        currentSprintId: "",
        currentWeek: 1,
        totalWeeks: Number(body.totalWeeks || 4),
        weeklyRhythm: String(body.weeklyRhythm || "Monday kickoff, daily check-ins, midweek doubt session, weekend review."),
        defaultSessionDay: String(body.defaultSessionDay || "Saturday"),
        defaultSessionTime: String(body.defaultSessionTime || "10:00"),
        timezone: String(body.timezone || "UTC"),
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
        members: [auth.userId],
        memberCount: 1,
        activeMemberCount: 1,
        completionRate: 0,
        weeklyActivityScore: 10,
        healthScore: 72,
        nextSessionAt: body.firstSessionAt || "",
        createdAt: now(),
        updatedAt: now(),
      }, publicPodPermissions(auth.userId))

      await safeCreate(databases, POD_COLLECTIONS.memberships, ID.unique(), {
        podId: pod.$id,
        userId: auth.userId,
        role: "owner",
        status: "active",
        joinedAt: now(),
        lastActiveAt: now(),
        progressPercent: 0,
        currentStreak: 0,
        totalPoints: 0,
        tasksCompleted: 0,
        sessionsAttended: 0,
        resourcesShared: 0,
        peerReviewsCompleted: 0,
        checkInsCount: 0,
        contributionScore: 0,
        skills: [],
        availability: "",
        notificationPreference: "all",
        createdAt: now(),
        updatedAt: now(),
      }, memberDocPermissions(auth.userId, auth.userId))

      const channels = await createDefaultChannels(databases, pod.$id, auth.userId)

      if (body.roadmapMode === "topic" || body.roadmapMode === "youtube") {
        const topic = body.roadmapMode === "youtube"
          ? `YouTube learning path ${extractYouTubeId(String(body.youtubeUrl || "")) || ""}`.trim()
          : String(body.topic || name)
        const generated = generateStarterRoadmap({ podId: pod.$id, topic, durationDays: Number(body.durationDays || 30), difficulty: String(body.difficulty || "beginner"), createdBy: auth.userId })
        for (const item of generated.roadmap) {
          const { $id, ...data } = item
          await safeCreate(databases, POD_COLLECTIONS.roadmapItems, ID.unique(), data)
        }
        for (const task of generated.tasks) {
          const { $id, ...data } = task
          await safeCreate(databases, POD_COLLECTIONS.tasks, ID.unique(), data)
        }
      }

      if (body.firstSessionAt) {
        await safeCreate(databases, POD_COLLECTIONS.sessions, ID.unique(), {
          podId: pod.$id,
          title: "Launch session",
          description: "Kick off the pod, align on outcomes, and choose the first task.",
          type: "study_session",
          status: "scheduled",
          startsAt: String(body.firstSessionAt),
          endsAt: "",
          timezone: String(body.timezone || "UTC"),
          hostId: auth.userId,
          agenda: "Introductions, roadmap walkthrough, first action.",
          meetingProvider: "internal",
          meetingUrl: "",
          maxParticipants: Number(body.maxMembers || 50),
          reminderSent: false,
          createdAt: now(),
          updatedAt: now(),
        })
      }

      if (channels[0]) {
        await safeCreate(databases, POD_COLLECTIONS.messages, ID.unique(), {
          podId: pod.$id,
          channelId: channels[0].$id,
          senderId: "system",
          senderName: "PeerSpark",
          content: `Welcome to ${name}. Start with today's focus, post a check-in, and keep blockers visible.`,
          type: "system",
          label: "announcement",
          replyToMessageId: "",
          threadRootId: "",
          attachmentIds: [],
          pinned: true,
          important: true,
          edited: false,
          deleted: false,
          createdAt: now(),
          updatedAt: now(),
        })
      }

      return response({ pod: normalizePod(pod) }, 201)
    }

    const [podId, action, subId, nested] = path
    const pod = await getPod(databases, podId)

    if (action === "join") {
      const existing = await getMembership(databases, pod.$id, auth.userId)
      if (existing) return response({ membership: existing, alreadyMember: true })
      const membership = await safeCreate(databases, POD_COLLECTIONS.memberships, ID.unique(), {
        podId: pod.$id,
        userId: auth.userId,
        role: "member",
        status: pod.approvalRequired ? "pending" : "active",
        joinedAt: now(),
        lastActiveAt: now(),
        progressPercent: 0,
        currentStreak: 0,
        totalPoints: 0,
        tasksCompleted: 0,
        sessionsAttended: 0,
        resourcesShared: 0,
        peerReviewsCompleted: 0,
        checkInsCount: 0,
        contributionScore: 0,
        skills: [],
        availability: "",
        notificationPreference: "all",
        createdAt: now(),
        updatedAt: now(),
      }, memberDocPermissions(auth.userId, pod.creatorId))
      const members = Array.isArray(pod.members) ? Array.from(new Set([...pod.members, auth.userId])) : [auth.userId]
      await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.pods, pod.$id, { members, memberCount: members.length, activeMemberCount: members.length, updatedAt: now() }).catch(() => null)
      return response({ membership, alreadyMember: false })
    }

    if (action === "roadmap") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator"])
      const generated = generateStarterRoadmap({ podId: pod.$id, topic: String(body.topic || pod.name), durationDays: Number(body.durationDays || 30), createdBy: auth.userId })
      const created = []
      for (const item of generated.roadmap) {
        const { $id, ...data } = item
        created.push(await safeCreate(databases, POD_COLLECTIONS.roadmapItems, ID.unique(), data))
      }
      for (const task of generated.tasks) {
        const { $id, ...data } = task
        await safeCreate(databases, POD_COLLECTIONS.tasks, ID.unique(), data)
      }
      return response({ roadmap: created, notice: generated.notice })
    }

    if (action === "tasks" && nested === "submit") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      if (!body.text && !body.link && !Array.isArray(body.fileIds)) throw new ApiError(400, "EMPTY_SUBMISSION", "Required submission cannot be empty.")
      if (body.link) {
        try { new URL(String(body.link)) } catch { throw new ApiError(400, "INVALID_URL", "Link submission must be a valid URL.") }
      }
      const submission = await safeCreate(databases, POD_COLLECTIONS.taskSubmissions, ID.unique(), {
        podId: pod.$id,
        taskId: subId,
        userId: auth.userId,
        status: "submitted",
        text: String(body.text || ""),
        link: String(body.link || ""),
        fileIds: Array.isArray(body.fileIds) ? body.fileIds : [],
        feedback: "",
        reviewedBy: "",
        reviewedAt: "",
        submittedAt: now(),
        pointsAwarded: 0,
        late: false,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ submission }, 201)
    }

    if (action === "tasks") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator"])
      const task = await safeCreate(databases, POD_COLLECTIONS.tasks, ID.unique(), {
        podId: pod.$id,
        roadmapItemId: String(body.roadmapItemId || ""),
        title: String(body.title || "Untitled task").slice(0, 180),
        description: String(body.description || ""),
        type: String(body.type || "build"),
        priority: String(body.priority || "medium"),
        status: String(body.status || "today"),
        assignedTo: Array.isArray(body.assignedTo) ? body.assignedTo : [],
        assignedRole: String(body.assignedRole || "member"),
        createdBy: auth.userId,
        dueAt: String(body.dueAt || oneYear()),
        points: Number(body.points || 20),
        difficulty: String(body.difficulty || "medium"),
        submissionType: String(body.submissionType || "text"),
        relatedResourceIds: Array.isArray(body.relatedResourceIds) ? body.relatedResourceIds : [],
        required: body.required !== false,
        allowLateSubmission: body.allowLateSubmission !== false,
        order: Number(body.order || Date.now()),
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ task }, 201)
    }

    if (action === "sessions" && subId && nested === "token") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const session = await databases.getDocument(DATABASE_ID, POD_COLLECTIONS.sessions, subId)
      if (session.podId !== pod.$id) throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found.")
      const roomName = `pod-${pod.$id}-${session.$id}`
      const token = await generateLiveKitToken({
        roomName,
        identity: auth.userId,
        displayName: String(body.displayName || "PeerSpark member"),
        metadata: { podId: pod.$id, sessionId: session.$id },
      })
      const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/app/pods/${pod.$id}/study-room?session=${session.$id}`
      await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.sessions, session.$id, {
        status: "live",
        meetingProvider: "livekit",
        meetingUrl,
        updatedAt: now(),
      }).catch(() => null)
      return response({ token, roomName, meetingUrl })
    }

    if (action === "sessions") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator"])
      const session = await safeCreate(databases, POD_COLLECTIONS.sessions, ID.unique(), {
        podId: pod.$id,
        title: String(body.title || "Study session"),
        description: String(body.description || ""),
        type: String(body.type || "study_session"),
        status: String(body.status || "scheduled"),
        startsAt: String(body.startsAt || now()),
        endsAt: String(body.endsAt || ""),
        timezone: String(body.timezone || pod.timezone || "UTC"),
        hostId: auth.userId,
        agenda: String(body.agenda || ""),
        meetingProvider: String(body.meetingProvider || "internal"),
        meetingUrl: String(body.meetingUrl || ""),
        recordingUrl: "",
        whiteboardStateId: "",
        notesResourceId: "",
        maxParticipants: Number(body.maxParticipants || pod.maxMembers || 50),
        reminderSent: false,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ session }, 201)
    }

    if (action === "resources") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const resource = await safeCreate(databases, POD_COLLECTIONS.resources, ID.unique(), {
        podId: pod.$id,
        uploaderId: auth.userId,
        title: String(body.title || "Untitled resource").slice(0, 180),
        description: String(body.description || ""),
        type: String(body.type || "link"),
        storageFileId: String(body.storageFileId || ""),
        url: String(body.url || ""),
        content: String(body.content || ""),
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
        visibility: String(body.visibility || "pod"),
        attachedToType: String(body.attachedToType || "none"),
        attachedToId: String(body.attachedToId || ""),
        views: 0,
        downloads: 0,
        bookmarks: 0,
        usefulCount: 0,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ resource }, 201)
    }

    if (action === "checkins") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const date = String(body.date || new Date().toISOString().slice(0, 10))
      const checkin = await safeCreate(databases, POD_COLLECTIONS.checkins, ID.unique(), {
        podId: pod.$id,
        userId: auth.userId,
        date,
        mood: String(body.mood || "focused"),
        status: String(body.status || "planned"),
        todayPlan: String(body.todayPlan || ""),
        yesterdayProgress: String(body.yesterdayProgress || ""),
        blocker: String(body.blocker || ""),
        helpNeeded: Boolean(body.helpNeeded),
        relatedTaskIds: Array.isArray(body.relatedTaskIds) ? body.relatedTaskIds : [],
        streakCountAfter: Number(body.streakCountAfter || 1),
        pointsAwarded: 5,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ checkin }, 201)
    }

    if (action === "channels" && nested === "messages") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      if (!String(body.content || "").trim()) throw new ApiError(400, "EMPTY_MESSAGE", "Message cannot be empty.")
      const message = await safeCreate(databases, POD_COLLECTIONS.messages, ID.unique(), {
        podId: pod.$id,
        channelId: subId,
        senderId: auth.userId,
        senderName: String(body.senderName || "Member"),
        content: String(body.content || ""),
        type: String(body.type || "text"),
        label: String(body.label || "none"),
        replyToMessageId: String(body.replyToMessageId || ""),
        threadRootId: String(body.threadRootId || ""),
        attachmentIds: Array.isArray(body.attachmentIds) ? body.attachmentIds : [],
        pinned: false,
        important: Boolean(body.important),
        edited: false,
        deleted: false,
        createdAt: now(),
        updatedAt: now(),
      })
      return response({ message }, 201)
    }

    if (action === "messages" && nested === "reactions") {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      const emoji = String(body.emoji || "✓").slice(0, 12)
      const existing = await safeList(databases, POD_COLLECTIONS.reactions, [
        Query.equal("messageId", subId),
        Query.equal("userId", auth.userId),
        Query.equal("emoji", emoji),
        Query.limit(1),
      ])
      if (existing.documents[0]) {
        await databases.deleteDocument(DATABASE_ID, POD_COLLECTIONS.reactions, existing.documents[0].$id)
        return response({ toggled: "off" })
      }
      const reaction = await safeCreate(databases, POD_COLLECTIONS.reactions, ID.unique(), {
        podId: pod.$id,
        messageId: subId,
        userId: auth.userId,
        emoji,
        createdAt: now(),
      })
      return response({ toggled: "on", reaction }, 201)
    }

    throw new ApiError(404, "NOT_FOUND", "Pod action not found.")
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    enforceSameOrigin(request)
    const auth = requireUser(request)
    const path = (await ctx.params).path || []
    const body = await request.json().catch(() => ({}))
    const { databases } = await createAdminClient()
    const [podId, action, subId] = path
    const pod = await getPod(databases, podId)

    if (!action) {
      await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor"])
      const allowed = ["name", "shortOutcome", "description", "category", "difficulty", "tags", "visibility", "approvalRequired", "maxMembers", "weeklyRhythm", "defaultSessionDay", "defaultSessionTime", "timezone", "status"]
      const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
      const updated = await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.pods, pod.$id, { ...update, updatedAt: now() })
      return response({ pod: normalizePod(updated) })
    }

    if (action === "messages") {
      const message = await databases.getDocument(DATABASE_ID, POD_COLLECTIONS.messages, subId)
      const membership = await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      if (message.senderId !== auth.userId && !["owner", "mentor", "moderator"].includes(membership.role)) {
        throw new ApiError(403, "MESSAGE_FORBIDDEN", "You do not have permission to edit this message.")
      }
      const updated = await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.messages, subId, {
        content: String(body.content || message.content || ""),
        label: String(body.label || message.label || "none"),
        edited: true,
        editedAt: now(),
        updatedAt: now(),
      })
      return response({ message: updated })
    }

    throw new ApiError(404, "NOT_FOUND", "Pod action not found.")
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest, ctx: Params) {
  try {
    enforceSameOrigin(request)
    const auth = requireUser(request)
    const path = (await ctx.params).path || []
    const { databases } = await createAdminClient()
    const [podId, action, subId] = path
    const pod = await getPod(databases, podId)

    if (action === "messages") {
      const message = await databases.getDocument(DATABASE_ID, POD_COLLECTIONS.messages, subId)
      const membership = await assertPodRole(databases, pod.$id, auth.userId, ["owner", "mentor", "moderator", "member"])
      if (message.senderId !== auth.userId && !["owner", "mentor", "moderator"].includes(membership.role)) {
        throw new ApiError(403, "MESSAGE_FORBIDDEN", "You do not have permission to delete this message.")
      }
      const updated = await databases.updateDocument(DATABASE_ID, POD_COLLECTIONS.messages, subId, {
        deleted: true,
        deletedAt: now(),
        content: "",
        updatedAt: now(),
      })
      return response({ message: updated })
    }

    throw new ApiError(404, "NOT_FOUND", "Pod action not found.")
  } catch (error) {
    return errorResponse(error)
  }
}
