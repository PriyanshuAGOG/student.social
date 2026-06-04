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
import { ApiError, enforceRateLimit, enforceSameOrigin, requireOwnership, requireUser } from '@/lib/api-security';

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

function getUnknownAttribute(error: any): string | null {
  const message = String(error?.message || '')
  return message.match(/Unknown attribute:\s*"([^"]+)"/)?.[1] || null
}

function isSchemaCompatibilityError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return Boolean(getUnknownAttribute(error)) || message.includes('attribute') || message.includes('index')
}

async function createDocumentWithSchemaRetry(
  databases: any,
  collectionId: string,
  payload: Record<string, unknown>,
  maxAttempts = 12,
) {
  const data = { ...payload }
  const removed = new Set<string>()

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await databases.createDocument(DATABASE_ID, collectionId, 'unique()', data)
    } catch (error: any) {
      const unknownAttribute = getUnknownAttribute(error)
      if (!unknownAttribute || removed.has(unknownAttribute)) throw error

      removed.add(unknownAttribute)
      delete data[unknownAttribute]
    }
  }

  throw new Error(`Unable to create ${collectionId} after schema compatibility retries`)
}

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
    const body = await request.json().catch(() => ({}))
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
      if (!['direct', 'dm'].includes(room.type) && room.type !== 'pod') {
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
        room = await createDocumentWithSchemaRetry(databases, CHAT_ROOMS_COLLECTION_ID, {
          type: 'direct',
          members: [senderId, recipientId],
          createdAt: now,
          isActive: true,
          lastMessageTime: now,
        })
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
        if (!isSchemaCompatibilityError(dedupeError)) throw dedupeError
        console.warn('[messages/send] clientMessageId dedupe unavailable; continuing without dedupe:', dedupeError?.message || dedupeError)
      }
    }

    let senderName = 'User'
    let senderAvatar = ''
    try {
      const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, senderId)
      senderName = profile.name || senderName
      senderAvatar = profile.avatar || ''
    } catch (profileError) {
      console.debug('[messages/send] Profile fetch failed for sender, using defaults:', senderId)
    }

    let message
    try {
      message = await createDocumentWithSchemaRetry(databases, MESSAGES_COLLECTION_ID, {
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
      })
    } catch (error: any) {
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

    if (recipientId) {
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
