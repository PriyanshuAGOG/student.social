/**
 * Course Service - Database operations for course system
 * 
 * Handles all CRUD operations for courses, chapters, content, assignments,
 * progress tracking, and submissions.
 */

import { Client, Databases, Query } from 'appwrite';
import {
  Course,
  CourseChapter,
  CourseContent,
  CourseAssignment,
  UserCourseProgress,
  AssignmentSubmission,
  CourseEnrollment,
  CourseStats,
  CourseReview,
  Certificate,
  CourseDifficulty,
  CourseStatus,
  AssignmentType,
} from '@/lib/types/courses';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

const COLLECTIONS = {
  COURSES: 'courses',
  COURSE_CHAPTERS: 'course_chapters',
  COURSE_CONTENT: 'course_content',
  COURSE_ASSIGNMENTS: 'course_assignments',
  USER_COURSE_PROGRESS: 'user_course_progress',
  ASSIGNMENT_SUBMISSIONS: 'assignment_submissions',
  COURSE_ENROLLMENTS: 'course_enrollments',
  COURSE_STATS: 'course_stats',
  COURSE_REVIEWS: 'course_reviews',
  CERTIFICATES: 'certificates',
};

// Initialize Appwrite connection (would use existing auth context)
export const getCourseDatabase = (): Databases | null => {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'peerspark');
    
    return new Databases(client);
  } catch (error) {
    console.error('Failed to initialize Appwrite client:', error);
    return null;
  }
};

// ============= COURSE CRUD =============

export async function createCourse(
  db: Databases,
  courseData: Omit<Course, '$id' | 'createdAt' | 'updatedAt'>
): Promise<Course> {
  try {
    const now = new Date().toISOString();
    const course = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'unique()',
      {
        ...courseData,
        enrollmentCount: 0,
        avgRating: 0,
        totalReviews: 0,
        createdAt: now,
        updatedAt: now,
        tags: JSON.stringify(courseData.tags || []),
        prerequisites: JSON.stringify(courseData.prerequisites || []),
      }
    );
    return course as Course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function getCourse(db: Databases, courseId: string): Promise<Course> {
  try {
    const course = await db.getDocument(DATABASE_ID, COLLECTIONS.COURSES, courseId);
    return {
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      prerequisites: JSON.parse(course.prerequisites || '[]'),
    } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
}

export async function getAllCourses(
  db: Databases,
  limit = 20,
  offset = 0,
  filters?: any[]
): Promise<{ courses: Course[]; total: number }> {
  try {
    const queries = [Query.limit(limit), Query.offset(offset)];
    if (filters) queries.push(...filters);
    queries.push(Query.equal('status', CourseStatus.PUBLISHED));

    const result = await db.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, queries);

    const courses = result.documents.map((doc: any) => ({
      ...doc,
      tags: JSON.parse(doc.tags || '[]'),
      prerequisites: JSON.parse(doc.prerequisites || '[]'),
    }));

    return { courses: courses as Course[], total: result.total };
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function getInstructorCourses(
  db: Databases,
  instructorId: string
): Promise<Course[]> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      [Query.equal('instructorId', instructorId)]
    );

    return result.documents.map((doc: any) => ({
      ...doc,
      tags: JSON.parse(doc.tags || '[]'),
      prerequisites: JSON.parse(doc.prerequisites || '[]'),
    })) as Course[];
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    throw error;
  }
}

export async function updateCourse(
  db: Databases,
  courseId: string,
  updates: Partial<Course>
): Promise<Course> {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
      prerequisites: updates.prerequisites ? JSON.stringify(updates.prerequisites) : undefined,
    };

    // Remove undefined keys
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const course = await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      courseId,
      updateData
    );
    return {
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      prerequisites: JSON.parse(course.prerequisites || '[]'),
    } as Course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(db: Databases, courseId: string): Promise<void> {
  try {
    await db.deleteDocument(DATABASE_ID, COLLECTIONS.COURSES, courseId);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

// ============= COURSE CHAPTERS =============

export async function createChapter(
  db: Databases,
  chapterData: Omit<CourseChapter, '$id' | 'createdAt'>
): Promise<CourseChapter> {
  try {
    const chapter = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'unique()',
      {
        ...chapterData,
        learningObjectives: JSON.stringify(chapterData.learningObjectives || []),
        createdAt: new Date().toISOString(),
      }
    );
    return chapter as CourseChapter;
  } catch (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
}

export async function getChapters(
  db: Databases,
  courseId: string
): Promise<CourseChapter[]> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      [Query.equal('courseId', courseId), Query.orderAsc('sequenceNumber')]
    );

    return result.documents.map((doc: any) => ({
      ...doc,
      learningObjectives: JSON.parse(doc.learningObjectives || '[]'),
    })) as CourseChapter[];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
}

