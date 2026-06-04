export type UploadScanResult = { ok: boolean; reason?: string }

const BLOCKED_MIME_PREFIXES = ['application/x-msdownload', 'application/x-sh', 'application/x-bat']
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh']
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

export function scanUploadMeta(file: { name?: string; type?: string; size?: number }): UploadScanResult {
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  const size = file.size || 0

  if (size > MAX_FILE_SIZE_BYTES) return { ok: false, reason: 'file too large' }
  if (BLOCKED_MIME_PREFIXES.some((m) => type.startsWith(m))) return { ok: false, reason: 'blocked mime type' }
  if (BLOCKED_EXTENSIONS.some((ext) => name.endsWith(ext))) return { ok: false, reason: 'blocked extension' }
  return { ok: true }
}
