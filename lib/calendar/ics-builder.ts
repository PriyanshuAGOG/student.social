import { applyPrivacy, escapeICSText, foldICSLine, formatTitle, formatUTCDate } from './formatters'
import { sanitizeDescription, sanitizeLocation, sanitizeTitle, safeDeepLink } from './sanitize'

export function buildCalendar({ feedSettings, events, generatedAt = new Date() }: { feedSettings: any; events: any[]; generatedAt?: Date }): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student.social//Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(feedSettings?.feedName || 'Student.social Calendar')}`,
    'X-WR-CALDESC:Your Student.social classes, study sessions, deadlines, and progress reviews.',
  ]

  for (const e of events) {
    const t = formatTitle(e.eventType, sanitizeTitle(e.title || 'Event'))
    const privacy = applyPrivacy(feedSettings?.privacyMode || 'full', t, sanitizeDescription(e.description || ''), sanitizeLocation(e.location || ''))
    const url = safeDeepLink(e.deepLinkPath || '/calendar')
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:ps_event_${e.recurringInstanceKey || e.$id || e.id}@peerspark.app`)
    lines.push(`DTSTAMP:${formatUTCDate(generatedAt)}`)
    lines.push(`CREATED:${formatUTCDate(e.createdAt || generatedAt)}`)
    lines.push(`LAST-MODIFIED:${formatUTCDate(e.updatedAt || generatedAt)}`)
    lines.push('SEQUENCE:1')
    lines.push(`STATUS:${e.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`)
    lines.push(foldICSLine(`SUMMARY:${escapeICSText(privacy.summary)}`))
    lines.push(foldICSLine(`DESCRIPTION:${escapeICSText(privacy.description || '')}`))
    lines.push(foldICSLine(`LOCATION:${escapeICSText(privacy.location || '')}`))
    lines.push(foldICSLine(`URL:${escapeICSText(url)}`))
    lines.push(`CATEGORIES:PEERSPARK,${String(e.eventType || 'CUSTOM').toUpperCase()}`)
    lines.push('CLASS:PRIVATE')
    lines.push(`TRANSP:${(e.transparency || 'opaque').toUpperCase()}`)
    lines.push(`DTSTART:${formatUTCDate(e.startAt)}`)
    lines.push(`DTEND:${formatUTCDate(e.endAt)}`)
    if (feedSettings?.includeReminders && Number.isFinite(feedSettings?.defaultReminderMinutes)) {
      lines.push('BEGIN:VALARM')
      lines.push('ACTION:DISPLAY')
      lines.push(foldICSLine(`DESCRIPTION:${escapeICSText(`Student.social reminder: ${sanitizeTitle(e.title || 'Event')}`)}`))
      lines.push(`TRIGGER:-PT${feedSettings.defaultReminderMinutes}M`)
      lines.push('END:VALARM')
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
