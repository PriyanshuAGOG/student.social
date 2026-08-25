/**
 * Instructor Grading Queue API
 * 
 * Endpoint: GET /api/instructor/grading-queue
 * 
 * Shows instructor submissions needing human review.
 * Includes low-confidence AI grades, essays, and plagiarism checks.
 */

import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';
import { courseService } from '@/lib/course-service';
import { z } from 'zod';
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';

interface GradingQueueItem {
  id: string;
  submissionId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  assignmentId: string;
  assignmentType: string;
  content: string;
  submissionDate: string;
  aiGrade?: number;
  aiConfidence?: number;
  flagReason: string;
  assignmentDifficulty: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'reviewing' | 'graded';
  assessmentTitle: string;
  lessonTitle: string;
  submissionType: string;
  submissionText: string;
  submittedAt: string;
  score: number;
  feedback: string;
  passed: boolean;
  gradedAt?: string;
}

/**
 * GET /api/instructor/grading-queue?instructorId=xxx&courseId=yyy
 * 
 * Get submissions requiring human grading
 */
export async function GET(request: Request) {
  try {
    const auth = requireUser(request);
    const { searchParams } = new URL(request.url);
    const instructorId = auth.userId;
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { databases } = await createAdminClient();

    // 1. Get instructor's courses
    const instructorCourses = courseId
      ? [courseId]
      : (await courseService.getInstructorCourses(databases as any, instructorId)).map((c: any) => c.$id);

    // 2. Fetch submissions requiring review
    const allSubmissions = await databases.listDocuments(
      DATABASE_ID,
      'assignment_submissions',
      [Query.limit(100)]
    );

    // Filter for this instructor's courses and find those needing review
    const gradingQueue: GradingQueueItem[] = [];

    for (const submission of allSubmissions.documents) {
      if (!instructorCourses.includes(submission.courseId)) {
        continue;
      }

      // Check if needs review (low confidence, pending, or essay)
      const score = submission.score ?? submission.aiGrade ?? 0;
      const confidence = submission.confidence ?? submission.aiConfidence ?? 0;
      const needsReview =
        submission.status === 'Submitted' ||
        submission.status === 'ReviewPending' ||
        (confidence > 0 && confidence < 0.7) ||
        (score >= 40 && score <= 60);

      const isGraded = submission.status === 'Graded' || submission.status === 'graded';
      if (!needsReview && !isGraded) {
        continue;
      }

      try {
        const course = await courseService.getCourse(databases as any, submission.courseId);
        const assignment = await databases.getDocument(
          DATABASE_ID,
          'course_assignments',
          submission.assignmentId
        );

        let flagReason = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';

        if (confidence > 0 && confidence < 0.7) {
          flagReason = 'Low AI confidence';
          priority = 'high';
        } else if (score >= 40 && score <= 60) {
          flagReason = 'Borderline score (40-60%)';
          priority = 'high';
        } else if (assignment.type === 'Essay') {
          flagReason = 'Essay submission - requires human grading';
          priority = 'medium';
        }

        if (submission.plagiarismScore && submission.plagiarismScore > 20) {
          flagReason += ` | Plagiarism detected (${submission.plagiarismScore}%)`;
          priority = 'high';
        }

        gradingQueue.push({
          id: submission.$id,
          submissionId: submission.$id,
          studentId: submission.userId,
          studentName: `Student ${submission.userId.slice(0, 8)}`,
          courseId: submission.courseId,
          courseName: course?.title || 'Unknown Course',
          assignmentId: submission.assignmentId,
          assignmentType: assignment.type || 'unknown',
          content: submission.submissionText?.slice(0, 200) || submission.submissionFile || '',
          submissionDate: submission.submittedAt || submission.$createdAt,
          aiGrade: score,
          aiConfidence: confidence,
          flagReason,
          assignmentDifficulty: assignment.difficulty || 'medium',
          priority,
          status: submission.status === 'Graded' ? 'graded' : 'pending',
          assessmentTitle: assignment.title || 'Assignment',
          lessonTitle: course?.title || 'Course',
          submissionType: assignment.type || 'unknown',
          submissionText: submission.submissionText || '',
          submittedAt: submission.submittedAt || submission.$createdAt,
          score: Number(submission.manualScore ?? score ?? 0),
          feedback: submission.aiGeneratedFeedback || '',
          passed: Number(submission.manualScore ?? score ?? 0) >= 70,
          gradedAt: submission.gradedAt,
        });
      } catch (err) {
        console.log('Error processing submission:', err);
      }
    }

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    gradingQueue.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
    });

    return new Response(
      JSON.stringify({
        success: true,
        instructorId,
        courseId,
        queue: gradingQueue.slice(0, limit),
        total: gradingQueue.length,
        byPriority: {
          high: gradingQueue.filter((q) => q.priority === 'high').length,
          medium: gradingQueue.filter((q) => q.priority === 'medium').length,
          low: gradingQueue.filter((q) => q.priority === 'low').length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error fetching grading queue:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch grading queue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/instructor/grading-queue
 * 
 * Submit manual grade for a submission
 */
export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: 'instructor:grade', max: 30, windowMs: 60_000 });
    const auth = requireUser(request);
    const { submissionId, grade, feedback, plagiarismScore } = await parseJsonBody(request, z.object({
      submissionId: z.string().min(1).max(255),
      grade: z.number().min(0).max(100),
      feedback: z.string().trim().max(2000).default(''),
      plagiarismScore: z.number().min(0).max(100).optional(),
    }));
    const instructorId = auth.userId;

    const { databases } = await createAdminClient();

    const submission = await databases.getDocument(DATABASE_ID, 'assignment_submissions', submissionId);
    const assignment = await databases.getDocument(DATABASE_ID, 'course_assignments', submission.assignmentId);
    const course = await databases.getDocument(DATABASE_ID, 'courses', assignment.courseId);
    if (course.instructorId !== instructorId) {
      throw new ApiError(403, 'FORBIDDEN', 'This submission does not belong to one of your courses');
    }

    // Update submission with instructor grade
    const updated = await databases.updateDocument(
      DATABASE_ID,
      'assignment_submissions',
      submissionId,
      {
        manualScore: grade,
        aiGeneratedFeedback: feedback || '',
        reviewedBy: instructorId,
        gradedAt: new Date().toISOString(),
        status: 'Graded',
        plagiarismScore: plagiarismScore || 0,
      }
    );

    // Notify student
    try {
      await databases.createDocument(
        DATABASE_ID,
        'notifications',
        `notif-grade-${submissionId}`,
        {
          userId: submission.userId,
          type: 'assignment_graded',
          actor: instructorId,
          assignmentId: submission.assignmentId,
          message: `Your assignment has been graded. Score: ${grade}%${feedback ? ` - ${feedback}` : ''}`,
          isRead: false,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (err) {
      console.log('Error creating notification:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission: updated,
        message: 'Submission graded successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error submitting grade:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit grade' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
