// @ts-nocheck
/**
 * Course Enrollment API
 * 
 * Endpoint: POST /api/courses/enroll
 * 
 * Enrolls a user in a course
 */

import { courseService } from '@/lib/course-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, courseId, enrollmentType = 'individual', podId } = body;

    if (!userId || !courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, courseId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const enrollment = await courseService.enrollInCourse(
      userId,
      courseId,
      enrollmentType,
      podId
    );

    return new Response(
      JSON.stringify({
        success: true,
        enrollment,
        message: 'Successfully enrolled in course',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to enroll in course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
