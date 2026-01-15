// @ts-nocheck
/**
 * Streaming Course Generation API
 * 
 * Generates courses incrementally - first creates chapter stubs,
 * then generates content progressively as user views chapters.
 * Much faster perceived performance and better UX.
 */

import { NextRequest, NextResponse } from "next/server"
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Client, Databases, Query } from "node-appwrite"
import { runAIChat } from "@/lib/ai"

const REQUEST_TIMEOUT = 30000; // 30 second timeout

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

  return new Databases(client)
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
      const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop()
      clearTimeout(timeout)
      if (videoId) {
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
    ])

    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
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
    } catch (parseErr) {
      throw new Error(`Failed to parse AI response: ${parseErr.message}`)
    }
  } catch (error) {
    throw new Error(`Chapter stub generation failed: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { podId, youtubeUrl, courseTitle } = await request.json()

    // Input validation
    if (!podId || !youtubeUrl || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields: podId, youtubeUrl, courseTitle" },
        { status: 400 }
      )
    }

    if (courseTitle.length < 3 || courseTitle.length > 200) {
      return NextResponse.json(
        { error: "Course title must be between 3 and 200 characters" },
        { status: 400 }
      )
    }

    const databases = getDatabases()

    // Check if pod already has a course
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

    // Extract video ID with timeout
    let videoId: string
    try {
      videoId = await extractVideoIdWithTimeout(youtubeUrl)
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid YouTube URL: ${error.message}` },
        { status: 400 }
      )
    }

    // Generate chapter stubs (quick, AI-based)
    let chapters: any[]
    try {
      chapters = await generateChapterStubs(courseTitle, youtubeUrl)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to generate course structure: ${error.message}` },
        { status: 500 }
      )
    }

    // Create course document with chapter stubs (status: "structuring")
    const courseData = {
      podId,
      courseTitle,
      youtubeUrl,
      videoId,
      status: "structuring", // Chapter stubs created, waiting for content
      progress: 0,
      totalChapters: chapters.length,
      completedChapters: 0,
      chapters: JSON.stringify(chapters),
      assignments: JSON.stringify([]),
      notes: JSON.stringify([]),
      dailyTasks: JSON.stringify([]),
      generationStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: request.headers.get("user-id") || "anonymous",
      updatedAt: new Date().toISOString(),
    }

    const course = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      "unique()",
      courseData
    )

    // Trigger background job to generate chapter content progressively
    // Don't await this - let it run in background
    generateChapterContentAsync(
      course.$id,
      podId,
      youtubeUrl,
      videoId,
      courseTitle,
      chapters
    ).catch(error => {
      console.error(`[generateCourseStreaming] Background job failed: ${error.message}`)
    })

    return NextResponse.json(
      {
        course: {
          ...courseData,
          $id: course.$id,
          chapters: chapters,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate course" },
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
  chapters: any[]
) {
  try {
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
      } catch (chapterError) {
        console.warn(`[generateChapterContent] Failed to generate chapter ${i + 1}: ${chapterError.message}`)
        // Continue to next chapter on error
        chapters[i].contentGenerated = false
        chapters[i].error = chapterError.message
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
  } catch (error) {
    console.error(`[generateChapterContentAsync] Fatal error: ${error.message}`)
    try {
      const databases = getDatabases()
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
        status: "error",
        error: error.message,
        updatedAt: new Date().toISOString(),
      })
    } catch (updateError) {
      console.error(`[generateChapterContentAsync] Failed to update error status: ${updateError.message}`)
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
  } catch (error) {
    throw new Error(`Chapter content generation failed: ${error.message}`)
  }
}
