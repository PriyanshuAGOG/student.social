import 'server-only'

type SessionSecurityEmail = {
  email: string
  name?: string | null
  sessionId: string
  ipAddress?: string | null
  userAgent?: string | null
  signedInAt?: Date
  method?: 'password' | 'google'
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

function describeDevice(userAgent = ''): string {
  const browser = /Edg\//i.test(userAgent) ? 'Microsoft Edge'
    : /Chrome\//i.test(userAgent) ? 'Chrome'
      : /Firefox\//i.test(userAgent) ? 'Firefox'
        : /Safari\//i.test(userAgent) ? 'Safari'
          : 'Web browser'
  const device = /Android/i.test(userAgent) ? 'Android device'
    : /iPhone|iPad/i.test(userAgent) ? 'Apple mobile device'
      : /Windows/i.test(userAgent) ? 'Windows computer'
        : /Mac OS/i.test(userAgent) ? 'Mac'
          : /Linux/i.test(userAgent) ? 'Linux device'
            : 'Unknown device'
  return `${browser} on ${device}`
}

export async function sendSessionSecurityEmail(details: SessionSecurityEmail) {
  if (process.env.DEVICE_LOGIN_NOTIFICATION_ENABLED === 'false') return { sent: false, disabled: true }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !details.email) return { sent: false, disabled: true }

  const signedInAt = details.signedInAt || new Date()
  const name = escapeHtml(details.name || 'there')
  const device = escapeHtml(describeDevice(details.userAgent || ''))
  const ipAddress = escapeHtml((details.ipAddress || 'Unavailable').split(',')[0].trim().slice(0, 80))
  const method = details.method === 'google' ? 'Google' : 'email and password'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app'
  const from = process.env.SECURITY_EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'Student.social Security <security@studentssocial.app>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `student-session-${details.sessionId}`.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [details.email],
      subject: 'A new Student.social session started',
      html: `<!doctype html><html><body style="margin:0;background:#eee8de;color:#292622;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:36px 20px"><div style="background:#2c2a27;color:#f7f0e6;border-radius:24px;padding:30px"><p style="margin:0 0 28px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#cbc1b4">Student.social security</p><h1 style="margin:0 0 14px;font-size:28px;line-height:1.15">New sign-in detected</h1><p style="margin:0 0 24px;line-height:1.6;color:#ded6cb">Hi ${name}, a new session was started using ${method}.</p><div style="border:1px solid #514d47;border-radius:16px;padding:18px;line-height:1.7"><b>${device}</b><br><span style="color:#bfb6aa">${escapeHtml(signedInAt.toISOString())}<br>IP address: ${ipAddress}</span></div><p style="margin:24px 0 0;line-height:1.6;color:#ded6cb">If this was you, no action is needed. If not, change your password and end unfamiliar sessions immediately.</p><a href="${escapeHtml(appUrl)}/app/settings" style="display:inline-block;margin-top:22px;padding:12px 18px;border-radius:999px;background:#f4eadc;color:#292622;text-decoration:none;font-weight:700">Review account security</a></div></div></body></html>`,
    }),
  })

  if (!response.ok) {
    const error = await response.text().catch(() => '')
    throw new Error(`Security email failed (${response.status}): ${error.slice(0, 200)}`)
  }
  return { sent: true, disabled: false }
}
