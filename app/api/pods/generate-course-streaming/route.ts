/**
 * Streaming Course Generation API
 * 
 * Generates courses incrementally - first creates chapter stubs,
 * then generates content progressively as user views chapters.
 * Much faster perceived performance and better UX.
 * 
 * @endpoint POST /api/pods/generate-course-streaming
 * @requires podId, youtubeUrl, courseTitle
 */

import { NextRequest, NextResponse } from "next/server"
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Client, Databases, Query } from "node-appwrite"
import { runAIChat } from "@/lib/ai"

const REQUEST_TIMEOUT = 30000 // 30 second timeout

// Structured logging helper
function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const logEntry = { timestamp, level, message, ...data }
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
  }
}

function getDatabases() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint) {
    throw new Error("Missing APPWRITE_ENDPOINT environment variable")
  }
  if (!project) {
    throw new Error("Missing APPWRITE_PROJECT_ID environment variable")
  }
  if (!apiKey) {
    throw new Error("Missing APPWRITE_API_KEY environment variable - required for server-side operations")
  }

  const adminClient = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey)

  return new Databases(adminClient)
}

// Extract video ID with timeout
async function extractVideoIdWithTimeout(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Video ID extraction timeout")),
      5000
    )

    try {
      const urlObj = new URL(url)
      // Handle various YouTube URL formats
      let videoId = urlObj.searchParams.get("v") // youtube.com/watch?v=XXX
      
      if (!videoId && urlObj.hostname.includes('youtu.be')) {
        // youtu.be/XXX format
        videoId = urlObj.pathname.slice(1)
      }
      
      if (!videoId) {
        // youtube.com/embed/XXX format
        const pathParts = urlObj.pathname.split("/")
        const embedIndex = pathParts.indexOf('embed')
        if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
          videoId = pathParts[embedIndex + 1]
        }
      }
      
      if (!videoId) {
        // Last resort: try to get from path
        videoId = urlObj.pathname.split("/").pop() || null
      }

      clearTimeout(timeout)
      
      if (videoId && videoId.length > 5) {
        resolve(videoId)
      } else {
        reject(new Error("Could not extract video ID from URL"))
      }
    } catch (err) {
      clearTimeout(timeout)
      reject(err)
    }
  })
}

