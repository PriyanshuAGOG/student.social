/**
 * LEAVE POD API ROUTE
 * POST /api/pods/[id]/leave
 * 
 * Removes a user from a pod with proper cleanup
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
    const { userId } = body;

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

    // Check if user is a member
    const members = Array.isArray(pod.members) ? pod.members : [];
    if (!members.includes(userId)) {
      throw new AppError({
        code: 'NOT_A_MEMBER',
        message: 'User is not a member of this pod',
        userMessage: 'You are not a member of this pod',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Check if user is creator - creators cannot leave their own pod
    if (pod.creatorId === userId) {
      throw new AppError({
        code: 'CREATOR_CANNOT_LEAVE',
        message: 'Pod creator cannot leave the pod',
        userMessage: 'As the creator, you cannot leave this pod. You can delete it or transfer ownership.',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
      });
    }

    // Remove user from members
    const updatedMembers = members.filter((id: string) => id !== userId);

    // Update pod
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

    // Remove user from pod's chat room
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

        if (chatMembers.includes(userId)) {
          const updatedChatMembers = chatMembers.filter((id: string) => id !== userId);
          
          await databases.updateDocument(
            DATABASE_ID,
            CHAT_ROOMS_COLLECTION_ID,
            chatRoom.$id,
            {
              members: updatedChatMembers,
            }
          );
          chatRoomUpdated = true;

          // Send leave notification message
          let userName = 'A member';
          try {
            const profile = await databases.getDocument(
              DATABASE_ID,
              PROFILES_COLLECTION_ID,
              userId
            );
            userName = profile.name || userName;
          } catch (profileError) {
            console.log('Could not fetch user profile for leave message');
          }

          await databases.createDocument(
            DATABASE_ID,
            MESSAGES_COLLECTION_ID,
            'unique()',
            {
              roomId: chatRoom.$id,
              senderId: 'system',
              content: `${userName} left the pod 👋`,
              timestamp: new Date().toISOString(),
              readBy: [],
              type: 'system',
            }
          );
        }
      }
    } catch (chatError) {
      console.error('Failed to remove user from chat room:', chatError);
      // Don't fail the entire operation if chat fails
    }

    return {
      success: true,
      pod: updatedPod,
      memberCount: updatedMembers.length,
      chatRoomUpdated,
      message: `Successfully left ${pod.name}`,
    };
  }, { operation: 'leavePod' });

  if (error) {
    const status = error.code === 'NOT_A_MEMBER' || error.code === 'CREATOR_CANNOT_LEAVE' ? 400 : 
                   error.code === 'RESOURCE_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.userMessage, details: error },
      { status }
    );
  }

  return NextResponse.json(data);
}
