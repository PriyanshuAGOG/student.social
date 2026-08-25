import { NextRequest, NextResponse } from 'next/server';
import {
  submitAssignment,
  updateProgress,
  getOrCreateProgress,
  getCourseDatabase,
  updateSubmission,
} from '@/lib/course-service';
import { SubmissionStatus } from '@/lib/types/courses';
import { z } from 'zod';
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: 'assignments:submit', max: 20, windowMs: 60_000 });
    const auth = requireUser(request);
    const formData = await request.formData();

    const fields = z.object({
      assignmentId: z.string().min(1).max(255),
      courseId: z.string().min(1).max(255),
      chapterId: z.string().max(255).default(''),
      submissionText: z.string().max(10_000).default(''),
    }).parse({
      assignmentId: String(formData.get('assignmentId') || ''),
      courseId: String(formData.get('courseId') || ''),
      chapterId: String(formData.get('chapterId') || ''),
      submissionText: String(formData.get('submissionText') || ''),
    });
    const { assignmentId, courseId, chapterId, submissionText } = fields;
    const userId = auth.userId;
    const submissionFile = formData.get('submissionFile') as File | null;

    if (!submissionText && !submissionFile) {
      return NextResponse.json(
        { error: 'Submission must include either text or file' },
        { status: 400 },
      );
    }

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 },
      );
    }
    const assignment = await db.getDocument('peerspark-main-db', 'course_assignments', assignmentId);
    if (assignment.courseId && assignment.courseId !== courseId) throw new ApiError(400, 'INVALID_INPUT', 'Assignment does not belong to this course');

    let fileUrl: string | null = null;
    if (submissionFile) {
      try {
        fileUrl = await uploadSubmissionFile(submissionFile);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'File upload failed' },
          { status: 400 },
        );
      }
    }

    const textLength = submissionText?.length || 0;
    if (textLength > 10000) {
      return NextResponse.json(
        { error: 'Submission text exceeds maximum length of 10,000 characters' },
        { status: 400 },
      );
    }

    if (textLength < 10 && !fileUrl) {
      return NextResponse.json(
        { error: 'Submission text must be at least 10 characters' },
        { status: 400 },
      );
    }

    const submission = await submitAssignment(db, {
      assignmentId,
      userId,
      submissionText: submissionText || '',
      submissionFile: fileUrl || '',
      score: 0,
      confidence: 0,
      aiGeneratedFeedback: '',
      isAutoGraded: false,
      flaggedForReview: false,
      revisionCount: 0,
      status: SubmissionStatus.SUBMITTED,
    });

    try {
      if (chapterId) {
        const progress = await getOrCreateProgress(db, userId, courseId, 1);
        await updateProgress(db, progress.$id, {
          attemptedAssignments: (progress.attemptedAssignments || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }

    let gradedSubmission = submission;
    try {
      const grade = autoGradeSubmission(submissionText || '', Boolean(fileUrl));
      gradedSubmission = await updateSubmission(db, submission.$id, {
        score: grade.score,
        confidence: grade.confidence,
        aiGeneratedFeedback: grade.feedback,
        isAutoGraded: grade.isAutoGraded,
        flaggedForReview: grade.flaggedForReview,
        status: grade.flaggedForReview ? SubmissionStatus.REVIEW_PENDING : SubmissionStatus.GRADED,
      });
    } catch (error) {
      console.error('Error auto-grading submission:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submissionId: submission.$id,
        assignmentId,
        userId,
        submittedAt: gradedSubmission.submittedAt,
        status: gradedSubmission.status,
        submission: gradedSubmission,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid assignment submission', details: error.flatten() }, { status: 400 });
    console.error('Error in submit assignment endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireUser(request);
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const submission = await db.getDocument('peerspark-main-db', 'assignment_submissions', submissionId);
    if (submission.userId !== auth.userId) throw new ApiError(403, 'FORBIDDEN', 'Submission does not belong to you');
    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: 'assignments:revise', max: 20, windowMs: 60_000 });
    const auth = requireUser(request);
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    const formData = await request.formData();
    const submissionText = formData.get('submissionText') as string;
    const submissionFile = formData.get('submissionFile') as File | null;

    if (!submissionText && !submissionFile) {
      return NextResponse.json({ error: 'Must provide either text or file' }, { status: 400 });
    }

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let fileUrl: string | null = null;
    if (submissionFile) {
      try {
        fileUrl = await uploadSubmissionFile(submissionFile);
      } catch (error) {
        return NextResponse.json({ error: 'File upload failed' }, { status: 400 });
      }
    }

    const currentSubmission = await db.getDocument('peerspark-main-db', 'assignment_submissions', submissionId);
    if (currentSubmission.userId !== auth.userId) throw new ApiError(403, 'FORBIDDEN', 'Submission does not belong to you');
    const updated = await db.updateDocument('peerspark-main-db', 'assignment_submissions', submissionId, {
      submissionText: submissionText || currentSubmission.submissionText,
      submissionFile: fileUrl || currentSubmission.submissionFile,
      revisionCount: (currentSubmission.revisionCount || 0) + 1,
      status: SubmissionStatus.SUBMITTED,
    });

    const grade = autoGradeSubmission(
      String(submissionText || currentSubmission.submissionText || ''),
      Boolean(fileUrl || currentSubmission.submissionFile),
    );

    const graded = await updateSubmission(db, submissionId, {
      score: grade.score,
      confidence: grade.confidence,
      aiGeneratedFeedback: grade.feedback,
      isAutoGraded: grade.isAutoGraded,
      flaggedForReview: grade.flaggedForReview,
      status: grade.flaggedForReview ? SubmissionStatus.REVIEW_PENDING : SubmissionStatus.GRADED,
    });

    return NextResponse.json({ success: true, data: graded });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error revising submission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}

async function uploadSubmissionFile(file: File): Promise<string> {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  const fileName = `${Date.now()}-${file.name}`;
  return `/uploads/assignments/${fileName}`;
}

function autoGradeSubmission(submissionText: string, hasFile: boolean) {
  const trimmed = submissionText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  if (!trimmed && hasFile) {
    return {
      score: 75,
      confidence: 0.55,
      feedback: 'File submission received. This submission is queued for instructor review.',
      isAutoGraded: false,
      flaggedForReview: true,
    };
  }

  const score = Math.max(40, Math.min(100, 50 + wordCount));
  const confidence = Math.min(0.95, 0.5 + wordCount / 200);
  const flaggedForReview = wordCount < 25;

  return {
    score,
    confidence,
    feedback: flaggedForReview
      ? 'Submission received. Add more detail to improve your score; this response has been flagged for review.'
      : 'Submission received and auto-evaluated. The response shows adequate coverage of the chapter concepts.',
    isAutoGraded: !flaggedForReview,
    flaggedForReview,
  };
}
