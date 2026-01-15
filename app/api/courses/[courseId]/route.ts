// @ts-nocheck
/**
 * Course Details API
 * 
 * Endpoint: GET /api/courses/[courseId]
 * 
 * Returns details for a specific course
 */

import { NextRequest } from 'next/server';
import { courseService } from '@/lib/course-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing courseId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const course = await courseService.getCourse(courseId);

    if (!course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        course,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
