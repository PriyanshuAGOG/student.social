export type ChatRoomType = 'direct' | 'pod' | 'group' | 'support' | 'system'
export type ChatMessageType = 'text' | 'image' | 'file' | 'voice' | 'system' | 'call_event'
export type ChatDeliveryState = 'draft' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted' | 'edited'

export interface NormalizedChatRoom {
  $id: string
  id: string
  type: ChatRoomType
  name: string
  avatar: string
  members: string[]
  participants: string[]
  admins: string[]
  podId?: string | null
  unreadCount: number
  lastMessage: string
  lastMessageTime: string
  lastMessageId?: string | null
  lastMessageSenderId?: string | null
  isOnline: boolean
  source: any
}

export interface NormalizedChatMessage {
  $id: string
  id: string
  roomId: string
  senderId: string
  authorId: string
  clientMessageId: string
  content: string
  type: ChatMessageType
  contentType: ChatMessageType
  deliveryState: ChatDeliveryState
  senderName: string
  authorName: string
  senderAvatar: string
  authorAvatar: string
  timestamp: string
  readBy: string[]
  replyTo: string | null
  replyToMessage?: NormalizedChatMessage | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  isEdited?: boolean
  editedAt?: string | null
  deletedAt?: string | null
  mentions: string[]
  metadata: Record<string, any>
  source: any
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
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

function normalizeMessageType(value: unknown): ChatMessageType {
  if (value === 'image' || value === 'file' || value === 'voice' || value === 'system' || value === 'call_event') {
    return value
  }
  return 'text'
}

function normalizeDeliveryState(value: unknown): ChatDeliveryState {
  if (
    value === 'draft' ||
    value === 'queued' ||
    value === 'sending' ||
    value === 'sent' ||
    value === 'delivered' ||
    value === 'read' ||
    value === 'failed' ||
    value === 'deleted' ||
    value === 'edited'
  ) {
    return value
  }
  return 'sent'
}

export function getChatRoomIdentity(room: Partial<NormalizedChatRoom> & { members?: string[]; participants?: string[]; podId?: string | null }) {
  if (room.type === 'pod' || room.podId) {
    return `pod:${room.podId || room.$id || room.id || ''}`
  }

  const participants = parseList(room.participants || room.members).sort()
  return participants.length > 0 ? `direct:${participants.join(':')}` : `direct:${room.$id || room.id || ''}`
}

export function normalizeChatRoom(room: any, currentUserId?: string): NormalizedChatRoom {
  const members = parseList(room?.members || room?.participants)
  const participants = members.length > 0 ? members : parseList(room?.participants)
  const otherUser = room?.otherUser || {}
  const type = room?.type === 'dm' ? 'direct' : (room?.type || (room?.podId ? 'pod' : 'direct'))
  const isDirect = type === 'direct'
  const name = room?.name || room?.displayName || room?.podName || otherUser?.name || room?.title || room?.$id || room?.id || 'Conversation'
  const avatar = room?.avatar || otherUser?.avatar || room?.image || room?.icon || '/placeholder.svg'
  const lastMessage = room?.lastMessage || room?.preview || room?.messagePreview || ''
  const lastMessageTime = room?.lastMessageTime || room?.updatedAt || room?.lastActivityAt || room?.createdAt || ''
  const lastMessageId = room?.lastMessageId || null
  const lastMessageSenderId = room?.lastMessageSenderId || room?.lastMessageSender || null

  return {
    $id: room?.$id || room?.id || room?.roomId || room?.podId || room?.name || '',
    id: room?.id || room?.$id || room?.roomId || room?.podId || room?.name || '',
    type,
    name: isDirect && otherUser?.name ? otherUser.name : name,
    avatar,
    members,
    participants: participants.length > 0 ? participants : members,
    admins: parseList(room?.admins),
    podId: room?.podId || null,
    unreadCount: Number(room?.unreadCount || room?.unread || 0),
    lastMessage,
    lastMessageTime,
    lastMessageId,
    lastMessageSenderId,
    isOnline: Boolean(room?.isOnline || otherUser?.isOnline),
    source: room,
  }
}

export function normalizeChatRooms(rooms: any[], currentUserId?: string): NormalizedChatRoom[] {
  const seen = new Set<string>()
  return rooms
    .map((room) => normalizeChatRoom(room, currentUserId))
    .filter((room) => {
      const identity = getChatRoomIdentity(room)
      if (seen.has(identity)) return false
      seen.add(identity)
      return true
    })
    .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
}

export function normalizeChatMessage(message: any): NormalizedChatMessage {
  const type = normalizeMessageType(message?.type || message?.contentType)
  const senderName = message?.senderName || message?.authorName || 'User'
  const senderAvatar = message?.senderAvatar || message?.authorAvatar || '/placeholder.svg'
  const timestamp = message?.timestamp || message?.$createdAt || new Date().toISOString()

  const metadata = (() => {
    if (typeof message?.metadata === 'object' && message?.metadata) return message.metadata
    if (typeof message?.metadata === 'string' && message.metadata.trim()) {
      try {
        const parsed = JSON.parse(message.metadata)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    }
    return {}
  })()

  return {
    $id: message?.$id || message?.id || message?.clientMessageId || `${message?.roomId || 'msg'}-${timestamp}`,
    id: message?.id || message?.$id || message?.clientMessageId || `${message?.roomId || 'msg'}-${timestamp}`,
    roomId: message?.roomId || '',
    senderId: message?.senderId || message?.authorId || '',
    authorId: message?.authorId || message?.senderId || '',
    clientMessageId: message?.clientMessageId || '',
    content: message?.content || '',
    type,
    contentType: normalizeMessageType(message?.contentType || type),
    deliveryState: normalizeDeliveryState(message?.deliveryState),
    senderName,
    authorName: senderName,
    senderAvatar,
    authorAvatar: senderAvatar,
    timestamp,
    readBy: parseList(message?.readBy),
    replyTo: message?.replyTo || null,
    replyToMessage: message?.replyToMessage || null,
    fileUrl: message?.fileUrl || null,
    fileName: message?.fileName || null,
    fileSize: typeof message?.fileSize === 'number' ? message.fileSize : null,
    isEdited: Boolean(message?.isEdited),
    editedAt: message?.editedAt || null,
    deletedAt: message?.deletedAt || null,
    mentions: parseList(message?.mentions),
    metadata,
    source: message,
  }
}

export function attachReplyTargets(messages: any[]): NormalizedChatMessage[] {
  const normalized = messages.map(normalizeChatMessage)
  const lookup = new Map(normalized.map((message) => [message.$id, message]))

  return normalized.map((message) => ({
    ...message,
    replyToMessage: message.replyTo ? lookup.get(message.replyTo) || message.replyToMessage || null : null,
  }))
}

export function formatChatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}
