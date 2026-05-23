export function detectCalendarProvider(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase()
  if (ua.includes('google')) return 'Google Calendar'
  if (ua.includes('apple') || ua.includes('ical')) return 'Apple Calendar'
  if (ua.includes('outlook')) return 'Outlook'
  if (ua.includes('microsoft')) return 'Microsoft'
  if (ua.includes('samsung')) return 'Samsung Calendar'
  return 'Unknown'
}
