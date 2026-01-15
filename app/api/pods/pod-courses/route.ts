// @ts-nocheck
/**
 * Pod Courses API
 * 
 * Endpoint: GET /api/pods/pod-courses
 * 
 * Returns all courses assigned to a pod with progress tracking
 */

import { Databases } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';

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

    const { databases } = createAdminClient();
    const databaseId = process.env.APPWRITE_DATABASE_ID;

    // Get pod courses for this pod
    const podCoursesResponse = await databases.listDocuments(
      databaseId!,
      'pod_courses',
      [
        {
          method: 'equal',
          attribute: 'podId',
          value: podId,
        },
      ]
    );

    const courses: CourseProgress[] = [];

    // Process each pod course
    for (const podCourse of podCoursesResponse.documents) {
      try {
        // Get course details
        const course = await databases.getDocument(
          databaseId!,
          'courses',
          podCourse.courseId
        );

        // Get pod members
        const podResponse = await databases.getDocument(
          databaseId!,
          'pods',
          podId
        );
        const podMembers = (podResponse as any).members || [];

        // Get course chapters
        const chaptersResponse = await databases.listDocuments(
          databaseId!,
          'course_chapters',
          [
            {
              method: 'equal',
              attribute: 'courseId',
              value: podCourse.courseId,
            },
          ]
        );

        // Calculate progress for each chapter
        const chapters = await Promise.all(
          chaptersResponse.documents.map(async (chapter: any) => {
            // Count members who completed this chapter
            const progressDocs = await databases.listDocuments(
              databaseId!,
              'user_course_progress',
              [
                {
                  method: 'equal',
                  attribute: 'chapterId',
                  value: chapter.$id,
                },
                {
                  method: 'equal',
                  attribute: 'completed',
                  value: true,
                },
              ]
            );

            return {
              $id: chapter.$id,
              title: chapter.title,
              completedBy: progressDocs.documents.length,
              totalMembers: podMembers.length,
            };
          })
        );

        // Calculate overall group progress
        const allProgressDocs = await databases.listDocuments(
          databaseId!,
          'user_course_progress',
          [
            {
              method: 'equal',
              attribute: 'courseId',
              value: podCourse.courseId,
            },
            {
              method: 'equal',
              attribute: 'completed',
              value: true,
            },
          ]
        );

        const membersCompleted = new Set(allProgressDocs.documents.map((p: any) => p.userId)).size;
        const groupCompletionPercent = Math.round(
          (membersCompleted / podMembers.length) * 100
        );

        courses.push({
          $id: podCourse.$id,
          courseId: podCourse.courseId,
          courseName: course.title,
          instructorName: course.instructor || 'Unknown Instructor',
          startDate: podCourse.createdAt || new Date().toISOString(),
          progress: {
            groupCompletionPercent,
            membersCompleted,
            totalMembers: podMembers.length,
          },
          chapters,
          lastActivity: podCourse.lastUpdated || podCourse.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.log(`Error processing pod course ${podCourse.$id}:`, err);
      }
    }

    return Response.json({ courses });
  } catch (error) {
    console.error('Error fetching pod courses:', error);
    return Response.json(
      { error: 'Failed to fetch pod courses' },
      { status: 500 }
    );
  }
}
