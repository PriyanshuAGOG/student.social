// @ts-nocheck
/**
 * Course List API
 * 
 * Endpoint: GET /api/courses/list
 * 
 * Returns list of all published courses
 */

import { courseService } from '@/lib/course-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const status = searchParams.get('status') || 'published';

    const { courses } = await courseService.getAllCourses();

    // Filter by status
    const filtered = status === 'all'
      ? courses
      : courses.filter((c: any) => c.status === status);

    return new Response(
      JSON.stringify({
        success: true,
        courses: filtered.slice(0, limit),
        total: filtered.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error listing courses:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to list courses' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
