export const ADMIN_OWNER_EMAIL = 'chat.priyanshuag@gmail.com'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isOwnerEmail(email?: string | null): boolean {
  return normalizeEmail(email || '') === ADMIN_OWNER_EMAIL
}

export function isAdminUser(user: { email?: string | null; labels?: string[] | null } | null | undefined): boolean {
  if (!user) return false

  const email = user.email ? normalizeEmail(user.email) : ''
  if (!email) return false

  return email === ADMIN_OWNER_EMAIL
}
