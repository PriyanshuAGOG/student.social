/**
 * COMMENTS API
 * POST /api/posts/[id]/comments - Create comment on post
 * GET  /api/posts/[id]/comments - Get comments for post
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!;
const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID!;
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!;

/**
 * POST /api/posts/[id]/comments - Create a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;
    const body = await request.json();
    const { userId, content, parentCommentId } = body;

    validateInput(
      { postId, userId, content },
      {
        postId: { required: true },
        userId: { required: true },
        content: {
          required: true,
          minLength: 1,
          maxLength: 1000,
        },
      }
    );

    const { databases } = await createAdminClient();

    // Verify post exists
    const post = await databases.getDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    if (post.isDeleted) {
      throw new AppError({
        code: 'POST_DELETED',
        message: 'Cannot comment on deleted post',
        userMessage: 'This post has been deleted',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Get commenter info
    let authorName = 'Anonymous';
    let authorAvatar = '';
    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        userId
      );
      authorName = profile.name || authorName;
      authorAvatar = profile.avatar || '';
    } catch (profileError) {
      console.log('Could not fetch commenter profile, using defaults');
    }

    // Create comment
    const comment = await databases.createDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      'unique()',
      {
        postId,
        authorId: userId,
        authorName,
        authorAvatar,
        content: content.trim(),
        parentCommentId: parentCommentId || null,
        likes: 0,
        likedBy: [],
        replies: 0,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Update post comment count
    await databases.updateDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId,
      {
        comments: (post.comments || 0) + 1,
      }
    );

    // Create notification for post author (if not self-comment)
    if (post.authorId !== userId) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          'unique()',
          {
            userId: post.authorId,
            type: 'comment',
            actor: userId,
            postId: postId,
            message: `${authorName} commented on your post`,
            isRead: false,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (notifError) {
        console.error('Failed to create comment notification:', notifError);
      }
    }

    // If reply, notify parent commenter
    if (parentCommentId) {
      try {
        const parentComment = await databases.getDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          parentCommentId
        );

        if (parentComment.authorId !== userId) {
          await databases.createDocument(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION_ID,
            'unique()',
            {
              userId: parentComment.authorId,
              type: 'reply',
              actor: userId,
              postId: postId,
              message: `${authorName} replied to your comment`,
              isRead: false,
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Update parent comment reply count
        await databases.updateDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          parentCommentId,
          {
            replies: (parentComment.replies || 0) + 1,
          }
        );
      } catch (parentError) {
        console.error('Failed to handle parent comment:', parentError);
      }
    }

    return {
      success: true,
      comment,
      message: 'Comment created successfully',
    };
  }, { operation: 'createComment' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'RESOURCE_NOT_FOUND' || error.code === 'POST_DELETED' ? 404 : 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/posts/[id]/comments - Get comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    validateInput({ postId }, { postId: { required: true } });

    const { databases } = await createAdminClient();

    const comments = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      [
        Query.equal('postId', postId),
        Query.equal('isDeleted', false),
        Query.isNull('parentCommentId'), // Only top-level comments
        Query.orderDesc('createdAt'),
        Query.limit(Math.min(limit, 100)),
        Query.offset(offset),
      ]
    );

    // For each comment, get its replies
    const commentsWithReplies = [];
    for (const comment of comments.documents) {
      const replies = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [
          Query.equal('parentCommentId', comment.$id),
          Query.equal('isDeleted', false),
          Query.orderAsc('createdAt'),
          Query.limit(10), // Limit replies per comment
        ]
      );

      commentsWithReplies.push({
        ...comment,
        replies: replies.documents,
      });
    }

    return {
      success: true,
      comments: commentsWithReplies,
      total: comments.total,
      limit,
      offset,
    };
  }, { operation: 'getComments' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
