import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { z } from "zod"
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from "@/lib/api-security"
import { runAIChat } from "@/lib/ai"
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-server"
import { buildCourseManifest, courseSettingsSchema, type PodCourseManifest } from "@/lib/courses/pod-course"
import { resolveYouTubeSource } from "@/lib/courses/youtube-source"
import { createAdminClient } from "@/lib/server/appwrite"

const requestSchema = z.object({
  podId: z.string().trim().min(1).max(255),
  youtubeUrl: z.string().url().max(500),
  courseTitle: z.string().trim().min(3).max(200),
  settings: courseSettingsSchema.partial().optional(),
})

function extractJsonObject(response: string) {
  const match = response.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("The curriculum response was not structured JSON")
  return JSON.parse(match[0])
}

async function enrichManifest(manifest: PodCourseManifest): Promise<PodCourseManifest> {
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) return manifest
  const compactOutline = manifest.modules.map((module) => ({
    id: module.id,
    chapters: module.chapters.map((chapter) => ({ id: chapter.id, sourceTitle: chapter.title })).slice(0, 12),
  }))
  try {
    const response = await Promise.race([
      runAIChat([
        {
          role: "system",
          content: `You are a senior instructional designer. Return only JSON. Improve the names and learning design for this course map without changing IDs, module count, lesson count, source order, or timestamps. Keep every title concise and source-grounded. Output {"modules":[{"id":"module-01","title":"...","description":"...","objectives":["...","..."],"milestone":"...","chapters":[{"id":"lesson-01","title":"...","description":"...","objectives":["...","..."],"topics":["...","..."]}]}]}. Do not include quiz answers or invented factual claims.`,
        },
        {
          role: "user",
          content: JSON.stringify({ title: manifest.sourceTitle, difficulty: manifest.settings.difficulty, outline: compactOutline }),
        },
      ], { maxTokens: 7000 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Curriculum enrichment timed out")), 20_000)),
    ])
    const enriched = extractJsonObject(response)
    if (!Array.isArray(enriched.modules)) return manifest
    const modulesById = new Map(enriched.modules.map((module: any) => [module.id, module]))
    return {
      ...manifest,
      modules: manifest.modules.map((module) => {
        const update: any = modulesById.get(module.id)
        const chaptersById = new Map((Array.isArray(update?.chapters) ? update.chapters : []).map((chapter: any) => [chapter.id, chapter]))
        return {
          ...module,
          title: typeof update?.title === "string" ? update.title.slice(0, 120) : module.title,
          description: typeof update?.description === "string" ? update.description.slice(0, 500) : module.description,
          objectives: Array.isArray(update?.objectives) ? update.objectives.slice(0, 5).map(String) : module.objectives,
          milestone: typeof update?.milestone === "string" ? update.milestone.slice(0, 300) : module.milestone,
          chapters: module.chapters.map((chapter) => {
            const chapterUpdate: any = chaptersById.get(chapter.id)
            return {
              ...chapter,
              title: typeof chapterUpdate?.title === "string" ? chapterUpdate.title.slice(0, 160) : chapter.title,
              description: typeof chapterUpdate?.description === "string" ? chapterUpdate.description.slice(0, 500) : chapter.description,
              objectives: Array.isArray(chapterUpdate?.objectives) ? chapterUpdate.objectives.slice(0, 5).map(String) : chapter.objectives,
              topics: Array.isArray(chapterUpdate?.topics) ? chapterUpdate.topics.slice(0, 8).map(String) : chapter.topics,
            }
          }),
        }
      }),
    }
  } catch (error) {
    console.info("Course outline enrichment unavailable; using deterministic curriculum", error instanceof Error ? error.message : String(error))
    return manifest
  }
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || `course-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: "pods:generate-course", max: 4, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, requestSchema)
    const settings = courseSettingsSchema.parse(input.settings || {})
    const { databases } = await createAdminClient()
    const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, input.podId)
    const members = Array.isArray(pod.members) ? pod.members : []
    if (pod.creatorId !== auth.userId && !members.includes(auth.userId)) {
      throw new ApiError(403, "FORBIDDEN", "Join this Pod before creating its learning track")
    }

    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_COURSES, [Query.equal("podId", input.podId), Query.limit(1)])
    if (existing.total > 0) throw new ApiError(409, "COURSE_EXISTS", "This Pod already has a learning track")

    let source: Awaited<ReturnType<typeof resolveYouTubeSource>>
    try {
      source = await resolveYouTubeSource(input.youtubeUrl, settings.estimatedHours)
    } catch (error) {
      throw new ApiError(400, "INVALID_YOUTUBE_SOURCE", error instanceof Error ? error.message : "Could not read this YouTube source")
    }
    const initialManifest = buildCourseManifest({
      title: input.courseTitle,
      sourceType: source.sourceType,
      sourceItems: source.items,
      settings,
      namespace: correlationId,
    })
    initialManifest.sourceTitle = input.courseTitle
    const manifest = await enrichManifest(initialManifest)
    const encodedManifest = JSON.stringify(manifest)
    if (encodedManifest.length > 49_000) {
      throw new ApiError(422, "COURSE_TOO_LARGE", "This playlist is too large for one Pod track. Split it into two focused tracks.")
    }

    const now = new Date().toISOString()
    const totalChapters = manifest.modules.reduce((sum, module) => sum + module.chapters.length, 0)
    const course = await databases.createDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, "unique()", {
      podId: input.podId,
      courseTitle: input.courseTitle,
      youtubeUrl: input.youtubeUrl,
      videoId: source.videoId || "",
      status: "completed",
      progress: 100,
      totalChapters,
      completedChapters: 0,
      chapters: encodedManifest,
      assignments: JSON.stringify([]),
      notes: JSON.stringify([]),
      dailyTasks: JSON.stringify([]),
      generationStartedAt: now,
      generationCompletedAt: now,
      createdAt: now,
      createdBy: auth.userId,
      updatedAt: now,
      correlationId,
    })

    return NextResponse.json({
      success: true,
      correlationId,
      course,
      source: { type: source.sourceType, itemCount: source.items.length, metadataMode: source.metadataMode },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code, correlationId }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Could not structure this course"
    console.error("Pod course generation failed", { correlationId, message })
    return NextResponse.json({ error: message, correlationId }, { status: 500 })
  }
}
