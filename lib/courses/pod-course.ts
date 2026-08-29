import { z } from "zod"

export const courseSettingsSchema = z.object({
  moduleTarget: z.number().int().min(3).max(10).default(8),
  estimatedHours: z.number().min(1).max(200).default(10),
  targetWeeks: z.number().int().min(1).max(52).default(8),
  sessionsPerWeek: z.number().int().min(1).max(7).default(4),
  minutesPerSession: z.number().int().min(15).max(240).default(45),
  passingScore: z.number().int().min(50).max(100).default(75),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "adaptive"]).default("adaptive"),
  unlockPolicy: z.literal("mastery").default("mastery"),
})

export type CourseSettings = z.infer<typeof courseSettingsSchema>

export type YouTubeSourceItem = {
  id: string
  videoId: string
  title: string
  url: string
  durationSeconds: number
  position: number
  channelTitle?: string
}

export type CourseChapter = {
  id: string
  order: number
  title: string
  description: string
  estimatedMinutes: number
  objectives: string[]
  topics: string[]
  sourceVideoId: string
  sourceUrl: string
  startSeconds: number
  endSeconds: number
  materialStatus: "pending" | "ready" | "error"
}

export type CourseModule = {
  id: string
  order: number
  title: string
  description: string
  estimatedMinutes: number
  objectives: string[]
  milestone: string
  chapters: CourseChapter[]
}

export type PodCourseManifest = {
  manifestVersion: 2
  sourceType: "video" | "playlist"
  sourceTitle: string
  totalMinutes: number
  settings: CourseSettings
  modules: CourseModule[]
  createdAt: string
}

export type LearnerCourseProgress = {
  completedChapterIds: string[]
  quizScores: Record<string, number>
  quizAttempts: Record<string, number>
  currentChapterId: string | null
  timeSpentMinutes: number
}

export const emptyLearnerProgress = (): LearnerCourseProgress => ({
  completedChapterIds: [],
  quizScores: {},
  quizAttempts: {},
  currentChapterId: null,
  timeSpentMinutes: 0,
})

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function parseCourseManifest(value: unknown, courseTitle = "Pod course", namespace = courseTitle): PodCourseManifest {
  const parsed = typeof value === "string" ? parseJson<any>(value, []) : value
  if (parsed && !Array.isArray(parsed) && parsed.manifestVersion === 2 && Array.isArray(parsed.modules)) {
    return parsed as PodCourseManifest
  }

  const legacyChapters = Array.isArray(parsed) ? parsed : []
  const settings = courseSettingsSchema.parse({})
  const chapters: CourseChapter[] = legacyChapters.map((chapter: any, index: number) => ({
    id: chapter.id || safeId(namespace, "lesson", index),
    order: index + 1,
    title: chapter.title || `Lesson ${index + 1}`,
    description: chapter.description || "Continue through this lesson with your Pod.",
    estimatedMinutes: Number(chapter.estimatedMinutes || 30),
    objectives: Array.isArray(chapter.objectives) ? chapter.objectives : [],
    topics: Array.isArray(chapter.keyPoints) ? chapter.keyPoints.slice(0, 5) : [],
    sourceVideoId: chapter.videoId || "",
    sourceUrl: chapter.youtubeUrl || "",
    startSeconds: Number(chapter.startSeconds || 0),
    endSeconds: Number(chapter.endSeconds || 0),
    materialStatus: chapter.contentGenerated ? "ready" : "pending",
  }))

  return {
    manifestVersion: 2,
    sourceType: "video",
    sourceTitle: courseTitle,
    totalMinutes: chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0),
    settings,
    modules: [{
      id: safeId(namespace, "module", 0),
      order: 1,
      title: "Course journey",
      description: "The original course structure, upgraded to the mastery learning experience.",
      estimatedMinutes: chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0),
      objectives: [],
      milestone: "Complete every lesson and mastery check.",
      chapters,
    }],
    createdAt: new Date().toISOString(),
  }
}

export function allCourseChapters(manifest: PodCourseManifest): CourseChapter[] {
  return manifest.modules.flatMap((module) => module.chapters).sort((a, b) => a.order - b.order)
}

export function getUnlockedChapterIds(manifest: PodCourseManifest, progress: LearnerCourseProgress): Set<string> {
  const chapters = allCourseChapters(manifest)
  const unlocked = new Set<string>()
  if (chapters[0]) unlocked.add(chapters[0].id)
  chapters.forEach((chapter, index) => {
    if (progress.completedChapterIds.includes(chapter.id)) {
      unlocked.add(chapter.id)
      if (chapters[index + 1]) unlocked.add(chapters[index + 1].id)
    }
  })
  return unlocked
}

