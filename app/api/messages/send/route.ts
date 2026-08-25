/**
 * DIRECT MESSAGING API
 * POST /api/messages/send - Send direct message
 * GET  /api/messages/room/[roomId] - Get messages in a room
 * GET  /api/messages/rooms - Get user's DM rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { ID, Permission, Query, Role } from 'node-appwrite';
import { z } from 'zod';
import { createAdminClient } from '@/lib/server/appwrite';
import { withErrorHandling, validateInput } from '@/lib/error-handler';
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security';
import { checkDurableRateLimit } from '@/lib/server/rate-limit';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const CHAT_ROOMS_COLLECTION_ID = (process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms');
const MESSAGES_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');
const NOTIFICATIONS_COLLECTION_ID = (process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications');

function parseMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.filter(Boolean)
  if (typeof room?.members === 'string') {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function isNotFound(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 404 || message.includes('not found') || message.includes('could not be found')
}

const sendMessageSchema = z.object({
  senderId: z.string().trim().min(1).max(255),
  recipientId: z.string().trim().min(1).max(255).optional(),
  roomId: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).max(5000),
  type: z.enum(['text', 'image', 'file', 'voice', 'system', 'call_event']).default('text'),
  clientMessageId: z.string().trim().min(1).max(255),
  metadata: z.object({
    replyTo: z.string().trim().max(255).nullable().optional(),
    fileUrl: z.string().trim().max(500).nullable().optional(),
    attachmentUrl: z.string().trim().max(500).nullable().optional(),
    fileName: z.string().trim().max(180).nullable().optional(),
    fileSize: z.number().int().min(0).max(100 * 1024 * 1024).nullable().optional(),
  }).default({}),
})

function internalError(message: string, error: any) {
  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' ? `${message}: ${error?.message || 'Unknown error'}` : message,
    },
    { status: 500 },
  )
}

/**
 * POST /api/messages/send - Send a direct message
 */
export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'messages:send', max: 60, windowMs: 60 * 1000 })

    const auth = requireUser(request)
    const durableLimit = await checkDurableRateLimit(`messages:send:${auth.userId}`, 60, 60_000)
    if (!durableLimit.allowed) throw new ApiError(429, 'RATE_LIMITED', 'Too many messages sent; wait before trying again')
    const body = await parseJsonBody(request, sendMessageSchema, 16 * 1024)
    const { senderId, recipientId, roomId, content, type = 'text', metadata = {}, clientMessageId } = body

    validateInput(
      { senderId, content },
      {
        senderId: { required: true },
        content: { required: true, minLength: 1, maxLength: 5000 },
      }
    )
    requireOwnership(senderId, auth.userId)

    const { databases } = await createAdminClient()

    let room: any = null

    if (roomId) {
      try {
        room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, String(roomId))
      } catch (error: any) {
        if (isNotFound(error)) {
          return NextResponse.json({ success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' }, { status: 404 })
        }
        throw error
      }

      const roomMembers = parseMembers(room)
      if (!['direct', 'dm', 'group', 'pod', 'support'].includes(room.type)) {
        throw new ApiError(400, 'INVALID_ROOM_TYPE', 'Unsupported chat room type')
      }

      if (!roomMembers.includes(senderId)) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation')
      }
    }

    if (!room) {
      if (!recipientId) {
        throw new ApiError(400, 'INVALID_INPUT', 'recipientId is required when roomId is not provided')
      }

      const existingRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [Query.limit(100)]
      )

      room = existingRooms.documents.find((candidate: any) => {
        if (!['direct', 'dm'].includes(candidate.type)) return false
        const members = parseMembers(candidate)
        return members.includes(senderId) && members.includes(recipientId)
      })

      if (!room) {
        const now = new Date().toISOString()
        const directMembers = [senderId, recipientId]
        room = await databases.createDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, ID.unique(), {
          type: 'direct',
          members: directMembers,
          createdAt: now,
          isActive: true,
          lastMessageTime: now,
        }, directMembers.map((memberId) => Permission.read(Role.user(memberId))))
      }
    }

    if (clientMessageId) {
      try {
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
          return NextResponse.json({
            success: true,
            message: existingMessages.documents[0],
            roomId: room.$id,
            deduplicated: true,
          })
        }
      } catch (dedupeError: any) {
        throw dedupeError
      }
    }

    let senderName = 'User'
    let senderAvatar = ''
    try {
      const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, senderId)
      senderName = profile.name || senderName
      senderAvatar = profile.avatar || ''
    } catch (_profileError) {
      console.debug('[messages/send] Profile fetch failed for sender, using defaults:', senderId)
    }

    let message
    try {
      const roomMembers = parseMembers(room)
      const safeDocumentId = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(clientMessageId) ? clientMessageId : ID.unique()
      message = await databases.createDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, safeDocumentId, {
        roomId: room.$id,
        senderId,
        authorId: senderId,
        ...(clientMessageId ? { clientMessageId: String(clientMessageId) } : {}),
        senderName,
        senderAvatar,
        content: String(content).trim(),
        type,
        contentType: type,
        deliveryState: 'sent',
        readBy: [senderId],
        ...(metadata.replyTo ? { replyTo: String(metadata.replyTo) } : {}),
        ...(metadata.fileUrl || metadata.attachmentUrl ? { fileUrl: String(metadata.fileUrl || metadata.attachmentUrl) } : {}),
        ...(metadata.fileName ? { fileName: String(metadata.fileName).slice(0, 180) } : {}),
        ...(metadata.fileSize ? { fileSize: Number(metadata.fileSize) } : {}),
        metadata: JSON.stringify(metadata || {}).slice(0, 5000),
        timestamp: new Date().toISOString(),
      }, roomMembers.map((memberId) => Permission.read(Role.user(memberId))))
    } catch (error: any) {
      if (error?.code === 409) {
        const duplicate = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
          Query.equal('roomId', room.$id), Query.equal('clientMessageId', clientMessageId), Query.limit(1),
        ])
        if (duplicate.documents?.[0]) {
          return NextResponse.json({ success: true, message: duplicate.documents[0], roomId: room.$id, deduplicated: true })
        }
      }
      console.error('[messages/send] Failed to insert message:', error)
      return internalError('Failed to send message', error)
    }

    try {
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        room.$id,
        {
          lastMessageTime: new Date().toISOString(),
          lastMessage: String(content).substring(0, 100),
          lastMessageSenderId: senderId,
        }
      )
    } catch (roomUpdateError) {
      console.error('[messages/send] Failed to update room last message metadata:', roomUpdateError)
    }

    const notificationRecipients = parseMembers(room).filter((memberId) => memberId !== senderId)
    for (const notificationRecipientId of notificationRecipients) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          'unique()',
          {
            userId: notificationRecipientId,
            type: 'message',
            title: 'New message',
            actorId: senderId,
            actorName: senderName,
            actorAvatar: senderAvatar,
            message: `${senderName} sent you a message`,
            isRead: false,
            timestamp: new Date().toISOString(),
            actionUrl: `/app/chat?room=${encodeURIComponent(room.$id)}`,
          }
        )
      } catch (notifError) {
        console.error('Failed to create message notification:', notifError)
      }
    }

    return NextResponse.json({ success: true, message, roomId: room.$id }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[messages/send] Failed to send message:', error)
    return internalError('Failed to send message', error)
  }
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
