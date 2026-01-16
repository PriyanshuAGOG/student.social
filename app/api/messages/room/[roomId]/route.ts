/**
 * DM ROOM MESSAGES API
 * GET /api/messages/room/[roomId] - Get messages in a DM room
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!;
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID!;

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const roomId = params.roomId;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    validateInput({ roomId }, { roomId: { required: true } });

    const { databases } = await createAdminClient();

    // Verify room exists and user is a member
    const room = await databases.getDocument(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      roomId
    );

    const members = Array.isArray(room.members) ? room.members : [];
    if (userId && !members.includes(userId)) {
      throw new Error('You do not have access to this conversation');
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

    // If userId provided, mark messages as read
    if (userId) {
      for (const message of messages.documents) {
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        if (!readBy.includes(userId) && message.senderId !== userId) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              MESSAGES_COLLECTION_ID,
              message.$id,
              {
                readBy: [...readBy, userId],
              }
            );
          } catch (updateError) {
            console.error('Failed to mark message as read:', updateError);
          }
        }
      }
    }

    return {
      success: true,
      messages: messages.documents.reverse(), // Oldest first
      total: messages.total,
      limit,
      offset,
    };
  }, { operation: 'getRoomMessages' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
