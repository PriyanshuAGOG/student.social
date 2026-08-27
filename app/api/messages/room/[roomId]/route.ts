/**
 * DM ROOM MESSAGES API
 * GET /api/messages/room/[roomId] - Get messages in a DM room
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';
import { withErrorHandling, validateInput } from '@/lib/error-handler';
import { ApiError, requireOwnership, requireUser } from '@/lib/api-security';
import { deriveDeliveryState, receiptAudience } from '@/lib/chat-receipts';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const MESSAGES_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages');
const CHAT_ROOMS_COLLECTION_ID = (process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms');
const MESSAGE_RECEIPTS_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGE_RECEIPTS_COLLECTION_ID || 'message_receipts');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');

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

    const messageIds = messages.documents.map((message: any) => message.$id).filter(Boolean)
    const [receiptResponse, profileResponse] = await Promise.all([
      messageIds.length > 0
        ? databases.listDocuments(DATABASE_ID, MESSAGE_RECEIPTS_COLLECTION_ID, [
            Query.equal('messageId', messageIds),
            Query.limit(Math.min(Math.max(messageIds.length * Math.max(members.length - 1, 1), 100), 5000)),
          ]).catch(() => ({ documents: [] } as any))
        : Promise.resolve({ documents: [] } as any),
      members.length > 0
        ? databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID, [
            Query.equal('$id', members),
            Query.limit(Math.min(members.length, 100)),
          ]).catch(() => ({ documents: [] } as any))
        : Promise.resolve({ documents: [] } as any),
    ])

    const receiptsByMessage = new Map<string, any[]>()
    for (const receipt of receiptResponse.documents || []) {
      const existing = receiptsByMessage.get(receipt.messageId) || []
      existing.push({
        userId: receipt.userId,
        deliveredAt: receipt.deliveredAt || null,
        readAt: receipt.readAt || null,
      })
      receiptsByMessage.set(receipt.messageId, existing)
    }

    const enrichedMessages = messages.documents.reverse().map((message: any) => {
      const receipts = receiptsByMessage.get(message.$id) || []
      const audience = receiptAudience(receipts)
      return {
        ...message,
        receipts,
        deliveredBy: audience.deliveredBy,
        readBy: Array.from(new Set([...(Array.isArray(message.readBy) ? message.readBy : []), ...audience.readBy])),
        deliveryState: deriveDeliveryState(receipts, message.deliveryState || 'sent'),
      }
    })

    return {
      success: true,
      messages: enrichedMessages,
      members: (profileResponse.documents || []).map((profile: any) => ({
        userId: profile.$id,
        name: profile.name || profile.username || 'Student',
        username: profile.username || '',
        avatar: profile.avatar || profile.profilePictureUrl || '',
      })),
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
