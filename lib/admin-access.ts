import { getEnv } from './env'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function getAdminEmails(): string[] {
  const env = getEnv()
  return [
    'chat.priyanshuag@gmail.com',
    ...(env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => normalizeEmail(value))
      .filter(Boolean),
  ]
}

export function isAdminUser(user: { email?: string | null; labels?: string[] | null } | null | undefined): boolean {
  if (!user) return false

  const email = user.email ? normalizeEmail(user.email) : ''
  if (!email) return false

  const emailAllowed = getAdminEmails().includes(email)
  const labelAllowed = Array.isArray(user.labels) && user.labels.includes('admin')

  return emailAllowed || labelAllowed
}
