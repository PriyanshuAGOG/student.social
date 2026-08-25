/**
 * DM ROOM MESSAGES API
 * GET /api/messages/room/[roomId] - Get messages in a DM room
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';
import { withErrorHandling, validateInput } from '@/lib/error-handler';
import { ApiError, requireOwnership, requireUser } from '@/lib/api-security';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const MESSAGES_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages');
const CHAT_ROOMS_COLLECTION_ID = (process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { data, error } = await withErrorHandling(async () => {
    const auth = requireUser(request)
    const { roomId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    validateInput({ roomId }, { roomId: { required: true } });
    if (userId) {
      requireOwnership(userId, auth.userId)
    }

    const { databases } = await createAdminClient();

    // Verify room exists and user is a member
    const room = await databases.getDocument(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      roomId
    );

    const members = Array.isArray(room.members)
      ? room.members
      : typeof room.members === 'string'
        ? (() => { try { return JSON.parse(room.members) } catch { return [] } })()
        : [];
    if (!members.includes(auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation');
    }

    // Get messages
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('roomId', roomId),
        Query.orderDesc('timestamp'),
        Query.limit(Math.min(limit, 100)),
        Query.offset(offset),
      ]
    );

    return {
      success: true,
      // Receipt updates travel on their own realtime channel. Keeping that
      // enrichment off the critical path makes opening a conversation one
      // database query instead of two, while the UI still converges live.
      messages: messages.documents.reverse(), // Oldest first
      total: messages.total,
      limit,
      offset,
    };
  }, { operation: 'getRoomMessages' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN'
      ? (error.code === 'UNAUTHORIZED' ? 401 : 403)
      : 500
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
