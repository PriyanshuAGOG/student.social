/**
 * Appwrite Setup Script for Course System
 * 
 * This script creates all the necessary collections for the course generation system.
 * Run this after setting up basic Appwrite configuration.
 * 
 * Usage: node scripts/setup-courses.js
 */

const sdk = require('node-appwrite');

// Check if Appwrite is configured
if (!process.env.APPWRITE_ENDPOINT && !process.env.APPWRITE_API_KEY) {
  console.log('⚠️  Appwrite not configured. Skipping collection setup.');
  console.log('   Set APPWRITE_ENDPOINT and APPWRITE_API_KEY environment variables to run this script.');
  console.log('   Collections will be created automatically when you start using the APIs.');
  process.exit(0);
}

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'peerspark-main-db')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db';

// Collection IDs
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

async function setupCollections() {
  try {
    console.log('🚀 Starting Appwrite Course System Setup...\n');

    // 1. COURSES Collection
    console.log('📚 Creating COURSES collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'Courses',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
        new sdk.Permission.delete(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'title',
      200,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'description',
      5000,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'instructorId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'language',
      10,
      false,
      'en'
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'duration',
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'difficulty',
      20,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'tags',
      5000,
      false
    ); // JSON stringified array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'prerequisites',
      2000,
      false
    ); // JSON stringified array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'coverImage',
      500,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'youtubeLink',
      500,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'status',
      20,
      false,
      'Draft'
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'isMonetized',
      false,
      false
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'price',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'enrollmentCount',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'avgRating',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'totalReviews',
      false,
      0
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'createdAt'
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSES,
      'updatedAt'
    );
    console.log('✅ COURSES collection created\n');

    // 2. COURSE_CHAPTERS Collection
    console.log('📖 Creating COURSE_CHAPTERS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'Course Chapters',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
        new sdk.Permission.delete(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'courseId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'title',
      300,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'description',
      2000,
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'sequenceNumber',
      true
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'duration',
      true
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'videoStartTime',
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'videoEndTime',
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'learningObjectives',
      2000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'contentType',
      20,
      false,
      'Video'
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'transcript',
      50000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'transcriptCleaned',
      50000,
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CHAPTERS,
      'createdAt'
    );
    console.log('✅ COURSE_CHAPTERS collection created\n');

    // 3. COURSE_CONTENT Collection
    console.log('📝 Creating COURSE_CONTENT collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'Course Content',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'chapterId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'summaries',
      10000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'keyTakeaways',
      5000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'detailedNotes',
      50000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'concepts',
      20000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'formulas',
      10000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'realWorldApplications',
      5000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'generatedAt',
      30,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'llmModel',
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_CONTENT,
      'promptHash',
      100,
      false
    );
    console.log('✅ COURSE_CONTENT collection created\n');

    // 4. COURSE_ASSIGNMENTS Collection
    console.log('❓ Creating COURSE_ASSIGNMENTS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'Course Assignments',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'chapterId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'title',
      300,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'description',
      2000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'type',
      30,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'difficulty',
      20,
      true
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'estimatedTime',
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'questionText',
      5000,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'options',
      2000,
      false
    ); // JSON array
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'rubric',
      3000,
      false
    ); // JSON object
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'gradingCriteria',
      2000,
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'sequenceNumber',
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'variations',
      5000,
      false
    ); // JSON array
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ASSIGNMENTS,
      'createdAt'
    );
    console.log('✅ COURSE_ASSIGNMENTS collection created\n');

    // 5. USER_COURSE_PROGRESS Collection
    console.log('📊 Creating USER_COURSE_PROGRESS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'User Course Progress',
      [
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'userId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'courseId',
      100,
      true
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'enrolledAt'
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'completionPercentage',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'chaptersCompleted',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'totalChapters',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'averageScore',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'finalScore',
      false,
      0
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'courseStatus',
      20,
      false,
      'InProgress'
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'certificateEarned',
      false,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'certificateId',
      100,
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'timeSpent',
      false,
      0
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'lastAccessedAt'
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'bookmarkedChapters',
      5000,
      false
    ); // JSON array
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'attemptedAssignments',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.USER_COURSE_PROGRESS,
      'completedAssignments',
      false,
      0
    );
    console.log('✅ USER_COURSE_PROGRESS collection created\n');

    // 6. ASSIGNMENT_SUBMISSIONS Collection
    console.log('✍️  Creating ASSIGNMENT_SUBMISSIONS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'Assignment Submissions',
      [
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'assignmentId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'userId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'submissionText',
      10000,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'submissionFile',
      500,
      false
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'submittedAt'
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'score',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'confidence',
      false,
      0
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'aiGeneratedFeedback',
      3000,
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'isAutoGraded',
      false,
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'flaggedForReview',
      false,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'reviewedBy',
      100,
      false
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'manualScore',
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'revisionCount',
      false,
      0
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
      'status',
      20,
      false,
      'Submitted'
    );
    console.log('✅ ASSIGNMENT_SUBMISSIONS collection created\n');

    // 7. COURSE_ENROLLMENTS Collection
    console.log('📋 Creating COURSE_ENROLLMENTS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'Course Enrollments',
      [
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'userId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'courseId',
      100,
      true
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'enrolledAt'
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'enrollmentType',
      20,
      false,
      'Free'
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'paymentId',
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'cohortId',
      100,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_ENROLLMENTS,
      'status',
      20,
      false,
      'Active'
    );
    console.log('✅ COURSE_ENROLLMENTS collection created\n');

    // 8. COURSE_STATS Collection
    console.log('📈 Creating COURSE_STATS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'Course Stats',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'courseId',
      100,
      true
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'enrollmentCount',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'completionCount',
      false,
      0
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'avgCompletionTime',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'avgScore',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'churnRate',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'totalRevenue',
      false,
      0
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'instructorEarnings',
      false,
      0
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_STATS,
      'updatedAt'
    );
    console.log('✅ COURSE_STATS collection created\n');

    // 9. COURSE_REVIEWS Collection
    console.log('⭐ Creating COURSE_REVIEWS collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'Course Reviews',
      [
        new sdk.Permission.read(sdk.Role.any()),
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
        new sdk.Permission.update(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'courseId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'userId',
      100,
      true
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'rating',
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'reviewText',
      2000,
      false
    );
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'verifiedCompletion',
      false,
      false
    );
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'helpfulCount',
      false,
      0
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.COURSE_REVIEWS,
      'createdAt'
    );
    console.log('✅ COURSE_REVIEWS collection created\n');

    // 10. CERTIFICATES Collection
    console.log('🎓 Creating CERTIFICATES collection...');
    await databases.createCollection(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'Certificates',
      [
        new sdk.Permission.read(sdk.Role.user()),
        new sdk.Permission.create(sdk.Role.user()),
      ]
    );

    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'courseId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'userId',
      100,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'certificateId',
      50,
      true
    );
    await databases.createFloatAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'score',
      true
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'completionDate'
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'instructorName',
      200,
      true
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'signatureUrl',
      500,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'qrCodeUrl',
      500,
      false
    );
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'verificationUrl',
      500,
      true
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'createdAt'
    );
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTIONS.CERTIFICATES,
      'expiresAt',
      false
    );
    console.log('✅ CERTIFICATES collection created\n');

    console.log('\n✅✅✅ All collections created successfully! ✅✅✅\n');
    console.log('Collections created:');
    Object.values(COLLECTIONS).forEach((col) => console.log(`  - ${col}`));

  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    process.exit(1);
  }
}

// Run setup
setupCollections().then(() => {
  console.log('\n🎉 Setup complete! Your course system is ready to use.');
  process.exit(0);
});
