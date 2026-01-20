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

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID!;
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!;
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID!;
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!;

/**
 * POST /api/messages/send - Send a direct message
 */
export async function POST(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const body = await request.json();
    const { senderId, recipientId, content, type = 'text', metadata = {} } = body;

    validateInput(
      { senderId, recipientId, content },
      {
        senderId: { required: true },
        recipientId: { required: true },
        content: { required: true, minLength: 1, maxLength: 5000 },
      }
    );

    const { databases } = await createAdminClient();

    // Get or create DM room
    let room;
    
    // Try to find existing room between these users
    const existingRooms = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [
        Query.equal('type', 'direct'),
        Query.limit(100), // Get all DM rooms
      ]
    );

    // Check if room exists between these two users
    room = existingRooms.documents.find((r: any) => {
      const members = Array.isArray(r.members) ? r.members : [];
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
          lastMessageAt: new Date().toISOString(),
        }
      );
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
    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      'unique()',
      {
        roomId: room.$id,
        senderId,
        senderName,
        senderAvatar,
        content: content.trim(),
        type,
        readBy: [senderId],
        replyTo: metadata.replyTo || null,
        attachmentUrl: metadata.attachmentUrl || null,
        timestamp: new Date().toISOString(),
      }
    );

    // Update room last message time
    await databases.updateDocument(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      room.$id,
      {
        lastMessageAt: new Date().toISOString(),
        lastMessage: content.substring(0, 100),
        lastMessageSender: senderId,
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
          actor: senderId,
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
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: error.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * GET /api/messages/send?userId=xxx - Get user's DM rooms
 */
export async function GET(request: NextRequest) {
  const { data, error } = await withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput({ userId }, { userId: { required: true } });

    const { databases } = await createAdminClient();

    // Get all DM rooms where user is a member
    const allRooms = await databases.listDocuments(
      DATABASE_ID,
      CHAT_ROOMS_COLLECTION_ID,
      [
        Query.equal('type', 'direct'),
        Query.orderDesc('lastMessageAt'),
        Query.limit(100),
      ]
    );

    // Filter rooms where user is a member
    const userRooms = allRooms.documents.filter((room: any) => {
      const members = Array.isArray(room.members) ? room.members : [];
      return members.includes(userId);
    });

    // Enrich each room with other user's profile
    const enrichedRooms = [];
    for (const room of userRooms) {
      const members = Array.isArray(room.members) ? room.members : [];
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
  }, { operation: 'getUserDMRooms' });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
