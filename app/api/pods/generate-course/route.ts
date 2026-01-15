import { NextRequest, NextResponse } from "next/server"
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Client, Databases } from "node-appwrite"

function getDatabases() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (endpoint && project && apiKey) {
    const adminClient = new Client()
      .setEndpoint(endpoint)
      .setProject(project)
      .setKey(apiKey)

    return new Databases(adminClient)
  }

  // Fallback to public client (requires session auth)
  return new Databases(client)
}

export async function POST(request: NextRequest) {
  try {
    const { podId, youtubeUrl, courseTitle } = await request.json()

    if (!podId || !youtubeUrl || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields: podId, youtubeUrl, courseTitle" },
        { status: 400 }
      )
    }

    // Check if pod already has a course
    const databases = getDatabases()
    const existingCourses = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      [`equal("podId", "${podId}")`]
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
      chapters: [],
      notes: [],
      assignments: [],
      dailyTasks: [],
      createdAt: new Date().toISOString(),
      createdBy: request.headers.get("user-id") || "anonymous",
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
    const databases = getDatabases()
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
      status: "completed",
      progress: 100,
      chapters,
      assignments,
      dailyTasks,
      notes,
    })
  } catch (error) {
    console.error("Error in course generation background job:", error)
    try {
      const databases = getDatabases()
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
