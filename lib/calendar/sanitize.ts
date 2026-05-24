export const stripHtml = (input = '') => input.replace(/<[^>]*>/g, ' ')
export const normalizeWhitespace = (input = '') => input.replace(/\s+/g, ' ').trim()

export function sanitizeTitle(input = ''): string {
  return normalizeWhitespace(stripHtml(input)).slice(0, 180)
}

export function sanitizeDescription(input = ''): string {
  return normalizeWhitespace(stripHtml(input)).slice(0, 2000)
}

export function sanitizeLocation(input = ''): string {
  return normalizeWhitespace(stripHtml(input)).slice(0, 200)
}

export function safeDeepLink(path = '', baseUrl = 'https://peerspark.app'): string {
  try {
    const url = new URL(path, baseUrl)
    const allowed = new URL(baseUrl)
    if (url.origin !== allowed.origin) return baseUrl
    return url.toString()
  } catch {
    return baseUrl
  }
}
