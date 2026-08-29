import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { z } from "zod"
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from "@/lib/api-security"
import { runAIChat } from "@/lib/ai"
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-server"
import { allCourseChapters, parseCourseManifest, parseJson } from "@/lib/courses/pod-course"
import { createAdminClient } from "@/lib/server/appwrite"
import { getTimestampedTranscript } from "@/lib/video-utils"

const CONTENT_COLLECTION = "course_content"
const ASSIGNMENTS_COLLECTION = "course_assignments"

const requestSchema = z.object({
  podId: z.string().trim().min(1).max(255),
  courseId: z.string().trim().min(1).max(255),
  chapterId: z.string().trim().min(1).max(255),
})

const generatedMaterialSchema = z.object({
  summary: z.string().min(30).max(1400),
  detailedNotes: z.array(z.object({
    heading: z.string().min(2).max(120),
    body: z.string().min(10).max(700),
    timestampSeconds: z.number().nonnegative().optional(),
  })).min(2).max(6),
  keyTakeaways: z.array(z.string().min(3).max(240)).min(3).max(7),
  glossary: z.array(z.object({ term: z.string().max(80), definition: z.string().max(300) })).max(8),
  practicePrompt: z.string().min(10).max(500),
  questions: z.array(z.object({
    question: z.string().min(5).max(500),
    options: z.array(z.string().min(1).max(240)).length(4),
    correctOption: z.number().int().min(0).max(3),
    explanation: z.string().min(5).max(500),
    evidenceTimestampSeconds: z.number().nonnegative().optional(),
  })).min(3).max(5),
})

