import { Query } from 'node-appwrite'
import { adminJson, safeListDocuments, withAdminApi } from '@/lib/admin-server'
import { COLLECTIONS } from '@/lib/appwrite-server'

export const GET = withAdminApi('courses.manage', async ({ request, correlationId }) => {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100)
  const [courses, podCourses, chapters] = await Promise.all([
    safeListDocuments(COLLECTIONS.COURSES, [Query.limit(limit)]),
    safeListDocuments(COLLECTIONS.POD_COURSES, [Query.limit(limit)]),
    safeListDocuments(COLLECTIONS.CHAPTERS, [Query.limit(1)]),
  ])

  return adminJson(
    {
      documents: courses.documents,
      total: courses.total,
      podCourses: podCourses.documents,
      chapterCount: chapters.total,
      pageInfo: { limit },
    },
    correlationId,
  )
})
