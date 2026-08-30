import 'server-only'

import { ID } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

type NotificationInput = {
  userId: string
  title: string
  message: string
  type?: string
  actionUrl?: string
  actorId?: string
  actorName?: string
  actorAvatar?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

function clean(value: unknown, max: number) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function createServerNotification(input: NotificationInput) {
  const { databases } = createAdminClient()
  const title = clean(input.title, 255) || 'Student.social update'
  const message = clean(input.message, 1000) || 'You have a new update.'
  const type = clean(input.type || 'info', 50).replace(/-/g, '_') || 'info'
  const metadata = input.metadata && Object.keys(input.metadata).length
    ? JSON.stringify(input.metadata).slice(0, 5000)
    : ''

  return databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
    userId: clean(input.userId, 255),
    title,
    message,
    type,
    timestamp: input.timestamp || new Date().toISOString(),
    isRead: false,
    actionUrl: clean(input.actionUrl, 500),
    actorId: clean(input.actorId, 255),
    actorName: clean(input.actorName, 255),
    actorAvatar: clean(input.actorAvatar, 500),
    metadata,
  })
}
