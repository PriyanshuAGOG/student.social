import { NextRequest } from 'next/server'
import { ApiError, requireUser } from '@/lib/api-security'
import { createAdminClient } from '@/lib/server/appwrite'
import { canAccessResource } from '@/lib/server/resource-access'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const RESOURCES_COLLECTION_ID = process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID || 'resources'
const RESOURCES_BUCKET_ID = process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = requireUser(request)
    const { id } = await context.params
    const { databases, storage } = createAdminClient()
    const resource = await databases.getDocument(DATABASE_ID, RESOURCES_COLLECTION_ID, id)
    if (!(await canAccessResource(databases, userId, resource))) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource')
    const fileId = String(resource.fileId || '')
    if (!fileId) throw new ApiError(404, 'NOT_FOUND', 'Resource file not found')
    const [file, bytes] = await Promise.all([
      storage.getFile(RESOURCES_BUCKET_ID, fileId),
      storage.getFileView(RESOURCES_BUCKET_ID, fileId),
    ])
    return new Response(bytes, {
      headers: {
        'Content-Type': file.mimeType || resource.fileType || 'application/octet-stream',
        'Content-Length': String(file.sizeOriginal || bytes.byteLength),
        'Content-Disposition': `${request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name || resource.fileName || 'resource')}`,
        'Cache-Control': resource.visibility === 'public' ? 'public, max-age=300' : 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    if (error instanceof ApiError) return Response.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    if (error?.code === 404) return Response.json({ success: false, error: 'Resource not found' }, { status: 404 })
    console.error('[resources/file] Read failed:', error)
    return Response.json({ success: false, error: 'Could not open this resource' }, { status: 500 })
  }
}
