/**
 * Assignment Grading API Endpoint
 * POST /api/assignments/grade
 * 
 * Auto-grades assignments with confidence scoring:
 * - Multiple choice: Instant 100% confidence
 * - Short answer: AI grades with rubric, confidence 0-1
 * - Flags low-confidence for human review
 * - Generates AI feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSubmission,
  updateSubmission,
  getChapterAssignments,
  getCourseDatabase,
} from '@/lib/course-service';
import { callLLM } from '@/lib/ai';
import { SubmissionStatus } from '@/lib/types/courses';

export async function POST(request: NextRequest) {
  try {
    const { submissionId, assignmentId, autoGrade = true } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing required field: submissionId' },
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

    // Get submission
    const submission = await getSubmission(db, submissionId);
    console.log(`📊 Grading submission ${submissionId}...`);

    // Get assignment details (if assignmentId provided)
    let assignment: any = null;
    if (assignmentId) {
      // Would fetch assignment from database
      // const chapters = await getChapters(db, courseId);
      // assignment = chapters?.assignments?.find((a: any) => a.$id === assignmentId);
    }

    // Grade based on assignment type
    let grade: any = {};

    if (assignment?.type === 'MultipleChoice') {
      grade = gradeMultipleChoice(submission, assignment);
    } else {
      grade = await gradeShortAnswer(submission, assignment);
    }

    // Update submission with grade
    const updatedSubmission = await updateSubmission(db, submissionId, {
      score: grade.score,
      confidence: grade.confidence,
      aiGeneratedFeedback: grade.feedback,
      isAutoGraded: grade.isAutoGraded,
      flaggedForReview: grade.flaggedForReview,
      status: grade.flaggedForReview ? SubmissionStatus.REVIEW_PENDING : SubmissionStatus.GRADED,
    });

    console.log(`✅ Grading complete. Score: ${grade.score}, Confidence: ${grade.confidence}`);

    return NextResponse.json({
      success: true,
      message: 'Assignment graded successfully',
      data: {
        submissionId,
        score: grade.score,
        confidence: grade.confidence,
        feedback: grade.feedback,
        flaggedForReview: grade.flaggedForReview,
        submission: updatedSubmission,
      },
    });
  } catch (error) {
    console.error('Error in grade endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Grade multiple choice answers (instant)
 */
function gradeMultipleChoice(submission: any, assignment: any): {
  score: number;
  confidence: number;
  feedback: string;
  isAutoGraded: boolean;
  flaggedForReview: boolean;
} {
  const submissionAnswer = submission.submissionText?.trim().toUpperCase();
  // Assignment would have correct answer stored
  const correctAnswer = 'A'; // Simplified - would come from assignment

  const isCorrect = submissionAnswer === correctAnswer;
  const score = isCorrect ? 100 : 0;

  return {
    score,
    confidence: 1.0, // 100% confidence for MC
    feedback: isCorrect
      ? `✅ Correct! You selected the right answer.`
      : `❌ Incorrect. The correct answer is ${correctAnswer}. Please review the course material and try again.`,
    isAutoGraded: true,
    flaggedForReview: false,
  };
}

/**
 * Grade short answer/essay responses using AI
 */
async function gradeShortAnswer(
  submission: any,
  assignment: any
): Promise<{
  score: number;
  confidence: number;
  feedback: string;
  isAutoGraded: boolean;
  flaggedForReview: boolean;
}> {
  const gradingPrompt = `You are an expert instructor grading a student's assignment.

Assignment:
Title: ${assignment?.title || 'Assignment'}
Question: ${assignment?.questionText || submission.submissionText?.substring(0, 200)}
Rubric: ${assignment?.gradingCriteria || 'Standard grading'}

Student's Answer:
${submission.submissionText || 'No text provided'}

Grade this answer on a scale of 0-100 based on:
- Correctness and accuracy
- Completeness and depth
- Clarity of explanation
- Relevance to the learning objectives

Respond with JSON:
{
  "score": 0-100,
  "confidence": 0-1,
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "feedback": "Constructive feedback with hints for improvement"
}`;

  try {
    const response = await callLLM(
      [{ role: 'user', content: gradingPrompt }],
      { model: 'mistralai/mistral-7b-instruct:free', maxTokens: 1000 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const gradeData = JSON.parse(jsonMatch[0]);
      const shouldFlag = gradeData.confidence < 0.7 || (gradeData.score >= 40 && gradeData.score <= 60);

      return {
        score: Math.round(gradeData.score),
        confidence: gradeData.confidence,
        feedback: `
**Feedback:**
${gradeData.feedback}

**Strengths:**
${gradeData.strengths?.map((s: string) => `✅ ${s}`).join('\n') || 'Good effort'}

**Areas for Improvement:**
${gradeData.areasForImprovement?.map((a: string) => `📌 ${a}`).join('\n') || 'Consider reviewing the concepts'}

${shouldFlag ? '\n⚠️ This response has been flagged for instructor review.' : ''}
`,
        isAutoGraded: true,
        flaggedForReview: shouldFlag,
      };
    }
  } catch (error) {
    console.error('Error grading with AI:', error);
  }

  // Fallback
  return {
    score: 0,
    confidence: 0,
    feedback: 'Unable to grade at this time. Please resubmit.',
    isAutoGraded: false,
    flaggedForReview: true,
  };
}

/**
 * POST /api/assignments/grade-batch
 * Grade multiple submissions at once for cost optimization
 */
export async function POST_BATCH(request: NextRequest) {
  try {
    const { submissionIds } = await request.json();

    if (!submissionIds || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing submissionIds' },
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

    console.log(`📊 Batch grading ${submissionIds.length} submissions...`);

    const results = [];
    for (const submissionId of submissionIds) {
      try {
        const submission = await getSubmission(db, submissionId);
        const grade = await gradeShortAnswer(submission, null);

        await updateSubmission(db, submissionId, {
          score: grade.score,
          confidence: grade.confidence,
          aiGeneratedFeedback: grade.feedback,
          isAutoGraded: grade.isAutoGraded,
          flaggedForReview: grade.flaggedForReview,
          status: grade.flaggedForReview ? SubmissionStatus.REVIEW_PENDING : SubmissionStatus.GRADED,
        });

        results.push({
          submissionId,
          score: grade.score,
          success: true,
        });
      } catch (error) {
        results.push({
          submissionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    console.log(`✅ Batch grading complete. ${successful}/${submissionIds.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Batch graded ${successful}/${submissionIds.length} submissions`,
      data: results,
    });
  } catch (error) {
    console.error('Error in batch grading:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
