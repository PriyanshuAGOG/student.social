import { NextRequest } from 'next/server'
import { ApiError, requireUser } from '@/lib/api-security'
import { createAdminClient } from '@/lib/server/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CHAT_ROOMS_COLLECTION_ID = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const ATTACHMENTS_BUCKET_ID = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments'

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

export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { userId } = requireUser(request)
    const { fileId } = await context.params
    const roomId = request.nextUrl.searchParams.get('roomId') || ''
    if (!roomId || !fileId) throw new ApiError(400, 'INVALID_INPUT', 'Attachment link is incomplete')

    const { databases, storage } = createAdminClient()
    const room = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION_ID, roomId)
    if (!parseMembers(room).includes(userId)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this attachment')

    const [file, bytes] = await Promise.all([
      storage.getFile(ATTACHMENTS_BUCKET_ID, fileId),
      storage.getFileView(ATTACHMENTS_BUCKET_ID, fileId),
    ])
    return new Response(bytes, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Length': String(file.sizeOriginal || bytes.byteLength),
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name || 'attachment')}`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    if (error instanceof ApiError) return Response.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    if (error?.code === 404) return Response.json({ success: false, error: 'Attachment not found' }, { status: 404 })
    console.error('[messages/attachments/file] Read failed:', error)
    return Response.json({ success: false, error: 'Could not open this attachment' }, { status: 500 })
  }
}
