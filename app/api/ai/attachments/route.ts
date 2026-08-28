import { NextRequest, NextResponse } from 'next/server'
import { ID, Permission, Role } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { createAdminClient } from '@/lib/server/appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { scanUploadMeta } from '@/lib/upload-security'

const ATTACHMENTS_BUCKET_ID = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments'
const APPWRITE_ENDPOINT = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || ''
const MAX_AI_ATTACHMENT_BYTES = 10 * 1024 * 1024

function fileViewUrl(fileId: string): string {
  return `${APPWRITE_ENDPOINT.replace(/\/$/, '')}/storage/buckets/${encodeURIComponent(ATTACHMENTS_BUCKET_ID)}/files/${encodeURIComponent(fileId)}/view?project=${encodeURIComponent(APPWRITE_PROJECT_ID)}`
}

function safeName(input: string): string {
  return (input || `ai-attachment-${Date.now()}`).replace(/[\r\n\\/]/g, '-').slice(0, 180)
}

async function extractAttachmentContext(file: File): Promise<string> {
  const type = (file.type || 'application/octet-stream').toLowerCase()
  const name = safeName(file.name)
  if (type.startsWith('text/') || type === 'application/json' || /\.(md|csv|json|js|ts|tsx|jsx|py|java|cpp|c|html|css)$/i.test(name)) {
    return (await file.text()).slice(0, 16_000)
  }

  const openAIKey = process.env.OPENAI_API_KEY || ''
  if (type.startsWith('audio/') && openAIKey) {
    const form = new FormData()
    form.append('file', file, name)
    form.append('model', 'whisper-1')
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAIKey}` },
      body: form,
    })
    if (response.ok) {
      const payload = await response.json().catch(() => null)
      if (payload?.text) return `Audio transcript:\n${String(payload.text).slice(0, 16_000)}`
    }
  }

  if (type.startsWith('image/') && openAIKey) {
    const encoded = Buffer.from(await file.arrayBuffer()).toString('base64')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAIKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this study attachment accurately. Extract visible text and identify the concepts, questions, or diagrams a tutor should help with.' },
            { type: 'image_url', image_url: { url: `data:${type};base64,${encoded}` } },
          ],
        }],
      }),
    })
    if (response.ok) {
      const payload = await response.json().catch(() => null)
      const description = payload?.choices?.[0]?.message?.content
      if (description) return `Image analysis:\n${String(description).slice(0, 16_000)}`
    }
  }

  return `Attached file: ${name} (${type}, ${(file.size / 1024 / 1024).toFixed(2)} MB). The file is uploaded, but automatic content extraction is unavailable for this format.`
}

export async function POST(request: NextRequest) {
  let uploadedFileId = ''
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'ai:attachments', max: 15, windowMs: 60_000 })
    const { userId } = requireUser(request)
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new ApiError(400, 'INVALID_INPUT', 'Choose a file for the AI tutor')
    if (file.size <= 0 || file.size > MAX_AI_ATTACHMENT_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'AI attachments must be 10 MB or smaller')
    const scan = scanUploadMeta(file, { maxBytes: MAX_AI_ATTACHMENT_BYTES })
    if (!scan.ok) throw new ApiError(400, 'INVALID_UPLOAD', scan.reason || 'This file cannot be uploaded')

    const extractedText = await extractAttachmentContext(file)
    const { storage } = createAdminClient()
    const name = safeName(file.name)
    const uploaded = await storage.createFile(
      ATTACHMENTS_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(Buffer.from(await file.arrayBuffer()), name),
      [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))],
    )
    uploadedFileId = uploaded.$id
    return NextResponse.json({
      success: true,
      attachment: {
        fileId: uploaded.$id,
        fileUrl: fileViewUrl(uploaded.$id),
        fileName: name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        extractedText,
      },
    }, { status: 201 })
  } catch (error: any) {
    if (uploadedFileId) {
      const { storage } = createAdminClient()
      await storage.deleteFile(ATTACHMENTS_BUCKET_ID, uploadedFileId).catch(() => undefined)
    }
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    console.error('[ai/attachments] Upload failed:', error)
    return NextResponse.json({ success: false, error: 'The AI tutor could not process this attachment' }, { status: 500 })
  }
}