// Generate chapter stubs quickly
async function generateChapterStubs(
  courseTitle: string,
  youtubeUrl: string
): Promise<any[]> {
  try {
    const response = await Promise.race([
      runAIChat([
        {
          role: "system",
          content: `You are a course curriculum expert. Given a course title and YouTube URL, 
generate a structured list of 4-6 chapters that would logically divide the course content.
Return ONLY a JSON array with no markdown formatting. Each chapter should have: 
{
  "chapterNumber": 1,
  "title": "Chapter title",
  "description": "What this chapter covers",
  "estimatedMinutes": 15,
  "objectives": ["objective 1", "objective 2"],
  "locked": false,
  "contentGenerated": false
}`,
        },
        {
          role: "user",
          content: `Course Title: "${courseTitle}"\nYouTube URL: ${youtubeUrl}\n\nGenerate chapter structure for this course.`,
        },
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Chapter generation timeout")), 15000)
      ),
    ]) as string

    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : response
      const chapters = JSON.parse(jsonStr)
      
      // Validate structure
      if (!Array.isArray(chapters) || chapters.length === 0) {
        throw new Error("Invalid chapter structure")
      }

      // Only first chapter unlocked initially
      return chapters.map((ch, idx) => ({
        ...ch,
        locked: idx > 0,
        contentGenerated: false,
        createdAt: new Date().toISOString(),
      }))
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      throw new Error(`Failed to parse AI response: ${msg}`)
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Chapter stub generation failed: ${msg}`)
  }
}

export async function POST(request: NextRequest) {
  // Generate correlation ID for request tracing
  const correlationId = request.headers.get('x-correlation-id') || 
    `course-gen-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  
  const startTime = Date.now()
  
  try {
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      log('warn', 'Invalid JSON in request body', { correlationId })
      return NextResponse.json(
        { error: "Invalid JSON in request body", correlationId },
        { status: 400 }
      )
    }

    const { podId, youtubeUrl, courseTitle } = body

    log('info', 'Course generation request received', { correlationId, podId, courseTitle })

    // Input validation
    if (!podId || !youtubeUrl || !courseTitle) {
      log('warn', 'Missing required fields', { correlationId, podId: !!podId, youtubeUrl: !!youtubeUrl, courseTitle: !!courseTitle })
      return NextResponse.json(
        { error: "Missing required fields: podId, youtubeUrl, courseTitle", correlationId },
        { status: 400 }
      )
    }

    if (typeof courseTitle !== 'string' || courseTitle.length < 3 || courseTitle.length > 200) {
      return NextResponse.json(
        { error: "Course title must be a string between 3 and 200 characters", correlationId },
        { status: 400 }
      )
    }

    // Allow both youtube.com and youtu.be URLs
    if (typeof youtubeUrl !== 'string' || (!youtubeUrl.includes('youtube') && !youtubeUrl.includes('youtu.be'))) {
      return NextResponse.json(
        { error: "youtubeUrl must be a valid YouTube URL (youtube.com or youtu.be)", correlationId },
        { status: 400 }
      )
    }

    let databases
    try {
      databases = getDatabases()
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error'
      log('error', 'Database connection failed', { correlationId, error: errorMsg })
      return NextResponse.json(
        { error: `Server configuration error. Please contact support.`, correlationId, details: process.env.NODE_ENV === 'development' ? errorMsg : undefined },
        { status: 500 }
      )
    }

    // Check if pod already has a course
    let existingCourses
    try {
      existingCourses = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POD_COURSES,
        [Query.equal('podId', podId)]
      )
    } catch (e: any) {
      log('error', 'Failed to check existing courses', { correlationId, error: e?.message })
      return NextResponse.json(
        { error: `Failed to check existing courses. Please try again.`, correlationId },
        { status: 500 }
      )
    }

    if (existingCourses.documents.length > 0) {
      log('info', 'Pod already has a course', { correlationId, podId })
      return NextResponse.json(
        { error: "This pod already has a course. Each pod can only have one course.", correlationId },
        { status: 400 }
      )
    }

    // Extract video ID with timeout
    let videoId: string
    try {
      videoId = await extractVideoIdWithTimeout(youtubeUrl)
      log('info', 'Video ID extracted', { correlationId, videoId })
    } catch (error) {
      log('warn', 'Failed to extract video ID', { correlationId, youtubeUrl, error: (error as Error)?.message })
      return NextResponse.json(
        { error: `Invalid YouTube URL: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId },
        { status: 400 }
      )
    }

    // Generate chapter stubs (quick, AI-based)
    let chapters: any[]
    try {
      log('info', 'Generating chapter stubs', { correlationId, courseTitle })
      chapters = await generateChapterStubs(courseTitle, youtubeUrl)
      log('info', 'Chapter stubs generated', { correlationId, chapterCount: chapters.length })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      log('error', 'Failed to generate chapter stubs', { correlationId, error: msg })
      return NextResponse.json(
        { error: `Failed to generate course structure. The AI service may be temporarily unavailable. Please try again.`, correlationId },
        { status: 500 }
      )
    }

    if (!Array.isArray(chapters) || chapters.length === 0) {
      log('error', 'No valid chapters generated', { correlationId })
      return NextResponse.json(
        { error: "Failed to generate valid course chapters. Please try a different course title.", correlationId },
        { status: 500 }
      )
    }

    // Create course document with chapter stubs (status: "structuring")
    const now = new Date().toISOString()
    const courseData = {
      podId,
      courseTitle,
      youtubeUrl,
      videoId,
      status: "structuring",
      progress: 0,
      totalChapters: chapters.length,
      completedChapters: 0,
      chapters: JSON.stringify(chapters),
      assignments: JSON.stringify([]),
      notes: JSON.stringify([]),
      dailyTasks: JSON.stringify([]),
      generationStartedAt: now,
      createdAt: now,
      createdBy: request.headers.get("x-user-id") || request.headers.get("user-id") || "anonymous",
      updatedAt: now,
      correlationId, // Store for debugging
    }

    let course
    try {
      course = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.POD_COURSES,
        "unique()",
        courseData
      )
      log('info', 'Course document created', { correlationId, courseId: course.$id })
    } catch (e: any) {
      const msg = e?.message || String(e)
      log('error', 'Failed to create course document', { correlationId, error: msg })
      return NextResponse.json(
        { error: `Failed to create course. Please try again.`, correlationId },
        { status: 500 }
      )
    }

    // Trigger background job to generate chapter content progressively
    generateChapterContentAsync(
      course.$id,
      podId,
      youtubeUrl,
      videoId,
      courseTitle,
      chapters,
      correlationId
    ).catch(error => {
      const msg = error instanceof Error ? error.message : String(error)
      log('error', 'Background chapter generation failed', { correlationId, courseId: course.$id, error: msg })
    })

    const duration = Date.now() - startTime
    log('info', 'Course generation request completed', { correlationId, courseId: course.$id, duration })

    return NextResponse.json(
      {
        success: true,
        correlationId,
        course: {
          ...courseData,
          $id: course.$id,
          chapters: chapters,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate course"
    log('error', 'Unhandled error in course generation', { correlationId, error: msg, stack: (error as Error)?.stack })
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again.", correlationId },
      { status: 500 }
    )
  }
}

// Async background job - generates chapter content progressively
async function generateChapterContentAsync(
  courseId: string,
  podId: string,
  youtubeUrl: string,
  videoId: string,
  courseTitle: string,
  chapters: any[],
  correlationId?: string
) {
  try {
    log('info', 'Starting background chapter content generation', { correlationId, courseId, chapterCount: chapters.length })
    const databases = getDatabases()
    let generatedCount = 0

    // Generate content for each chapter progressively
    for (let i = 0; i < chapters.length; i++) {
      try {
        // Generate content for this specific chapter (with timeout)
        const chapterContent = await Promise.race([
          generateChapterContent(courseTitle, chapters[i], i),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Chapter content generation timeout")), 20000)
          ),
        ] as const)

        // Update chapter with generated content
        chapters[i] = {
          ...chapters[i],
          ...chapterContent,
          contentGenerated: true,
        }

        // Unlock next chapter if this one is completed
        if (i + 1 < chapters.length) {
          chapters[i + 1].locked = false
        }

        generatedCount++

        // Update progress in database
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.POD_COURSES,
          courseId,
          {
            chapters: JSON.stringify(chapters),
            progress: Math.round((generatedCount / chapters.length) * 100),
            completedChapters: generatedCount,
            updatedAt: new Date().toISOString(),
          }
        )
      } catch (chapterError: unknown) {
        const msg = chapterError instanceof Error ? chapterError.message : String(chapterError)
        console.warn(`[generateChapterContent] Failed to generate chapter ${i + 1}: ${msg}`)
        // Continue to next chapter on error
        chapters[i].contentGenerated = false
        chapters[i].error = msg
      }
    }

    // Mark course as completed
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
      status: "completed",
      progress: 100,
      chapters: JSON.stringify(chapters),
      completedChapters: generatedCount,
      generationCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[generateChapterContentAsync] Fatal error: ${msg}`)
    try {
      const databases = getDatabases()
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
        status: "error",
        error: msg,
        updatedAt: new Date().toISOString(),
      })
    } catch (updateError: unknown) {
      const updateMsg = updateError instanceof Error ? updateError.message : String(updateError)
      console.error(`[generateChapterContentAsync] Failed to update error status: ${updateMsg}`)
    }
  }
}

