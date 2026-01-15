/**
 * Adaptive Difficulty & Progress Tracking Service
 * 
 * Handles:
 * - Adaptive assignment selection based on performance
 * - Progress calculation
 * - Performance analytics
 * - Struggling concepts detection
 */

import { Databases } from 'appwrite';
import {
  getUserSubmissions,
  getChapterAssignments,
  updateProgress,
  DATABASE_ID,
} from '@/lib/course-service';
import { AssignmentSubmission, AssignmentDifficulty } from '@/lib/types/courses';

/**
 * Calculate next recommended difficulty based on user performance
 */
export async function getRecommendedNextDifficulty(
  db: Databases,
  userId: string,
  courseId: string
): Promise<AssignmentDifficulty> {
  try {
    // Get user's recent submissions
    const submissions = await getUserSubmissions(db, userId);

    if (submissions.length === 0) {
      return 'Easy'; // Start with easy
    }

    // Calculate average score from last 5 submissions
    const recentSubmissions = submissions.slice(-5);
    const avgScore =
      recentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) /
      recentSubmissions.length;

    // Recommend difficulty based on performance
    if (avgScore >= 90) {
      return 'Hard'; // User is excelling, try harder assignments
    } else if (avgScore >= 75) {
      return 'Medium'; // User is doing well, try medium
    } else if (avgScore >= 50) {
      return 'Easy'; // User struggling, go back to easy
    } else {
      return 'Easy'; // User struggling significantly, focus on easy
    }
  } catch (error) {
    console.error('Error calculating difficulty:', error);
    return 'Easy';
  }
}

/**
 * Update user progress with completion tracking
 */
export async function updateUserProgress(
  db: Databases,
  progressId: string,
  chapterId: string,
  assignments: AssignmentSubmission[],
  totalChapters: number
) {
  try {
    // Calculate metrics
    const completedAssignments = assignments.filter(
      (a) => a.status === 'Graded' || a.status === 'ReviewPending'
    ).length;
    const totalAssignments = assignments.length;
    const avgScore =
      assignments.reduce((sum, a) => sum + (a.score || 0), 0) /
      assignments.length || 0;

    // Calculate overall completion percentage
    const chaptersCompleted = Math.floor(totalAssignments / 3); // Rough estimate
    const completionPercentage = (chaptersCompleted / totalChapters) * 100;

    // Update progress
    await updateProgress(db, progressId, {
      completionPercentage: Math.min(100, Math.round(completionPercentage)),
      chaptersCompleted: Math.min(chaptersCompleted, totalChapters),
      averageScore: Math.round(avgScore),
      completedAssignments,
      lastAccessedAt: new Date().toISOString(),
    });

    console.log(
      `📊 Progress updated: ${completionPercentage.toFixed(1)}%, Avg Score: ${avgScore.toFixed(1)}`
    );
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

/**
 * Identify struggling concepts from submission data
 */
export async function identifyStrugglingConcepts(
  db: Databases,
  userId: string,
  courseId: string
): Promise<string[]> {
  try {
    const submissions = await getUserSubmissions(db, userId);

    // Find submissions with low scores
    const poorSubmissions = submissions.filter((s) => s.score && s.score < 50);

    // Extract struggling concepts from feedback
    const strugglConcepts: string[] = [];

    for (const submission of poorSubmissions) {
      if (submission.aiGeneratedFeedback) {
        // Parse feedback for concept mentions
        const conceptMatches = submission.aiGeneratedFeedback.match(
          /concept.*?[:—](.*?)[\n.]/gi
        );
        if (conceptMatches) {
          conceptMatches.forEach((match) => {
            const concept = match.replace(/concept.*?[:—]/, '').trim();
            if (!strugglConcepts.includes(concept)) {
              strugglConcepts.push(concept);
            }
          });
        }
      }
    }

    return strugglConcepts.slice(0, 5); // Top 5 struggling concepts
  } catch (error) {
    console.error('Error identifying struggling concepts:', error);
    return [];
  }
}

/**
 * Calculate performance metrics for analytics
 */
export function calculatePerformanceMetrics(submissions: AssignmentSubmission[]): {
  averageScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  completionRate: number;
  improvementTrend: number;
} {
  if (submissions.length === 0) {
    return {
      averageScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      completionRate: 0,
      improvementTrend: 0,
    };
  }

  const scores = submissions
    .filter((s) => s.score !== null && s.score !== undefined)
    .map((s) => s.score as number);

  // Sort for median
  const sortedScores = [...scores].sort((a, b) => a - b);

  // Calculate metrics
  const averageScore =
    scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const medianScore =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] +
          sortedScores[sortedScores.length / 2]) /
        2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  // Calculate improvement trend (compare first half to second half)
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

  const improvementTrend = secondHalfAvg - firstHalfAvg;

  return {
    averageScore: Math.round(averageScore),
    medianScore: Math.round(medianScore),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    completionRate: (submissions.length / (submissions.length + 5)) * 100, // Estimate
    improvementTrend: Math.round(improvementTrend * 10) / 10,
  };
}

/**
 * Award bonus points for improvement
 */
export function calculateImprovementBonus(
  previousScore: number,
  currentScore: number,
  basePoints: number = 50
): number {
  const improvement = currentScore - previousScore;

  if (improvement <= 0) return 0;

  // Award 0-50 bonus points based on improvement
  const bonus = Math.min(improvement, 50);
  return Math.round(bonus);
}
