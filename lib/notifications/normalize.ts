export type NormalizedNotification = {
  $id: string
  userId: string
  title: string
  message: string
  body: string
  type: string
  category: string
  priority: string
  actionUrl: string
  ctaUrl: string
  actionText?: string
  ctaLabel?: string
  actorId?: string
  actorName?: string
  actorAvatar?: string
  metadata: Record<string, any> | null
  podId?: string
  podName?: string
  isRead: boolean
  timestamp: string
  createdAt: string
  [key: string]: unknown
}

function parseMetadata(value: unknown): Record<string, any> | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function normalizeNotificationDocument(doc: any): NormalizedNotification {
  const metadata = parseMetadata(doc?.metadata)
  const rawTimestamp = doc?.timestamp || doc?.createdAt || doc?.$createdAt
  const fallbackTimestamp = Number.isFinite(Date.parse(doc?.$createdAt)) ? doc.$createdAt : new Date(0).toISOString()
  const timestamp = Number.isFinite(Date.parse(rawTimestamp)) ? rawTimestamp : fallbackTimestamp
  const title = String(doc?.title || doc?.type || 'Notification').replace(/[_-]+/g, ' ').trim() || 'Notification'
  const message = String(doc?.message || doc?.body || 'You have a new update.').trim() || 'You have a new update.'
  const type = String(doc?.type || doc?.category || 'system').replace(/-/g, '_')
  const actionUrl = doc?.actionUrl || metadata?.actionUrl || (metadata?.postId ? `/app/feed?post=${encodeURIComponent(metadata.postId)}` : '')

  return {
    $id: String(doc?.$id || ''),
    userId: String(doc?.userId || ''),
    title,
    message,
    body: message,
    type,
    category: String(doc?.category || type),
    priority: String(doc?.priority || 'normal'),
    icon: doc?.icon,
    imageUrl: doc?.imageUrl,
    ctaLabel: doc?.actionText,
    ctaUrl: actionUrl,
    actionText: doc?.actionText,
    actionUrl,
    actorId: doc?.actorId,
    actorName: doc?.actorName,
    actorAvatar: doc?.actorAvatar,
    metadata,
    podId: metadata?.podId || doc?.podId,
    podName: metadata?.podName || doc?.podName,
    isRead: doc?.isRead ?? doc?.read ?? false,
    readAt: doc?.readAt,
    expiresAt: doc?.expiresAt,
    timestamp,
    createdAt: timestamp,
  }
}
