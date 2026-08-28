import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { scanUploadMeta } from '@/lib/upload-security'

const ATTACHMENTS_BUCKET_ID = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments'
const APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ''
const MAX_POST_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_PREFIXES = ['image/', 'text/', 'video/']
const ALLOWED_TYPES = new Set(['application/pdf', 'application/json'])

function safeFileName(input: string): string {
  const fallback = `post-attachment-${Date.now()}`
  return (input || fallback).replace(/[\r\n]/g, ' ').replace(/[\\/]/g, '-').slice(0, 180) || fallback
}

function fileViewUrl(fileId: string): string {
  const endpoint = APPWRITE_ENDPOINT.replace(/\/$/, '')
  return `${endpoint}/storage/buckets/${encodeURIComponent(ATTACHMENTS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
}

function isAllowedFile(file: File): boolean {
  const type = (file.type || 'application/octet-stream').toLowerCase()
  return ALLOWED_PREFIXES.some((prefix) => type.startsWith(prefix)) || ALLOWED_TYPES.has(type)
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'posts:attachments', max: 24, windowMs: 60 * 1000 })
    const auth = requireUser(req)

    const formData = await req.formData().catch(() => null)
    const file = formData?.get('file')

    if (!(file instanceof File)) {
      throw new ApiError(400, 'INVALID_INPUT', 'A file is required')
    }
    if (file.size <= 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'The selected file is empty')
    }
    if (file.size > MAX_POST_ATTACHMENT_BYTES) {
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Post attachments must be 10MB or smaller')
    }
    if (!isAllowedFile(file)) {
      throw new ApiError(400, 'UNSUPPORTED_FILE_TYPE', 'Posts support images, videos, PDFs, JSON, and text/code files')
    }

    const scanned = scanUploadMeta({ name: file.name, type: file.type, size: file.size }, { maxBytes: MAX_POST_ATTACHMENT_BYTES })
    if (!scanned.ok) {
      throw new ApiError(400, 'UNSAFE_UPLOAD', `Rejected upload: ${scanned.reason}`)
    }

    const { storage } = await createAdminClient()
    const fileName = safeFileName(file.name)
    const uploaded = await storage.createFile(
      ATTACHMENTS_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), fileName),
      [
        Permission.read(Role.any()),
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
    console.error('[posts/attachments] Failed to upload post attachment:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload post attachment' }, { status: 500 })
  }
}
