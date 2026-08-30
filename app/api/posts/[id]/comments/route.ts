/**
 * COMMENTS API
 * POST /api/posts/[id]/comments - Create comment on post
 * GET  /api/posts/[id]/comments - Get comments for post
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';
import { ApiError, enforceRateLimit, enforceSameOrigin, requireOwnership, requireUser } from '@/lib/api-security';
import { createServerNotification } from '@/lib/server/notifications';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const POSTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts');
const COMMENTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');

/**
 * POST /api/posts/[id]/comments - Create a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let requestBody: any = null;

  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, { key: 'posts:comments', max: 20, windowMs: 60 * 1000 });
    requestBody = await request.json().catch(() => null);
    if (!requestBody) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const auth = requireUser(request);
    if (requestBody.userId) {
      requireOwnership(requestBody.userId, auth.userId);
    }
    requestBody.userId = auth.userId;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }

    return NextResponse.json({ success: false, error: 'Unable to create comment' }, { status: 500 });
  }

  const { data, error } = await withErrorHandling(async () => {
    const { id: postId } = await params;
    const body = requestBody;
    const { userId, content, replyTo, parentCommentId } = body;
    const parentId = replyTo || parentCommentId || null;

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

    let parentComment: any = null;
    if (parentId) {
      parentComment = await databases.getDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        parentId
      );

      if (parentComment.postId !== postId || parentComment.isDeleted) {
        throw new AppError({
          code: 'INVALID_PARENT_COMMENT',
          message: 'Parent comment does not belong to this post',
          userMessage: 'This reply could not be added to the selected comment',
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.VALIDATION,
        });
      }
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
    const now = new Date().toISOString();
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
        replyTo: parentId,
        likes: 0,
        likedBy: [],
        timestamp: now,
        createdAt: now,
        updatedAt: now,
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
        await createServerNotification({
          userId: post.authorId,
          title: 'New comment',
          message: `${authorName} commented on your post`,
          type: 'comment',
          actorId: userId,
          actorName: authorName,
          actorAvatar: authorAvatar,
          actionUrl: `/app/feed?post=${encodeURIComponent(postId)}`,
          metadata: { postId },
        });
      } catch (notifError) {
        console.error('Failed to create comment notification:', notifError);
      }
    }

    // If reply, notify parent commenter
    if (parentComment) {
      try {
        if (parentComment.authorId !== userId) {
          await createServerNotification({
            userId: parentComment.authorId,
            title: 'New reply',
            message: `${authorName} replied to your comment`,
            type: 'reply',
            actorId: userId,
            actorName: authorName,
            actorAvatar: authorAvatar,
            actionUrl: `/app/feed?post=${encodeURIComponent(postId)}`,
            metadata: { postId, commentId: parentComment.$id },
          });
        }
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
      { status: error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_PARENT_COMMENT' ? 400 : error.code === 'RESOURCE_NOT_FOUND' || error.code === 'POST_DELETED' ? 404 : 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/posts/[id]/comments - Get comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const requestedLimit = parseInt(searchParams.get('limit') || '50', 10);
  const requestedOffset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
  const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

  const { data, error } = await withErrorHandling(async () => {
    const { id: postId } = await params;

    validateInput({ postId }, { postId: { required: true } });

    const { databases } = await createAdminClient();

    const comments = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      [
        Query.equal('postId', postId),
        Query.orderDesc('timestamp'),
        Query.limit(limit),
        Query.offset(offset),
      ]
    ).catch((error: any) => {
      const message = String(error?.message || '').toLowerCase()
      if (error?.code === 404 || message.includes('requested item could not be found') || message.includes('not found')) {
        return { documents: [], total: 0 } as any
      }
      throw error
    });

    // Older and current comment schemas do not contain an `isDeleted`
    // attribute. Querying that missing field caused Appwrite to reject the
    // entire request and the client then rendered a false empty state.
    const allComments = Array.isArray(comments.documents)
      ? comments.documents.filter((comment: any) => comment.isDeleted !== true)
      : []
    const commentsById = new Map<string, any>()
    const roots: any[] = []

    for (const comment of allComments) {
      commentsById.set(comment.$id, { ...comment, replies: [] })
    }

    for (const comment of allComments) {
      const normalized = commentsById.get(comment.$id)
      const parentId = comment.replyTo || comment.parentCommentId || null
      if (parentId && commentsById.has(parentId)) {
        commentsById.get(parentId).replies.push(normalized)
      } else {
        roots.push(normalized)
      }
    }

    return {
      success: true,
      comments: roots,
      total: comments.total,
      limit,
      offset,
    };
  }, { operation: 'getComments' });

  if (error) {
    const message = String(error?.message || '').toLowerCase()
    if (error.code === 'RESOURCE_NOT_FOUND' || message.includes('requested item could not be found') || message.includes('not found')) {
      return NextResponse.json({ success: true, comments: [], total: 0, limit, offset });
    }
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
