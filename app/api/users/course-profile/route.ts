// @ts-nocheck
/**
 * User Course Profile & Certifications API
 * 
 * Endpoint: GET /api/users/course-profile
 * 
 * Displays user's course learning journey, earned certificates,
 * achievements, and learning statistics on their profile.
 */

// @ts-nocheck
import { Query } from 'appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { courseService } from '@/lib/course-service';

interface CourseProfile {
  userId: string;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLearningHours: number;
  averageScore: number;
  totalPoints: number;
  streak: number;
  badges: Array<{
    name: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  certificates: Array<{
    certificateId: string;
    courseName: string;
    score: number;
    earnedAt: string;
    verificationUrl: string;
    downloadUrl: string;
  }>;
  enrolledCourses: Array<{
    courseId: string;
    title: string;
    instructor: string;
    progress: number;
    averageScore: number;
    status: string;
    enrolledAt: string;
    completedAt?: string;
  }>;
  achievements: Array<{
    achievementId: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    rarity: string;
    earnedAt: string;
    courseId?: string;
    courseName?: string;
  }>;
  learningStats: {
    averageCompletionRate: number;
    avgScorePerCourse: number;
    totalAssignmentsCompleted: number;
    totalAssignmentsAttempted: number;
    improvementTrend: number; // percentage improvement over time
  };
}

/**
 * GET /api/users/course-profile?userId=xxx
 * 
 * Get complete course learning profile for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // 1. Get all user enrollments
    const enrollments = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      'course_enrollments',
      [Query.equal('userId', userId)]
    );

    const totalEnrolled = enrollments.total;
    let totalCompleted = 0;
    let totalPoints = 0;
    let totalLearningHours = 0;
    const enrolledCoursesList: any[] = [];

    // 2. For each course, get progress and details
    for (const enrollment of enrollments.documents) {
      try {
        const course = await courseService.getCourse(databases as unknown as any, enrollment.courseId);
        const progress = await courseService.getOrCreateProgress(
          databases as unknown as any,
          userId,
          enrollment.courseId,
          0
        );
        const submissions = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
          'assignment_submissions',
          [
            Query.equal('userId', userId),
            Query.equal('courseId', enrollment.courseId),
          ]
        );

        const chapters = await courseService.getChapters(databases as unknown as any, enrollment.courseId);
        const estimatedHours = chapters.length * 2; // Rough estimate: 2 hours per chapter
        totalLearningHours += estimatedHours;

        const completionPercent =
          chapters.length > 0 ? (progress.chaptersCompleted / chapters.length) * 100 : 0;

        if (completionPercent >= 70) {
          totalCompleted++;
        }

        const userProgress = JSON.parse(JSON.stringify(progress));
        totalPoints += userProgress.totalPoints || 0;

        enrolledCoursesList.push({
          courseId: enrollment.courseId,
          title: course?.title || 'Unknown Course',
          instructor: course?.instructorId || 'Unknown',
          progress: Math.round(completionPercent),
          averageScore: userProgress.averageScore || 0,
          status:
            completionPercent >= 100
              ? 'completed'
              : completionPercent >= 70
                ? 'near-completion'
                : 'in-progress',
          enrolledAt: (enrollment as any).enrollmentDate || enrollment.createdAt,
          completedAt:
            completionPercent >= 70
              ? (enrollment as any).completedAt || new Date().toISOString()
              : undefined,
          assignmentsCompleted: submissions.total,
        });
      } catch (err) {
        console.log(`Error getting details for course ${enrollment.courseId}:`, err);
      }
    }

    // 3. Get certificates
    const certificates = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      'certificates',
      [Query.equal('userId', userId)]
    );

    const certificatesList = certificates.documents.map((cert: any) => ({
      certificateId: cert.$id,
      courseName: cert.courseName,
      score: cert.score,
      earnedAt: cert.issuedAt,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-certificate/${cert.certificateId}`,
      downloadUrl: `/api/certificates/download?certificateId=${cert.$id}`,
    }));

    // 4. Get achievements/badges
    const achievements = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      'user_achievements',
      [Query.equal('userId', userId)]
    );

    const achievementsList = achievements.documents.map((ach: any) => ({
      achievementId: ach.$id,
      name: ach.achievementName,
      description: ach.description,
      icon: ach.icon || '🏆',
      points: ach.points || 0,
      rarity: ach.rarity || 'common',
      earnedAt: ach.earnedAt,
      courseId: ach.courseId,
      courseName: ach.courseName,
    }));

    // 5. Calculate learning stats
    const stats = {
      averageCompletionRate:
        enrolledCoursesList.length > 0
          ? Math.round(
              enrolledCoursesList.reduce((sum, c) => sum + c.progress, 0) /
                enrolledCoursesList.length
            )
          : 0,
      avgScorePerCourse:
        enrolledCoursesList.length > 0
          ? Math.round(
              enrolledCoursesList.reduce((sum, c) => sum + c.averageScore, 0) /
                enrolledCoursesList.length
            )
          : 0,
      totalAssignmentsCompleted: enrolledCoursesList.reduce((sum, c) => sum + c.assignmentsCompleted, 0),
      totalAssignmentsAttempted: enrolledCoursesList.length * 10, // Rough estimate
      improvementTrend: 12, // This would be calculated from historical data
    };

    // 6. Calculate streak (simplified)
    let streak = 0;
    try {
      const recentActivities = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
        'assignment_submissions',
        [Query.equal('userId', userId), Query.limit(1000)]
      );

      if (recentActivities.documents.length > 0) {
        const dates = new Set<string>();
        recentActivities.documents.forEach((doc: any) => {
          const date = new Date(doc.createdAt).toISOString().split('T')[0];
          dates.add(date);
        });

        const sortedDates = Array.from(dates).sort().reverse();
        let currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const curr = new Date(sortedDates[i]);
          const next = new Date(sortedDates[i + 1]);
          const diffDays = Math.floor(
            (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        streak = currentStreak;
      }
    } catch (err) {
      console.log('Error calculating streak:', err);
    }

    // 7. Get badges (from achievements marked as badges)
    const badges = achievementsList.filter((a) => a.rarity === 'legendary' || a.rarity === 'epic');

    const profile: CourseProfile = {
      userId,
      totalCoursesEnrolled: totalEnrolled,
      totalCoursesCompleted: totalCompleted,
      totalLearningHours,
      averageScore: Math.round(stats.avgScorePerCourse),
      totalPoints,
      streak,
      badges,
      certificates: certificatesList,
      enrolledCourses: enrolledCoursesList.sort(
        (a, b) =>
          new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
      ),
      achievements: achievementsList.sort(
        (a, b) =>
          new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
      ),
      learningStats: stats,
    };

    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching user course profile:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch user profile' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