// Generate detailed content for a single chapter
async function generateChapterContent(
  courseTitle: string,
  chapter: any,
  chapterIndex: number
): Promise<any> {
  try {
    const response = await runAIChat([
      {
        role: "system",
        content: `You are an expert course content creator. Generate detailed educational content for a chapter.
Return ONLY a JSON object with no markdown formatting. Structure:
{
  "content": "detailed chapter content (2-3 paragraphs)",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "assignments": [
    {
      "id": "assign-1",
      "title": "Assignment title",
      "description": "What to do",
      "dueInDays": 3
    }
  ],
  "notes": ["note 1", "note 2"],
  "resources": ["resource link 1", "resource link 2"]
}`,
      },
      {
        role: "user",
        content: `Course: "${courseTitle}"\nChapter ${chapterIndex + 1}: ${chapter.title}\nDescription: ${chapter.description}\nObjectives: ${chapter.objectives.join(", ")}\n\nCreate detailed chapter content.`,
      },
    ])

    // Extract and validate JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const content = JSON.parse(jsonMatch[0])
    
    // Validate structure
    if (!content.content || !Array.isArray(content.keyPoints)) {
      throw new Error("Invalid content structure")
    }

    return {
      content: content.content,
      keyPoints: content.keyPoints,
      assignments: content.assignments || [],
      notes: content.notes || [],
      resources: content.resources || [],
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Chapter content generation failed: ${msg}`)
  }
}
