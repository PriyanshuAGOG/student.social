/**
 * Instructor Grading Queue API
 * 
 * Endpoint: GET /api/instructor/grading-queue
 * 
 * Shows instructor submissions needing human review.
 * Includes low-confidence AI grades, essays, and plagiarism checks.
 */

import { Databases } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { courseService } from '@/lib/course-service';

interface GradingQueueItem {
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
}

/**
 * GET /api/instructor/grading-queue?instructorId=xxx&courseId=yyy
 * 
 * Get submissions requiring human grading
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!instructorId) {
      return new Response(
        JSON.stringify({ error: 'Missing instructorId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // 1. Get instructor's courses
    const instructorCourses = courseId
      ? [courseId]
      : (await courseService.getInstructorCourses(instructorId)).map((c: any) => c.$id);

    // 2. Fetch submissions requiring review
    const allSubmissions = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'assignment_submissions',
      [],
      10000
    );

    // Filter for this instructor's courses and find those needing review
    const gradingQueue: GradingQueueItem[] = [];

    for (const submission of allSubmissions.documents) {
      if (!instructorCourses.includes(submission.courseId)) {
        continue;
      }

      // Check if needs review (low confidence, pending, or essay)
      const needsReview =
        submission.status === 'pending' ||
        (submission.aiConfidence && submission.aiConfidence < 0.7) ||
        (submission.aiGrade && submission.aiGrade >= 40 && submission.aiGrade <= 60);

      if (!needsReview) {
        continue;
      }

      try {
        const course = await courseService.getCourse(submission.courseId);
        const assignment = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'course_assignments',
          submission.assignmentId
        );

        let flagReason = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';

        if (submission.aiConfidence && submission.aiConfidence < 0.7) {
          flagReason = 'Low AI confidence';
          priority = 'high';
        } else if (submission.aiGrade && submission.aiGrade >= 40 && submission.aiGrade <= 60) {
          flagReason = 'Borderline score (40-60%)';
          priority = 'high';
        } else if (assignment.type === 'essay') {
          flagReason = 'Essay submission - requires human grading';
          priority = 'medium';
        }

        if (submission.plagiarismScore && submission.plagiarismScore > 20) {
          flagReason += ` | Plagiarism detected (${submission.plagiarismScore}%)`;
          priority = 'high';
        }

        gradingQueue.push({
          submissionId: submission.$id,
          studentId: submission.userId,
          studentName: `Student ${submission.userId.slice(0, 8)}`,
          courseId: submission.courseId,
          courseName: course?.title || 'Unknown Course',
          assignmentId: submission.assignmentId,
          assignmentType: assignment.type || 'unknown',
          content: submission.answerText?.slice(0, 200) || submission.fileUrl || '',
          submissionDate: submission.createdAt,
          aiGrade: submission.aiGrade,
          aiConfidence: submission.aiConfidence,
          flagReason,
          assignmentDifficulty: assignment.difficulty || 'medium',
          priority,
          status: submission.status || 'pending',
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
    const body = await request.json();
    const { submissionId, instructorId, grade, feedback, plagiarismScore } = body;

    if (!submissionId || !instructorId || grade === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: submissionId, instructorId, grade',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (grade < 0 || grade > 100) {
      return new Response(
        JSON.stringify({ error: 'Grade must be between 0 and 100' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Update submission with instructor grade
    const updated = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'assignment_submissions',
      submissionId,
      {
        instructorGrade: grade,
        instructorFeedback: feedback || '',
        gradedBy: instructorId,
        gradedAt: new Date().toISOString(),
        status: 'graded',
        plagiarismScore: plagiarismScore || 0,
      }
    );

    // Notify student
    const submission = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'assignment_submissions',
      submissionId
    );

    try {
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'notifications',
        `notif-grade-${submissionId}`,
        {
          type: 'assignment_graded',
          recipientId: submission.userId,
          senderId: instructorId,
          relatedSubmissionId: submissionId,
          content: `Your assignment has been graded! Score: ${grade}%${feedback ? ` - ${feedback}` : ''}`,
          isRead: false,
          createdAt: new Date().toISOString(),
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
    console.error('Error submitting grade:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit grade' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
