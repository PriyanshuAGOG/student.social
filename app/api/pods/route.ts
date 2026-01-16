/**
 * COMPREHENSIVE POD API ROUTES
 * Production-ready endpoints with full error handling
 * 
 * Endpoints:
 * - POST   /api/pods          - Create pod
 * - GET    /api/pods          - List pods
 * - GET    /api/pods/[id]     - Get pod details
 * - PUT    /api/pods/[id]     - Update pod
 * - DELETE /api/pods/[id]     - Delete pod
 * - POST   /api/pods/[id]/join   - Join pod
 * - POST   /api/pods/[id]/leave  - Leave pod
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
const POD_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_POD_IMAGES_BUCKET_ID!;

/**
 * POST /api/pods - Create a new pod
 */
export async function POST(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const body = await request.json();
    const { name, description, userId, metadata = {} } = body;

    // Validate input
    validateInput(
      { name, userId },
      {
        name: {
          required: true,
          minLength: 3,
          maxLength: 100,
          pattern: /^[a-zA-Z0-9\s\-_]+$/,
        },
        userId: { required: true },
      }
    );

    const { databases, storage } = await createAdminClient();

    // Check if user already has a pod with this name
    const existingPods = await databases.listDocuments(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      [
        Query.equal('creatorId', userId),
        Query.equal('name', name.trim()),
      ]
    );

    if (existingPods.documents.length > 0) {
      throw new AppError({
        code: 'POD_EXISTS',
        message: 'You already have a pod with this name',
        userMessage: 'You already have a pod with this name. Please choose a different name.',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
      });
    }

    // Upload pod image if provided
    let imageUrl = '';
    if (metadata.imageFile) {
      try {
        const fileUpload = await storage.createFile(
          POD_IMAGES_BUCKET_ID,
          'unique()',
          metadata.imageFile
        );
        imageUrl = storage.getFileView(POD_IMAGES_BUCKET_ID, fileUpload.$id).toString();
      } catch (uploadError) {
        console.error('Failed to upload pod image:', uploadError);
        // Continue without image rather than failing entirely
      }
    } else if (metadata.image) {
      imageUrl = metadata.image;
    }

    // Create pod document
    const pod = await databases.createDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      'unique()',
      {
        name: name.trim(),
        description: description?.trim() || '',
        creatorId: userId,
        members: [userId],
        memberCount: 1,
        image: imageUrl,
        category: metadata.category || metadata.subject || 'general',
        isPrivate: metadata.isPrivate || false,
        isActive: true,
        isPublic: metadata.isPublic !== false,
        subject: metadata.subject || '',
        difficulty: metadata.difficulty || 'Beginner',
        tags: metadata.tags || [],
        maxMembers: metadata.maxMembers || 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Create chat room for pod
    let chatRoom = null;
    try {
      chatRoom = await databases.createDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        'unique()',
        {
          podId: pod.$id,
          name: name.trim(), // Use pod name instead of "general"
          type: 'pod',
          members: [userId],
          createdAt: new Date().toISOString(),
          isActive: true,
        }
      );

      // Send welcome message
      await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        'unique()',
        {
          roomId: chatRoom.$id,
          senderId: 'system',
          content: `🎉 Welcome to ${name}! This is your pod's group chat.`,
          timestamp: new Date().toISOString(),
          readBy: [],
          type: 'system',
        }
      );
    } catch (chatError) {
      console.error('Failed to create pod chat room:', chatError);
      // Pod created successfully, chat room failed - log but don't fail the request
    }

    return {
      success: true,
      pod,
      chatRoom,
      message: 'Pod created successfully',
    };
  }, { operation: 'createPod' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/pods - List pods with filters and pagination
 */
export async function GET(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('isPublic');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const myPods = searchParams.get('myPods') === 'true';

    const { databases } = await createAdminClient();
    const queries: string[] = [];

    // Filter for user's pods
    if (myPods && userId) {
      queries.push(Query.equal('members', userId));
    }

    // Filter by visibility
    if (isPublic !== null) {
      queries.push(Query.equal('isPublic', isPublic === 'true'));
    }

    // Filter by category
    if (category) {
      queries.push(Query.equal('category', category));
    }

    // Search by name (if supported)
    if (search) {
      queries.push(Query.search('name', search));
    }

    // Add sorting and pagination
    queries.push(Query.orderDesc('createdAt'));
    queries.push(Query.limit(Math.min(limit, 100)));
    queries.push(Query.offset(offset));

    const result = await databases.listDocuments(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      queries
    );

    return {
      success: true,
      pods: result.documents,
      total: result.total,
      limit,
      offset,
    };
  }, { operation: 'listPods' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
