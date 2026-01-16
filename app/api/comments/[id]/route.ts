/**
 * DELETE COMMENT API
 * DELETE /api/comments/[id] - Delete a comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const commentId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput(
      { commentId, userId },
      {
        commentId: { required: true },
        userId: { required: true },
      }
    );

    const { databases } = await createAdminClient();

    // Get comment and verify user is author
    const comment = await databases.getDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId
    );

    if (comment.authorId !== userId) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Only the comment author can delete this comment',
        userMessage: 'You do not have permission to delete this comment',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
      });
    }

    // Get all replies to this comment
    const replies = await databases.listDocuments(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      [Query.equal('parentCommentId', commentId)]
    );

    // Delete all replies
    for (const reply of replies.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        reply.$id
      );
    }

    // Delete the comment itself
    await databases.deleteDocument(
      DATABASE_ID,
      COMMENTS_COLLECTION_ID,
      commentId
    );

    // Update post comment count
    try {
      const post = await databases.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        comment.postId
      );

      const newCount = Math.max(0, (post.comments || 0) - (1 + replies.documents.length));

      await databases.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        comment.postId,
        {
          comments: newCount,
        }
      );
    } catch (postError) {
      console.error('Failed to update post comment count:', postError);
    }

    // Update parent comment reply count if this was a reply
    if (comment.parentCommentId) {
      try {
        const parentComment = await databases.getDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          comment.parentCommentId
        );

        await databases.updateDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          comment.parentCommentId,
          {
            replies: Math.max(0, (parentComment.replies || 0) - 1),
          }
        );
      } catch (parentError) {
        console.error('Failed to update parent comment reply count:', parentError);
      }
    }

    return {
      success: true,
      message: 'Comment deleted successfully',
      commentId,
      deletedReplies: replies.documents.length,
    };
  }, { operation: 'deleteComment' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