function stableId(prefix: string, value: string) {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`
}

function extractJsonObject(response: string) {
  const match = response.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Lesson material was not returned as structured JSON")
  return JSON.parse(match[0])
}

function fallbackMaterial(chapter: any) {
  const firstObjective = chapter.objectives?.[0] || "explain the lesson's central idea"
  return generatedMaterialSchema.parse({
    summary: `${chapter.description} Use the source segment, the key takeaways below, and the Pod discussion prompt to turn passive viewing into active understanding.`,
    detailedNotes: [
      { heading: "What to notice", body: `Watch for the main idea behind “${chapter.title}”. Pause when the source introduces a definition, decision, or worked example.`, timestampSeconds: chapter.startSeconds },
      { heading: "Make it usable", body: `After watching, close the player and ${firstObjective.toLowerCase()}. Add one example from your own context before taking the mastery check.`, timestampSeconds: chapter.endSeconds },
    ],
    keyTakeaways: [
      `Summarize ${chapter.title} without replaying the source.`,
      "Separate the core principle from the example used to teach it.",
      "Name one situation where the idea would and would not apply.",
    ],
    glossary: [],
    practicePrompt: `Post one example of ${chapter.title} in the Pod and ask a peer to challenge your explanation.`,
    questions: [
      { question: "Which activity best demonstrates active understanding of this lesson?", options: ["Explaining and applying the idea", "Replaying without reflection", "Skipping the examples", "Memorizing the title only"], correctOption: 0, explanation: "Explanation and application provide stronger evidence of understanding than passive playback.", evidenceTimestampSeconds: chapter.startSeconds },
      { question: "What should you do before moving to the next lesson?", options: ["Pass the mastery check", "Only open the video", "Wait for another member", "Skip the notes"], correctOption: 0, explanation: "This track uses mastery gates, so passing the check unlocks the next lesson.", evidenceTimestampSeconds: chapter.endSeconds },
      { question: "What is the most useful way to handle an unclear concept?", options: ["Write the exact blocker and ask the Pod", "Ignore it", "Mark the course complete", "Guess silently"], correctOption: 0, explanation: "A precise blocker makes peer and AI support faster and more useful.", evidenceTimestampSeconds: chapter.startSeconds },
    ],
  })
}

function serializeMaterial(content: any, assignments: any[]) {
  return {
    summary: parseJson<string[]>(content?.summaries, [""])[0] || "",
    detailedNotes: parseJson<any[]>(content?.detailedNotes, []),
    keyTakeaways: parseJson<string[]>(content?.keyTakeaways, []),
    glossary: parseJson<any[]>(content?.concepts, []),
    practicePrompt: parseJson<string[]>(content?.realWorldApplications, [""])[0] || "",
    questions: assignments.map((assignment) => ({
      id: assignment.$id,
      question: assignment.questionText,
      options: parseJson<string[]>(assignment.options, []),
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: "pods:course-material", max: 12, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, requestSchema)
    const { databases } = await createAdminClient()
    const [pod, course] = await Promise.all([
      databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, input.podId),
      databases.getDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, input.courseId),
    ])
    const members = Array.isArray(pod.members) ? pod.members : []
    if (pod.creatorId !== auth.userId && !members.includes(auth.userId)) throw new ApiError(403, "FORBIDDEN", "Join this Pod to open its course")
    if (course.podId !== input.podId) throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found in this Pod")

    const manifest = parseCourseManifest(course.chapters, course.courseTitle, course.$id)
    const chapter = allCourseChapters(manifest).find((item) => item.id === input.chapterId)
    if (!chapter) throw new ApiError(404, "LESSON_NOT_FOUND", "Lesson not found")

    const [existingContent, existingAssignments] = await Promise.all([
      databases.listDocuments(DATABASE_ID, CONTENT_COLLECTION, [Query.equal("chapterId", chapter.id), Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, ASSIGNMENTS_COLLECTION, [Query.equal("chapterId", chapter.id), Query.orderAsc("sequenceNumber"), Query.limit(10)]),
    ])
    if (existingContent.total > 0 && existingAssignments.total >= 3) {
      return NextResponse.json({ material: serializeMaterial(existingContent.documents[0], existingAssignments.documents), cached: true })
    }

    const aiConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY)
    const transcript = aiConfigured ? await getTimestampedTranscript(chapter.sourceVideoId) : []
    const relevantSegments = transcript.filter((segment) => {
      if (chapter.endSeconds <= chapter.startSeconds) return true
      return segment.offsetSeconds >= chapter.startSeconds - 5 && segment.offsetSeconds <= chapter.endSeconds + 5
    })
    const evidence = relevantSegments.slice(0, 180).map((segment) => `[${Math.round(segment.offsetSeconds)}s] ${segment.text}`).join("\n").slice(0, 14_000)
    let material: z.infer<typeof generatedMaterialSchema>
    if (!aiConfigured) {
      material = fallbackMaterial(chapter)
    } else try {
      const response = await Promise.race([
        runAIChat([
          {
            role: "system",
            content: `You create source-grounded lesson material. Return only JSON matching: {"summary":"...","detailedNotes":[{"heading":"...","body":"...","timestampSeconds":0}],"keyTakeaways":["..."],"glossary":[{"term":"...","definition":"..."}],"practicePrompt":"...","questions":[{"question":"...","options":["A","B","C","D"],"correctOption":0,"explanation":"...","evidenceTimestampSeconds":0}]}. Create 3-5 fair multiple-choice questions. Every correct answer must be supported by the supplied transcript. If evidence is unavailable, keep the content explicitly skill-practice oriented and do not invent source claims.`,
          },
          {
            role: "user",
            content: JSON.stringify({ chapter, transcriptEvidence: evidence || "Captions unavailable; create a transparent supplemental study scaffold." }),
          },
        ], { maxTokens: 4500 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Lesson generation timed out")), 22_000)),
      ])
      material = generatedMaterialSchema.parse(extractJsonObject(response))
    } catch (error) {
      console.info("Using resilient lesson material fallback", error instanceof Error ? error.message : String(error))
      material = fallbackMaterial(chapter)
    }

    const now = new Date().toISOString()
    const contentId = stableId("content", `${course.$id}:${chapter.id}`)
    if (!existingContent.total) {
      const storedNotes = material.detailedNotes.map((note) => ({ ...note, heading: note.heading.slice(0, 100), body: note.body.slice(0, 560) }))
      const storedGlossary = material.glossary.slice(0, 6).map((item) => ({ term: item.term.slice(0, 70), definition: item.definition.slice(0, 180) }))
      await databases.createDocument(DATABASE_ID, CONTENT_COLLECTION, contentId, {
        chapterId: chapter.id,
        summaries: JSON.stringify([material.summary]),
        keyTakeaways: JSON.stringify(material.keyTakeaways),
        detailedNotes: JSON.stringify(storedNotes),
        concepts: JSON.stringify(storedGlossary),
        formulas: JSON.stringify([]),
        realWorldApplications: JSON.stringify([material.practicePrompt]),
        generatedAt: now,
        llmModel: "student-social-course-material-v2",
        promptHash: stableId("prompt", `${course.$id}:${chapter.id}:v2`),
      })
    }

    const assignmentDocs = []
    for (let index = 0; index < material.questions.length; index += 1) {
      const question = material.questions[index]
      const assignmentId = stableId("quiz", `${course.$id}:${chapter.id}:${index}`)
      try {
        const created = await databases.createDocument(DATABASE_ID, ASSIGNMENTS_COLLECTION, assignmentId, {
          chapterId: chapter.id,
          title: `${chapter.title} · Check ${index + 1}`,
          description: "A source-grounded mastery question.",
          type: "quiz",
          difficulty: manifest.settings.difficulty === "adaptive" ? "medium" : manifest.settings.difficulty,
          estimatedTime: 2,
          questionText: question.question,
          options: JSON.stringify(question.options),
          rubric: JSON.stringify({ correctOption: question.correctOption, explanation: question.explanation, evidenceTimestampSeconds: question.evidenceTimestampSeconds }),
          gradingCriteria: `Pass the lesson at ${manifest.settings.passingScore}% or higher.`,
          sequenceNumber: index + 1,
          variations: JSON.stringify([]),
          createdAt: now,
        })
        assignmentDocs.push(created)
      } catch (error: any) {
        if (error?.code !== 409) throw error
        assignmentDocs.push(await databases.getDocument(DATABASE_ID, ASSIGNMENTS_COLLECTION, assignmentId))
      }
    }

    const content = existingContent.documents[0] || await databases.getDocument(DATABASE_ID, CONTENT_COLLECTION, contentId)
    return NextResponse.json({ material: serializeMaterial(content, assignmentDocs), cached: false })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error("Course material generation failed", error)
    return NextResponse.json({ error: "Could not prepare this lesson. Try again in a moment." }, { status: 500 })
  }
}
