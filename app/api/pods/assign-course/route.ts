/**
 * Pod Course Assignment API
 * 
 * Endpoint: POST /api/pods/assign-course
 * 
 * Assigns a course to a pod and automatically enrolls all members.
 * Creates a cohort with tracking for shared progress and accountability.
 */

import { Databases, Permission, Role } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { courseService } from '@/lib/course-service';

interface AssignCourseRequest {
  courseId: string;
  podId: string;
  cohortName?: string;
  cohortPace: 'Self-paced' | 'Weekly' | 'Custom';
  customPaceSchedule?: {
    startDate: string;
    endDate: string;
    weeklyGoal?: number;
  };
  instructorNotes?: string;
}

interface PodMember {
  userId: string;
  role: string;
  joinedAt: string;
}

/**
 * POST /api/pods/assign-course
 * 
 * Assigns a course to a pod and auto-enrolls all members
 */
export async function POST(request: Request) {
  try {
    const body: AssignCourseRequest = await request.json();
    const { courseId, podId, cohortPace, customPaceSchedule, instructorNotes, cohortName } = body;

    // Validation
    if (!courseId || !podId || !cohortPace) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: courseId, podId, cohortPace' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // 1. Fetch course to verify it exists
    const course = await courseService.getCourse(courseId);
    if (!course) {
      return new Response(
        JSON.stringify({ error: `Course not found: ${courseId}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch pod members
    let podMembers: PodMember[] = [];
    try {
      const pod = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'pods',
        podId
      );
      podMembers = pod.members || [];
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: `Pod not found: ${podId}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create pod course record
    const podCourseId = `${podId}-${courseId}-${Date.now()}`;
    const podCourse = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_courses',
      podCourseId,
      {
        podId,
        courseId,
        courseName: course.title,
        cohortName: cohortName || `${course.title} - Cohort`,
        cohortPace,
        customPaceSchedule: customPaceSchedule ? JSON.stringify(customPaceSchedule) : null,
        instructorNotes: instructorNotes || '',
        assignedAt: new Date().toISOString(),
        assignedBy: 'system', // In production, get from auth context
        status: 'active',
        memberCount: podMembers.length,
        enrolledCount: 0,
        completionRate: 0,
        averageScore: 0,
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
      ]
    );

    // 4. Auto-enroll all pod members in the course
    const enrollmentResults: Array<{
      userId: string;
      success: boolean;
      enrollmentId?: string;
      error?: string;
    }> = [];

    for (const member of podMembers) {
      try {
        const enrollment = await courseService.enrollInCourse(
          member.userId,
          courseId,
          'pod-cohort',
          podId
        );
        enrollmentResults.push({
          userId: member.userId,
          success: true,
          enrollmentId: enrollment.$id,
        });
      } catch (err: any) {
        enrollmentResults.push({
          userId: member.userId,
          success: false,
          error: err.message,
        });
      }
    }

    // Count successful enrollments
    const successCount = enrollmentResults.filter((r) => r.success).length;

    // 5. Update pod course with enrollment count
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_courses',
      podCourseId,
      {
        enrolledCount: successCount,
      }
    );

    // 6. Create pod course activities collection for tracking
    try {
      await databases.createCollection(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'Pod Course Activities',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
        ]
      );

      // Add attributes for tracking
      await databases.createStringAttribute(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'userId',
        255,
        true
      );

      await databases.createStringAttribute(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'activityType',
        50,
        true
      ); // chapter-completed, assignment-submitted, achievement-earned

      await databases.createStringAttribute(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'chapterId',
        255,
        false
      );

      await databases.createIntegerAttribute(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'score',
        false
      );

      await databases.createDatetimeAttribute(
        process.env.APPWRITE_DATABASE_ID!,
        `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
        'completedAt',
        false
      );
    } catch (err) {
      // Collection might already exist, continue
      console.log('Pod course activities collection already exists or error creating it');
    }

    return new Response(
      JSON.stringify({
        success: true,
        podCourseId,
        podCourse,
        enrollments: {
          total: podMembers.length,
          successful: successCount,
          failed: podMembers.length - successCount,
          details: enrollmentResults,
        },
        message: `Course "${course.title}" assigned to pod. ${successCount}/${podMembers.length} members enrolled.`,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error assigning course to pod:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to assign course to pod' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/pods/assign-course?podId=xxx
 * 
 * Fetch all courses assigned to a pod
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const podId = searchParams.get('podId');

    if (!podId) {
      return new Response(
        JSON.stringify({ error: 'Missing podId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Fetch all pod courses for this pod
    const podCourses = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_courses',
      [
        {
          method: 'equal',
          attribute: 'podId',
          value: podId,
        },
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        podId,
        courses: podCourses.documents,
        total: podCourses.total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching pod courses:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch pod courses' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
