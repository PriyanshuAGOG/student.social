/**
 * Pod Course Study Sessions API
 * 
 * Endpoint: POST /api/pods/study-sessions
 * 
 * Creates and manages study sessions for pod cohorts.
 * Allows members to book time slots and study together using Jitsi Meet.
 */

import { Databases, Permission, Role } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';

interface StudySession {
  sessionId: string;
  podCourseId: string;
  chapterId?: string;
  topic: string;
  description?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  hostId: string;
  hostName: string;
  participants: Array<{
    userId: string;
    userName: string;
    joinedAt?: string;
    leftAt?: string;
  }>;
  maxParticipants?: number;
  jitsiRoomName: string;
  recordingUrl?: string;
  agenda?: string;
  resources?: Array<{ name: string; url: string }>;
}

/**
 * POST /api/pods/study-sessions
 * 
 * Create a study session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      podCourseId,
      chapterId,
      topic,
      description,
      scheduledStartTime,
      scheduledEndTime,
      hostId,
      hostName,
      maxParticipants = 10,
      agenda,
    } = body;

    // Validation
    if (!podCourseId || !topic || !scheduledStartTime || !hostId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: podCourseId, topic, scheduledStartTime, hostId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const startTime = new Date(scheduledStartTime);
    if (startTime < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Start time must be in the future' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    // Create Jitsi room name (alphanumeric only)
    const jitsiRoomName = `pod-${podCourseId.slice(0, 8)}-${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '');

    // Create session document
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_study_sessions',
      sessionId,
      {
        podCourseId,
        chapterId: chapterId || null,
        topic,
        description: description || '',
        scheduledStartTime,
        scheduledEndTime: scheduledEndTime || new Date(new Date(scheduledStartTime).getTime() + 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        hostId,
        hostName: hostName || `User ${hostId.slice(0, 8)}`,
        participants: JSON.stringify([
          {
            userId: hostId,
            userName: hostName,
            joinedAt: null,
          },
        ]),
        maxParticipants,
        jitsiRoomName,
        agenda: agenda || '',
        resources: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        recordingUrl: null,
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        session,
        jitsiRoomUrl: `https://meet.jitsi/${jitsiRoomName}`,
        message: 'Study session scheduled successfully',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating study session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create study session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/pods/study-sessions
 * 
 * Get study sessions for a pod course
 * Query params: ?podCourseId=xxx&status=scheduled|in-progress&limit=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const podCourseId = searchParams.get('podCourseId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!podCourseId) {
      return new Response(
        JSON.stringify({ error: 'Missing podCourseId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const filters: any[] = [
      {
        method: 'equal',
        attribute: 'podCourseId',
        value: podCourseId,
      },
    ];

    if (status) {
      filters.push({
        method: 'equal',
        attribute: 'status',
        value: status,
      });
    }

    const sessions = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_study_sessions',
      filters,
      limit,
      offset
    );

    // Parse JSON fields
    const parsedSessions = sessions.documents.map((doc: any) => ({
      ...doc,
      participants: doc.participants ? JSON.parse(doc.participants) : [],
      resources: doc.resources ? JSON.parse(doc.resources) : [],
    }));

    // Sort by scheduled start time
    parsedSessions.sort(
      (a: any, b: any) =>
        new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );

    return new Response(
      JSON.stringify({
        success: true,
        podCourseId,
        sessions: parsedSessions,
        total: sessions.total,
        limit,
        offset,
        hasMore: offset + limit < sessions.total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching study sessions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch study sessions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/pods/study-sessions
 * 
 * Update session status or add participant
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, action, userId, userName } = body;

    if (!sessionId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const session = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'pod_course_study_sessions',
      sessionId
    );

    switch (action) {
      case 'start':
        const started = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_study_sessions',
          sessionId,
          {
            status: 'in-progress',
          }
        );
        return new Response(JSON.stringify({ success: true, session: started }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'end':
        const ended = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_study_sessions',
          sessionId,
          {
            status: 'completed',
          }
        );
        return new Response(JSON.stringify({ success: true, session: ended }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'join':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for join action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const participants = JSON.parse(session.participants || '[]');
        const alreadyJoined = participants.some((p: any) => p.userId === userId);

        if (!alreadyJoined) {
          participants.push({
            userId,
            userName: userName || `User ${userId.slice(0, 8)}`,
            joinedAt: new Date().toISOString(),
          });
        }

        const joined = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_study_sessions',
          sessionId,
          {
            participants: JSON.stringify(participants),
          }
        );

        return new Response(JSON.stringify({ success: true, session: joined }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'leave':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for leave action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const updatedParticipants = JSON.parse(session.participants || '[]');
        const participantIndex = updatedParticipants.findIndex((p: any) => p.userId === userId);

        if (participantIndex !== -1) {
          updatedParticipants[participantIndex].leftAt = new Date().toISOString();
        }

        const left = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'pod_course_study_sessions',
          sessionId,
          {
            participants: JSON.stringify(updatedParticipants),
          }
        );

        return new Response(JSON.stringify({ success: true, session: left }), {
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
    console.error('Error updating study session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update study session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
