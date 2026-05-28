import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
const RESOURCES_BUCKET_ID = process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources'

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ success: true, documents: response.documents, total: response.total })
  } catch (error: any) {
    console.error('[API] Error listing resources:', error)
    return NextResponse.json({ error: 'Failed to list resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { databases, storage } = await createAdminClient()
    const form = await request.formData()
    const userId = request.headers.get('x-user-id') || String(form.get('userId') || '')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const title = String(form.get('title') || file.name)
    const description = String(form.get('description') || '')
    const podId = String(form.get('podId') || '')
    const visibility = String(form.get('visibility') || 'public')
    const tagsRaw = String(form.get('tags') || '[]')
    let tags: string[] = []
    try { tags = JSON.parse(tagsRaw) } catch { tags = [] }

    const upload = await storage.createFile(RESOURCES_BUCKET_ID, 'unique()', file)
    const fileUrl = storage.getFileView(RESOURCES_BUCKET_ID, upload.$id).toString()
    const now = new Date().toISOString()

    const resource = await databases.createDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, 'unique()', {
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
      downloads: 0,
      likes: 0,
      views: 0,
      likedBy: [],
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, resource })
  } catch (error: any) {
    console.error('[API] Error uploading resource:', error)
    return NextResponse.json({ error: 'Failed to upload resource' }, { status: 500 })
  }
}