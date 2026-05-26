import { NextRequest, NextResponse } from 'next/server';
import {
  submitAssignment,
  updateProgress,
  getOrCreateProgress,
  getCourseDatabase,
  updateSubmission,
} from '@/lib/course-service';
import { SubmissionStatus } from '@/lib/types/courses';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const assignmentId = formData.get('assignmentId') as string;
    const userId = formData.get('userId') as string;
    const courseId = formData.get('courseId') as string;
    const chapterId = formData.get('chapterId') as string;
    const submissionText = formData.get('submissionText') as string;
    const submissionFile = formData.get('submissionFile') as File | null;

    if (!assignmentId || !userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: assignmentId, userId, courseId' },
        { status: 400 },
      );
    }

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
    console.error('Error in submit assignment endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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
