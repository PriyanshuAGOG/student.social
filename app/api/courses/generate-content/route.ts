/**
 * Content Generation API Endpoint
 * POST /api/courses/generate-content
 * 
 * Generates AI-powered learning materials for chapters:
 * 1. Summaries (2-3 sentences + key takeaways)
 * 2. Detailed notes (structured markdown with concepts, formulas, examples)
 * 3. Smart assignments (easy, medium, hard with varied types)
 * 
 * Uses batch processing and caching to optimize AI costs
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateContent,
  createAssignment,
  getChapters,
  getCourseDatabase,
} from '@/lib/course-service';
import { callLLM } from '@/lib/ai';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const {
      courseId,
      chapterId,
      contentType, // 'summaries' | 'notes' | 'assignments' | 'all'
      forceRegenerate = false,
    } = await request.json();

    if (!courseId || !chapterId) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, chapterId' },
        { status: 400 }
      );
    }

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get chapter data
    const chapters = await getChapters(db, courseId);
    const chapter = chapters.find((c) => c.$id === chapterId);

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    console.log(`📚 Generating content for chapter: ${chapter.title}`);

    const generateWhat =
      contentType === 'all'
        ? ['summaries', 'notes', 'assignments']
        : [contentType];
    const results: any = {};

    // 1. Generate Summaries
    if (generateWhat.includes('summaries')) {
      console.log('📝 Generating summaries...');
      try {
        results.summaries = await generateSummaries(chapter);
      } catch (error) {
        console.error('Error generating summaries:', error);
        results.summaries = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // 2. Generate Detailed Notes
    if (generateWhat.includes('notes')) {
      console.log('📖 Generating detailed notes...');
      try {
        results.notes = await generateDetailedNotes(chapter);
      } catch (error) {
        console.error('Error generating notes:', error);
        results.notes = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // 3. Generate Assignments
    if (generateWhat.includes('assignments')) {
      console.log('❓ Generating assignments...');
      try {
        results.assignments = await generateAssignments(db, chapter, courseId);
      } catch (error) {
        console.error('Error generating assignments:', error);
        results.assignments = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Save content to database
    if (results.summaries && results.summaries.summaries) {
      try {
        const promptHash = crypto
          .createHash('md5')
          .update(chapter.transcript || '')
          .digest('hex');

        await createOrUpdateContent(db, {
          chapterId: chapter.$id,
          summaries: results.summaries.summaries || [],
          keyTakeaways: results.summaries.keyTakeaways || [],
          detailedNotes: results.notes?.detailedNotes || '',
          concepts: results.notes?.concepts || [],
          formulas: results.notes?.formulas || [],
          realWorldApplications: results.notes?.realWorldApplications || [],
          generatedAt: new Date().toISOString(),
          llmModel: 'mixed (llama-3.2-3b, mistral-7b)',
          promptHash,
        });
        console.log('✅ Content saved to database');
      } catch (error) {
        console.error('Error saving content:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated content for chapter: ${chapter.title}`,
      data: {
        chapterId: chapter.$id,
        chapterTitle: chapter.title,
        contentGenerated: generateWhat,
        results,
      },
    });
  } catch (error) {
    console.error('Error in generate-content endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Generate summaries and key takeaways
 * Cost: ~0.01 credits per chapter (using Llama-3.2-3b:free)
 */
async function generateSummaries(chapter: any): Promise<{
  summaries: string[];
  keyTakeaways: string[];
}> {
  const prompt = `You are an expert course instructor. Summarize this chapter content concisely.

Chapter: ${chapter.title}
Description: ${chapter.description || 'N/A'}

Learning Objectives:
${chapter.learningObjectives?.map((obj: string) => `- ${obj}`).join('\n') || 'N/A'}

Transcript:
${chapter.transcript?.substring(0, 2000) || 'N/A'}...

Please provide:
1. A 2-3 sentence executive summary
2. 3-5 more detailed summaries (1-2 sentences each)
3. 5-7 key takeaways

Format your response as JSON:
{
  "summary": "2-3 sentence summary",
  "summaries": ["summary 1", "summary 2", ...],
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...]
}`;

  const response = await callLLM(
    [{ role: 'user', content: prompt }],
    { model: 'meta-llama/llama-3.2-3b-instruct:free', maxTokens: 800 }
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summaries: [parsed.summary, ...(parsed.summaries || [])],
        keyTakeaways: parsed.keyTakeaways || [],
      };
    }
  } catch (error) {
    console.error('Error parsing summaries JSON:', error);
  }

  // Fallback
  return {
    summaries: [chapter.description || 'Summary unavailable'],
    keyTakeaways: chapter.learningObjectives || [],
  };
}

/**
 * Generate detailed notes with structure
 * Cost: ~0.02 credits per chapter (using Mistral-7b:free for better structured output)
 */
