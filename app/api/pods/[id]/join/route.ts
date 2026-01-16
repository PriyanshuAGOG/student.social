/**
 * JOIN POD API ROUTE
 * POST /api/pods/[id]/join
 * 
 * Adds a user to a pod with proper verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';
import { withErrorHandling, validateInput, AppError, ErrorSeverity, ErrorCategory } from '@/lib/error-handler';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PODS_COLLECTION_ID = process.env.NEXT_PUBLIC_PODS_COLLECTION_ID!;
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID!;
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!;
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await withErrorHandling(async () => {
    const podId = params.id;
    const body = await request.json();
    const { userId, userEmail } = body;

    validateInput({ podId, userId }, {
      podId: { required: true },
      userId: { required: true },
    });

    const { databases } = await createAdminClient();

    // Get pod
    const pod = await databases.getDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );

    // Check if pod is active
    if (!pod.isActive) {
      throw new AppError({
        code: 'POD_INACTIVE',
        message: 'This pod is no longer active',
        userMessage: 'This pod is no longer active',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Check max members
    const members = Array.isArray(pod.members) ? pod.members : [];
    if (pod.maxMembers && members.length >= pod.maxMembers) {
      throw new AppError({
        code: 'POD_FULL',
        message: 'Pod has reached maximum members',
        userMessage: 'This pod is full. Maximum members reached.',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Check if already a member
    if (members.includes(userId)) {
      return {
        success: true,
        alreadyMember: true,
        message: 'Already a member of this pod',
        pod,
        memberCount: members.length,
      };
    }

    // Add user to members
    const updatedMembers = [...members, userId];

    // Update pod with new member
    const updatedPod = await databases.updateDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId,
      {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: new Date().toISOString(),
      }
    );

    // Verify the update
    const verifiedPod = await databases.getDocument(
      DATABASE_ID,
      PODS_COLLECTION_ID,
      podId
    );
    
    const verifiedMembers = Array.isArray(verifiedPod.members) ? verifiedPod.members : [];

    // Add user to pod's chat room
    let chatRoomUpdated = false;
    try {
      const chatRooms = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [Query.equal('podId', podId)]
      );

      if (chatRooms.documents.length > 0) {
        const chatRoom = chatRooms.documents[0];
        const chatMembers = Array.isArray(chatRoom.members) ? chatRoom.members : [];

        if (!chatMembers.includes(userId)) {
          await databases.updateDocument(
            DATABASE_ID,
            CHAT_ROOMS_COLLECTION_ID,
            chatRoom.$id,
            {
              members: [...chatMembers, userId],
            }
          );
          chatRoomUpdated = true;

          // Send join notification message
          let userName = 'New member';
          try {
            const profile = await databases.getDocument(
              DATABASE_ID,
              PROFILES_COLLECTION_ID,
              userId
            );
            userName = profile.name || userName;
          } catch (profileError) {
            console.log('Could not fetch user profile for join message');
          }

          await databases.createDocument(
            DATABASE_ID,
            MESSAGES_COLLECTION_ID,
            'unique()',
            {
              roomId: chatRoom.$id,
              senderId: 'system',
              content: `${userName} joined the pod! 👋`,
              timestamp: new Date().toISOString(),
              readBy: [],
              type: 'system',
            }
          );
        }
      }
    } catch (chatError) {
      console.error('Failed to add user to chat room:', chatError);
      // Don't fail the entire operation if chat fails
    }

    return {
      success: true,
      pod: verifiedPod,
      memberCount: verifiedMembers.length,
      members: verifiedMembers,
      chatRoomUpdated,
      message: `Successfully joined ${pod.name}`,
    };
  }, { operation: 'joinPod' });

  if (error) {
    const status = error.code === 'POD_FULL' || error.code === 'POD_INACTIVE' ? 400 : 
                   error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
