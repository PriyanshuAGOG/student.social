import crypto from 'crypto'
import { Account, Client, ID, Query } from 'node-appwrite'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, getCorrelationId, jsonError, parseJsonBody } from '@/lib/api-security'
import { getEnv, getSessionCookieSecret, normalizeAppwriteEndpoint } from '@/lib/env'
import { isAdminUser } from '@/lib/admin-access'
import { createSessionClient } from '@/lib/server/appwrite'

const env = getEnv()

export const ADMIN_COLLECTIONS = {
  roles: process.env.ADMIN_ROLES_COLLECTION_ID || 'admin_roles',
  auditLogs: process.env.ADMIN_AUDIT_LOGS_COLLECTION_ID || 'admin_audit_logs',
  sessions: process.env.ADMIN_SESSIONS_COLLECTION_ID || 'admin_sessions',
  contentReports: process.env.CONTENT_REPORTS_COLLECTION_ID || process.env.NEXT_PUBLIC_CONTENT_REPORTS_COLLECTION_ID || 'content_reports',
  moderationActions: process.env.MODERATION_ACTIONS_COLLECTION_ID || 'moderation_actions',
  clientErrors: process.env.CLIENT_ERRORS_COLLECTION_ID || 'client_errors',
  apiErrors: process.env.API_ERROR_EVENTS_COLLECTION_ID || 'api_error_events',
  systemHealth: process.env.SYSTEM_HEALTH_EVENTS_COLLECTION_ID || 'system_health_events',
  featureFlags: process.env.FEATURE_FLAGS_COLLECTION_ID || 'feature_flags',
  adminNotes: process.env.ADMIN_NOTES_COLLECTION_ID || 'admin_notes',
  supportTickets: process.env.SUPPORT_TICKETS_COLLECTION_ID || 'support_tickets',
  savedViews: process.env.ADMIN_SAVED_VIEWS_COLLECTION_ID || 'admin_saved_views',
  broadcasts: process.env.ADMIN_BROADCASTS_COLLECTION_ID || 'admin_broadcasts',
}

export const DATABASE_ID =
  env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  process.env.APPWRITE_DATABASE_ID ||
  process.env.NEXT_PUBLIC_DATABASE_ID ||
  'peerspark-main-db'

export type AdminRole = 'owner' | 'admin' | 'moderator' | 'support' | 'analyst' | 'readonly'
export type AdminPermission =
  | 'overview.read'
  | 'users.read'
  | 'users.write'
  | 'users.roles'
  | 'reports.review'
  | 'feed.moderate'
  | 'pods.moderate'
  | 'chat.review'
  | 'vault.moderate'
  | 'courses.manage'
  | 'notifications.manage'
  | 'analytics.read'
  | 'errors.manage'
  | 'system.manage'
  | 'security.read'
  | 'feature_flags.manage'
  | 'audit.read'

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: [
    'overview.read',
    'users.read',
    'users.write',
    'users.roles',
    'reports.review',
    'feed.moderate',
    'pods.moderate',
    'chat.review',
    'vault.moderate',
    'courses.manage',
    'notifications.manage',
    'analytics.read',
    'errors.manage',
    'system.manage',
    'security.read',
    'feature_flags.manage',
    'audit.read',
  ],
  admin: [
    'overview.read',
    'users.read',
    'users.write',
    'reports.review',
    'feed.moderate',
    'pods.moderate',
    'chat.review',
    'vault.moderate',
    'courses.manage',
    'notifications.manage',
    'analytics.read',
    'errors.manage',
    'security.read',
    'audit.read',
  ],
  moderator: ['overview.read', 'users.read', 'reports.review', 'feed.moderate', 'pods.moderate', 'chat.review', 'vault.moderate'],
  support: ['overview.read', 'users.read', 'reports.review', 'errors.manage', 'security.read'],
  analyst: ['overview.read', 'analytics.read', 'audit.read'],
  readonly: ['overview.read', 'analytics.read', 'audit.read'],
}

type SessionCookie = {
  secret?: string
  userId?: string
  sessionId?: string
  expire?: string
}

export type AdminContext = {
  userId: string
  email: string
  name?: string
  role: AdminRole
  permissions: AdminPermission[]
  correlationId: string
}

export type AdminRouteContext = {
  request: NextRequest
  admin: AdminContext
  correlationId: string
}