export async function updateChapter(
  db: Databases,
  chapterId: string,
  updates: Partial<CourseChapter>
): Promise<CourseChapter> {
  try {
    const updateData = {
      ...updates,
      learningObjectives: updates.learningObjectives 
        ? JSON.stringify(updates.learningObjectives)
        : undefined,
    };

    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const chapter = await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      chapterId,
      updateData
    );
    return {
      ...chapter,
      learningObjectives: JSON.parse(chapter.learningObjectives || '[]'),
    } as CourseChapter;
  } catch (error) {
    console.error('Error updating chapter:', error);
    throw error;
  }
}

// ============= COURSE CONTENT =============

export async function createOrUpdateContent(
  db: Databases,
  contentData: Omit<CourseContent, '$id'>
): Promise<CourseContent> {
  try {
    // Check if content exists for this chapter
    const existing = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      [Query.equal('chapterId', contentData.chapterId)]
    );

    const data = {
      ...contentData,
      summaries: JSON.stringify(contentData.summaries),
      keyTakeaways: JSON.stringify(contentData.keyTakeaways),
      concepts: JSON.stringify(contentData.concepts),
      formulas: JSON.stringify(contentData.formulas),
      realWorldApplications: JSON.stringify(contentData.realWorldApplications),
    };

    if (existing.total > 0) {
      // Update existing
      const content = await db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COURSE_CONTENT,
        existing.documents[0].$id,
        data
      );
      return parseContent(content);
    } else {
      // Create new
      const content = await db.createDocument(
        DATABASE_ID,
        COLLECTIONS.COURSE_CONTENT,
        'unique()',
        data
      );
      return parseContent(content);
    }
  } catch (error) {
    console.error('Error creating/updating content:', error);
    throw error;
  }
}

export async function getContent(
  db: Databases,
  chapterId: string
): Promise<CourseContent | null> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      [Query.equal('chapterId', chapterId)]
    );

    if (result.total === 0) return null;
    return parseContent(result.documents[0]);
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}

function parseContent(doc: any): CourseContent {
  return {
    ...doc,
    summaries: JSON.parse(doc.summaries || '[]'),
    keyTakeaways: JSON.parse(doc.keyTakeaways || '[]'),
    concepts: JSON.parse(doc.concepts || '[]'),
    formulas: JSON.parse(doc.formulas || '[]'),
    realWorldApplications: JSON.parse(doc.realWorldApplications || '[]'),
  } as CourseContent;
}

// ============= COURSE ASSIGNMENTS =============

export async function createAssignment(
  db: Databases,
  assignmentData: Omit<CourseAssignment, '$id' | 'createdAt'>
): Promise<CourseAssignment> {
  try {
    const assignment = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'unique()',
      {
        ...assignmentData,
        options: assignmentData.options ? JSON.stringify(assignmentData.options) : null,
        rubric: JSON.stringify(assignmentData.rubric),
        variations: assignmentData.variations ? JSON.stringify(assignmentData.variations) : null,
        createdAt: new Date().toISOString(),
      }
    );
    return parseAssignment(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

export async function getChapterAssignments(
  db: Databases,
  chapterId: string
): Promise<CourseAssignment[]> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      [Query.equal('chapterId', chapterId), Query.orderAsc('sequenceNumber')]
    );

    return result.documents.map((doc: any) => parseAssignment(doc)) as CourseAssignment[];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}

function parseAssignment(doc: any): CourseAssignment {
  return {
    ...doc,
    options: doc.options ? JSON.parse(doc.options) : undefined,
    rubric: JSON.parse(doc.rubric),
    variations: doc.variations ? JSON.parse(doc.variations) : undefined,
  } as CourseAssignment;
}

// ============= USER PROGRESS =============

export async function getOrCreateProgress(
  db: Databases,
  userId: string,
  courseId: string,
  totalChapters: number
): Promise<UserCourseProgress> {
  try {
    const existing = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      [Query.equal('userId', userId), Query.equal('courseId', courseId)]
    );

    if (existing.total > 0) {
      return existing.documents[0] as UserCourseProgress;
    }

    // Create new progress record
    const progress = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'unique()',
      {
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        completionPercentage: 0,
        chaptersCompleted: 0,
        totalChapters,
        averageScore: 0,
        finalScore: 0,
        courseStatus: 'InProgress',
        certificateEarned: false,
        timeSpent: 0,
        lastAccessedAt: new Date().toISOString(),
        bookmarkedChapters: JSON.stringify([]),
        attemptedAssignments: 0,
        completedAssignments: 0,
      }
    );

    return progress as UserCourseProgress;
  } catch (error) {
    console.error('Error getting/creating progress:', error);
    throw error;
  }
}

