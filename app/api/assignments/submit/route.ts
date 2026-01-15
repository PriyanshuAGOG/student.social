/**
 * Assignment Submission API Endpoint
 * POST /api/assignments/submit
 * 
 * Allows students to submit assignments with:
 * - Text submission
 * - File upload
 * - Timestamp tracking
 * - Validation
 * - Automatic grading trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  submitAssignment,
  getChapterAssignments,
  updateProgress,
  getOrCreateProgress,
  getCourseDatabase,
} from '@/lib/course-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const assignmentId = formData.get('assignmentId') as string;
    const userId = formData.get('userId') as string;
    const courseId = formData.get('courseId') as string;
    const chapterId = formData.get('chapterId') as string;
    const submissionText = formData.get('submissionText') as string;
    const submissionFile = formData.get('submissionFile') as File | null;

    // Validation
    if (!assignmentId || !userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: assignmentId, userId, courseId' },
        { status: 400 }
      );
    }

    if (!submissionText && !submissionFile) {
      return NextResponse.json(
        { error: 'Submission must include either text or file' },
        { status: 400 }
      );
    }

    console.log(`📝 Submission received for assignment ${assignmentId} from user ${userId}`);

    const db = getCourseDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    let fileUrl: string | null = null;

    // Handle file upload if present
    if (submissionFile) {
      try {
        fileUrl = await uploadSubmissionFile(submissionFile);
        console.log(`📎 File uploaded: ${fileUrl}`);
      } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 400 }
        );
      }
    }

    // Validate submission length
    const textLength = submissionText?.length || 0;
    if (textLength > 10000) {
      return NextResponse.json(
        { error: 'Submission text exceeds maximum length of 10,000 characters' },
        { status: 400 }
      );
    }

    if (textLength < 10 && !fileUrl) {
      return NextResponse.json(
        { error: 'Submission text must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Create submission record
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
      status: 'Submitted',
    });

    console.log(`✅ Submission ${submission.$id} created`);

    // Update user progress
    try {
      if (chapterId) {
        const progress = await getOrCreateProgress(db, userId, courseId, 1);
        await updateProgress(db, progress.$id, {
          attemptedAssignments: (progress.attemptedAssignments || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Don't fail the submission if progress update fails
    }

    // Trigger automatic grading
    console.log('🤖 Triggering automatic grading...');
    try {
      const gradeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/assignments/grade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: submission.$id,
            assignmentId,
            autoGrade: true,
          }),
        }
      );

      if (gradeResponse.ok) {
        const gradeData = await gradeResponse.json();
        console.log(
          `✅ Auto-grading complete. Score: ${gradeData.data.score}, Confidence: ${gradeData.data.confidence}`
        );
      } else {
        console.error('Auto-grading failed');
      }
    } catch (error) {
      console.error('Error triggering auto-grading:', error);
      // Don't fail submission if grading fails
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submissionId: submission.$id,
        assignmentId,
        userId,
        submittedAt: submission.submittedAt,
        status: submission.status,
      },
    });
  } catch (error) {
    console.error('Error in submit assignment endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Upload submission file to storage
 * In real implementation, would upload to Appwrite Storage or cloud storage
 */
async function uploadSubmissionFile(file: File): Promise<string> {
  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10 MB
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

  // In real implementation:
  // 1. Convert file to buffer
  // 2. Upload to Appwrite Storage
  // 3. Return URL

  // For now, return placeholder
  const fileName = `${Date.now()}-${file.name}`;
  return `/uploads/assignments/${fileName}`;
}

/**
 * GET /api/assignments/submit?submissionId=xxx
 * Get submission details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
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

    // Fetch submission
    const submission = await db.getDocument('peerspark-main-db', 'assignment_submissions', submissionId);

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assignments/submit?submissionId=xxx
 * Update/revise submission
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const submissionText = formData.get('submissionText') as string;
    const submissionFile = formData.get('submissionFile') as File | null;

    if (!submissionText && !submissionFile) {
      return NextResponse.json(
        { error: 'Must provide either text or file' },
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

    let fileUrl: string | null = null;
    if (submissionFile) {
      try {
        fileUrl = await uploadSubmissionFile(submissionFile);
      } catch (error) {
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 400 }
        );
      }
    }

    // Get current submission
    const currentSubmission = await db.getDocument('peerspark-main-db', 'assignment_submissions', submissionId);

    // Update submission
    const updated = await db.updateDocument('peerspark-main-db', 'assignment_submissions', submissionId, {
      submissionText: submissionText || currentSubmission.submissionText,
      submissionFile: fileUrl || currentSubmission.submissionFile,
      revisionCount: (currentSubmission.revisionCount || 0) + 1,
      status: 'Submitted', // Reset status for re-grading
    });

    console.log(
      `✏️  Submission ${submissionId} revised. Revision count: ${updated.revisionCount}`
    );

    // Trigger re-grading
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/assignments/grade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            autoGrade: true,
          }),
        }
      );
    } catch (error) {
      console.error('Error triggering re-grading:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Submission updated and re-graded',
      data: {
        submissionId: updated.$id,
        revisionCount: updated.revisionCount,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
