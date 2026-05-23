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

import { NextRequest } from 'next/server';
import {
  getSubmission,
  updateSubmission,
  getCourseDatabase,
} from '@/lib/course-service';
import { callLLM } from '@/lib/ai';
import { SubmissionStatus } from '@/lib/types/courses';
import { z } from 'zod'
import { ApiError, jsonError, jsonOk, parseJsonBody, requireRole, requireUser } from '@/lib/api-security'
import { writeAuditLog } from '@/lib/audit-log'

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  assignmentId: z.string().min(1).optional(),
  autoGrade: z.boolean().optional().default(true),
})

const batchSchema = z.object({
  submissionIds: z.array(z.string().min(1)).min(1).max(50),
})

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    requireRole(auth, ['instructor', 'admin'])
    const { submissionId, assignmentId } = await parseJsonBody(request, gradeSchema, 64 * 1024)

    const db = getCourseDatabase();
    if (!db) {
      throw new ApiError(500, 'DATABASE_UNAVAILABLE', 'Database connection failed')
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

    writeAuditLog({ action: 'assignment_grade_single', actorId: auth.userId, correlationId, targetId: submissionId, status: 'success' })

    return jsonOk({
      message: 'Assignment graded successfully',
      data: {
        submissionId,
        score: grade.score,
        confidence: grade.confidence,
        feedback: grade.feedback,
        flaggedForReview: grade.flaggedForReview,
        submission: updatedSubmission,
      },
    }, 200, correlationId)
  } catch (error) {
    writeAuditLog({ action: 'assignment_grade_single', actorId: request.headers.get('x-user-id') || 'unknown', correlationId, status: 'failure' })
    return jsonError(error, correlationId)
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
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    requireRole(auth, ['instructor', 'admin'])
    const { submissionIds } = await parseJsonBody(request, batchSchema, 64 * 1024)

    const db = getCourseDatabase();
    if (!db) {
      throw new ApiError(500, 'DATABASE_UNAVAILABLE', 'Database connection failed')
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

    writeAuditLog({ action: 'assignment_grade_batch', actorId: auth.userId, correlationId, status: 'success', details: { requested: submissionIds.length, successful } })
    return jsonOk({ message: `Batch graded ${successful}/${submissionIds.length} submissions`, data: results }, 200, correlationId)
  } catch (error) {
    writeAuditLog({ action: 'assignment_grade_batch', actorId: request.headers.get('x-user-id') || 'unknown', correlationId, status: 'failure' })
    return jsonError(error, correlationId)
  }
}
