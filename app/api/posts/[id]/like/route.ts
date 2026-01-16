/**
 * POST INTERACTIONS API
 * Like, Save, Share endpoints for posts
 * 
 * - POST /api/posts/[id]/like
 * - POST /api/posts/[id]/save
 * - POST /api/posts/[id]/share
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!;
const SAVED_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID!;
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!;

/**
 * POST /api/posts/[id]/like - Toggle like on post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;
    const body = await request.json();
    const { userId } = body;

    validateInput({ postId, userId }, {
      postId: { required: true },
      userId: { required: true },
    });

    const { databases } = await createAdminClient();

    const post = await databases.getDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const isLiked = likedBy.includes(userId);

    const newLikedBy = isLiked
      ? likedBy.filter((id: string) => id !== userId)
      : [...likedBy, userId];

    const updatedPost = await databases.updateDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId,
      {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      }
    );

    // Create notification for post author if liking (not self-like)
    if (!isLiked && post.authorId !== userId) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          'unique()',
          {
            userId: post.authorId,
            type: 'like',
            actor: userId,
            postId: postId,
            message: 'Someone liked your post',
            isRead: false,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (notifError) {
        console.error('Failed to create like notification:', notifError);
      }
    }

    return {
      success: true,
      likes: newLikedBy.length,
      isLiked: !isLiked,
      post: updatedPost,
    };
  }, { operation: 'toggleLike' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500 }
    );
  }

  return NextResponse.json(data);
}
