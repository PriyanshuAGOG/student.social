/**
 * USER FOLLOW/UNFOLLOW API
 * POST /api/users/[id]/follow - Follow/Unfollow a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID!;
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const targetUserId = params.id;
    const body = await request.json();
    const { userId } = body; // Current user

    validateInput({ targetUserId, userId }, {
      targetUserId: { required: true },
      userId: { required: true },
    });

    if (targetUserId === userId) {
      throw new AppError({
        code: 'CANNOT_FOLLOW_SELF',
        message: 'You cannot follow yourself',
        userMessage: 'You cannot follow yourself',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
      });
    }

    const { databases } = await createAdminClient();

    // Get both profiles
    const [followerProfile, targetProfile] = await Promise.all([
      databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId),
      databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, targetUserId),
    ]);

    const following = Array.isArray(followerProfile.following) ? followerProfile.following : [];
    const isFollowing = following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      const newFollowing = following.filter((id: string) => id !== targetUserId);
      await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      });

      const followers = Array.isArray(targetProfile.followers) ? targetProfile.followers : [];
      const newFollowers = followers.filter((id: string) => id !== userId);
      await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION_ID, targetUserId, {
        followers: newFollowers,
        followerCount: newFollowers.length,
      });

      return {
        success: true,
        isFollowing: false,
        message: `Unfollowed ${targetProfile.name || 'user'}`,
      };
    } else {
      // Follow
      const newFollowing = [...following, targetUserId];
      await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      });

      const followers = Array.isArray(targetProfile.followers) ? targetProfile.followers : [];
      const newFollowers = [...followers, userId];
      await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION_ID, targetUserId, {
        followers: newFollowers,
        followerCount: newFollowers.length,
      });

      // Create notification
      try {
        await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, 'unique()', {
          userId: targetUserId,
          type: 'follow',
          actor: userId,
          actorName: followerProfile.name || 'Someone',
          actorAvatar: followerProfile.avatar || '',
          message: `${followerProfile.name || 'Someone'} started following you`,
          isRead: false,
          timestamp: new Date().toISOString(),
        });
      } catch (notifError) {
        console.error('Failed to create follow notification:', notifError);
      }

      return {
        success: true,
        isFollowing: true,
        message: `Following ${targetProfile.name || 'user'}`,
      };
    }
  }, { operation: 'toggleFollow' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'VALIDATION_ERROR' || error.code === 'CANNOT_FOLLOW_SELF' ? 400 : error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500 }
    );
  }

  return NextResponse.json(data);
}
