import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceSameOrigin, requireUser } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

function parseMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.filter(Boolean)
  if (typeof room?.members === 'string') {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function parseMetadata(message: any): Record<string, any> {
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
}

function stringifyMetadata(metadata: Record<string, any>) {
  return JSON.stringify(metadata || {}).slice(0, 5000)
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => String(entry))))
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isNotFound(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 404 || message.includes('not found') || message.includes('could not be found')
}

function internalError(message: string, error: any) {
  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' ? `${message}: ${error?.message || 'Unknown error'}` : message,
    },
    { status: 500 },
  )
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    enforceSameOrigin(req)
    const auth = requireUser(req)
    const { messageId } = await params
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!messageId || !action) {
      throw new ApiError(400, 'INVALID_INPUT', 'messageId and action are required')
    }

    if (!isValidUuid(messageId)) {
      throw new ApiError(400, 'INVALID_INPUT', 'messageId must be a valid UUID')
    }

    const { databases } = await createAdminClient()
    let message
    try {
      message = await databases.getDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId)
    } catch (error: any) {
      if (isNotFound(error)) {
        throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Message not found')
      }
      throw error
    }

    let room
    try {
      room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, message.roomId)
    } catch (error: any) {
      if (isNotFound(error)) {
        throw new ApiError(404, 'ROOM_NOT_FOUND', 'Room not found')
      }
      throw error
    }
    const members = parseMembers(room)

    if (!members.includes(auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation')
    }

    const now = new Date().toISOString()
    const metadata = parseMetadata(message)

    if (action === 'edit') {
      if (message.senderId !== auth.userId) {
        throw new ApiError(403, 'FORBIDDEN', 'Only the message author can edit this message')
      }
      if (!content) {
        throw new ApiError(400, 'INVALID_INPUT', 'content is required')
      }

      const updated = await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId, {
        content,
        isEdited: true,
        editedAt: now,
        editedBy: auth.userId,
      })

      return NextResponse.json({ success: true, message: updated })
    }

    if (action === 'delete') {
      if (message.senderId !== auth.userId) {
        throw new ApiError(403, 'FORBIDDEN', 'Only the message author can delete this message')
      }

      const updated = await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId, {
        content: '[deleted]',
        isEdited: true,
        deletedAt: now,
        deletedBy: auth.userId,
        deliveryState: 'deleted',
        editedAt: now,
        editedBy: auth.userId,
      })

      return NextResponse.json({ success: true, message: updated })
    }


    if (action === 'react') {
      const emoji = typeof body?.emoji === 'string' ? body.emoji.trim().slice(0, 16) : ''
      if (!emoji) {
        throw new ApiError(400, 'INVALID_INPUT', 'emoji is required')
      }

      const currentReactions = metadata.reactions && typeof metadata.reactions === 'object' ? metadata.reactions : {}
      const reactionUsers = uniqueStrings(currentReactions[emoji])
      const nextUsers = reactionUsers.includes(auth.userId)
        ? reactionUsers.filter((entry) => entry !== auth.userId)
        : [...reactionUsers, auth.userId]
      const nextReactions = { ...currentReactions }
      if (nextUsers.length > 0) {
        nextReactions[emoji] = nextUsers
      } else {
        delete nextReactions[emoji]
      }

      const nextMetadata = {
        ...metadata,
        reactions: nextReactions,
        reactedAt: now,
      }

      const updated = await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId, {
        metadata: stringifyMetadata(nextMetadata),
      })

      return NextResponse.json({ success: true, message: updated })
    }

    if (action === 'pin' || action === 'star') {
      const field = action === 'pin' ? 'pinnedBy' : 'starredBy'
      const arrayValues = uniqueStrings(metadata[field])
      const nextValues = arrayValues.includes(auth.userId)
        ? arrayValues.filter((entry) => entry !== auth.userId)
        : [...arrayValues, auth.userId]

      const nextMetadata = {
        ...metadata,
        [field]: nextValues,
        pinnedAt: action === 'pin' ? (nextValues.length > 0 ? now : null) : metadata.pinnedAt || null,
        starredAt: action === 'star' ? (nextValues.length > 0 ? now : null) : metadata.starredAt || null,
      }

      const updated = await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId, {
        metadata: stringifyMetadata(nextMetadata),
        pinnedAt: action === 'pin' ? (nextValues.length > 0 ? now : null) : message.pinnedAt || null,
        starredAt: action === 'star' ? (nextValues.length > 0 ? now : null) : message.starredAt || null,
      })

      return NextResponse.json({ success: true, message: updated })
    }

    throw new ApiError(400, 'INVALID_INPUT', `Unsupported action: ${action}`)
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[messages/[messageId] PATCH] Failed to mutate message:', error)
    return internalError('Failed to mutate message', error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    enforceSameOrigin(req)
    const auth = requireUser(req)
    const { messageId } = await params

    const { databases } = await createAdminClient()
    const message = await databases.getDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId)
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, message.roomId)
    const members = parseMembers(room)

    if (!members.includes(auth.userId)) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation')
    }

    if (message.senderId !== auth.userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the message author can delete this message')
    }

    const now = new Date().toISOString()
    const updated = await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId, {
      content: '[deleted]',
      isEdited: true,
      deletedAt: now,
      deletedBy: auth.userId,
      deliveryState: 'deleted',
      editedAt: now,
      editedBy: auth.userId,
    })

    return NextResponse.json({ success: true, message: updated })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Failed to delete message:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete message' }, { status: 500 })
  }
}
