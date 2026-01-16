/**
 * COMPREHENSIVE POST [ID] API ROUTES
 * Production-ready endpoints for individual post operations
 * 
 * - GET    /api/posts/[id]    - Get post details
 * - PUT    /api/posts/[id]    - Update post
 * - DELETE /api/posts/[id]    - Delete post
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!;
const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
const SAVED_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID!;
const POST_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_POST_IMAGES_BUCKET_ID!;

/**
 * GET /api/posts/[id] - Get post details with comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;

    validateInput({ postId }, { postId: { required: true } });

    const { databases } = await createAdminClient();

    const post = await databases.getDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    if (post.isDeleted) {
      throw new AppError({
        code: 'POST_DELETED',
        message: 'This post has been deleted',
        userMessage: 'This post has been deleted',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Get comments count
    let commentsCount = 0;
    try {
      const comments = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [Query.equal('postId', postId), Query.limit(1)]
      );
      commentsCount = comments.total;
    } catch (commentError) {
      console.error('Failed to fetch comments count:', commentError);
    }

    return {
      success: true,
      post: {
        ...post,
        comments: commentsCount,
      },
    };
  }, { operation: 'getPost' });

  if (error) {
    const status = error.code === 'RESOURCE_NOT_FOUND' || error.code === 'POST_DELETED' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/posts/[id] - Update post
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;
    const body = await request.json();
    const { userId, content, metadata = {} } = body;

    validateInput(
      { postId, userId },
      {
        postId: { required: true },
        userId: { required: true },
      }
    );

    if (content) {
      validateInput(
        { content },
        {
          content: {
            minLength: 1,
            maxLength: 5000,
          },
        }
      );
    }

    const { databases } = await createAdminClient();

    // Get post and verify user is author
    const post = await databases.getDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    if (post.authorId !== userId) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Only the post author can update this post',
        userMessage: 'You do not have permission to update this post',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
      });
    }

    if (post.isDeleted) {
      throw new AppError({
        code: 'POST_DELETED',
        message: 'Cannot update deleted post',
        userMessage: 'This post has been deleted and cannot be updated',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (content) updateData.content = content.trim();
    if (metadata.tags) updateData.tags = metadata.tags;
    if (metadata.isPinned !== undefined) updateData.isPinned = metadata.isPinned;
    if (metadata.visibility) updateData.visibility = metadata.visibility;

    // Update post
    const updatedPost = await databases.updateDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId,
      updateData
    );

    return {
      success: true,
      post: updatedPost,
      message: 'Post updated successfully',
    };
  }, { operation: 'updatePost' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' ? 403 : 
                   error.code === 'RESOURCE_NOT_FOUND' || error.code === 'POST_DELETED' ? 404 : 
                   error.code === 'VALIDATION_ERROR' ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/posts/[id] - Delete post with cascading cleanup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const postId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput(
      { postId, userId },
      {
        postId: { required: true },
        userId: { required: true },
      }
    );

    const { databases, storage } = await createAdminClient();

    // Get post and verify user is author
    const post = await databases.getDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    if (post.authorId !== userId) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Only the post author can delete this post',
        userMessage: 'You do not have permission to delete this post',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
      });
    }

    // Delete images from storage
    if (post.imageUrls && Array.isArray(post.imageUrls)) {
      for (const imageUrl of post.imageUrls) {
        try {
          const fileId = imageUrl.split('/').pop()?.split('?')[0];
          if (fileId) {
            await storage.deleteFile(POST_IMAGES_BUCKET_ID, fileId);
          }
        } catch (imageError) {
          console.error('Failed to delete image:', imageError);
        }
      }
    }

    // Delete all comments on this post
    try {
      const comments = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [Query.equal('postId', postId)]
      );

      for (const comment of comments.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          comment.$id
        );
      }
    } catch (commentError) {
      console.error('Failed to delete comments:', commentError);
    }

    // Delete saved post entries
    try {
      const savedEntries = await databases.listDocuments(
        DATABASE_ID,
        SAVED_POSTS_COLLECTION_ID,
        [Query.equal('postId', postId)]
      );

      for (const entry of savedEntries.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          SAVED_POSTS_COLLECTION_ID,
          entry.$id
        );
      }
    } catch (savedError) {
      console.error('Failed to delete saved entries:', savedError);
    }

    // Finally delete the post itself
    await databases.deleteDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      postId
    );

    return {
      success: true,
      message: 'Post deleted successfully',
      postId,
    };
  }, { operation: 'deletePost' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
