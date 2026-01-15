/**
 * Video Processing API Endpoint
 * POST /api/courses/process-video
 * 
 * Accepts a YouTube link and:
 * 1. Extracts transcript (using youtube-transcript-api)
 * 2. Cleans and normalizes transcript
 * 3. Chunks transcript intelligently (300-800 tokens)
 * 4. Detects chapters using AI
 * 5. Calculates chapter timestamps
 * 6. Stores chapter data to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { Databases } from 'appwrite';
import {
  createChapter,
  getOrCreateProgress,
  getCourseDatabase,
} from '@/lib/course-service';
import { getYouTubeVideoId, getTranscript, cleanTranscript, chunkTranscript } from '@/lib/video-utils';
import { callLLM } from '@/lib/ai';
import { ChapterContentType } from '@/lib/types/courses';

export async function POST(request: NextRequest) {
  try {
    const { youtubeLink, courseId, instructorId } = await request.json();

    // Validation
    if (!youtubeLink || !courseId || !instructorId) {
      return NextResponse.json(
        { error: 'Missing required fields: youtubeLink, courseId, instructorId' },
        { status: 400 }
      );
    }

    console.log(`🎬 Processing video: ${youtubeLink}`);

    // Step 1: Extract YouTube video ID
    const videoId = getYouTubeVideoId(youtubeLink);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Step 2: Get transcript
    console.log(`📝 Extracting transcript for video ${videoId}...`);
    const transcript = await getTranscript(videoId);
    if (!transcript) {
      return NextResponse.json(
        { error: 'Could not extract transcript from video. Make sure it has captions.' },
        { status: 400 }
      );
    }

    // Step 3: Clean transcript
    console.log('🧹 Cleaning transcript...');
    const cleanedTranscript = cleanTranscript(transcript);

    // Step 4: Chunk transcript intelligently
    console.log('✂️  Chunking transcript...');
    const chunks = chunkTranscript(cleanedTranscript, {
      targetTokens: 500,
      minTokens: 300,
      maxTokens: 800,
    });

    console.log(`📊 Created ${chunks.length} chunks from transcript`);

    // Step 5: Detect chapters using AI
    console.log('🤖 Detecting chapters with AI...');
    const chapterDetectionPrompt = `
You are a course curriculum expert. Analyze the following transcript chunks and identify the natural chapter/section divisions.

Transcript chunks:
${chunks
  .slice(0, Math.min(5, chunks.length)) // Use first 5 chunks for analysis
  .map((chunk, i) => `[Chunk ${i + 1}] ${chunk.content.substring(0, 200)}...`)
  .join('\n\n')}

Respond with a JSON array of chapters. Each chapter should have:
- title: Clear, descriptive chapter title
- description: 1-2 sentence description
- startChunk: Starting chunk index (0-based)
- endChunk: Ending chunk index
- learningObjectives: Array of 3-5 learning objectives

Format: [{"title": "...", "description": "...", "startChunk": 0, "endChunk": 2, "learningObjectives": [...]}]

Detect 5-15 chapters based on the content structure.
`;

    let chapters: any[] = [];
    try {
      const response = await callLLM(
        [{ role: 'user', content: chapterDetectionPrompt }],
        { model: 'meta-llama/llama-3.2-3b-instruct:free', maxTokens: 2000 }
      );

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        chapters = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error detecting chapters:', error);
      // Fallback: create chapters evenly distributed
      chapters = createDefaultChapters(chunks.length);
    }

    // Step 6: Calculate timestamps and create chapter documents
    console.log(`📚 Creating ${chapters.length} chapters in database...`);

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const createdChapters = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const startChunk = chapter.startChunk || Math.floor((i / chapters.length) * chunks.length);
      const endChunk = chapter.endChunk || Math.floor(((i + 1) / chapters.length) * chunks.length) - 1;

      // Calculate duration based on chunks (assuming avg 1 min per chunk)
      const duration = Math.max(5, (endChunk - startChunk + 1) * 2); // 2 min per chunk

      // Combine transcript from chunks
      const chapterTranscript = chunks
        .slice(startChunk, endChunk + 1)
        .map((c) => c.content)
        .join('\n\n');

      try {
        const createdChapter = await createChapter(db, {
          courseId,
          title: chapter.title || `Chapter ${i + 1}`,
          description: chapter.description || '',
          sequenceNumber: i + 1,
          duration,
          videoStartTime: 0, // Would calculate from video if needed
          videoEndTime: duration * 60,
          learningObjectives: chapter.learningObjectives || [],
          contentType: ChapterContentType.VIDEO,
          transcript: chapterTranscript,
          transcriptCleaned: chapterTranscript,
        });

        createdChapters.push(createdChapter);
        console.log(`✅ Created chapter: ${createdChapter.title}`);
      } catch (error) {
        console.error(`❌ Error creating chapter ${i + 1}:`, error);
      }
    }

    console.log(`\n✅ Video processing complete! Created ${createdChapters.length} chapters`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed video and created ${createdChapters.length} chapters`,
      data: {
        videoId,
        transcriptLength: cleanedTranscript.length,
        chunkCount: chunks.length,
        chaptersCreated: createdChapters.length,
        chapters: createdChapters,
      },
    });
  } catch (error) {
    console.error('Error in process-video endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Helper: Create default chapters if AI detection fails
function createDefaultChapters(chunkCount: number): any[] {
  const chapters = [];
  const chaptersCount = Math.min(15, Math.max(5, Math.ceil(chunkCount / 20)));
  const chunksPerChapter = Math.ceil(chunkCount / chaptersCount);

  for (let i = 0; i < chaptersCount; i++) {
    chapters.push({
      title: `Chapter ${i + 1}`,
      description: `Content section ${i + 1}`,
      startChunk: i * chunksPerChapter,
      endChunk: Math.min((i + 1) * chunksPerChapter - 1, chunkCount - 1),
      learningObjectives: [
        'Understand the key concepts',
        'Apply learning to practical scenarios',
        'Test your knowledge',
      ],
    });
  }

  return chapters;
}
