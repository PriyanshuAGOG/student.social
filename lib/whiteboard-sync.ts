/**
 * Whiteboard Real-time Sync Utilities
 * 
 * Provides Appwrite integration for real-time whiteboard state synchronization
 * across multiple users in a pod session.
 */

import { Client, Databases, type Models } from 'appwrite'

// Type for Appwrite realtime messages
type RealtimeMessage = {
  events: string[]
  channels: string[]
  timestamp: string
  payload: Models.Document
}

interface WhiteboardState {
  podId: string
  meetingId: string
  creatorId: string
  state: string // JSON stringified canvas history
  title: string
  isShared: boolean
  lastModifiedBy: string
  lastModifiedAt: string
  version: number
}

/**
 * Create or update whiteboard state in Appwrite
 */
export async function saveWhiteboardState(
  appwrite: ReturnType<typeof initializeAppwrite>,
  whiteboardData: Partial<WhiteboardState>
) {
  try {
    if (!whiteboardData.podId) throw new Error('Pod ID required')

    const databases = new Databases(appwrite.client)

    // Check if whiteboard exists
    let docId = `whiteboard-${whiteboardData.podId}`

    try {
      // Try to get existing document
      const existing = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
        'pod_whiteboards',
        docId
      )

      // Update existing
      return await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
        'pod_whiteboards',
        docId,
        {
          ...whiteboardData,
          lastModifiedAt: new Date().toISOString(),
          version: existing.version + 1,
        }
      )
    } catch (e: any) {
      if (e.code === 404) {
        // Create new
        return await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
          'pod_whiteboards',
          docId,
          {
            podId: whiteboardData.podId,
            meetingId: whiteboardData.meetingId || '',
            creatorId: whiteboardData.creatorId || '',
            state: whiteboardData.state || '[]',
            title: whiteboardData.title || 'Untitled Whiteboard',
            isShared: whiteboardData.isShared ?? true,
            lastModifiedBy: whiteboardData.lastModifiedBy || '',
            lastModifiedAt: new Date().toISOString(),
            version: 1,
          }
        )
      }
      throw e
    }
  } catch (error) {
    console.error('Failed to save whiteboard state:', error)
    throw error
  }
}

/**
 * Subscribe to real-time whiteboard updates
 */
export async function subscribeToWhiteboardUpdates(
  appwrite: ReturnType<typeof initializeAppwrite>,
  podId: string,
  onUpdate: (state: WhiteboardState) => void
) {
  try {
    const unsubscribe = appwrite.client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'}.collections.pod_whiteboards.documents`,
      (response) => {
        const payload = response.payload as unknown as WhiteboardState
        if (payload && payload.podId === podId) {
          onUpdate(payload)
        }
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Failed to subscribe to whiteboard updates:', error)
    return () => {} // Return no-op unsubscribe if subscription fails
  }
}

/**
 * Export whiteboard as PDF or image
 */
export async function exportWhiteboard(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg' = 'png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to export whiteboard'))
      }
    }, `image/${format}`, 0.95)
  })
}

/**
 * Share whiteboard link
 */
export function getWhiteboardShareLink(podId: string, meetingId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/app/pods/${podId}?meeting=${meetingId}&view=whiteboard`
}

/**
 * Initialize Appwrite client (stub - actual initialization in auth-context)
 */
export function initializeAppwrite() {
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

  return { client }
}
