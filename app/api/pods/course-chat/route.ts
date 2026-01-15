/**
 * Pod Course Chat & Discussion API
 * 
 * Endpoint: POST /api/pods/course-chat
 * 
 * Enables pod members to discuss course content, ask questions, and collaborate
 * Features: threaded discussions, real-time updates, moderation
 */

import { Databases, Permission, Role } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';

interface ChatMessage {
  userId: string;
  userName: string;
  userImage?: string;
  podCourseId: string;
  chapterId?: string;
  content: string;
  messageType: 'question' | 'answer' | 'discussion' | 'announcement';
  parentMessageId?: string; // for threaded replies
  attachments?: string[]; // file IDs
  createdAt: string;
  likes: number;
  replies: number;
}

/**
 * POST /api/pods/course-chat
 * 
 * Create a new chat message in pod course discussion
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userName, podCourseId, chapterId, content, messageType, parentMessageId } =
      body;

    // Validation
    if (!userId || !podCourseId || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, podCourseId, content' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (content.length < 1 || content.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Content must be between 1 and 5000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Create message document
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const message = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_chat',
      messageId,
      {
        userId,
        userName: userName || `User ${userId.slice(0, 8)}`,
        podCourseId,
        chapterId: chapterId || null,
        content,
        messageType: messageType || 'discussion',
        parentMessageId: parentMessageId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        replies: 0,
        isDeleted: false,
        isPinned: false,
        moderation: {
          flagged: false,
          reason: null,
          flaggedAt: null,
          flaggedBy: null,
        },
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
      ]
    );

    // If this is a reply, increment parent reply count
    if (parentMessageId) {
      try {
        const parentMessage = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          parentMessageId
        );

        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          parentMessageId,
          {
            replies: (parentMessage.replies || 0) + 1,
          }
        );
      } catch (err) {
        console.log('Could not update parent message reply count');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        message,
        notification: {
          type: 'new_discussion',
          podCourseId,
          messageId,
          userId,
          userName,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating chat message:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/pods/course-chat
 * 
 * Get chat messages for a pod course or chapter
 * Query params: ?podCourseId=xxx&chapterId=yyy&limit=50&offset=0
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const podCourseId = searchParams.get('podCourseId');
    const chapterId = searchParams.get('chapterId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!podCourseId) {
      return new Response(
        JSON.stringify({ error: 'Missing podCourseId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Build query filters
    const filters: any[] = [
      {
        method: 'equal',
        attribute: 'podCourseId',
        value: podCourseId,
      },
      {
        method: 'equal',
        attribute: 'isDeleted',
        value: false,
      },
    ];

    if (chapterId) {
      filters.push({
        method: 'equal',
        attribute: 'chapterId',
        value: chapterId,
      });
    }

    const messages = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_chat',
      filters,
      limit,
      offset
    );

    // Sort by date descending (newest first)
    const sorted = messages.documents.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return new Response(
      JSON.stringify({
        success: true,
        podCourseId,
        chapterId,
        messages: sorted,
        total: messages.total,
        limit,
        offset,
        hasMore: offset + limit < messages.total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch messages' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/pods/course-chat
 * 
 * Update a chat message (edit) or like/flag
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { messageId, action, content, likeBy } = body;

    if (!messageId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messageId, action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const message = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_chat',
      messageId
    );

    switch (action) {
      case 'edit':
        if (!content) {
          return new Response(
            JSON.stringify({ error: 'Content required for edit action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const edited = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          messageId,
          {
            content,
            updatedAt: new Date().toISOString(),
            isEdited: true,
          }
        );
        return new Response(JSON.stringify({ success: true, message: edited }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'like':
        const liked = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          messageId,
          {
            likes: (message.likes || 0) + 1,
          }
        );
        return new Response(JSON.stringify({ success: true, message: liked }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'flag':
        const flagged = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          messageId,
          {
            'moderation.flagged': true,
            'moderation.flaggedAt': new Date().toISOString(),
          }
        );
        return new Response(JSON.stringify({ success: true, message: flagged }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'delete':
        const deleted = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_chat',
          messageId,
          {
            isDeleted: true,
            content: '[deleted]',
          }
        );
        return new Response(JSON.stringify({ success: true, message: deleted }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action: ' + action }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error updating chat message:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
