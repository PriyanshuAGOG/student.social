/**
 * Achievement System
 * 
 * Manages course-related achievements and badges:
 * - Chapter Master (90%+ on all chapter assignments)
 * - Course Complete (70%+ overall)
 * - Perfect Score (100%)
 * - Speedrunner (complete in <7 days)
 * - And more...
 */

import { Databases } from 'appwrite';
import { Achievement, UserCourseProgress, CourseProgressStatus } from '@/lib/types/courses';
import { profileService } from '@/lib/appwrite';

export const COURSE_ACHIEVEMENTS = {
  CHAPTER_MASTER: {
    type: 'chapter_master',
    name: 'Chapter Master',
    description: 'Scored 90%+ on all chapter assignments',
    badgeIcon: '🏆',
    points: 50,
    rarity: 'Uncommon' as const,
  },
  COURSE_COMPLETE: {
    type: 'course_complete',
    name: 'Course Complete',
    description: 'Completed course with 70%+ score',
    badgeIcon: '🎓',
    points: 200,
    rarity: 'Rare' as const,
  },
  PERFECT_SCORE: {
    type: 'perfect_score',
    name: 'Perfect Score',
    description: 'Achieved 100% on entire course',
    badgeIcon: '⭐',
    points: 300,
    rarity: 'Epic' as const,
  },
  SPEEDRUNNER: {
    type: 'speedrunner',
    name: 'Speedrunner',
    description: 'Completed course in less than 7 days',
    badgeIcon: '⚡',
    points: 100,
    rarity: 'Rare' as const,
  },
  PERFECTIONIST: {
    type: 'perfectionist',
    name: 'Perfectionist',
    description: 'Averaged less than 3 attempts per assignment',
    badgeIcon: '💎',
    points: 150,
    rarity: 'Rare' as const,
  },
  TEACHERS_PET: {
    type: 'teachers_pet',
    name: "Teacher's Pet",
    description: 'Scored 100% on all hard difficulty assignments',
    badgeIcon: '🔥',
    points: 80,
    rarity: 'Uncommon' as const,
  },
  COMEBACK_KING: {
    type: 'comeback_king',
    name: 'Comeback King',
    description: 'Improved from failing grade to perfect on resubmission',
    badgeIcon: '🔥',
    points: 70,
    rarity: 'Uncommon' as const,
  },
  GROUP_LEARNER: {
    type: 'group_learner',
    name: 'Group Learner',
    description: 'Completed course with pod members (all completed)',
    badgeIcon: '👥',
    points: 120,
    rarity: 'Uncommon' as const,
  },
  COURSE_SPECIALIST: {
    type: 'course_specialist',
    name: 'Course Specialist',
    description: 'Achieved 95%+ on 5+ courses',
    badgeIcon: '🎯',
    points: 400,
    rarity: 'Legendary' as const,
  },
};

/**
 * Check and award achievements for course completion
 */
export async function checkAndAwardAchievements(
  db: Databases,
  userId: string,
  progress: UserCourseProgress,
  courseId: string,
  submissions: any[]
): Promise<Achievement[]> {
  const achievedAchievements: Achievement[] = [];

  try {
    // 1. Chapter Master - 90%+ on all assignments
    if (submissions.every((s) => (s.score || 0) >= 90)) {
      achievedAchievements.push({
        ...COURSE_ACHIEVEMENTS.CHAPTER_MASTER,
        earnedAt: new Date().toISOString(),
        courseId,
      });
    }

    // 2. Course Complete - 70%+ overall
    if (progress.finalScore >= 70 && progress.courseStatus === CourseProgressStatus.COMPLETED) {
      achievedAchievements.push({
        ...COURSE_ACHIEVEMENTS.COURSE_COMPLETE,
        earnedAt: new Date().toISOString(),
        courseId,
      });
    }

    // 3. Perfect Score - 100%
    if (progress.finalScore === 100) {
      achievedAchievements.push({
        ...COURSE_ACHIEVEMENTS.PERFECT_SCORE,
        earnedAt: new Date().toISOString(),
        courseId,
      });
    }

    // 4. Speedrunner - < 7 days
    const enrolledDate = new Date(progress.enrolledAt);
    const completedDate = new Date();
    const daysDiff = Math.floor(
      (completedDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 7 && progress.courseStatus === CourseProgressStatus.COMPLETED) {
      achievedAchievements.push({
        ...COURSE_ACHIEVEMENTS.SPEEDRUNNER,
        earnedAt: new Date().toISOString(),
        courseId,
      });
    }

    // 5. Perfectionist - < 3 attempts average
    const avgAttempts =
      submissions.reduce((sum, s) => sum + (s.revisionCount || 0), 0) /
      submissions.length;

    if (avgAttempts < 3) {
      achievedAchievements.push({
        ...COURSE_ACHIEVEMENTS.PERFECTIONIST,
        earnedAt: new Date().toISOString(),
        courseId,
      });
    }

    // Award achievements to user profile
    for (const achievement of achievedAchievements) {
      await awardAchievementToUser(db, userId, achievement);
    }

    console.log(
      `🏆 Awarded ${achievedAchievements.length} achievements to user ${userId}`
    );

    return achievedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Award achievement to user profile
 */
async function awardAchievementToUser(
  db: Databases,
  userId: string,
  achievement: Achievement
) {
  try {
    // Get user profile
    const user = await profileService.getProfile(userId);
    if (!user) {
      console.warn(`Profile not found for ${userId}, skipping achievement award`);
      return;
    }

    // Add achievement to badges array
    const badges = user.badges || [];
    badges.push(achievement);

    // Update user profile
    await profileService.updateProfile(userId, { badges });

    // Award points
    const newPoints = (user.totalPoints || 0) + achievement.points;
    await profileService.updateProfile(userId, { totalPoints: newPoints });

    console.log(
      `✅ Awarded "${achievement.name}" (+${achievement.points} points) to ${userId}`
    );
  } catch (error) {
    console.error(`Error awarding achievement to ${userId}:`, error);
  }
}

/**
 * Generate achievement post for social feed
 */
export function generateAchievementPost(
  achievement: Achievement,
  userName: string,
  courseName: string,
  score?: number
): {
  title: string;
  description: string;
  emoji: string;
} {
  const posts: { [key: string]: string } = {
    chapter_master: `${achievement.badgeIcon} ${userName} is a Chapter Master in ${courseName}!`,
    course_complete: `🎓 ${userName} completed "${courseName}" with ${score || 'high'}% score!`,
    perfect_score: `⭐ ${userName} achieved a Perfect Score in "${courseName}"!`,
    speedrunner: `⚡ ${userName} is a Speedrunner - completed "${courseName}" in record time!`,
    perfectionist: `💎 ${userName} is a Perfectionist - nearly perfect execution in "${courseName}"!`,
    teachers_pet: `🔥 ${userName} earned "Teacher's Pet" in "${courseName}"!`,
    comeback_king: `🏆 ${userName} is a Comeback King - improved dramatically in "${courseName}"!`,
    group_learner: `👥 ${userName} completed "${courseName}" with their pod!`,
    course_specialist: `🎯 ${userName} is a Course Specialist - mastered ${courseName}!`,
  };

  return {
    title: posts[achievement.type] || `${achievement.name} - ${courseName}`,
    description: achievement.description,
    emoji: achievement.badgeIcon,
  };
}
