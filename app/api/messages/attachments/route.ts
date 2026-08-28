import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { scanUploadMeta } from '@/lib/upload-security'

const ATTACHMENTS_BUCKET_ID = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments'
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

function safeFileName(input: string): string {
  const fallback = `attachment-${Date.now()}`
  return (input || fallback).replace(/[\r\n]/g, ' ').replace(/[\\/]/g, '-').slice(0, 180) || fallback
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

function parseMembers(room: any): string[] {
  if (Array.isArray(room?.members)) return room.members.filter(Boolean).map(String)
  if (typeof room?.members === 'string') {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []
    } catch {
      return []
    }
  }
  return []
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'messages:attachments', max: 40, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const formData = await req.formData().catch(() => null)
    const file = formData?.get('file')
    const roomId = String(formData?.get('roomId') || '')

    if (!(file instanceof File)) {
      throw new ApiError(400, 'INVALID_INPUT', 'A file is required')
    }

    if (file.size <= 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'The selected file is empty')
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Attachments must be 25MB or smaller')
    }
    const scan = scanUploadMeta(file, { maxBytes: MAX_ATTACHMENT_BYTES })
    if (!scan.ok) throw new ApiError(400, 'INVALID_UPLOAD', scan.reason || 'This attachment cannot be uploaded')

    if (!roomId) throw new ApiError(400, 'INVALID_INPUT', 'Choose a conversation before attaching a file')
    const { databases, storage } = await createAdminClient()
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
    if (!parseMembers(room).includes(auth.userId)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this conversation')
    const fileName = safeFileName(file.name)
    const uploaded = await storage.createFile(
      ATTACHMENTS_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), fileName),
      [
        Permission.read(Role.user(auth.userId)),
        Permission.update(Role.user(auth.userId)),
        Permission.delete(Role.user(auth.userId)),
      ],
    )

    return NextResponse.json({
      success: true,
      attachment: {
        fileId: uploaded.$id,
        fileUrl: `/api/messages/attachments/${encodeURIComponent(uploaded.$id)}?roomId=${encodeURIComponent(roomId)}`,
        fileName,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[messages/attachments] Failed to upload attachment:', error)
    return internalError('Failed to upload attachment', error)
  }
}
