import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireVerifiedUser } from '@/lib/api-security'
import { createAdminClient, getDatabaseId } from '@/lib/server/appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { scanUploadMeta } from '@/lib/upload-security'

const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'
const AVATARS_BUCKET_ID = process.env.NEXT_PUBLIC_AVATARS_BUCKET_ID || 'avatars'
const APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ''
const MAX_AVATAR_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

function imageType(file: File): string {
  if (file.type) return file.type.toLowerCase()
  const extension = file.name.toLowerCase().split('.').pop()
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' } as Record<string, string>)[extension || ''] || ''
}

function avatarViewUrl(fileId: string): string {
  return `${APPWRITE_ENDPOINT.replace(/\/$/, '')}/storage/buckets/${encodeURIComponent(AVATARS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
}

function safeImageName(input: string): string {
  return (input || `avatar-${Date.now()}.png`).replace(/[\r\n\\/]/g, '-').slice(0, 140)
}

export async function POST(request: NextRequest) {
  let uploadedFileId = ''
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'profiles:avatar', max: 12, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) throw new ApiError(400, 'INVALID_INPUT', 'Select an image to upload')
    if (!ALLOWED_TYPES.has(imageType(file))) throw new ApiError(400, 'UNSUPPORTED_FILE_TYPE', 'Use a JPG, PNG, WebP, GIF, or AVIF image')
    if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Profile pictures must be smaller than 8 MB')
    const scan = scanUploadMeta(file)
    if (!scan.ok) throw new ApiError(400, 'INVALID_UPLOAD', scan.reason || 'This image cannot be uploaded')

    const { databases, storage } = createAdminClient()
    const databaseId = getDatabaseId()
    const profile = await databases.getDocument(databaseId, PROFILES_COLLECTION_ID, userId)
    const uploaded = await storage.createFile(
      AVATARS_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), safeImageName(file.name)),
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    )
    uploadedFileId = uploaded.$id
    const avatar = avatarViewUrl(uploaded.$id)

    await databases.updateDocument(databaseId, PROFILES_COLLECTION_ID, userId, {
      avatar,
      avatarFileId: uploaded.$id,
      updatedAt: new Date().toISOString(),
    })

    const previousFileId = String(profile.avatarFileId || '')
    if (previousFileId && previousFileId !== uploaded.$id) {
      await storage.deleteFile(AVATARS_BUCKET_ID, previousFileId).catch(() => undefined)
    }

    return NextResponse.json({ success: true, avatar, avatarFileId: uploaded.$id }, { status: 201 })
  } catch (error: any) {
    if (uploadedFileId) {
      const { storage } = createAdminClient()
      await storage.deleteFile(AVATARS_BUCKET_ID, uploadedFileId).catch(() => undefined)
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[profiles/avatar] Upload failed:', error)
    return NextResponse.json({ success: false, error: 'Could not update the profile picture' }, { status: 500 })
  }
}
