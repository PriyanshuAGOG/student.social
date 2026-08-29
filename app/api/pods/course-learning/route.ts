import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { z } from "zod"
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from "@/lib/api-security"
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-server"
import {
  allCourseChapters,
  calculateLearnerCompletion,
  getUnlockedChapterIds,
  parseCourseManifest,
  parseJson,
  parseProgressDocument,
} from "@/lib/courses/pod-course"
import { createAdminClient } from "@/lib/server/appwrite"

const PROGRESS_COLLECTION = "user_course_progress"
const ASSIGNMENTS_COLLECTION = "course_assignments"
const SUBMISSIONS_COLLECTION = "assignment_submissions"

const attemptSchema = z.object({
  podId: z.string().trim().min(1).max(255),
  courseId: z.string().trim().min(1).max(255),
  chapterId: z.string().trim().min(1).max(255),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
  timeSpentMinutes: z.number().int().min(0).max(1440).default(0),
})

async function getAuthorizedCourse(databases: any, auth: any, podId: string, courseId: string) {
  const [pod, course] = await Promise.all([
    databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId),
    databases.getDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId),
  ])
  const members = Array.isArray(pod.members) ? pod.members : []
  if (pod.creatorId !== auth.userId && !members.includes(auth.userId)) throw new ApiError(403, "FORBIDDEN", "Join this Pod to learn with the cohort")
  if (course.podId !== podId) throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found in this Pod")
  return course
}

