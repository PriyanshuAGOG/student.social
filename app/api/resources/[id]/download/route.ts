import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
const RESOURCES_BUCKET_ID = process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { databases, storage } = await createAdminClient()
    const { id: resourceId } = await params
    const resource = await databases.getDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId)
    const fileId = resource.fileId || resource.fileUrl?.split('/').pop()?.split('?')[0]
    if (!fileId) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    try {
      await databases.updateDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId, {
        downloads: (resource.downloads || 0) + 1,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      // Best effort only
    }

    return NextResponse.json({ success: true, url: storage.getFileDownload(RESOURCES_BUCKET_ID, fileId).toString() })
  } catch (error: any) {
    console.error('[API] Error preparing resource download:', error)
    return NextResponse.json({ error: 'Failed to download resource' }, { status: 500 })
  }
}