export function calculateLearnerCompletion(manifest: PodCourseManifest, progress: LearnerCourseProgress): number {
  const total = allCourseChapters(manifest).length
  if (!total) return 0
  return Math.round((new Set(progress.completedChapterIds).size / total) * 100)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function safeId(namespace: string, prefix: string, index: number) {
  const safeNamespace = namespace.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(-18) || "track"
  return `${safeNamespace}-${prefix}-${String(index + 1).padStart(2, "0")}`
}

export function buildCourseManifest(input: {
  title: string
  sourceType: "video" | "playlist"
  sourceItems: YouTubeSourceItem[]
  settings: CourseSettings
  namespace?: string
}): PodCourseManifest {
  const { title, sourceType, sourceItems, settings, namespace = "track" } = input
  const estimatedTotalSeconds = Math.max(
    settings.estimatedHours * 3600,
    sourceItems.reduce((sum, item) => sum + Math.max(0, item.durationSeconds), 0),
  )
  const totalMinutes = Math.max(60, Math.round(estimatedTotalSeconds / 60))
  const moduleCount = clamp(settings.moduleTarget || Math.round(totalMinutes / 450), 3, 10)

  let chapterSeeds: Array<YouTubeSourceItem & { startSeconds: number; endSeconds: number }> = []
  if (sourceItems.length > 1) {
    chapterSeeds = sourceItems.map((item) => ({
      ...item,
      startSeconds: 0,
      endSeconds: item.durationSeconds,
    }))
  } else {
    const source = sourceItems[0]
    const chapterCount = clamp(Math.round(totalMinutes / 60), moduleCount * 2, 60)
    const segmentSeconds = Math.round(estimatedTotalSeconds / chapterCount)
    chapterSeeds = Array.from({ length: chapterCount }, (_, index) => ({
      ...source,
      id: `${source.id}-${index + 1}`,
      title: `${title}: lesson ${index + 1}`,
      position: index,
      durationSeconds: segmentSeconds,
      startSeconds: index * segmentSeconds,
      endSeconds: Math.min(estimatedTotalSeconds, (index + 1) * segmentSeconds),
    }))
  }

  const chaptersPerModule = Math.ceil(chapterSeeds.length / moduleCount)
  const modules: CourseModule[] = Array.from({ length: moduleCount }, (_, moduleIndex) => {
    const seeds = chapterSeeds.slice(moduleIndex * chaptersPerModule, (moduleIndex + 1) * chaptersPerModule)
    const chapters = seeds.map((seed, localIndex) => {
      const order = moduleIndex * chaptersPerModule + localIndex + 1
      return {
        id: safeId(namespace, "lesson", order - 1),
        order,
        title: sourceItems.length > 1 ? seed.title : `Lesson ${order}: ${moduleIndex === 0 ? "Foundations" : `Module ${moduleIndex + 1}`}`,
        description: sourceItems.length > 1
          ? `Study ${seed.title}, capture the core ideas, then prove understanding in a short mastery check.`
          : `A focused segment from ${formatSeconds(seed.startSeconds)} to ${formatSeconds(seed.endSeconds)} with notes, practice, and a mastery check.`,
        estimatedMinutes: Math.max(10, Math.round((seed.endSeconds - seed.startSeconds || seed.durationSeconds) / 60)),
        objectives: ["Explain the central idea in your own words", "Apply the lesson in a practical example"],
        topics: [],
        sourceVideoId: seed.videoId,
        sourceUrl: seed.url,
        startSeconds: seed.startSeconds,
        endSeconds: seed.endSeconds,
        materialStatus: "pending" as const,
      }
    })
    const estimatedMinutes = chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0)
    return {
      id: safeId(namespace, "module", moduleIndex),
      order: moduleIndex + 1,
      title: moduleIndex === 0 ? "Foundations" : moduleIndex === moduleCount - 1 ? "Integration & proof" : `Capability ${moduleIndex + 1}`,
      description: `A coherent stage of ${title} with ${chapters.length} focused lessons and a visible mastery milestone.`,
      estimatedMinutes,
      objectives: ["Build durable understanding", "Use the ideas in a concrete task"],
      milestone: moduleIndex === moduleCount - 1 ? "Complete the course proof-of-learning milestone." : `Demonstrate mastery of module ${moduleIndex + 1}.`,
      chapters,
    }
  }).filter((module) => module.chapters.length > 0)

  return {
    manifestVersion: 2,
    sourceType,
    sourceTitle: title,
    totalMinutes,
    settings,
    modules,
    createdAt: new Date().toISOString(),
  }
}

export function formatSeconds(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`
}

export function parseProgressDocument(document: any): LearnerCourseProgress {
  if (!document) return emptyLearnerProgress()
  return {
    completedChapterIds: parseJson<string[]>(document.completedChapterIds, []),
    quizScores: parseJson<Record<string, number>>(document.quizScores, {}),
    quizAttempts: parseJson<Record<string, number>>(document.quizAttempts, {}),
    currentChapterId: document.currentChapterId || null,
    timeSpentMinutes: Number(document.timeSpent || 0),
  }
}
