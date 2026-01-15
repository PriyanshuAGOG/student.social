// @ts-nocheck
/**
 * Course Chapters API
 * 
 * Endpoint: GET /api/courses/[courseId]/chapters
 * 
 * Returns all chapters for a course
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

    const chapters = await courseService.getChapters(courseId);

    return new Response(
      JSON.stringify({
        success: true,
        chapters,
        total: chapters.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch chapters' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
