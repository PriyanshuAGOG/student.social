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
const MESSAGE_RECEIPTS_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGE_RECEIPTS_COLLECTION_ID || 'message_receipts';

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

    const messageIds = messages.documents.map((message: any) => message.$id)
    let receipts: any[] = []
    if (messageIds.length > 0) {
      try {
        const receiptResult = await databases.listDocuments(DATABASE_ID, MESSAGE_RECEIPTS_COLLECTION_ID, [
          Query.equal('messageId', messageIds),
          Query.limit(Math.min(5000, Math.max(100, messageIds.length * Math.max(1, members.length)))),
        ])
        receipts = receiptResult.documents || []
      } catch (receiptError) {
        console.error('[messages/room] Receipt enrichment unavailable:', receiptError)
      }
    }

    const readByMessage = new Map<string, Set<string>>()
    for (const receipt of receipts) {
      if (!receipt.readAt) continue
      const readers = readByMessage.get(receipt.messageId) || new Set<string>()
      readers.add(receipt.userId)
      readByMessage.set(receipt.messageId, readers)
    }
    const enrichedMessages = messages.documents.map((message: any) => ({
      ...message,
      readBy: Array.from(new Set([...(Array.isArray(message.readBy) ? message.readBy : []), ...(readByMessage.get(message.$id) || [])])),
    }))

    return {
      success: true,
      messages: enrichedMessages.reverse(), // Oldest first
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