const adminActionSchema = z.object({
  action: z.string().min(1).max(80),
  targetId: z.string().min(1).max(255),
  targetType: z.string().min(1).max(80),
  reason: z.string().min(4).max(1000),
  metadata: z.record(z.unknown()).optional(),
})

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  for (const entry of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = entry.trim().split('=')
    if (rawName !== name) continue
    return decodeURIComponent(rawValueParts.join('='))
  }

  return null
}

function verifySessionCookie(request: Request): SessionCookie | null {
  const raw = getCookieValue(request, 'peerspark_session')
  if (!raw) return null

  const [encodedPayload, signature] = raw.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = crypto.createHmac('sha256', getSessionCookieSecret()).update(encodedPayload).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookie
  } catch {
    return null
  }
}

async function getAdminUserFromRequest(request: NextRequest) {
  const signedSession = verifySessionCookie(request)
  if (signedSession?.userId && (signedSession.secret || signedSession.sessionId)) {
    if (signedSession.secret) {
      const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT)
      const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
      if (!endpoint || !project) {
        throw new ApiError(500, 'ADMIN_AUTH_CONFIG_MISSING', 'Appwrite admin authentication is not configured')
      }

      const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(signedSession.secret)
      const account = new Account(sessionClient)
      const user = await account.get().catch(() => null)
      if (user && isAdminUser(user)) {
        return user
      }
    }

    if (signedSession.sessionId) {
      try {
        const { users } = createAdminClient()
        const userSessions = await users.listSessions(signedSession.userId, false).catch(() => null)
        const activeSession = userSessions?.sessions?.find((candidate: any) => candidate.$id === signedSession.sessionId)
        if (activeSession?.$id) {
          const user = await users.get(signedSession.userId).catch(() => null)
          if (user && isAdminUser(user)) {
            return user
          }
        }
      } catch {
        // Fall through to appwrite-session fallback.
      }
    }
  }

  const appwriteSession = request.cookies.get('appwrite-session')?.value
  if (!appwriteSession) return null

  try {
    const { account } = await createSessionClient(request)
    const user = await account.get().catch(() => null)
    if (user && isAdminUser(user)) {
      return user
    }
  } catch {
    return null
  }

  return null
}

