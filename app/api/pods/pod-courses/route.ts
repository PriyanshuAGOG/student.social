/**
 * Pod Courses API
 * 
 * Endpoint: GET /api/pods/pod-courses
 * 
 * Returns all courses assigned to a pod with progress tracking
 */

import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';

interface CourseProgress {
  $id: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  startDate: string;
  progress: {
    groupCompletionPercent: number;
    membersCompleted: number;
    totalMembers: number;
  };
  chapters: {
    $id: string;
    title: string;
    completedBy: number;
    totalMembers: number;
  }[];
  lastActivity: string;
}

function parseChapters(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * GET /api/pods/pod-courses?podId=xxx
 * 
 * Get all courses assigned to a pod
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const podId = searchParams.get('podId');

    if (!podId) {
      return Response.json(
        { error: 'Pod ID required' },
        { status: 400 }
      );
    }

    const { databases, config } = await createAdminClient();

    // Get pod courses for this pod
    const podCoursesResponse = await databases.listDocuments(
      config.databaseId,
      'pod_courses',
      [Query.equal('podId', podId), Query.orderDesc('createdAt')]
    );

    // A pod course is the course document itself. Older code treated it as a
    // relation to `courses` and queried attributes that do not exist in the
    // provisioned schemas (`courseId`, `chapterId`, and `completed`).
    const courses: CourseProgress[] = podCoursesResponse.documents.map((podCourse: any) => {
      const rawChapters = parseChapters(podCourse.chapters)
      const completedChapters = Math.max(Number(podCourse.completedChapters) || 0, 0)
      const totalChapters = Math.max(Number(podCourse.totalChapters) || rawChapters.length, 0)
      const progress = Number.isFinite(Number(podCourse.progress))
        ? Math.min(Math.max(Number(podCourse.progress), 0), 100)
        : totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0

      return {
        $id: podCourse.$id,
        courseId: podCourse.$id,
        courseName: podCourse.courseTitle || 'Untitled course',
        instructorName: podCourse.createdBy || 'PeerSpark',
        startDate: podCourse.createdAt || podCourse.$createdAt,
        progress: {
          groupCompletionPercent: progress,
          membersCompleted: completedChapters,
          totalMembers: totalChapters,
        },
        chapters: rawChapters.map((chapter, index) => ({
          $id: String(chapter.id || chapter.$id || `chapter-${index + 1}`),
          title: String(chapter.title || `Chapter ${index + 1}`),
          completedBy: chapter.contentGenerated === true ? 1 : 0,
          totalMembers: 1,
        })),
        lastActivity: podCourse.updatedAt || podCourse.createdAt || podCourse.$updatedAt,
      }
    });

    return Response.json({ courses });
  } catch (error) {
    console.error('Error fetching pod courses:', error);
    return Response.json(
      { error: 'Failed to fetch pod courses' },
      { status: 500 }
    );
  }
}
