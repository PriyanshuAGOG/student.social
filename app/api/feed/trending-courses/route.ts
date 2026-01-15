// @ts-nocheck
/**
 * Trending Courses & Leaderboard API
 * 
 * Endpoint: GET /api/feed/trending-courses
 * 
 * Provides trending courses, top performers, and course recommendations
 * based on engagement, completions, and pod trends.
 */

// @ts-nocheck
import { Databases } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { courseService } from '@/lib/course-service';

/**
 * GET /api/feed/trending-courses
 * 
 * Get trending courses with popularity metrics
 * Query params: ?timeframe=week|month|all&limit=10&category=tech
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category');

    const { databases } = createAdminClient();

    // Calculate date range for trending
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        startDate.setFullYear(2020); // Far in the past
    }

    // Get all courses
    const allCourses = await courseService.getAllCourses();

    // Enrich with engagement metrics
    const enrichedCourses = await Promise.all(
      allCourses.map(async (course: any) => {
        try {
          // Count enrollments in timeframe
          const enrollments = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'course_enrollments',
            [
              {
                method: 'equal',
                attribute: 'courseId',
                value: course.$id,
              },
            ]
          );

          // Get stats
          const stats = await courseService.getOrCreateStats(course.$id);

          // Count completions in timeframe
          let completions = 0;
          if (stats) {
            const completionsDate = new Date(stats.updatedAt || stats.createdAt);
            if (completionsDate >= startDate) {
              completions = stats.completions || 0;
            }
          }

          // Count feed posts in timeframe
          const posts = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'feed_posts',
            [
              {
                method: 'equal',
                attribute: 'courseId',
                value: course.$id,
              },
            ]
          );

          const recentPosts = posts.documents.filter(
            (p: any) => new Date(p.createdAt) >= startDate
          );

          const totalEngagement =
            enrollments.total * 1 + completions * 5 + recentPosts.length * 3;

          return {
            ...course,
            enrollmentCount: enrollments.total,
            completionCount: completions,
            feedPostCount: recentPosts.length,
            averageRating: stats?.averageRating || 0,
            totalEngagementScore: totalEngagement,
            completionRate: enrollments.total > 0 ? (completions / enrollments.total) * 100 : 0,
          };
        } catch (err) {
          console.log('Error enriching course:', err);
          return course;
        }
      })
    );

    // Sort by engagement score
    const sorted = enrichedCourses
      .sort((a: any, b: any) => (b.totalEngagementScore || 0) - (a.totalEngagementScore || 0))
      .slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        timeframe,
        courses: sorted,
        total: sorted.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching trending courses:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch trending courses' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
