// Course System Type Definitions

// Enums
export enum CourseDifficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum CourseStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived',
}

export enum ChapterContentType {
  VIDEO = 'Video',
  ARTICLE = 'Article',
  INTERACTIVE = 'Interactive',
}

export enum AssignmentType {
  MULTIPLE_CHOICE = 'MultipleChoice',
  SHORT_ANSWER = 'ShortAnswer',
  ESSAY = 'Essay',
  CODE = 'Code',
  PROJECT = 'Project',
}

export enum AssignmentDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum CourseProgressStatus {
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  DROPPED = 'Dropped',
}

export enum EnrollmentType {
  FREE = 'Free',
  PAID = 'Paid',
  COHORT = 'Cohort',
}

export enum EnrollmentStatus {
  ACTIVE = 'Active',
  DROPPED = 'Dropped',
  COMPLETED = 'Completed',
}

export enum SubmissionStatus {
  SUBMITTED = 'Submitted',
  GRADED = 'Graded',
  REVIEW_PENDING = 'ReviewPending',
}

// Interfaces

export interface Course {
  $id: string;
  title: string;
  description: string;
  instructorId: string;
  language: string;
  duration: number; // minutes
  difficulty: CourseDifficulty;
  tags: string[];
  prerequisites: string[];
  coverImage: string;
  youtubeLink?: string;
  status: CourseStatus;
  isMonetized: boolean;
  price: number; // USD
  enrollmentCount: number;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseChapter {
  $id: string;
  courseId: string;
  title: string;
  description: string;
  sequenceNumber: number;
  duration: number; // minutes
  videoStartTime: number; // seconds
  videoEndTime: number; // seconds
  learningObjectives: string[];
  contentType: ChapterContentType;
  transcript: string;
  transcriptCleaned: string;
  createdAt: string;
}

export interface Concept {
  name: string;
  definition: string;
  importance: 'critical' | 'important' | 'reference';
}

export interface CourseContent {
  $id: string;
  chapterId: string;
  summaries: string[];
  keyTakeaways: string[];
  detailedNotes: string; // markdown
  concepts: Concept[];
  formulas: string[];
  realWorldApplications: string[];
  generatedAt: string;
  llmModel: string;
  promptHash: string; // for caching
}

export interface GradingRubric {
  criteria: Array<{
    name: string;
    weight: number;
    description: string;
  }>;
  passingScore: number;
}

export interface CourseAssignment {
  $id: string;
  chapterId: string;
  title: string;
  description: string;
  type: AssignmentType;
  difficulty: AssignmentDifficulty;
  estimatedTime: number; // minutes
  questionText: string;
  options?: string[]; // for multiple choice
  rubric: GradingRubric;
  gradingCriteria: string;
  sequenceNumber: number;
  variations?: string[]; // different versions to prevent cheating
  createdAt: string;
}

export interface UserCourseProgress {
  $id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completionPercentage: number; // 0-100
  chaptersCompleted: number;
  totalChapters: number;
  averageScore: number; // 0-100
  finalScore: number; // 0-100
  courseStatus: CourseProgressStatus;
  certificateEarned: boolean;
  certificateId?: string;
  timeSpent: number; // minutes
  lastAccessedAt: string;
  bookmarkedChapters: string[];
  attemptedAssignments: number;
  completedAssignments: number;
}

export interface AssignmentSubmission {
  $id: string;
  assignmentId: string;
  userId: string;
  submissionText?: string;
  submissionFile?: string;
  submittedAt: string;
  score: number; // 0-100
  confidence: number; // 0-1
  aiGeneratedFeedback: string;
  isAutoGraded: boolean;
  flaggedForReview: boolean;
  reviewedBy?: string;
  manualScore?: number;
  revisionCount: number;
  status: SubmissionStatus;
}

export interface CourseEnrollment {
  $id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  enrollmentType: EnrollmentType;
  paymentId?: string;
  cohortId?: string;
  status: EnrollmentStatus;
}

export interface CourseStats {
  $id: string;
  courseId: string;
  enrollmentCount: number;
  completionCount: number;
  avgCompletionTime: number; // minutes
  avgScore: number;
  churnRate: number; // percentage
  totalRevenue: number;
  instructorEarnings: number;
  updatedAt: string;
}

export interface CourseReview {
  $id: string;
  courseId: string;
  userId: string;
  rating: number; // 1-5
  reviewText: string;
  verifiedCompletion: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Achievement {
  type: string;
  name: string;
  description: string;
  badgeIcon: string;
  points: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  earnedAt: string;
  courseId?: string;
}

export interface Certificate {
  $id: string;
  courseId: string;
  userId: string;
  certificateId: string; // CERT-2026-01-15-XXXXX
  score: number;
  completionDate: string;
  instructorName: string;
  signatureUrl?: string;
  qrCodeUrl: string;
  verificationUrl: string;
  createdAt: string;
  expiresAt?: string; // optional expiry
}
