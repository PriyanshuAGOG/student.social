/**
 * DIRECT MESSAGING API
 * POST /api/messages/send - Send direct message
 * GET  /api/messages/room/[roomId] - Get messages in a room
 * GET  /api/messages/rooms - Get user's DM rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput } from '@/lib/error-handler';
import { enforceRateLimit, enforceSameOrigin, requireOwnership, requireUser } from '@/lib/api-security';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const CHAT_ROOMS_COLLECTION_ID = (process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms');
const MESSAGES_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');
const NOTIFICATIONS_COLLECTION_ID = (process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications');

/**
 * POST /api/messages/send - Send a direct message
 */
export async function POST(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'messages:send', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(request)
    const body = await request.json();
    const { senderId, recipientId, roomId, content, type = 'text', metadata = {}, clientMessageId } = body;

    validateInput(
      { senderId, content },
      {
        senderId: { required: true },
        content: { required: true, minLength: 1, maxLength: 5000 },
      }
    );
    requireOwnership(senderId, auth.userId)

    const { databases } = await createAdminClient();
    console.debug('[messages/send] createAdminClient succeeded for sender:', senderId, 'recipient:', recipientId)

    // Get or create room
    let room;

    if (roomId) {
      room = await databases.getDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        roomId
      );

      const roomMembers = Array.isArray(room.members)
        ? room.members
        : typeof room.members === 'string'
          ? (() => { try { return JSON.parse(room.members) } catch { return [] } })()
          : [];
      if (!roomMembers.includes(senderId)) {
        throw new Error('You do not have access to this conversation');
      }
    }

    if (!room) {
      if (!recipientId) {
        throw new Error('recipientId is required when roomId is not provided');
      }

      // Try to find existing room between these two users
      const existingRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [
          Query.limit(100), // Get recent rooms and filter direct-room variants in app code.
        ]
      );

      // Check if room exists between these two users
      room = existingRooms.documents.find((r: any) => {
        if (!['direct', 'dm'].includes(r.type)) return false;
        const members = Array.isArray(r.members)
          ? r.members
          : typeof r.members === 'string'
            ? (() => { try { return JSON.parse(r.members) } catch { return [] } })()
            : [];
        return members.includes(senderId) && members.includes(recipientId);
      });

      // Create room if doesn't exist
      if (!room) {
        room = await databases.createDocument(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          'unique()',
          {
            type: 'direct',
            members: [senderId, recipientId],
            createdAt: new Date().toISOString(),
            isActive: true,
            lastMessageTime: new Date().toISOString(),
          }
        );
      }
    }

    if (clientMessageId) {
      const existingMessages = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('roomId', room.$id),
          Query.equal('clientMessageId', String(clientMessageId)),
          Query.limit(1),
        ]
      )

      if (existingMessages.documents.length > 0) {
        return {
          success: true,
          message: existingMessages.documents[0],
          roomId: room.$id,
          deduplicated: true,
        }
      }
    }

    // Get sender profile
    let senderName = 'User';
    let senderAvatar = '';
    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        senderId
      );
      senderName = profile.name || senderName;
      senderAvatar = profile.avatar || '';
    } catch (profileError) {
      console.debug('[messages/send] Profile fetch failed for sender, using defaults:', senderId);
    }

    // Create message
    console.debug('[messages/send] creating message in room:', room.$id)
    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      'unique()',
      {
        roomId: room.$id,
        senderId,
        authorId: senderId,
        ...(clientMessageId ? { clientMessageId: String(clientMessageId) } : {}),
        senderName,
        senderAvatar,
        content: content.trim(),
        type,
        contentType: type,
        deliveryState: 'sent',
        readBy: [senderId],
        ...(metadata.replyTo ? { replyTo: String(metadata.replyTo) } : {}),
        ...(metadata.fileUrl || metadata.attachmentUrl ? { fileUrl: String(metadata.fileUrl || metadata.attachmentUrl) } : {}),
        metadata: JSON.stringify(metadata || {}).slice(0, 5000),
        timestamp: new Date().toISOString(),
      }
    );

    // Update room last message time
    console.debug('[messages/send] updating lastMessageAt for room:', room.$id)
    await databases.updateDocument(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      room.$id,
      {
        lastMessageTime: new Date().toISOString(),
        lastMessage: content.substring(0, 100),
        lastMessageSenderId: senderId,
      }
    );

    // Create notification for recipient
    try {
      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        'unique()',
        {
          userId: recipientId,
          type: 'message',
          title: 'New message',
          actorId: senderId,
          actorName: senderName,
          actorAvatar: senderAvatar,
          message: `${senderName} sent you a message`,
          isRead: false,
          timestamp: new Date().toISOString(),
          actionUrl: `/app/messages/${senderId}`,
        }
      );
    } catch (notifError) {
      console.error('Failed to create message notification:', notifError);
    }

    return {
      success: true,
      message,
      roomId: room.$id,
    };
  }, { operation: 'sendDirectMessage' });

  if (error) {
    const status = error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN'
      ? (error.code === 'UNAUTHORIZED' ? 401 : 403)
      : error.code === 'VALIDATION_ERROR'
        ? 400
        : 500
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/messages/send?userId=xxx - Get user's DM rooms
 */
export async function GET(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const auth = requireUser(request)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput({ userId }, { userId: { required: true } });
    requireOwnership(userId!, auth.userId)

    try {
      const { databases } = await createAdminClient();

      // Get all DM rooms where user is a member
      const allRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [
          Query.orderDesc('lastMessageTime'),
          Query.limit(100),
        ]
      );

      // Filter rooms where user is a member
      const userRooms = (allRooms?.documents || []).filter((room: any) => {
        if (!['direct', 'dm'].includes(room.type)) return false;
        const members = Array.isArray(room.members)
          ? room.members
          : typeof room.members === 'string'
            ? (() => { try { return JSON.parse(room.members) } catch { return [] } })()
            : [];
        return members.includes(userId);
      });

      // Enrich each room with other user's profile
      const enrichedRooms: any[] = [];
      for (const room of userRooms) {
        const members = Array.isArray(room.members)
          ? room.members
          : typeof room.members === 'string'
            ? (() => { try { return JSON.parse(room.members) } catch { return [] } })()
            : [];
        const otherUserId = members.find((id: string) => id !== userId);

        if (otherUserId) {
          try {
            const otherUser = await databases.getDocument(
              DATABASE_ID,
              PROFILES_COLLECTION_ID,
              otherUserId
            );

            enrichedRooms.push({
              ...room,
              otherUser: {
                id: otherUserId,
                name: otherUser.name || 'User',
                avatar: otherUser.avatar || '',
                isOnline: otherUser.isOnline || false,
              },
            });
          } catch (profileError) {
            console.error('Failed to fetch other user profile:', profileError);
            enrichedRooms.push({
              ...room,
              otherUser: {
                id: otherUserId,
                name: 'User',
                avatar: '',
                isOnline: false,
              },
            });
          }
        }
      }

      return {
        success: true,
        rooms: enrichedRooms,
        total: enrichedRooms.length,
      };
    } catch (e: any) {
      console.error('[messages/send GET] Error fetching rooms:', e)
      // Fail gracefully for clients - return empty list instead of 500 where appropriate
      return {
        success: true,
        rooms: [],
        total: 0,
      }
    }
  }, { operation: 'getUserDMRooms' });

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
