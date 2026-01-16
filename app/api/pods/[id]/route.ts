/**
 * COMPREHENSIVE POD [ID] API ROUTES
 * Production-ready endpoints for individual pod operations
 * 
 * - GET    /api/pods/[id]    - Get pod details
 * - PUT    /api/pods/[id]    - Update pod
 * - DELETE /api/pods/[id]    - Delete pod
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PODS_COLLECTION_ID = process.env.NEXT_PUBLIC_PODS_COLLECTION_ID!;
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID!;
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!;
const POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!;
const COMMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!;
const POD_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_POD_IMAGES_BUCKET_ID!;

/**
 * GET /api/pods/[id] - Get pod details with member information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const podId = params.id;

    validateInput({ podId }, { podId: { required: true } });

    const { databases } = await createAdminClient();

    const pod = await databases.getDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );

    // Get member count
    const members = Array.isArray(pod.members) ? pod.members : [];

    // Get chat rooms
    let chatRooms: any[] = [];
    try {
      const chatResult = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [Query.equal('podId', podId)]
      );
      chatRooms = chatResult.documents as any[];
    } catch (chatError) {
      console.error('Failed to fetch chat rooms:', chatError);
      chatRooms = [];
    }

    // Get post count
    let postCount = 0;
    try {
      const postsResult = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('podId', podId), Query.limit(1)]
      );
      postCount = postsResult.total;
    } catch (postError) {
      console.error('Failed to fetch post count:', postError);
    }

    return {
      success: true,
      pod: {
        ...pod,
        memberCount: members.length,
        postCount,
        chatRooms,
      },
    };
  }, { operation: 'getPodDetails' });

  if (error) {
    const status = error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/pods/[id] - Update pod information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const podId = params.id;
    const body = await request.json();
    const { userId, updates } = body;

    validateInput(
      { podId, userId },
      {
        podId: { required: true },
        userId: { required: true },
      }
    );

    const { databases, storage } = await createAdminClient();

    // Get pod and verify user is creator
    const pod = await databases.getDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );

    if (pod.creatorId !== userId) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Only the pod creator can update this pod',
        userMessage: 'You do not have permission to update this pod',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
      });
    }

    // Validate updates if provided
    if (updates.name) {
      validateInput(
        { name: updates.name },
        {
          name: {
            minLength: 3,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s\-_]+$/,
          },
        }
      );
    }

    // Handle image upload if provided
    let imageUrl = pod.image;
    if (updates.imageFile) {
      try {
        // Delete old image if exists
        if (imageUrl) {
          const oldFileId = imageUrl.split('/').pop()?.split('?')[0];
          if (oldFileId) {
            try {
              await storage.deleteFile(POD_IMAGES_BUCKET_ID, oldFileId);
            } catch (deleteError) {
              console.error('Failed to delete old image:', deleteError);
            }
          }
        }

        // Upload new image
        const fileUpload = await storage.createFile(
          POD_IMAGES_BUCKET_ID,
          'unique()',
          updates.imageFile
        );
        imageUrl = storage.getFileView(POD_IMAGES_BUCKET_ID, fileUpload.$id).toString();
      } catch (uploadError) {
        console.error('Failed to upload new image:', uploadError);
        throw new AppError({
          code: 'IMAGE_UPLOAD_FAILED',
          message: 'Failed to upload image',
          userMessage: 'Failed to upload image. Please try again.',
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.STORAGE,
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.description !== undefined) updateData.description = updates.description.trim();
    if (imageUrl !== pod.image) updateData.image = imageUrl;
    if (updates.category) updateData.category = updates.category;
    if (updates.subject) updateData.subject = updates.subject;
    if (updates.difficulty) updateData.difficulty = updates.difficulty;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.isPrivate !== undefined) updateData.isPrivate = updates.isPrivate;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.maxMembers) updateData.maxMembers = updates.maxMembers;

    // Update pod
    const updatedPod = await databases.updateDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId,
      updateData
    );

    // Update chat room name if pod name changed
    if (updates.name && updates.name !== pod.name) {
      try {
        const chatRooms = await databases.listDocuments(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          [Query.equal('podId', podId)]
        );

        for (const room of chatRooms.documents) {
          await databases.updateDocument(
            DATABASE_ID,
            CHAT_ROOMS_COLLECTION_ID,
            room.$id,
            { name: updates.name.trim() }
          );
        }
      } catch (chatError) {
        console.error('Failed to update chat room name:', chatError);
      }
    }

    return {
      success: true,
      pod: updatedPod,
      message: 'Pod updated successfully',
    };
  }, { operation: 'updatePod' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/pods/[id] - Delete pod with cascading cleanup
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const podId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput(
      { podId, userId },
      {
        podId: { required: true },
        userId: { required: true },
      }
    );

    const { databases, storage } = await createAdminClient();

    // Get pod and verify user is creator
    const pod = await databases.getDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );

    if (pod.creatorId !== userId) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Only the pod creator can delete this pod',
        userMessage: 'You do not have permission to delete this pod',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
      });
    }

    // Delete pod image if exists
    if (pod.image) {
      try {
        const fileId = pod.image.split('/').pop()?.split('?')[0];
        if (fileId) {
          await storage.deleteFile(POD_IMAGES_BUCKET_ID, fileId);
        }
      } catch (imageError) {
        console.error('Failed to delete pod image:', imageError);
      }
    }

    // Delete all chat rooms and messages
    try {
      const chatRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [Query.equal('podId', podId)]
      );

      for (const room of chatRooms.documents) {
        // Delete messages in room
        const messages = await databases.listDocuments(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          [Query.equal('roomId', room.$id)]
        );

        for (const message of messages.documents) {
          await databases.deleteDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, message.$id);
        }

        // Delete room
        await databases.deleteDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, room.$id);
      }
    } catch (chatError) {
      console.error('Failed to delete chat rooms:', chatError);
    }

    // Delete all posts in this pod
    try {
      const posts = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('podId', podId)]
      );

      for (const post of posts.documents) {
        // Delete comments on post
        try {
          const comments = await databases.listDocuments(
            DATABASE_ID,
            COMMENTS_COLLECTION_ID,
            [Query.equal('postId', post.$id)]
          );

          for (const comment of comments.documents) {
            await databases.deleteDocument(DATABASE_ID, COMMENTS_COLLECTION_ID, comment.$id);
          }
        } catch (commentError) {
          console.error('Failed to delete comments:', commentError);
        }

        // Delete post
        await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, post.$id);
      }
    } catch (postError) {
      console.error('Failed to delete posts:', postError);
    }

    // Finally delete the pod itself
    await databases.deleteDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );

    return {
      success: true,
      message: 'Pod deleted successfully',
      podId,
    };
  }, { operation: 'deletePod' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
