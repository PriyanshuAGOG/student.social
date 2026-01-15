// @ts-nocheck
/**
 * Pod Course Progress API
 * 
 * Endpoint: GET /api/pods/course-progress
 * 
 * Tracks and displays progress for a pod cohort studying a course together.
 * Shows individual progress, group stats, and peer accountability metrics.
 */

// @ts-nocheck
import { Databases } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { courseService } from '@/lib/course-service';

interface MemberProgress {
  userId: string;
  displayName: string;
  profileImage?: string;
  completionPercent: number;
  chaptersCompleted: number;
  totalChapters: number;
  averageScore: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  lastActivityAt: string;
  streak: number; // days of consecutive activity
  achievements: Array<{ name: string; earnedAt: string }>;
}

interface PodCohortProgress {
  podCourseId: string;
  courseId: string;
  courseName: string;
  cohortName: string;
  cohortPace: string;
  totalMembers: number;
  activeMembers: number;
  groupCompletionPercent: number;
  groupAverageScore: number;
  memberProgress: MemberProgress[];
  milestones: Array<{
    milestone: string;
    completedBy: number;
    totalMembers: number;
    percentComplete: number;
  }>;
  accelerators: string[]; // Members ahead of pace
  strugglingMembers: string[]; // Members behind pace
  communityScore: number; // 0-100, based on participation
}

/**
 * GET /api/pods/course-progress?podCourseId=xxx
 * 
 * Get progress for all members in a pod cohort
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const podCourseId = searchParams.get('podCourseId');

    if (!podCourseId) {
      return new Response(
        JSON.stringify({ error: 'Missing podCourseId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // 1. Fetch pod course info
    const podCourse = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_courses',
      podCourseId
    );

    const { podId, courseId } = podCourse;

    // 2. Get course info
    const course = await courseService.getCourse(courseId);
    if (!course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get chapters
    const chapters = await courseService.getChapters(courseId);
    const totalChapters = chapters.length;

    // 4. Fetch all enrollments for this course from pod members
    const enrollments = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'course_enrollments',
      [
        {
          method: 'equal',
          attribute: 'courseId',
          value: courseId,
        },
        {
          method: 'equal',
          attribute: 'podId',
          value: podId,
        },
      ]
    );

    // 5. For each enrolled member, get their progress
    const memberProgressList: MemberProgress[] = [];
    let totalScore = 0;
    let totalCompletionPercent = 0;

    for (const enrollment of enrollments.documents) {
      const userId = enrollment.userId;

      try {
        // Get user progress
        const userProgress = await courseService.getOrCreateProgress(userId, courseId);

        // Get submissions to count
        const submissions = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          'assignment_submissions',
          [
            {
              method: 'equal',
              attribute: 'userId',
              value: userId,
            },
            {
              method: 'equal',
              attribute: 'courseId',
              value: courseId,
            },
          ]
        );

        // Get user achievements for this course
        let achievements: Array<{ name: string; earnedAt: string }> = [];
        try {
          const userAchievements = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'user_achievements',
            [
              {
                method: 'equal',
                attribute: 'userId',
                value: userId,
              },
            ]
          );
          achievements = userAchievements.documents
            .filter((a: any) => a.courseId === courseId)
            .map((a: any) => ({
              name: a.achievementName,
              earnedAt: a.earnedAt,
            }));
        } catch (e) {
          // Table may not exist yet
        }

        // Calculate streak (simplified - count consecutive days with activity)
        let streak = 0;
        try {
          const activities = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            `pod_course_activities_${podCourseId.replace(/-/g, '_')}`,
            [
              {
                method: 'equal',
                attribute: 'userId',
                value: userId,
              },
            ]
          );

          // Group by date and count consecutive days
          if (activities.documents.length > 0) {
            const dates = new Set<string>();
            activities.documents.forEach((doc: any) => {
              const date = new Date(doc.completedAt).toISOString().split('T')[0];
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
        } catch (e) {
          // If activities collection doesn't exist, streak = 0
        }

        const completionPercent = Math.round((userProgress.completedChapters / totalChapters) * 100);

        memberProgressList.push({
          userId,
          displayName: enrollment.enrollmentType === 'pod-cohort' ? `Member ${userId.slice(0, 8)}` : 'Unknown',
          completionPercent,
          chaptersCompleted: userProgress.completedChapters,
          totalChapters,
          averageScore: userProgress.averageScore || 0,
          assignmentsSubmitted: submissions.total,
          totalAssignments: chapters.reduce((acc, ch) => acc + (ch.assignments?.length || 0), 0),
          lastActivityAt: userProgress.lastActivityAt || new Date().toISOString(),
          streak,
          achievements,
        });

        totalScore += userProgress.averageScore || 0;
        totalCompletionPercent += completionPercent;
      } catch (err) {
        console.log(`Error fetching progress for user ${userId}:`, err);
        // Continue with other members
      }
    }

    // 6. Calculate cohort metrics
    const groupCompletionPercent =
      memberProgressList.length > 0
        ? Math.round(totalCompletionPercent / memberProgressList.length)
        : 0;

    const groupAverageScore =
      memberProgressList.length > 0 ? Math.round(totalScore / memberProgressList.length) : 0;

    // 7. Find accelerators and struggling members
    const medianCompletion = memberProgressList.length > 0
      ? [...memberProgressList]
          .sort((a, b) => a.completionPercent - b.completionPercent)[
          Math.floor(memberProgressList.length / 2)
        ]?.completionPercent || 0
      : 0;

    const accelerators = memberProgressList
      .filter((m) => m.completionPercent > medianCompletion + 20)
      .map((m) => m.userId);

    const strugglingMembers = memberProgressList
      .filter((m) => m.completionPercent < medianCompletion - 20 && m.completionPercent < 25)
      .map((m) => m.userId);

    // 8. Calculate milestones
    const milestones = [
      { milestone: '25% Complete', target: 25 },
      { milestone: '50% Complete', target: 50 },
      { milestone: '75% Complete', target: 75 },
      { milestone: '100% Complete', target: 100 },
    ].map((m) => ({
      milestone: m.milestone,
      completedBy: memberProgressList.filter((mem) => mem.completionPercent >= m.target).length,
      totalMembers: memberProgressList.length,
      percentComplete: Math.round(
        (memberProgressList.filter((mem) => mem.completionPercent >= m.target).length /
          memberProgressList.length) *
          100
      ),
    }));

    // 9. Community score (based on participation, attendance, engagement)
    const communityScore = Math.round(
      (accelerators.length * 10 + memberProgressList.filter((m) => m.streak >= 3).length * 5) /
        Math.max(memberProgressList.length, 1)
    );

    const cohortProgress: PodCohortProgress = {
      podCourseId,
      courseId,
      courseName: course.title,
      cohortName: podCourse.cohortName,
      cohortPace: podCourse.cohortPace,
      totalMembers: enrollments.documents.length,
      activeMembers: memberProgressList.filter((m) => m.streakactivity !== null).length,
      groupCompletionPercent,
      groupAverageScore,
      memberProgress: memberProgressList.sort((a, b) => b.completionPercent - a.completionPercent),
      milestones,
      accelerators,
      strugglingMembers,
      communityScore,
    };

    return new Response(JSON.stringify({ success: true, data: cohortProgress }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching pod course progress:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch pod course progress' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
