import { EVENT_TITLE_PREFIX } from './constants'
import type { PrivacyMode } from './types'

export const escapeICSText = (v = '') => v.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n')
export const formatUTCDate = (d: string|Date) => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')
export const foldICSLine = (line: string) => line.length <= 75 ? line : `${line.slice(0,75)}\r\n ${line.slice(75)}`

export function formatTitle(eventType: string, title: string) {
  const p = EVENT_TITLE_PREFIX[eventType] || ''
  return p ? `${p} ${title}` : title
}

export function applyPrivacy(mode: PrivacyMode, title: string, description?: string, location?: string) {
  if (mode === 'busy_only') return { summary: 'Busy', description: 'Peerspark private event', location: '' }
  if (mode === 'minimal') return { summary: 'Peerspark Study Session', description: 'Open in Peerspark', location: 'Peerspark' }
  if (mode === 'title_only') return { summary: title, description: 'Open in Peerspark', location: '' }
  return { summary: title, description: description || '', location: location || '' }
}
