import { z } from 'zod'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { courseService } from '@/lib/course-service'
import { ApiError, jsonError, jsonOk, requireUser } from '@/lib/api-security'
import { getEnv } from '@/lib/env'
import { computeCourseTrendScore, stableRankByScore } from '@/lib/feed-algorithms'

const querySchema = z.object({
  timeframe: z.enum(['week', 'month', 'all']).default('month'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
})

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    requireUser(request)
    const params = new URL(request.url).searchParams
    const parsed = querySchema.parse({
      timeframe: params.get('timeframe') ?? undefined,
      limit: params.get('limit') ?? undefined,
      category: params.get('category') ?? undefined,
    })

    const { databases } = createAdminClient()
    const databaseId = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID
    if (!databaseId) throw new ApiError(500, 'DATABASE_CONFIG_MISSING', 'Database id is not configured')

    const now = new Date()
    const startDate = new Date()
    if (parsed.timeframe === 'week') startDate.setDate(now.getDate() - 7)
    else if (parsed.timeframe === 'month') startDate.setMonth(now.getMonth() - 1)
    else startDate.setFullYear(2020)

    const allCoursesResp: any = await courseService.getAllCourses()
    const allCourses = Array.isArray(allCoursesResp) ? allCoursesResp : (allCoursesResp?.courses || [])
    const filteredCourses = parsed.category ? allCourses.filter((c: any) => String(c?.category || '').toLowerCase() === parsed.category?.toLowerCase()) : allCourses

    const enrichedCourses = await Promise.all(filteredCourses.map(async (course: any) => {
      try {
        const enrollments = await databases.listDocuments(databaseId, 'course_enrollments', [Query.equal('courseId', course.$id)])
        const stats: any = await courseService.getOrCreateStats(course.$id)
        const completionsDate = new Date(stats?.updatedAt || stats?.createdAt || 0)
        const completions = completionsDate >= startDate ? (stats?.completions || 0) : 0
        const posts = await databases.listDocuments(databaseId, 'feed_posts', [Query.equal('courseId', course.$id)])
        const recentPosts = (posts.documents || []).filter((p: any) => new Date(p.createdAt) >= startDate)
        const trendScore = computeCourseTrendScore({
          enrollmentCount: enrollments.total || 0,
          completionCount: completions,
          feedPostCount: recentPosts.length,
          averageRating: stats?.averageRating || 0,
          createdAtMs: new Date(course?.createdAt || Date.now()).getTime(),
        })
        return { ...course, enrollmentCount: enrollments.total || 0, completionCount: completions, feedPostCount: recentPosts.length, averageRating: stats?.averageRating || 0, trendScore }
      } catch {
        return { ...course, enrollmentCount: 0, completionCount: 0, feedPostCount: 0, averageRating: 0, trendScore: 0 }
      }
    }))

    const sorted = stableRankByScore(enrichedCourses).slice(0, parsed.limit)
    return jsonOk({ timeframe: parsed.timeframe, courses: sorted, total: sorted.length }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}