export async function updateProgress(
  db: Databases,
  progressId: string,
  updates: Partial<UserCourseProgress>
): Promise<UserCourseProgress> {
  try {
    const updateData = {
      ...updates,
      bookmarkedChapters: updates.bookmarkedChapters 
        ? JSON.stringify(updates.bookmarkedChapters)
        : undefined,
    };

    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const progress = await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      progressId,
      updateData
    );

    return {
      ...progress,
      bookmarkedChapters: JSON.parse(progress.bookmarkedChapters || '[]'),
    } as UserCourseProgress;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
}

// ============= ASSIGNMENT SUBMISSIONS =============

export async function submitAssignment(
  db: Databases,
  submissionData: Omit<AssignmentSubmission, '$id'>
): Promise<AssignmentSubmission> {
  try {
    const submission = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'unique()',
      {
        ...submissionData,
        submittedAt: new Date().toISOString(),
      }
    );
    return submission as AssignmentSubmission;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
}

export async function getSubmission(
  db: Databases,
  submissionId: string
): Promise<AssignmentSubmission> {
  try {
    const submission = await db.getDocument(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      submissionId
    );
    return submission as AssignmentSubmission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

export async function updateSubmission(
  db: Databases,
  submissionId: string,
  updates: Partial<AssignmentSubmission>
): Promise<AssignmentSubmission> {
  try {
    const submission = await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      submissionId,
      updates
    );
    return submission as AssignmentSubmission;
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
}

export async function getUserSubmissions(
  db: Databases,
  userId: string,
  assignmentId?: string
): Promise<AssignmentSubmission[]> {
  try {
    const queries = [Query.equal('userId', userId)];
    if (assignmentId) queries.push(Query.equal('assignmentId', assignmentId));

    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      queries
    );

    return result.documents as AssignmentSubmission[];
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    throw error;
  }
}

// ============= ENROLLMENTS =============

export async function enrollInCourse(
  db: Databases,
  enrollmentData: Omit<CourseEnrollment, '$id'>
): Promise<CourseEnrollment> {
  try {
    // Check if already enrolled
    const existing = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      [Query.equal('userId', enrollmentData.userId), Query.equal('courseId', enrollmentData.courseId)]
    );

    if (existing.total > 0) {
      return existing.documents[0] as CourseEnrollment;
    }

    const enrollment = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'unique()',
      {
        ...enrollmentData,
        enrolledAt: new Date().toISOString(),
      }
    );

    // Increment course enrollment count
    const course = await getCourse(db, enrollmentData.courseId);
    await updateCourse(db, enrollmentData.courseId, {
      ...course,
      enrollmentCount: (course.enrollmentCount || 0) + 1,
    });

    return enrollment as CourseEnrollment;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
}

export async function getUserEnrollments(
  db: Databases,
  userId: string
): Promise<CourseEnrollment[]> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      [Query.equal('userId', userId), Query.equal('status', 'Active')]
    );

    return result.documents as CourseEnrollment[];
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    throw error;
  }
}

// ============= STATISTICS =============

export async function getOrCreateStats(
  db: Databases,
  courseId: string
): Promise<CourseStats> {
  try {
    const existing = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      [Query.equal('courseId', courseId)]
    );

    if (existing.total > 0) {
      return existing.documents[0] as CourseStats;
    }

    const stats = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'unique()',
      {
        courseId,
        enrollmentCount: 0,
        completionCount: 0,
        avgCompletionTime: 0,
        avgScore: 0,
        churnRate: 0,
        totalRevenue: 0,
        instructorEarnings: 0,
        updatedAt: new Date().toISOString(),
      }
    );

    return stats as CourseStats;
  } catch (error) {
    console.error('Error getting/creating stats:', error);
    throw error;
  }
}

export async function updateStats(
  db: Databases,
  statsId: string,
  updates: Partial<CourseStats>
): Promise<CourseStats> {
  try {
    const stats = await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      statsId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );
    return stats as CourseStats;
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
}

// ============= CERTIFICATES =============

export async function createCertificate(
  db: Databases,
  certData: Omit<Certificate, '$id'>
): Promise<Certificate> {
  try {
    const cert = await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'unique()',
      {
        ...certData,
        createdAt: new Date().toISOString(),
      }
    );
    return cert as Certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }
}

export async function getUserCertificates(
  db: Databases,
  userId: string
): Promise<Certificate[]> {
  try {
    const result = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      [Query.equal('userId', userId), Query.orderDesc('createdAt')]
    );

    return result.documents as Certificate[];
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    throw error;
  }
}

// Export collection IDs for use in other files
export { COLLECTIONS, DATABASE_ID };
