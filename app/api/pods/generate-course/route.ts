// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/server/appwrite"
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite-server"
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from "@/lib/api-security"
import { z } from "zod"
import { parseJsonBody } from "@/lib/api-security"

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: "pods:generate-course", max: 5, windowMs: 60 * 1000 })
    const auth = requireUser(request)
    const { podId, youtubeUrl, courseTitle } = await parseJsonBody(request, z.object({ podId: z.string().min(1).max(255), youtubeUrl: z.string().url().max(500), courseTitle: z.string().trim().min(3).max(180) }))

    // Check if pod already has a course
    const { databases } = await createAdminClient()
    const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
    const members = Array.isArray(pod.members) ? pod.members : []
    if (pod.creatorId !== auth.userId && !members.includes(auth.userId)) {
      return NextResponse.json({ error: "Only pod members can generate a course for this pod" }, { status: 403 })
    }

    const existingCourses = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      [Query.equal('podId', podId)]
    )

    if (existingCourses.documents.length > 0) {
      return NextResponse.json(
        { error: "This pod already has a course. Each pod can only have one course." },
        { status: 400 }
      )
    }

    // Create course document with generating status
    const courseData = {
      podId,
      courseTitle,
      youtubeUrl,
      status: "generating",
      progress: 0,
      chapters: JSON.stringify([]),
      notes: JSON.stringify([]),
      assignments: JSON.stringify([]),
      dailyTasks: JSON.stringify([]),
      createdAt: new Date().toISOString(),
      createdBy: auth.userId,
      updatedAt: new Date().toISOString(),
    }

    const course = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      "unique()",
      courseData
    )

    // Start background job to generate course
    // This would typically be done with a queue like Bull or Inngest
    // For now, we'll trigger a background process
    triggerCourseGeneration(course.$id, podId, youtubeUrl, courseTitle)

    return NextResponse.json(
      { course: { ...courseData, $id: course.$id } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error("Error generating course:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate course" },
      { status: 500 }
    )
  }
}

// Background function to generate course from YouTube
async function triggerCourseGeneration(
  courseId: string,
  podId: string,
  youtubeUrl: string,
  courseTitle: string
) {
  try {
    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      throw new Error("Invalid YouTube URL")
    }

    // Call YouTube transcript extraction
    const transcriptResponse = await fetch(
      `/api/courses/extract-transcript?videoId=${videoId}`
    )
    if (!transcriptResponse.ok) {
      throw new Error("Failed to extract transcript")
    }

    const { transcript } = await transcriptResponse.json()

    // Call course generation with transcript
    const generateResponse = await fetch("/api/courses/process-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        courseTitle,
        youtubeUrl,
        courseId, // Store reference to pod course
        podId,
      }),
    })

    if (!generateResponse.ok) {
      throw new Error("Failed to generate course content")
    }

    const { chapters, assignments, dailyTasks, notes } =
      await generateResponse.json()

    // Update course document with generated content
    const { databases } = await createAdminClient()
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
      status: "completed",
      progress: 100,
      chapters: JSON.stringify(chapters || []),
      assignments: JSON.stringify(assignments || []),
      dailyTasks: JSON.stringify(dailyTasks || []),
      notes: JSON.stringify(notes || []),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in course generation background job:", error)
    try {
      const { databases } = await createAdminClient()
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
        status: "error",
        progress: 0,
      })
    } catch (updateError) {
      console.error("Failed to update course status to error:", updateError)
    }
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop() || null
  } catch {
    return null
  }
}
