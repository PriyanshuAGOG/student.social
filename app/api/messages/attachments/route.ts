import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { normalizeAppwriteEndpoint } from '@/lib/env'

const ATTACHMENTS_BUCKET_ID = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments'
const APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ''
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

function safeFileName(input: string): string {
  const fallback = `attachment-${Date.now()}`
  return (input || fallback).replace(/[\r\n]/g, ' ').replace(/[\\/]/g, '-').slice(0, 180) || fallback
}

function fileViewUrl(fileId: string): string {
  const endpoint = APPWRITE_ENDPOINT.replace(/\/$/, '')
  return `${endpoint}/storage/buckets/${encodeURIComponent(ATTACHMENTS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
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

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'messages:attachments', max: 40, windowMs: 60 * 1000 })

    const auth = requireUser(req)
    const formData = await req.formData().catch(() => null)
    const file = formData?.get('file')

    if (!(file instanceof File)) {
      throw new ApiError(400, 'INVALID_INPUT', 'A file is required')
    }

    if (file.size <= 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'The selected file is empty')
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Attachments must be 25MB or smaller')
    }

    const { storage } = await createAdminClient()
    const fileName = safeFileName(file.name)
    const uploaded = await storage.createFile(
      ATTACHMENTS_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), fileName),
      [
        Permission.read(Role.users()),
        Permission.update(Role.user(auth.userId)),
        Permission.delete(Role.user(auth.userId)),
      ],
    )

    return NextResponse.json({
      success: true,
      attachment: {
        fileId: uploaded.$id,
        fileUrl: fileViewUrl(uploaded.$id),
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
