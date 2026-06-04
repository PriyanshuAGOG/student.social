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

type PostAttachment = {
  fileId?: string
  fileUrl: string
  fileName: string
  fileSize?: number
  fileType?: string
}

function normalizeAttachment(raw: unknown): PostAttachment | null {
  if (!raw || typeof raw !== 'object') return null
  const attachment = raw as Record<string, unknown>
  const fileUrl = typeof attachment.fileUrl === 'string' ? attachment.fileUrl.trim() : ''
  const fileName = typeof attachment.fileName === 'string' ? attachment.fileName.trim() : ''
  if (!fileUrl || !fileName) return null
  return {
    fileId: typeof attachment.fileId === 'string' ? attachment.fileId.slice(0, 255) : undefined,
    fileUrl: fileUrl.slice(0, 500),
    fileName: fileName.replace(/[\r\n]/g, ' ').slice(0, 180),
    fileSize: typeof attachment.fileSize === 'number' ? Math.max(0, Math.min(50 * 1024 * 1024, Math.round(attachment.fileSize))) : undefined,
    fileType: typeof attachment.fileType === 'string' ? attachment.fileType.slice(0, 120) : undefined,
  }
}

function encodeAttachment(attachment: PostAttachment): string {
  return JSON.stringify(attachment).slice(0, 1000)
}

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

    const normalizedType = typeof metadata.type === 'string' && metadata.type.trim()
      ? metadata.type.trim().slice(0, 50)
      : 'post';

    const normalizedAttachments = Array.isArray(metadata.attachments)
      ? metadata.attachments.map(normalizeAttachment).filter(Boolean).slice(0, 6) as PostAttachment[]
      : [];
    const attachmentImageUrls = normalizedAttachments
      .filter((attachment) => (attachment.fileType || '').startsWith('image/'))
      .map((attachment) => attachment.fileUrl);
    const normalizedImageUrls = [...imageUrls, ...attachmentImageUrls].slice(0, 4);
    const normalizedImageUrl = normalizedImageUrls[0] || '';

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
        imageUrl: normalizedImageUrl,
        imageUrls: normalizedImageUrls,
        attachments: normalizedAttachments.map(encodeAttachment),
        type: normalizedType,
        visibility: normalizedVisibility,
        podId: normalizedPodId,
        tags: normalizedTags,
        mentions: normalizedMentions,
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        saves: 0,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      post,
      message: 'Post created successfully',
    };
  }, { operation: 'createPost' });

  if (error) {
    const status = error.code === 'VALIDATION_ERROR'
      ? 400
      : typeof (error as any).status === 'number'
        ? (error as any).status
        : 500
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
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
    const search = (searchParams.get('search') || '').trim().toLowerCase();

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
    const queries: string[] = [];

    // Filter by pod
    if (podId) {
      queries.push(Query.equal('podId', podId));
    } else if (!authorId) {
      // Feed view shows public posts by default.
      queries.push(Query.equal('visibility', 'public'));
    }

    // Filter by author
    if (authorId) {
      queries.push(Query.equal('authorId', authorId));
    }

    // Add sorting and pagination
    queries.push(Query.orderDesc('timestamp'));
    queries.push(Query.limit(Math.min(limit, 100)));
    queries.push(Query.offset(offset));

    const result = await databases.listDocuments(
      DATABASE_ID,
      POSTS_COLLECTION_ID,
      queries
    ).catch((err: any) => {
      const message = String(err?.message || '').toLowerCase()
      if ((err as AppwriteException)?.code === 404 || message.includes('requested item could not be found') || message.includes('invalid input') || message.includes('not found')) {
        console.warn('[api/posts] Returning empty feed after Appwrite lookup/query failure:', err?.message || err)
        return { documents: [], total: 0 } as any
      }
      throw err
    });

    const documents = search
      ? result.documents.filter((post: any) => {
          const searchable = [post.title, post.content, post.authorName, post.authorUsername, ...(Array.isArray(post.tags) ? post.tags : [])]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return searchable.includes(search) || search.split(/\s+/).every((term) => searchable.includes(term))
        })
      : result.documents;

    return {
      success: true,
      documents,
      posts: documents,
      total: search ? documents.length : result.total,
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
