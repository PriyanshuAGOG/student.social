// @ts-nocheck
/**
 * Course Enrollment API
 * 
 * Endpoint: POST /api/courses/enroll
 * Endpoint: GET /api/courses/enroll?userId=...&courseId=...
 * 
 * Enrolls a user in a course
 */

import { EnrollmentStatus } from '@/lib/types/courses';
import { courseService, enrollInCourse, getUserEnrollments } from '@/lib/course-service';

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

    const db = courseService.getCourseDatabase();
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database connection failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const enrollment = await enrollInCourse(db, {
      userId,
      courseId,
      enrollmentType,
      cohortId: podId,
      status: EnrollmentStatus.ACTIVE,
    });

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required query params: userId, courseId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = courseService.getCourseDatabase();
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database connection failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const enrollments = await getUserEnrollments(db, userId);
    const enrollment = enrollments.find((item) => item.courseId === courseId) || null;

    return new Response(
      JSON.stringify({
        success: true,
        enrolled: Boolean(enrollment),
        enrollment,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error checking course enrollment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to check enrollment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
