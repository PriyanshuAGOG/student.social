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
import { z } from 'zod';
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: 'courses:enroll', max: 15, windowMs: 60_000 });
    const { userId } = requireUser(request);
    const { courseId, enrollmentType, podId } = await parseJsonBody(request, z.object({
      userId: z.string().optional(),
      courseId: z.string().min(1).max(255),
      enrollmentType: z.enum(['individual', 'pod']).default('individual'),
      podId: z.string().max(255).optional(),
    }));

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
    if (error instanceof ApiError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error enrolling in course:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to enroll in course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = requireUser(request);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required query param: courseId' }),
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
    if (error instanceof ApiError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Error checking course enrollment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to check enrollment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
