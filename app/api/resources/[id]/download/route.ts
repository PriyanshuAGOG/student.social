import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { ApiError, requireUser } from '@/lib/api-security'
import { canAccessResource } from '@/lib/server/resource-access'

const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireUser(request)
    const { databases } = await createAdminClient()
    const { id: resourceId } = await params
    const resource = await databases.getDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, resourceId)
    if (!(await canAccessResource(databases, userId, resource))) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource')
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

    return NextResponse.json({ success: true, url: `/api/resources/${encodeURIComponent(resourceId)}/file?download=1` })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error preparing resource download:', error)
    return NextResponse.json({ error: 'Failed to download resource' }, { status: 500 })
  }
}
