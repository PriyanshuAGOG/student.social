import 'server-only'

type CalendarReminderEmail = {
  email: string
  name?: string
  eventId: string
  title: string
  startTime: string
  location?: string
  reminderMinutes: number
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

function reminderLabel(minutes: number) {
  if (minutes === 0) return 'starting now'
  if (minutes === 1440) return 'starting tomorrow'
  if (minutes >= 60) return `starting in ${Math.round(minutes / 60)} hour${minutes === 60 ? '' : 's'}`
  return `starting in ${minutes} minutes`
}

export async function sendCalendarReminderEmail(details: CalendarReminderEmail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !details.email) return { sent: false, disabled: true }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app'
  const from = process.env.CALENDAR_EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'Student.social Calendar <calendar@studentssocial.app>'
  const start = new Date(details.startTime)
  const formattedStart = Number.isFinite(start.getTime())
    ? new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }).format(start)
    : details.startTime
  const label = reminderLabel(details.reminderMinutes)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `student-calendar-${details.eventId}-${details.reminderMinutes}`.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [details.email],
      subject: `${details.title} is ${label}`,
      html: `<!doctype html><html><body style="margin:0;background:#eef8f5;color:#172421;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:36px 20px"><div style="background:#14211f;color:#f4fffc;border-radius:24px;padding:30px"><p style="margin:0 0 24px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#72e5cf">Student.social calendar</p><h1 style="margin:0 0 12px;font-size:28px;line-height:1.18">${escapeHtml(details.title)}</h1><p style="margin:0 0 22px;color:#bdd0cb;line-height:1.6">Hi ${escapeHtml(details.name || 'there')}, this event is ${escapeHtml(label)}.</p><div style="border:1px solid #35514b;border-radius:16px;padding:18px;line-height:1.7"><b>${escapeHtml(formattedStart)} UTC</b>${details.location ? `<br><span style="color:#bdd0cb">${escapeHtml(details.location)}</span>` : ''}</div><a href="${escapeHtml(appUrl)}/app/calendar" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#72e5cf;color:#10201d;text-decoration:none;font-weight:700">Open calendar</a></div></div></body></html>`,
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => '')
    throw new Error(`Calendar reminder email failed (${response.status}): ${error.slice(0, 200)}`)
  }
  return { sent: true, disabled: false }
}
