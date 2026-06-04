/**
 * Message Normalizer - Fixes all message payload bugs and standardizes field naming
 * Converts inconsistent message data structures into a uniform format
 */

export interface StandardizedMessage {
  $id: string
  roomId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'voice' | 'system'
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  replyTo?: string | null
  replyToMessage?: StandardizedMessage | null
  isEdited?: boolean
  editedAt?: string | null
  deletedAt?: string | null
  deliveryState: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  readBy?: string[]
  metadata?: {
    reactions?: Record<string, string[]>
    pinnedBy?: string[]
    starredBy?: string[]
  }
  clientMessageId?: string
}

/**
 * Detect message type from content and file extension
 */
function detectMessageType(content: string, fileUrl?: string, fileName?: string): StandardizedMessage['type'] {
  if (!fileUrl) return 'text'

  const fileExt = fileName?.toLowerCase().split('.').pop() || ''
  const fileUrlExt = fileUrl.toLowerCase().split('.').pop() || ''

  // Image extensions
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(fileExt) || /^(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(fileUrlExt)) {
    return 'image'
  }

  // Audio extensions
  if (/^(mp3|wav|m4a|aac|ogg|flac|wma)$/.test(fileExt) || /^(mp3|wav|m4a|aac|ogg|flac|wma)$/.test(fileUrlExt)) {
    return 'voice'
  }

  // Video extensions
  if (/^(mp4|webm|mov|avi|mkv|flv)$/.test(fileExt) || /^(mp4|webm|mov|avi|mkv|flv)$/.test(fileUrlExt)) {
    return 'file'
  }

  return 'file'
}

/**
 * Normalize a single message object
 */
export function normalizeMessage(raw: any, currentUserId?: string): StandardizedMessage {
  if (!raw) {
    throw new Error('Message is required')
  }

  // Extract file information from various possible field names
  let fileUrl = raw.fileUrl || raw.file_url || raw.attachment?.url || raw.attachment || null
  let fileName = raw.fileName || raw.file_name || raw.attachment?.name || null
  let fileSize = raw.fileSize || raw.file_size || raw.attachment?.size || null

  // Handle image field legacy naming
  if (raw.image && !fileUrl) {
    fileUrl = typeof raw.image === 'string' ? raw.image : raw.image.url
    fileName = raw.image.name || 'image'
  }

  // Sanitize fileUrl - remove if empty string
  if (fileUrl === '' || fileUrl === 'null' || fileUrl === null) {
    fileUrl = null
  }

  // Detect message type
  const messageType = raw.type || detectMessageType(raw.content || '', fileUrl || undefined, fileName || undefined)

  // Parse metadata and reactions
  let metadata: StandardizedMessage['metadata'] = {}
  if (raw.metadata) {
    if (typeof raw.metadata === 'string') {
      try {
        metadata = JSON.parse(raw.metadata)
      } catch {
        metadata = {}
      }
    } else {
      metadata = raw.metadata
    }
  }

  if (metadata && typeof metadata === 'object') {
    fileUrl = fileUrl || (metadata as any).fileUrl || (metadata as any).attachmentUrl || null
    fileName = fileName || (metadata as any).fileName || null
    fileSize = fileSize || (metadata as any).fileSize || null
  }

  // Handle emoji field (convert to reactions metadata)
  if (raw.emoji) {
    const emojiReactions: Record<string, string[]> = {}
    if (Array.isArray(raw.emoji)) {
      raw.emoji.forEach((e: any) => {
        const emoji = e.emoji || e
        const userId = e.userId || currentUserId || 'unknown'
        if (!emojiReactions[emoji]) emojiReactions[emoji] = []
        if (!emojiReactions[emoji].includes(userId)) {
          emojiReactions[emoji].push(userId)
        }
      })
    }
    metadata = { ...metadata, reactions: emojiReactions }
  }

  // Parse delivery state
  const deliveryState = parseDeliveryState(raw.deliveryState || raw.delivery_state || 'sent')

  // Parse timestamps
  const timestamp = raw.timestamp || raw.createdAt || raw.created_at || new Date().toISOString()
  const editedAt = raw.editedAt || raw.edited_at || null
  const deletedAt = raw.deletedAt || raw.deleted_at || null

  // Normalize room ID (handle 'dm' vs 'direct' naming)
  const roomId = raw.roomId || raw.room_id || raw.conversationId || raw.directMessageRoomId || ''

  // Normalize author info
  const authorId = raw.authorId || raw.author_id || raw.senderId || raw.sender_id || raw.userId || ''
  const authorName = raw.authorName || raw.author_name || raw.senderName || raw.sender_name || 'Unknown User'
  const authorAvatar = raw.authorAvatar || raw.author_avatar || raw.senderAvatar || raw.sender_avatar

  // Parse readBy field
  const readBy = parseList(raw.readBy || raw.read_by || [])

  return {
    $id: raw.$id || raw.id || `msg-${Date.now()}-${Math.random()}`,
    roomId,
    authorId,
    authorName,
    authorAvatar,
    content: (raw.content || raw.message || '').toString().trim(),
    timestamp,
    type: messageType,
    fileUrl: fileUrl ? String(fileUrl) : null,
    fileName: fileName ? String(fileName) : null,
    fileSize: typeof fileSize === 'number' ? fileSize : Number(fileSize) || null,
    replyTo: raw.replyTo || raw.reply_to || null,
    replyToMessage: raw.replyToMessage,
    isEdited: Boolean(raw.isEdited || raw.is_edited || editedAt),
    editedAt,
    deletedAt,
    deliveryState,
    readBy,
    metadata,
    clientMessageId: raw.clientMessageId || raw.client_message_id,
  }
}

/**
 * Normalize multiple messages
 */
export function normalizeMessages(raw: any[], currentUserId?: string): StandardizedMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((msg) => normalizeMessage(msg, currentUserId)).filter(Boolean)
}

/**
 * Parse delivery state with fallback
 */
function parseDeliveryState(value: any): StandardizedMessage['deliveryState'] {
  const state = String(value).toLowerCase().trim()
  if (['sending', 'sent', 'delivered', 'read', 'failed'].includes(state)) {
    return state as StandardizedMessage['deliveryState']
  }
  return 'sent'
}

/**
 * Parse list from various formats
 */
function parseList(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Validate message has required fields
 */
export function isValidMessage(message: any): boolean {
  return !!(message && message.$id && message.authorId && message.content !== undefined)
}

/**
 * Get standardized message payload for sending
 */
export function createMessagePayload(
  content: string,
  options?: {
    fileUrl?: string
    fileName?: string
    fileSize?: number
    replyTo?: string
    metadata?: any
  }
): Record<string, any> {
  return {
    content: content.trim(),
    type: options?.fileUrl ? detectMessageType(content, options.fileUrl, options.fileName) : 'text',
    fileUrl: options?.fileUrl || null,
    fileName: options?.fileName || null,
    fileSize: options?.fileSize || null,
    replyTo: options?.replyTo || null,
    deliveryState: 'sending',
    metadata: options?.metadata || {},
    timestamp: new Date().toISOString(),
  }
}
