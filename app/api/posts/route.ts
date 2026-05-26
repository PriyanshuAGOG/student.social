/**
 * COMPREHENSIVE POSTS API ROUTES
 * Production-ready endpoints with full error handling
 * 
 * - POST   /api/posts       - Create post
 * - GET    /api/posts       - List posts
 * - GET    /api/posts/[id]  - Get post details
 * - PUT    /api/posts/[id]  - Update post
 * - DELETE /api/posts/[id]  - Delete post
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppwriteException, Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';
import { enforceRateLimit, enforceSameOrigin, requireOwnership, requireUser, ApiError } from '@/lib/api-security';
import { scanUploadMeta } from '@/lib/upload-security';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const POSTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID || 'posts');
const COMMENTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID || 'comments');
const SAVED_POSTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID || 'saved_posts');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');
const POST_IMAGES_BUCKET_ID = (process.env.NEXT_PUBLIC_POST_IMAGES_BUCKET_ID || 'post_images');

/**
 * POST /api/posts - Create a new post
 */
export async function POST(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'posts_create', max: 30, windowMs: 60_000 })
    const auth = requireUser(request)
    const body = await request.json();
    const { authorId, content, metadata = {} } = body;
    requireOwnership(authorId, auth.userId)

    // Validate input
    validateInput(
      { authorId, content },
      {
        authorId: { required: true },
        content: {
          required: true,
          minLength: 1,
          maxLength: 5000,
        },
      }
    );

    const { databases, storage } = await createAdminClient();

    // Get author info
    let authorName = 'Anonymous';
    let authorAvatar = '';
    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        authorId
      );
      authorName = profile.name || authorName;
      authorAvatar = profile.avatar || '';
    } catch (profileError) {
      console.log('Could not fetch author profile, using defaults');
    }

    // Upload images if provided
    const imageUrls: string[] = [];
    if (metadata.imageFiles && Array.isArray(metadata.imageFiles)) {
      for (const imageFile of metadata.imageFiles.slice(0, 4)) { // Max 4 images
        const scanned = scanUploadMeta({ name: imageFile?.name, type: imageFile?.type, size: imageFile?.size })
        if (!scanned.ok) {
          throw new ApiError(400, 'UNSAFE_UPLOAD', `Rejected upload: ${scanned.reason}`)
        }
        try {
          const fileUpload = await storage.createFile(
            POST_IMAGES_BUCKET_ID,
            'unique()',
            imageFile
          );
          const imageUrl = storage.getFileView(POST_IMAGES_BUCKET_ID, fileUpload.$id).toString();
          imageUrls.push(imageUrl);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          // Continue with other images
        }
      }
    }

    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    if (!normalizedContent) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: 'Post content is required',
        userMessage: 'Post content is required',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
      });
    }

    const normalizedTags = Array.isArray(metadata.tags)
      ? metadata.tags.filter((tag: unknown) => typeof tag === 'string' && tag.trim()).slice(0, 10)
      : [];

    const normalizedMentions = Array.isArray(metadata.mentions)
      ? metadata.mentions.filter((mention: unknown) => typeof mention === 'string' && mention.trim()).slice(0, 20)
      : [];

    const normalizedVisibility = metadata.visibility === 'pod' ? 'pod' : 'public';
    const normalizedPodId = normalizedVisibility === 'pod' && typeof metadata.podId === 'string' && metadata.podId.trim()
      ? metadata.podId.trim()
      : null;

    const now = new Date().toISOString();

    // Create post document
    const post = await databases.createDocument(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      'unique()',
      {
        authorId,
        authorName,
        authorAvatar,
        content: normalizedContent,
        imageUrls,
        mediaUrls: imageUrls,
        type: metadata.type || 'text',
        visibility: normalizedVisibility,
        podId: normalizedPodId,
        courseId: metadata.courseId || null,
        tags: normalizedTags,
        mentions: normalizedMentions,
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        saves: 0,
        isDeleted: false,
        isPinned: metadata.isPinned || false,
        createdAt: now,
        updatedAt: now,
        timestamp: now,
      }
    );

    return {
      success: true,
      post,
      message: 'Post created successfully',
    };
  }, { operation: 'createPost' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/posts - List posts with filters and pagination
 */
export async function GET(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const podId = searchParams.get('podId');
    const authorId = searchParams.get('authorId');
    const saved = searchParams.get('saved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { databases } = await createAdminClient();

    // Handle saved posts separately
    if (saved && userId) {
      const savedPosts = await databases.listDocuments(
        DATABASE_ID,
        SAVED_POSTS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('savedAt'),
          Query.limit(Math.min(limit, 100)),
          Query.offset(offset),
        ]
      ).catch((err: any) => {
        if ((err as AppwriteException)?.code === 404) {
          return { documents: [], total: 0 } as any
        }
        throw err
      });

      // Fetch actual posts
      const posts = [];
      for (const saved of savedPosts.documents) {
        try {
          const post = await databases.getDocument(
            DATABASE_ID,
            POSTS_COLLECTION_ID,
            saved.postId
          );
          if (!post.isDeleted) {
            posts.push(post);
          }
        } catch (postError) {
          console.error('Failed to fetch saved post:', postError);
        }
      }

      return {
        success: true,
        documents: posts,
        posts,
        total: savedPosts.total,
        limit,
        offset,
      };
    }

    // Normal post listing
    const queries: string[] = [Query.equal('isDeleted', false)];

    // Filter by pod
    if (podId) {
      queries.push(Query.equal('podId', podId));
    } else {
      // Only show public posts if not filtered by pod
      queries.push(Query.equal('visibility', 'public'));
    }

    // Filter by author
    if (authorId) {
      queries.push(Query.equal('authorId', authorId));
    }

    // Add sorting and pagination
    queries.push(Query.orderDesc('createdAt'));
    queries.push(Query.limit(Math.min(limit, 100)));
    queries.push(Query.offset(offset));

    const result = await databases.listDocuments(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      queries
    ).catch((err: any) => {
      if ((err as AppwriteException)?.code === 404) {
        return { documents: [], total: 0 } as any
      }
      throw err
    });

    return {
      success: true,
      documents: result.documents,
      posts: result.documents,
      total: result.total,
      limit,
      offset,
    };
  }, { operation: 'listPosts' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
