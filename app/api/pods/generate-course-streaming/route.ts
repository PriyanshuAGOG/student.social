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
import { getTranscript } from "@/lib/video-utils"

const REQUEST_TIMEOUT = 30000; // 30 second timeout

function getDatabases() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !project || !apiKey) {
    throw new Error("Missing Appwrite server credentials")
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

// Generate chapter stubs (with optional transcript)
async function generateChapterStubs(
  courseTitle: string,
  youtubeUrl: string,
  transcript?: string | null
): Promise<any[]> {
  try {
    const systemPrompt = transcript
      ? `You are a course curriculum expert. Given a course title and the video transcript below, generate a structured list of 4-8 chapters that logically divide the content.
        The chapters should follow the flow of the real content provided in the transcript.`
      : `You are a course curriculum expert. Given a course title and YouTube URL, generate a structured list of 4-6 chapters that would logically divide the course content.`;

    const userPrompt = transcript
      ? `Course Title: "${courseTitle}"\n\nTRANSCRIPT START:\n${transcript.slice(0, 15000)}...\nTRANSCRIPT END\n\nGenerate chapter structure for this course based on the transcript above.`
      : `Course Title: "${courseTitle}"\nYouTube URL: ${youtubeUrl}\n\nGenerate chapter structure for this course.`;

    const response = await Promise.race([
      runAIChat([
        {
          role: "system",
          content: `${systemPrompt}
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
          content: userPrompt,
        },
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Chapter generation timeout")), 25000)
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
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { podId, youtubeUrl, courseTitle } = body

    // Input validation
    if (!podId || !youtubeUrl || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields: podId, youtubeUrl, courseTitle" },
        { status: 400 }
      )
    }

    if (typeof courseTitle !== 'string' || courseTitle.length < 3 || courseTitle.length > 200) {
      return NextResponse.json(
        { error: "Course title must be a string between 3 and 200 characters" },
        { status: 400 }
      )
    }

    if (typeof youtubeUrl !== 'string' || !youtubeUrl.includes('youtube') && !youtubeUrl.includes('youtu.be')) {
      return NextResponse.json(
        { error: "youtubeUrl must be a valid YouTube URL" },
        { status: 400 }
      )
    }

    let databases
    try {
      databases = getDatabases()
    } catch (e) {
      return NextResponse.json(
        { error: `Database connection failed: ${e instanceof Error ? e.message : 'Unknown error'}` },
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
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to check existing courses: ${e.message}` },
        { status: 500 }
      )
    }

    if (existingCourses.documents.length > 0) {
      // For development, we might want to allow replacing, but for now strict 1:1
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
        { error: `Invalid YouTube URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Fetch transcript (best effort)
    let transcript: string | null = null
    try {
      transcript = await getTranscript(videoId)
      if (transcript) {
        console.log(`[generate-course] Transcript fetched, length: ${transcript.length}`)
      } else {
        console.log(`[generate-course] No transcript available for ${videoId}`)
      }
    } catch (e) {
      console.warn(`[generate-course] Failed to fetch transcript: ${e}`)
    }

    // Generate chapter stubs (quick, AI-based)
    let chapters: any[]
    try {
      chapters = await generateChapterStubs(courseTitle, youtubeUrl, transcript)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return NextResponse.json(
        { error: `Failed to generate course structure: ${msg}` },
        { status: 500 }
      )
    }

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate valid course chapters" },
        { status: 500 }
      )
    }

    // Create course document with chapter stubs (status: "structuring")
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
      generationStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: request.headers.get("user-id") || "anonymous",
      updatedAt: new Date().toISOString(),
    }

    let course
    try {
      course = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.POD_COURSES,
        "unique()",
        courseData
      )
    } catch (e) {
      const msg = e.message || String(e)
      return NextResponse.json(
        { error: `Failed to create course document: ${msg}` },
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
      transcript
    ).catch(error => {
      console.error(`[generateChapterContentAsync] Background job failed: ${error.message}`)
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
    const msg = error instanceof Error ? error.message : "Failed to generate course"
    return NextResponse.json(
      { error: msg },
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
  transcript?: string | null
) {
  try {
    const databases = getDatabases()
    let generatedCount = 0

    // Generate content for each chapter progressively
    for (let i = 0; i < chapters.length; i++) {
      try {
        // Generate content for this specific chapter (with timeout)
        const chapterContent = await Promise.race([
          generateChapterContent(courseTitle, chapters[i], i, transcript),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Chapter content generation timeout")), 45000) // Increased timeout for content
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
        console.warn(`[generateChapterContent] Failed to generate chapter ${i + 1}: ${chapterError instanceof Error ? chapterError.message : String(chapterError)}`)
        // Continue to next chapter on error, but mark as error
        chapters[i].contentGenerated = false
        chapters[i].error = chapterError instanceof Error ? chapterError.message : "Unknown error"
      }
    }

    // Mark course as completed (even if some chapters failed, we finish the process)
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
      status: "completed",
      progress: 100,
      chapters: JSON.stringify(chapters),
      completedChapters: generatedCount,
      generationCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[generateChapterContentAsync] Fatal error: ${error instanceof Error ? error.message : String(error)}`)
    try {
      const databases = getDatabases()
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COURSES, courseId, {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        updatedAt: new Date().toISOString(),
      })
    } catch (updateError) {
      console.error(`[generateChapterContentAsync] Failed to update error status: ${updateError instanceof Error ? updateError.message : String(updateError)}`)
    }
  }
}

// Generate detailed content for a single chapter
async function generateChapterContent(
  courseTitle: string,
  chapter: any,
  chapterIndex: number,
  transcript?: string | null
): Promise<any> {
  try {
    const systemPrompt = transcript
      ? `You are an expert course content creator. Generate detailed educational content for a chapter based on the provided video transcript.
        Make sure the content (key points, assignments) relies on the actual information from the transcript as much as possible.`
      : `You are an expert course content creator. Generate detailed educational content for a chapter.`;

    const userPrompt = transcript
      ? `Course: "${courseTitle}"\nChapter ${chapterIndex + 1}: ${chapter.title}\nDescription: ${chapter.description}\nObjectives: ${chapter.objectives.join(", ")}\n\nFULL TRANSCRIPT:\n${transcript}\n\nUsing the transcript, create detailed content for this chapter covering the objectives.`
      : `Course: "${courseTitle}"\nChapter ${chapterIndex + 1}: ${chapter.title}\nDescription: ${chapter.description}\nObjectives: ${chapter.objectives.join(", ")}\n\nCreate detailed chapter content.`;

    const response = await runAIChat([
      {
        role: "system",
        content: `${systemPrompt}
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
        content: userPrompt,
      },
    ], {
      // Use efficient model that handles large context if transcript is present
      // or fallback models from lib/ai.ts will handle it
      maxTokens: 2000
    })

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

    // Ensure IDs are unique-ish
    const assignments = (content.assignments || []).map((a: any, idx: number) => ({
      ...a,
      id: a.id || `assign-${chapter.chapterNumber}-${idx}-${Date.now()}`
    }))

    return {
      content: content.content,
      keyPoints: content.keyPoints,
      assignments: assignments,
      notes: content.notes || [],
      resources: content.resources || [],
    }
  } catch (error) {
    throw new Error(`Chapter content generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
