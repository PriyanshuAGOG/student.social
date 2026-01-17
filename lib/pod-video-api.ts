/**
 * Pod Video & Whiteboard Backend API
 * 
 * Provides Appwrite integration for:
 * - Meeting state management
 * - Whiteboard persistence and sync
 * - Session analytics
 * - Participant tracking
 */

import { client, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Models, AppwriteException, RealtimeResponseEvent } from "appwrite"

/**
 * Create or update a pod meeting session
 */
export async function createPodMeeting({
  podId,
  meetingId,
  title,
  creatorId,
  features = [],
  tags = [],
}: {
  podId: string
  meetingId: string
  title: string
  creatorId: string
  features?: string[]
  tags?: string[]
}) {
  try {
    const docId = `meeting-${meetingId}`
    const now = new Date().toISOString()

    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      docId,
      {
        podId,
        meetingId,
        title,
        creatorId,
        startTime: now,
        endTime: null,
        duration: 0,
        isActive: true,
        status: "active",
        currentParticipants: 1,
        participantIds: JSON.stringify([creatorId]),
        recordingUrl: null,
        features: JSON.stringify(features),
        notes: "",
        tags: JSON.stringify(tags),
        createdAt: now,
        updatedAt: now,
      }
    )
  } catch (error) {
    console.error("Failed to create pod meeting:", error)
    throw error
  }
}

/**
 * End a pod meeting session
 */
export async function endPodMeeting(meetingId: string) {
  try {
    const docId = `meeting-${meetingId}`
    const now = new Date().toISOString()

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      docId
    )

    const startTime = new Date(doc.startTime)
    const endTime = new Date(now)
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      docId,
      {
        isActive: false,
        status: "ended",
        endTime: now,
        duration: durationSeconds,
        updatedAt: now,
      }
    )
  } catch (error) {
    console.error("Failed to end pod meeting:", error)
    throw error
  }
}

/**
 * Save whiteboard state
 */
export async function saveWhiteboardState({
  podId,
  meetingId,
  creatorId,
  state,
  title = "Untitled Whiteboard",
  isShared = true,
  exportUrl = null,
}: {
  podId: string
  meetingId: string
  creatorId: string
  state: string // JSON stringified canvas history
  title?: string
  isShared?: boolean
  exportUrl?: string | null
}) {
  try {
    const docId = `whiteboard-${podId}-${meetingId}`
    const now = new Date().toISOString()

    // Check if exists
    try {
      const existing = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.POD_WHITEBOARDS || "pod_whiteboards",
        docId
      )

      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.POD_WHITEBOARDS || "pod_whiteboards",
        docId,
        {
          state,
          lastModifiedBy: creatorId,
          lastModifiedAt: now,
          version: existing.version + 1,
          isArchived: false,
          exportUrl,
        }
      )
    } catch (e: unknown) {
      if ((e as AppwriteException).code === 404) {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.POD_WHITEBOARDS || "pod_whiteboards",
          docId,
          {
            podId,
            meetingId,
            creatorId,
            state,
            title,
            description: "",
            isShared,
            lastModifiedBy: creatorId,
            lastModifiedAt: now,
            version: 1,
            exportUrl: exportUrl || null,
            collaborators: JSON.stringify([creatorId]),
            isArchived: false,
            createdAt: now,
          }
        )
      }
      throw e
    }
  } catch (error) {
    console.error("Failed to save whiteboard state:", error)
    throw error
  }
}

/**
 * Track participant attendance
 */
export async function trackParticipant({
  meetingId,
  podId,
  userId,
  cameraOn = true,
  microphoneOn = true,
}: {
  meetingId: string
  podId: string
  userId: string
  cameraOn?: boolean
  microphoneOn?: boolean
}) {
  try {
    const docId = `participant-${meetingId}-${userId}`
    const now = new Date().toISOString()

    // Check if exists
    try {
      await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.POD_MEETING_PARTICIPANTS || "pod_meeting_participants",
        docId
      )

      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.POD_MEETING_PARTICIPANTS || "pod_meeting_participants",
        docId,
        {
          cameraOn,
          microphoneOn,
          lastActiveAt: now,
        }
      )
    } catch (e: unknown) {
      if ((e as AppwriteException).code === 404) {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.POD_MEETING_PARTICIPANTS || "pod_meeting_participants",
          docId,
          {
            meetingId,
            podId,
            userId,
            joinedAt: now,
            leftAt: null,
            duration: 0,
            cameraOn,
            microphoneOn,
            screenShareDuration: 0,
            status: "joined",
            notes: "",
            lastActiveAt: now,
          }
        )
      }
      throw e
    }
  } catch (error) {
    console.error("Failed to track participant:", error)
    // Don't throw - this is non-critical
  }
}

/**
 * Get meeting analytics
 */
export async function getMeetingAnalytics(meetingId: string) {
  try {
    // Get meeting doc
    const meeting = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      `meeting-${meetingId}`
    )

    // Get participant records (would need a query in real implementation)
    // For now, return basic meeting stats
    return {
      meetingId,
      title: meeting.title,
      duration: meeting.duration,
      participantCount: meeting.currentParticipants,
      status: meeting.status,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      creatorId: meeting.creatorId,
    }
  } catch (error) {
    console.error("Failed to get meeting analytics:", error)
    return null
  }
}

/**
 * Subscribe to real-time meeting updates
 */
export function subscribeToMeetingUpdates(
  meetingId: string,
  onUpdate: (meeting: Models.Document) => void
) {
  try {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.POD_MEETINGS || "pod_meetings"}.documents.meeting-${meetingId}`,
      (message: RealtimeResponseEvent<Models.Document>) => {
        onUpdate(message.payload)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error("Failed to subscribe to meeting updates:", error)
    return () => { } // Return no-op unsubscribe
  }
}

/**
 * Subscribe to whiteboard updates
 */
export function subscribeToWhiteboardUpdates(
  podId: string,
  meetingId: string,
  onUpdate: (whiteboard: Models.Document) => void
) {
  try {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.POD_WHITEBOARDS || "pod_whiteboards"}.documents.whiteboard-${podId}-${meetingId}`,
      (message: RealtimeResponseEvent<Models.Document>) => {
        onUpdate(message.payload)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error("Failed to subscribe to whiteboard updates:", error)
    return () => { } // Return no-op unsubscribe
  }
}

/**
 * Get participant list for meeting
 */
export async function getMeetingParticipants(meetingId: string) {
  try {
    const meeting = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      `meeting-${meetingId}`
    )

    const participantIds = JSON.parse(meeting.participantIds || "[]")
    return participantIds
  } catch (error) {
    console.error("Failed to get meeting participants:", error)
    return []
  }
}

/**
 * Update participant count in real-time
 */
export async function updateParticipantCount(meetingId: string, count: number) {
  try {
    const docId = `meeting-${meetingId}`

    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.POD_MEETINGS || "pod_meetings",
      docId,
      {
        currentParticipants: count,
        updatedAt: new Date().toISOString(),
      }
    )
  } catch (error) {
    console.error("Failed to update participant count:", error)
    // Non-critical, don't throw
  }
}
