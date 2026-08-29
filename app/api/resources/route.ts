import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Query, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireVerifiedUser } from '@/lib/api-security'
import { scanUploadMeta } from '@/lib/upload-security'
import { canAccessResource } from '@/lib/server/resource-access'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
const RESOURCES_BUCKET_ID = process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources'

function inferCategory(fileType: string): string {
  const type = fileType.toLowerCase()
  if (type.startsWith('image/')) return 'images'
  if (type.startsWith('video/')) return 'videos'
  if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.startsWith('text/x-')) return 'code'
  if (type.includes('pdf') || type.includes('word') || type.startsWith('text/')) return 'notes'
  return 'other'
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireVerifiedUser(request)
    const { databases } = await createAdminClient()
    const params = request.nextUrl.searchParams
    const podId = params.get('podId')
    const visibility = params.get('visibility')
    const authorId = params.get('authorId')
    const search = params.get('search')
    const limit = parseInt(params.get('limit') || '50', 10)
    const offset = parseInt(params.get('offset') || '0', 10)

    const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(Math.min(limit, 100)), Query.offset(Math.max(offset, 0))]
    if (podId) queries.push(Query.equal('podId', podId))
    if (visibility) queries.push(Query.equal('visibility', visibility))
    if (authorId) queries.push(Query.equal('authorId', authorId))
    if (search) queries.push(Query.search('title', search))

    const response = await databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, queries)
    const access = await Promise.all(response.documents.map((resource) => canAccessResource(databases, userId, resource)))
    const documents = response.documents.filter((_, index) => access[index])
    return NextResponse.json({ success: true, documents, total: documents.length })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[API] Error listing resources:', error)
    return NextResponse.json({ error: 'Failed to list resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let uploadedFileId = ''
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'resources:upload', max: 20, windowMs: 60_000 })
    const { userId } = await requireVerifiedUser(request)
    const { databases, storage } = await createAdminClient()
    const form = await request.formData()

    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }
    const scan = scanUploadMeta(file, { maxBytes: 50 * 1024 * 1024 })
    if (!scan.ok) throw new ApiError(400, 'INVALID_UPLOAD', scan.reason || 'File is not allowed')

    const title = String(form.get('title') || file.name).trim().slice(0, 180)
    const description = String(form.get('description') || '').trim().slice(0, 2000)
    const podId = String(form.get('podId') || '')
    const requestedVisibility = String(form.get('visibility') || 'public')
    const visibility = ['public', 'private', 'pod'].includes(requestedVisibility) ? requestedVisibility : 'private'
    const tagsRaw = String(form.get('tags') || '[]')
    let tags: string[] = []
    try { tags = JSON.parse(tagsRaw) } catch { tags = [] }

    const readPermission = visibility === 'public' ? Permission.read(Role.any()) : visibility === 'pod' ? Permission.read(Role.users()) : Permission.read(Role.user(userId))
    const upload = await storage.createFile(
      RESOURCES_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), file.name.replace(/[\r\n\\/]/g, '-').slice(0, 180)),
      [
        readPermission,
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    )
    uploadedFileId = upload.$id
    const resourceId = ID.unique()
    const fileUrl = `/api/resources/${encodeURIComponent(resourceId)}/file`
    const now = new Date().toISOString()

    const resource = await databases.createDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId, {
      fileId: upload.$id,
      authorId: userId,
      title,
      description,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      podId,
      visibility,
      tags,
      category: inferCategory(file.type || ''),
      downloads: 0,
      likes: 0,
      views: 0,
      uploadedAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, resource })
  } catch (error: any) {
    if (uploadedFileId) {
      const { storage } = await createAdminClient()
      await storage.deleteFile(RESOURCES_BUCKET_ID, uploadedFileId).catch(() => undefined)
    }
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error uploading resource:', error)
    return NextResponse.json({ error: 'Failed to upload resource' }, { status: 500 })
  }
}
