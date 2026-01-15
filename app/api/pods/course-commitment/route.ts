// @ts-nocheck
/**
 * Pod Course Accountability & Commitments API
 * 
 * Endpoint: POST /api/pods/course-commitment
 * 
 * Allows pod members to set weekly commitments and track accountability.
 * Includes reminder notifications and group incentives.
 */

// @ts-nocheck
import { Databases, Permission, Role } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';

interface CourseCommitment {
  userId: string;
  podCourseId: string;
  weeklyGoal: number; // number of chapters/assignments per week
  commitmentDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'missed';
}

/**
 * POST /api/pods/course-commitment
 * 
 * Create a commitment for a pod member
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, podCourseId, weeklyGoal, dueDate } = body;

    if (!userId || !podCourseId || !weeklyGoal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Create commitment record
    const commitmentId = `${userId}-${podCourseId}-${Date.now()}`;
    const commitment = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'course_commitments',
      commitmentId,
      {
        userId,
        podCourseId,
        weeklyGoal,
        commitmentDate: new Date().toISOString(),
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        completedThisWeek: 0,
        notificationsEnabled: true,
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        commitmentId,
        commitment,
        message: `Commitment created: ${weeklyGoal} chapters/assignments per week`,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating commitment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create commitment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/pods/course-commitment?userId=xxx&podCourseId=yyy
 * 
 * Get commitment status for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const podCourseId = searchParams.get('podCourseId');

    if (!userId || !podCourseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: userId, podCourseId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const commitments = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'course_commitments',
      [
        {
          method: 'equal',
          attribute: 'userId',
          value: userId,
        },
        {
          method: 'equal',
          attribute: 'podCourseId',
          value: podCourseId,
        },
      ]
    );

    if (commitments.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: null, hasCommitment: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentCommitment = commitments.documents[0];

    // Calculate progress
    const dueDate = new Date(currentCommitment.dueDate);
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = Math.round(
      (currentCommitment.completedThisWeek / currentCommitment.weeklyGoal) * 100
    );
    const onTrack = currentCommitment.completedThisWeek >= currentCommitment.weeklyGoal;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...currentCommitment,
          daysRemaining,
          progressPercent,
          onTrack,
          remaining: Math.max(0, currentCommitment.weeklyGoal - currentCommitment.completedThisWeek),
        },
        hasCommitment: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching commitment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch commitment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/pods/course-commitment
 * 
 * Update commitment progress (called when chapter/assignment completed)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { commitmentId, increment = 1 } = body;

    if (!commitmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing commitmentId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const commitment = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'course_commitments',
      commitmentId
    );

    const newCompleted = commitment.completedThisWeek + increment;
    const newStatus = newCompleted >= commitment.weeklyGoal ? 'completed' : 'active';

    const updated = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'course_commitments',
      commitmentId,
      {
        completedThisWeek: newCompleted,
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        commitment: updated,
        message: newStatus === 'completed' ? '🎉 Weekly goal completed!' : 'Progress updated',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating commitment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update commitment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
