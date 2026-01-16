/**
 * SAVE POST API
 * POST /api/posts/[id]/save - Toggle save status on post
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const SAVED_POSTS_COLLECTION_ID = process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID!;

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

    // Check if post is already saved
    const existing = await databases.listDocuments(
      DATABASE_ID,
      SAVED_POSTS_COLLECTION_ID,
      [
        Query.equal('postId', postId),
        Query.equal('userId', userId),
      ]
    );

    if (existing.documents.length > 0) {
      // Already saved, remove it
      await databases.deleteDocument(
        DATABASE_ID,
        SAVED_POSTS_COLLECTION_ID,
        existing.documents[0].$id
      );
      return {
        success: true,
        saved: false,
        message: 'Post unsaved',
      };
    } else {
      // Not saved, create new save
      const savedPost = await databases.createDocument(
        DATABASE_ID,
        SAVED_POSTS_COLLECTION_ID,
        'unique()',
        {
          postId: postId,
          userId: userId,
          savedAt: new Date().toISOString(),
        }
      );
      return {
        success: true,
        saved: true,
        savedPost,
        message: 'Post saved',
      };
    }
  }, { operation: 'toggleSave' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
