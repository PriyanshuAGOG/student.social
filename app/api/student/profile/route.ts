import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { ApiError, requireUser } from '@/lib/api-security'
import { createAdminClient, getDatabaseId } from '@/lib/server/appwrite'

async function listOrEmpty(databases: any, databaseId: string, collectionId: string, queries: string[]) {
  return databases.listDocuments(databaseId, collectionId, queries).catch(() => ({ documents: [], total: 0 }))
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireUser(request)
    const { databases, users } = createAdminClient()
    const databaseId = getDatabaseId()

    const [account, profile, enrollments, achievements, certificates, submissions] = await Promise.all([
      users.get(userId).catch(() => null),
      databases.getDocument(databaseId, 'profiles', userId).catch(() => null),
      listOrEmpty(databases, databaseId, 'course_enrollments', [Query.equal('userId', userId), Query.limit(100)]),
      listOrEmpty(databases, databaseId, 'user_achievements', [Query.equal('userId', userId), Query.limit(100)]),
      listOrEmpty(databases, databaseId, 'certificates', [Query.equal('userId', userId), Query.limit(100)]),
      listOrEmpty(databases, databaseId, 'assignment_submissions', [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(100)]),
    ])

    const courseIds: string[] = [...new Set<string>(enrollments.documents.map((item: any) => String(item.courseId || '')).filter(Boolean))]
    const courseEntries = await Promise.all(courseIds.map(async (courseId) => {
      const course = await databases.getDocument(databaseId, 'courses', courseId).catch(() => null)
      return [courseId, course] as const
    }))
    const courseById = new Map(courseEntries)
    const enrollmentData: Array<{ courseId: string; courseName: string; enrollmentType: string; completionPercent: number; chaptersCompleted: number; totalChapters: number; averageScore: number; status: 'active' | 'completed' }> = enrollments.documents.map((item: any) => {
      const course: any = courseById.get(item.courseId)
      const completion = Number(item.completionPercent ?? item.progress ?? 0)
      return {
        courseId: item.courseId,
        courseName: course?.title || 'Course',
        enrollmentType: item.enrollmentType || 'individual',
        completionPercent: completion,
        chaptersCompleted: Number(item.chaptersCompleted || 0),
        totalChapters: Number(item.totalChapters || 0),
        averageScore: Number(item.averageScore || 0),
        status: item.status === 'completed' || completion >= 100 ? 'completed' : 'active',
      }
    })
    const scored: number[] = submissions.documents.map((item: any) => Number(item.manualScore ?? item.score)).filter(Number.isFinite)
    const recentActivity = submissions.documents.slice(0, 10).map((item: any) => ({
      description: `Submitted assignment ${String(item.assignmentId || '').slice(0, 12)}`,
      timestamp: item.submittedAt || item.$createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        name: profile?.name || account?.name || 'Student',
        email: account?.email || profile?.email || '',
        streak: Number(profile?.studyStreak || 0),
        longestStreak: Number(profile?.longestStreak || profile?.studyStreak || 0),
        totalCertificates: certificates.total,
        totalAchievements: achievements.total,
        activeCourses: enrollmentData.filter((item) => item.status === 'active').length,
        completedCourses: enrollmentData.filter((item) => item.status === 'completed').length,
        totalPoints: Number(profile?.totalPoints || 0),
        averageScore: scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : 0,
        totalStudyHours: Number(profile?.totalStudyHours || 0),
        enrollments: enrollmentData,
        achievements: achievements.documents,
        certificates: certificates.documents,
        categoryStats: [],
        recentActivity,
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[student/profile] Failed to load profile', error)
    return NextResponse.json({ error: 'Failed to load student profile' }, { status: 500 })
  }
}