async function generateDetailedNotes(chapter: any): Promise<{
  detailedNotes: string;
  concepts: Array<{ name: string; definition: string; importance: string }>;
  formulas: string[];
  realWorldApplications: string[];
}> {
  const prompt = `You are an expert course instructor creating detailed study notes.

Chapter: ${chapter.title}
Description: ${chapter.description || 'N/A'}

Learning Objectives:
${chapter.learningObjectives?.map((obj: string) => `- ${obj}`).join('\n') || 'N/A'}

Transcript Excerpt:
${chapter.transcript?.substring(0, 3000) || 'N/A'}...

Create comprehensive study notes in markdown format including:
1. Learning Objectives summary
2. Core Concepts (bullet points with clear explanations)
3. Step-by-Step Breakdowns (for processes/procedures)
4. Important Formulas or Code Snippets (if applicable)
5. Real-World Applications (practical examples)

Also provide:
- A JSON array of key concepts with definitions
- A JSON array of important formulas/code
- A JSON array of real-world applications

Format your response as:
---MARKDOWN---
[Detailed notes in markdown]
---JSON_CONCEPTS---
[{"name": "...", "definition": "...", "importance": "critical|important|reference"}, ...]
---JSON_FORMULAS---
["formula 1", "formula 2", ...]
---JSON_APPLICATIONS---
["application 1", "application 2", ...]`;

  const response = await callLLM(
    [{ role: 'user', content: prompt }],
    { model: 'mistralai/mistral-7b-instruct:free', maxTokens: 2000 }
  );

  try {
    const markdownMatch = response.match(/---MARKDOWN---([\s\S]*?)---JSON_CONCEPTS---/);
    const conceptsMatch = response.match(/---JSON_CONCEPTS---([\s\S]*?)---JSON_FORMULAS---/);
    const formulasMatch = response.match(/---JSON_FORMULAS---([\s\S]*?)---JSON_APPLICATIONS---/);
    const applicationsMatch = response.match(/---JSON_APPLICATIONS---([\s\S]*?)$/);

    return {
      detailedNotes: markdownMatch ? markdownMatch[1].trim() : response,
      concepts: conceptsMatch ? JSON.parse(conceptsMatch[1].trim()) : [],
      formulas: formulasMatch ? JSON.parse(formulasMatch[1].trim()) : [],
      realWorldApplications: applicationsMatch ? JSON.parse(applicationsMatch[1].trim()) : [],
    };
  } catch (error) {
    console.error('Error parsing notes JSON:', error);
  }

  return {
    detailedNotes: response,
    concepts: [],
    formulas: [],
    realWorldApplications: [],
  };
}

/**
 * Generate varied assignments (easy, medium, hard)
 * Cost: ~0.03 credits per chapter (using mixed models)
 */
async function generateAssignments(
  db: any,
  chapter: any,
  courseId: string
): Promise<{
  assignments: any[];
  created: number;
}> {
  const assignmentTypes = [
    {
      type: 'MultipleChoice',
      difficulty: 'Easy',
      count: 1,
      prompt: `Create an easy multiple-choice question to test recall and comprehension.`,
    },
    {
      type: 'ShortAnswer',
      difficulty: 'Medium',
      count: 1,
      prompt: `Create a medium-difficulty short-answer question (2-3 sentences) that requires students to apply concepts.`,
    },
    {
      type: 'Essay',
      difficulty: 'Hard',
      count: 1,
      prompt: `Create a challenging essay or project-based assignment that requires synthesis and critical thinking.`,
    },
  ];

  const assignments = [];
  let createdCount = 0;

  for (const assignmentConfig of assignmentTypes) {
    for (let i = 0; i < assignmentConfig.count; i++) {
      try {
        const prompt = `You are a course instructor creating an assignment.

Chapter: ${chapter.title}
Learning Objectives:
${chapter.learningObjectives?.map((obj: string) => `- ${obj}`).join('\n') || 'N/A'}

Content Preview:
${chapter.transcript?.substring(0, 1500) || 'N/A'}...

${assignmentConfig.prompt}

Type: ${assignmentConfig.type}
Difficulty: ${assignmentConfig.difficulty}

Respond with JSON:
{
  "title": "Assignment Title",
  "description": "Brief description",
  "type": "${assignmentConfig.type}",
  "difficulty": "${assignmentConfig.difficulty}",
  "questionText": "Full question text",
  "options": ${assignmentConfig.type === 'MultipleChoice' ? '["A) ...", "B) ...", "C) ...", "D) ..."]' : 'null'},
  "estimatedTime": 15,
  "rubric": {"criteria": [{"name": "...", "weight": 0.5, "description": "..."}], "passingScore": 70},
  "gradingCriteria": "How to grade this assignment",
  "learningOutcome": "What this tests"
}`;

        const response = await callLLM(
          [{ role: 'user', content: prompt }],
          {
            model:
              assignmentConfig.difficulty === 'Easy'
                ? 'meta-llama/llama-3.2-3b-instruct:free'
                : 'mistralai/mistral-7b-instruct:free',
            maxTokens: 1200,
          }
        );

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const assignmentData = JSON.parse(jsonMatch[0]);

          // Save to database
          const created = await createAssignment(db, {
            chapterId: chapter.$id,
            ...assignmentData,
            rubric: assignmentData.rubric || {
              criteria: [
                { name: 'Accuracy', weight: 0.6, description: 'Correctness of answer' },
                { name: 'Completeness', weight: 0.4, description: 'Thoroughness' },
              ],
              passingScore: 70,
            },
            sequenceNumber: assignments.length + 1,
          });

          assignments.push(created);
          createdCount++;
          console.log(`✅ Created ${assignmentConfig.difficulty} assignment: ${assignmentData.title}`);
        }
      } catch (error) {
        console.error(`Error creating ${assignmentConfig.difficulty} assignment:`, error);
      }
    }
  }

  return { assignments, created: createdCount };
}
