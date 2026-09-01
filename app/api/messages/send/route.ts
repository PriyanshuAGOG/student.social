/**
 * DIRECT MESSAGING API
 * POST /api/messages/send - Send direct message
 * GET  /api/messages/room/[roomId] - Get messages in a room
 * GET  /api/messages/rooms - Get user's DM rooms
 */

import { after, NextRequest, NextResponse } from 'next/server';
import { ID, Permission, Query, Role } from 'node-appwrite';
import { z } from 'zod';
import { createAdminClient } from '@/lib/server/appwrite';
import { withErrorHandling, validateInput } from '@/lib/error-handler';
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireOwnership, requireVerifiedUser } from '@/lib/api-security';
import { checkDurableRateLimit } from '@/lib/server/rate-limit';
import { sendNewMessagePush } from '@/lib/server/web-push';
import { runAIChat } from '@/lib/ai';
import { buildAuthorizedAIContext } from '@/lib/server/ai-context';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db';
const CHAT_ROOMS_COLLECTION_ID = (process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms');
const MESSAGES_COLLECTION_ID = (process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages');
const PROFILES_COLLECTION_ID = (process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles');
const NOTIFICATIONS_COLLECTION_ID = (process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications');
const AI_ID = 'student-social-ai';

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
    fileId: z.string().trim().max(255).nullable().optional(),
    fileType: z.string().trim().max(120).nullable().optional(),
    durationMs: z.number().int().min(0).max(6 * 60 * 60 * 1000).nullable().optional(),
    transcript: z.string().trim().max(3000).nullable().optional(),
    transcriptStatus: z.enum(['ready', 'unavailable', 'failed']).nullable().optional(),
    resourceId: z.string().trim().max(255).nullable().optional(),
    resourceTitle: z.string().trim().max(180).nullable().optional(),
    resourceType: z.string().trim().max(120).nullable().optional(),
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

function notificationPreview(type: string, content: string, fileName?: string | null): string {
  if (type === 'voice') return 'Voice message'
  if (type === 'image') return 'Photo'
  if (type === 'file') return fileName ? `File: ${fileName}` : 'Shared a file'
  return content.replace(/\s+/g, ' ').trim().slice(0, 160)
}

function invokesTutor(content: string): boolean {
  return /(^|\s)@ai\b/i.test(content)
}

async function answerTutorMention(databases: any, room: any, sourceMessage: any, senderName: string) {
  const authorizedContext = await buildAuthorizedAIContext(sourceMessage.senderId || sourceMessage.authorId, { resources: true, calendar: true })
  const recent = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
    Query.equal('roomId', room.$id),
    Query.orderDesc('timestamp'),
    Query.limit(12),
  ]).catch(() => ({ documents: [sourceMessage] }))
  const context = [...recent.documents].reverse().map((entry: any) => {
    let attachment = ''
    try {
      const metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata
      if (metadata?.fileName) attachment = ` [Attachment: ${metadata.fileName}${metadata.fileType ? `, ${metadata.fileType}` : ''}]`
    } catch {
      attachment = ''
    }
    return {
      role: entry.senderId === AI_ID ? 'assistant' as const : 'user' as const,
      content: `${entry.senderName || 'Student'}: ${entry.content}${attachment}`,
    }
  })
  const reply = await runAIChat([
    {
      role: 'system',
      content: `You are Student.social AI inside a human study chat. Answer only when mentioned with @AI. Be concise, practical, encouraging, and preserve the students' agency. Use the recent conversation and the invoking student's authorized context without exposing private system details. Never perform a side effect such as sending another message or changing a calendar event without first proposing the exact action and receiving explicit confirmation.\n\n${authorizedContext}`,
    },
    ...context,
  ], { maxTokens: 900 }).catch(() => `@${senderName}, I couldn't reach the tutor service just now. Your question is still here—mention @AI again in a moment and I'll retry.`)
  const roomMembers = parseMembers(room)
  return databases.createDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, ID.unique(), {
    roomId: room.$id,
    senderId: AI_ID,
    authorId: AI_ID,
    clientMessageId: `ai_${sourceMessage.$id}`.slice(0, 255),
    senderName: 'AI',
    senderAvatar: '',
    content: reply.slice(0, 5000),
    type: 'text',
    contentType: 'text',
    deliveryState: 'sent',
    readBy: [],
    metadata: JSON.stringify({ isAi: true, invokedBy: senderName, inReplyTo: sourceMessage.$id }),
    timestamp: new Date().toISOString(),
  }, roomMembers.map((memberId: string) => Permission.read(Role.user(memberId))))
}

/**
 * POST /api/messages/send - Send a direct message
 */
export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'messages:send', max: 60, windowMs: 60 * 1000 })

    const auth = await requireVerifiedUser(request)
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

    const { databases, users } = await createAdminClient()

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
    const preview = notificationPreview(type, String(content), metadata.fileName)
    const actionUrl = `/app/chat?room=${encodeURIComponent(room.$id)}&message=${encodeURIComponent(message.$id)}`

    // Message persistence is the critical path. Inbox storage and background
    // push complete after the response so pressing Send remains immediate.
    after(async () => {
      const backgroundTasks: Promise<unknown>[] = notificationRecipients.map(async (notificationRecipientId) => {
        await Promise.allSettled([
          databases.createDocument(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION_ID,
            ID.unique(),
            {
              userId: notificationRecipientId,
              type: 'message',
              title: senderName,
              actorId: senderId,
              actorName: senderName,
              actorAvatar: senderAvatar,
              message: preview,
              isRead: false,
              timestamp: new Date().toISOString(),
              actionUrl,
              metadata: JSON.stringify({ roomId: room.$id, messageId: message.$id, senderId }),
            },
            [Permission.read(Role.user(notificationRecipientId))],
          ),
          sendNewMessagePush(users, notificationRecipientId, {
            roomId: room.$id,
            messageId: message.$id,
            senderId,
            senderName,
            senderAvatar,
            preview,
            actionUrl,
          }),
        ])
      })
      if (invokesTutor(String(content))) {
        backgroundTasks.push(answerTutorMention(databases, room, message, senderName))
      }
      await Promise.allSettled(backgroundTasks)
    })

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
    const auth = await requireVerifiedUser(request)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    validateInput({ userId }, { userId: { required: true } });
    requireOwnership(userId!, auth.userId)

    try {
      const { databases } = await createAdminClient();

      // Get conversations where the user is a member. Pod rooms are loaded by
      // the Pod service; this endpoint owns direct and standalone group rooms.
      const allRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [
          Query.orderDesc('lastMessageTime'),
          Query.limit(500),
        ]
      );

      // Filter rooms where user is a member
      const userRooms = (allRooms?.documents || []).filter((room: any) => {
        if (!['direct', 'dm', 'group'].includes(room.type)) return false;
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
        if (room.type === 'group') {
          enrichedRooms.push({ ...room, members, participants: members });
          continue;
        }

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