function resolveRole(user: { email?: string | null; labels?: string[] | null }): AdminRole {
  const labels = Array.isArray(user.labels) ? user.labels : []
  const email = (user.email || '').trim().toLowerCase()
  const ownerEmails = [
    'chat.priyanshuag@gmail.com',
    ...(process.env.ADMIN_OWNER_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ]

  if (ownerEmails.includes(email) || labels.includes('owner') || labels.includes('super_admin')) return 'owner'
  if (labels.includes('moderator')) return 'moderator'
  if (labels.includes('support')) return 'support'
  if (labels.includes('analyst')) return 'analyst'
  if (labels.includes('readonly')) return 'readonly'
  return 'admin'
}

export function hasAdminPermission(admin: Pick<AdminContext, 'permissions'>, permission: AdminPermission) {
  return admin.permissions.includes(permission)
}

export async function requireAdmin(request: NextRequest, permission: AdminPermission): Promise<AdminContext> {
  const correlationId = getCorrelationId(request)
  const user = await getAdminUserFromRequest(request)
  if (!user) {
    throw new ApiError(401, 'ADMIN_AUTH_REQUIRED', 'Admin session cookie is required')
  }

  if (!isAdminUser(user)) {
    throw new ApiError(403, 'ADMIN_FORBIDDEN', 'Admin access is required')
  }

  const role = resolveRole(user)
  const permissions = rolePermissions[role]
  if (!permissions.includes(permission)) {
    throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', `Missing admin permission: ${permission}`)
  }

  return {
    userId: user.$id,
    email: user.email,
    name: user.name,
    role,
    permissions,
    correlationId,
  }
}

export function adminJson(data: unknown, correlationId: string, status = 200) {
  return NextResponse.json(
    { success: true, data, correlationId },
    { status, headers: { 'x-correlation-id': correlationId } },
  )
}

export function withAdminApi(permission: AdminPermission, handler: (context: AdminRouteContext) => Promise<Response>) {
  return async function adminRoute(request: NextRequest) {
    const correlationId = getCorrelationId(request)
    try {
      enforceSameOrigin(request)
      enforceRateLimit(request, { key: `admin:${permission}`, max: 120, windowMs: 60 * 1000 })
      const admin = await requireAdmin(request, permission)
      return handler({ request, admin, correlationId })
    } catch (error) {
      if (!(error instanceof ApiError)) {
        await writeApiError({
          route: new URL(request.url).pathname,
          method: request.method,
          message: error instanceof Error ? error.message : 'Unknown admin API error',
          stack: error instanceof Error ? error.stack : undefined,
          statusCode: 500,
          correlationId,
        })
      }
      return jsonError(error, correlationId)
    }
  }
}

export async function safeListDocuments(collectionId: string, queries: string[] = []) {
  try {
    const { databases } = await createAdminClient()
    return await databases.listDocuments(DATABASE_ID, collectionId, queries)
  } catch (error: any) {
    if (error?.code === 404 || String(error?.message || '').includes('could not be found')) {
      return { total: 0, documents: [] as any[] }
    }
    throw error
  }
}

export async function safeGetCount(collectionId: string, queries: string[] = []) {
  const result = await safeListDocuments(collectionId, [Query.limit(1), ...queries])
  return result.total || 0
}

export function redactUser(user: any, viewerRole: AdminRole) {
  const isPrivileged = viewerRole === 'owner' || viewerRole === 'admin' || viewerRole === 'support'
  return {
    id: user.$id,
    name: user.name || user.email?.split('@')[0] || 'User',
    email: isPrivileged ? user.email : maskEmail(user.email),
    status: user.status,
    labels: Array.isArray(user.labels) ? user.labels.filter((label: string) => !label.includes('secret')) : [],
    registration: user.registration,
    accessedAt: user.accessedAt,
    emailVerification: user.emailVerification,
    phoneVerification: user.phoneVerification,
  }
}

export function maskEmail(email?: string) {
  if (!email || !email.includes('@')) return 'redacted'
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}***@${domain}`
}

export async function writeAdminAudit(entry: {
  actorId: string
  actorEmail?: string
  action: string
  targetType: string
  targetId?: string
  reason?: string
  status?: 'success' | 'failure'
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
  correlationId: string
}) {
  const payload = {
    actorId: entry.actorId,
    actorEmail: entry.actorEmail || '',
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId || '',
    reason: entry.reason || '',
    status: entry.status || 'success',
    beforeJson: JSON.stringify(entry.before || {}).slice(0, 5000),
    afterJson: JSON.stringify(entry.after || {}).slice(0, 5000),
    correlationId: entry.correlationId,
    createdAt: new Date().toISOString(),
  }

  try {
    const { databases } = await createAdminClient()
    await databases.createDocument(DATABASE_ID, ADMIN_COLLECTIONS.auditLogs, ID.unique(), payload)
  } catch (error) {
    console.info(JSON.stringify({ type: 'admin_audit_fallback', ...payload }))
  }
}

export async function writeApiError(entry: {
  route: string
  method: string
  message: string
  stack?: string
  statusCode: number
  userId?: string
  correlationId: string
}) {
  const payload = {
    route: entry.route,
    method: entry.method,
    message: entry.message.slice(0, 1000),
    stack: (entry.stack || '').slice(0, 5000),
    statusCode: entry.statusCode,
    userId: entry.userId || '',
    fingerprint: crypto.createHash('sha256').update(`${entry.route}:${entry.message}`).digest('hex').slice(0, 32),
    status: 'open',
    ownerId: '',
    count: 1,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    correlationId: entry.correlationId,
  }

  try {
    const { databases } = await createAdminClient()
    await databases.createDocument(DATABASE_ID, ADMIN_COLLECTIONS.apiErrors, ID.unique(), payload)
  } catch {
    console.info(JSON.stringify({ type: 'api_error_fallback', ...payload }))
  }
}

export async function parseAdminAction(request: NextRequest) {
  return parseJsonBody(request, adminActionSchema, 1024 * 16)
}

export function statusFromAction(action: string) {
  if (action.includes('resolve') || action.includes('close')) return 'resolved'
  if (action.includes('hide') || action.includes('quarantine') || action.includes('freeze')) return 'actioned'
  if (action.includes('restore')) return 'restored'
  return 'reviewed'
}