async function getOrCreateProgress(databases: any, userId: string, courseId: string, totalChapters: number) {
  const existing = await databases.listDocuments(DATABASE_ID, PROGRESS_COLLECTION, [
    Query.equal("userId", userId),
    Query.equal("courseId", courseId),
    Query.limit(1),
  ])
  if (existing.total > 0) return existing.documents[0]
  const now = new Date().toISOString()
  return databases.createDocument(DATABASE_ID, PROGRESS_COLLECTION, "unique()", {
    userId,
    courseId,
    enrolledAt: now,
    completionPercentage: 0,
    chaptersCompleted: 0,
    totalChapters,
    averageScore: 0,
    finalScore: 0,
    courseStatus: "in_progress",
    certificateEarned: false,
    timeSpent: 0,
    lastAccessedAt: now,
    bookmarkedChapters: JSON.stringify([]),
    attemptedAssignments: 0,
    completedAssignments: 0,
    completedChapterIds: JSON.stringify([]),
    quizScores: JSON.stringify({}),
    quizAttempts: JSON.stringify({}),
    currentChapterId: "",
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireVerifiedUser(request)
    const podId = request.nextUrl.searchParams.get("podId") || ""
    const courseId = request.nextUrl.searchParams.get("courseId") || ""
    if (!podId || !courseId) throw new ApiError(400, "INVALID_INPUT", "podId and courseId are required")
    const { databases } = await createAdminClient()
    const course = await getAuthorizedCourse(databases, auth, podId, courseId)
    const manifest = parseCourseManifest(course.chapters, course.courseTitle, course.$id)
    const chapters = allCourseChapters(manifest)
    const document = await getOrCreateProgress(databases, auth.userId, courseId, chapters.length)
    const progress = parseProgressDocument(document)
    const unlockedChapterIds = [...getUnlockedChapterIds(manifest, progress)]
    return NextResponse.json({
      progress: { ...progress, completionPercentage: calculateLearnerCompletion(manifest, progress) },
      unlockedChapterIds,
    })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error("Course progress load failed", error)
    return NextResponse.json({ error: "Could not load your course progress" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: "pods:course-attempt", max: 20, windowMs: 60_000 })
    const auth = await requireVerifiedUser(request)
    const input = await parseJsonBody(request, attemptSchema)
    const { databases } = await createAdminClient()
    const course = await getAuthorizedCourse(databases, auth, input.podId, input.courseId)
    const manifest = parseCourseManifest(course.chapters, course.courseTitle, course.$id)
    const chapters = allCourseChapters(manifest)
    const chapterIndex = chapters.findIndex((chapter) => chapter.id === input.chapterId)
    if (chapterIndex < 0) throw new ApiError(404, "LESSON_NOT_FOUND", "Lesson not found")
    const progressDocument = await getOrCreateProgress(databases, auth.userId, input.courseId, chapters.length)
    const progress = parseProgressDocument(progressDocument)
    if (!getUnlockedChapterIds(manifest, progress).has(input.chapterId)) {
      throw new ApiError(409, "LESSON_LOCKED", "Complete the previous mastery check first")
    }

    const assignments = await databases.listDocuments(DATABASE_ID, ASSIGNMENTS_COLLECTION, [
      Query.equal("chapterId", input.chapterId),
      Query.orderAsc("sequenceNumber"),
      Query.limit(20),
    ])
    if (assignments.total < 1) throw new ApiError(409, "QUIZ_NOT_READY", "Open the lesson material before taking its mastery check")
    const answered = assignments.documents.filter((assignment: any) => Number.isInteger(input.answers[assignment.$id]))
    if (answered.length !== assignments.total) throw new ApiError(400, "INCOMPLETE_QUIZ", "Answer every question before submitting")

    let correct = 0
    const feedback = assignments.documents.map((assignment: any) => {
      const rubric = parseJson<any>(assignment.rubric, {})
      const isCorrect = input.answers[assignment.$id] === Number(rubric.correctOption)
      if (isCorrect) correct += 1
      return { assignmentId: assignment.$id, correct: isCorrect, explanation: rubric.explanation || "Review the lesson notes and try again." }
    })
    const score = Math.round((correct / assignments.total) * 100)
    const passed = score >= manifest.settings.passingScore
    const completedChapterIds = passed
      ? [...new Set([...progress.completedChapterIds, input.chapterId])]
      : progress.completedChapterIds
    const quizScores = { ...progress.quizScores, [input.chapterId]: Math.max(score, progress.quizScores[input.chapterId] || 0) }
    const quizAttempts = { ...progress.quizAttempts, [input.chapterId]: (progress.quizAttempts[input.chapterId] || 0) + 1 }
    const updatedProgress = {
      ...progress,
      completedChapterIds,
      quizScores,
      quizAttempts,
      currentChapterId: passed ? chapters[chapterIndex + 1]?.id || input.chapterId : input.chapterId,
      timeSpentMinutes: progress.timeSpentMinutes + (input.timeSpentMinutes || 0),
    }
    const completionPercentage = calculateLearnerCompletion(manifest, updatedProgress)
    const scoreValues = Object.values(quizScores)
    const now = new Date().toISOString()

    await databases.updateDocument(DATABASE_ID, PROGRESS_COLLECTION, progressDocument.$id, {
      completionPercentage,
      chaptersCompleted: completedChapterIds.length,
      totalChapters: chapters.length,
      averageScore: scoreValues.length ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : 0,
      finalScore: completionPercentage === 100 ? scoreValues.reduce((sum, value) => sum + value, 0) / Math.max(1, scoreValues.length) : 0,
      courseStatus: completionPercentage === 100 ? "completed" : "in_progress",
      certificateEarned: completionPercentage === 100,
      timeSpent: updatedProgress.timeSpentMinutes,
      lastAccessedAt: now,
      attemptedAssignments: Number(progressDocument.attemptedAssignments || 0) + assignments.total,
      completedAssignments: Number(progressDocument.completedAssignments || 0) + (passed ? assignments.total : 0),
      completedChapterIds: JSON.stringify(completedChapterIds),
      quizScores: JSON.stringify(quizScores),
      quizAttempts: JSON.stringify(quizAttempts),
      currentChapterId: updatedProgress.currentChapterId || "",
    })

    for (const assignment of assignments.documents) {
      const itemFeedback = feedback.find((item) => item.assignmentId === assignment.$id)
      await databases.createDocument(DATABASE_ID, SUBMISSIONS_COLLECTION, "unique()", {
        assignmentId: assignment.$id,
        courseId: input.courseId,
        userId: auth.userId,
        submissionText: JSON.stringify({ selectedOption: input.answers[assignment.$id], chapterId: input.chapterId }),
        submittedAt: now,
        score: itemFeedback?.correct ? 100 : 0,
        confidence: 1,
        aiGeneratedFeedback: itemFeedback?.explanation || "",
        isAutoGraded: true,
        flaggedForReview: false,
        gradedAt: now,
        revisionCount: quizAttempts[input.chapterId],
        status: itemFeedback?.correct ? "passed" : "needs_review",
      })
    }

    return NextResponse.json({
      passed,
      score,
      passingScore: manifest.settings.passingScore,
      feedback,
      progress: { ...updatedProgress, completionPercentage },
      unlockedChapterIds: [...getUnlockedChapterIds(manifest, updatedProgress)],
      nextChapterId: passed ? chapters[chapterIndex + 1]?.id || null : input.chapterId,
    })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error("Course mastery attempt failed", error)
    return NextResponse.json({ error: "Could not grade this mastery check. Your answers are safe; please retry." }, { status: 500 })
  }
}
