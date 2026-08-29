import { AppwriteException, Client, Account, Databases, Storage, Teams, Avatars, Functions, Messaging, Query, Realtime } from "appwrite"
import { rankPodsForUser } from "./pod-matching"
import { getEnv, normalizeAppwriteEndpoint, requireEnv } from "./env"
import { callService } from "./appwrite/calls"
import { apiJson } from "./appwrite/http"
import { createProfileEnsureDeduper } from "./appwrite/profile-ensure-deduper"

export { callService }

// Debug function to log initialization (opt-in for dev only)
const debugLog = (message: string, data?: any) => {
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_APPWRITE_DEBUG === "true"
  ) {
    console.debug(`[Appwrite] ${message}`, data || "")
  }
}

// Internal helper to avoid noisy/sensitive logs in production
const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.debug(message, data ?? "")
  }
}

export function isAppwriteEmailVerified(user: any): boolean {
  return user?.emailVerification === true
    || user?.emailVerified === true
    || user?.status === 'verified'
    || user?.status === true
    || user?.status === 1
}

function isNoActiveSessionError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return error?.status === 401 || error?.code === 401 || message.includes('missing scope') || message.includes('unauthorized') || message.includes('guests')
}

function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Initialize Appwrite Client with your credentials
const env = getEnv()
const endpoint = normalizeAppwriteEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT) || "https://fra.cloud.appwrite.io/v1"
const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""

debugLog("Initializing with endpoint:", endpoint)
debugLog("Initializing with project:", projectId)

const client = new Client()
export { client }

if (endpoint) {
  client.setEndpoint(endpoint)
}

if (projectId) {
  client.setProject(projectId)
} else {
  console.error("[Appwrite] MISSING PROJECT ID - check NEXT_PUBLIC_APPWRITE_PROJECT_ID in Vercel")
}

debugLog("Client initialized successfully")

// Initialize Appwrite services with proper client
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const teams = new Teams(client)
export const avatars = new Avatars(client)
export const functions = new Functions(client)
export const messaging = new Messaging(client)
const realtime = new Realtime(client)
let realtimeIdentity: { userId: string; expiresAt: number } | null = null
let realtimeIdentityPromise: Promise<boolean> | null = null

export async function ensureRealtimeAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (realtimeIdentity && Date.now() < realtimeIdentity.expiresAt - 60_000) return true
  if (realtimeIdentityPromise) return realtimeIdentityPromise

  realtimeIdentityPromise = (async () => {
    const response = await fetch('/api/realtime/token', {
      credentials: 'include',
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.jwt || !payload?.userId) {
      throw new Error(payload?.error || 'Unable to authenticate live updates')
    }

    if (realtimeIdentity) await realtime.disconnect().catch(() => undefined)
    client.setJWT(payload.jwt)
    realtimeIdentity = {
      userId: String(payload.userId),
      expiresAt: new Date(payload.expiresAt || Date.now() + 55 * 60_000).getTime(),
    }
    return true
  })().catch((error) => {
    if (process.env.NODE_ENV === 'development') console.warn('Realtime authentication unavailable:', error)
    return false
  }).finally(() => {
    realtimeIdentityPromise = null
  })

  return realtimeIdentityPromise
}
const matchCache = new Map<string, { timestamp: number; data: any[] }>()
const MATCH_CACHE_TTL = 1000 * 60 * 5 // 5 minutes

async function fetchSessionUser(): Promise<any | null> {
  if (typeof window === 'undefined') return null

  try {
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.authenticated || !payload?.user) {
      return null
    }
    return payload.user
  } catch {
    return null
  }
}

// Verify Account service has methods
debugLog("Account service methods:", Object.keys(account).slice(0, 5))

// Database and Collection IDs - You'll need to create these in Appwrite
export const DATABASE_ID = getEnv().NEXT_PUBLIC_APPWRITE_DATABASE_ID || ""
export const COLLECTIONS = {
  PROFILES: "profiles",
  POSTS: "posts",
  COMMENTS: "comments",
  MESSAGES: "messages",
  CHAT_PRESENCE: "chat_presence",
  RESOURCES: "resources",
  NOTIFICATIONS: "notifications",
  PODS: "pods",
  CALENDAR_EVENTS: "calendar_events",
  CHAT_ROOMS: "chat_rooms",
  POD_COMMITMENTS: "pod_commitments",
  POD_CHECK_INS: "pod_check_ins",
  POD_RSVPS: "pod_rsvps",
  POD_MEETINGS: "pod_meetings",
  POD_WHITEBOARDS: "pod_whiteboards",
  POD_MEETING_PARTICIPANTS: "pod_meeting_participants",
  POD_COURSES: "pod_courses",
  CHALLENGES: "challenges",
}

// Storage Bucket IDs - You'll need to create these in Appwrite
export const BUCKETS = {
  AVATARS: "avatars",
  RESOURCES: "resources",
  ATTACHMENTS: "attachments",
  POST_IMAGES: "post_images",
}

// Authentication Functions
export const authService = {
  // Register new user
  async register(email: string, password: string, name: string) {
    try {
      // Prefer server proxy in browser to avoid CORS misconfiguration issues
      if (typeof window !== 'undefined') {
        const proxyResp = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
        const proxyData = await proxyResp.json().catch(() => ({}))
        if (!proxyResp.ok) {
          const detailedError = proxyData?.details?.errorMessage || proxyData?.details?.error || proxyData?.message || proxyData?.error || 'Registration failed'
          const codeSuffix = proxyData?.code ? ` (${proxyData.code})` : ''
          throw new Error(`${detailedError}${codeSuffix}`)
        }
        return { ...proxyData, verificationSent: false }
      }

      // Create user account (server/runtime path)
      let user: any = null
      if (account && typeof (account as any).create === 'function') {
        user = await account.create("unique()", email, password, name)
      } else {
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify({ email, password, name }),
          credentials: 'include',
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Registration failed')
        user = data
      }

      // Try to create a session to send verification email
      let sessionCreated = false
      try {
        if (account && typeof (account as any).createEmailPasswordSession === 'function') {
          await (account as any).createEmailPasswordSession(email, password)
          sessionCreated = true
        } else if (account && typeof (account as any).createEmailSession === 'function') {
          await (account as any).createEmailSession(email, password)
          sessionCreated = true
        } else {
          // REST fallback to create session cookie
          const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/sessions/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': projectId || '' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          })
          if (resp.ok) sessionCreated = true
        }
      } catch (sessionErr) {
        console.warn('Failed to create temporary session for verification:', sessionErr)
      }

      // Request verification email if session was created
      if (sessionCreated) {
        try {
          if (account && typeof (account as any).createVerification === 'function') {
            await (account as any).createVerification((getEnv().NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') + '/verify-email')
          } else {
            await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': projectId || '' },
              body: JSON.stringify({ url: ((getEnv().NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') + '/verify-email') }),
              credentials: 'include',
            })
          }
        } catch (verifyErr) {
          console.warn('Failed to request verification email:', verifyErr)
        }

        // Delete temporary session so user isn't auto-logged-in
        try {
          if (account && typeof (account as any).deleteSession === 'function') {
            await (account as any).deleteSession('current')
          } else {
            await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/sessions/current', {
              method: 'DELETE',
              headers: { 'X-Appwrite-Project': projectId || '' },
              credentials: 'include',
            })
          }
        } catch (delErr) {
          // Ignore - session might already be deleted or not exist
        }
      }

      // Create user profile in database
      try {
        devLog(`[register] Creating profile for user: ${user.$id}`)
        const suggestedUsername = normalizeUsername(name || email.split('@')[0] || user.$id) || `user_${user.$id.slice(0, 6)}`
        const profile = await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
          userId: user.$id,
          name: name,
          username: suggestedUsername,
          email: email,
          bio: "",
          interests: [],
          avatar: "",
          joinedAt: new Date().toISOString(),
          isOnline: false,
          studyStreak: 0,
          totalPoints: 0,
          level: 1,
          badges: [],
          learningGoals: [],
          learningPace: '',
          preferredSessionTypes: [],
          availability: [],
          currentFocusAreas: [],
        })
        devLog(`[register] Profile created successfully`, { id: profile.$id, name: profile.name })
      } catch (profileError: any) {
        // Profile creation might fail due to permissions - this is OK for now
        // The profile will be created on first login instead
        console.warn("[register] Profile creation failed - will be created on first login:", profileError?.message || profileError)
        console.error("[register] Full error:", profileError)
      }

      return user
    } catch (error: any) {
      console.error("Registration error:", error)
      throw new Error(error?.message || "Registration failed")
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      // First, check if there's already an active session and enforce verification on it.
      try {
        const currentUser = typeof window !== 'undefined' ? await fetchSessionUser() : await account.get()
        if (currentUser) {
          if (!isAppwriteEmailVerified(currentUser)) {
            try {
              await this.resendVerification(currentUser.$id || currentUser.email || email)
            } catch (verificationError) {
              console.warn('Failed to send verification reminder for active unverified session:', verificationError)
            }
            throw new Error('EMAIL_NOT_VERIFIED: Please verify your email address before signing in.')
          }
          devLog("User already has an active verified session")
          return { userId: currentUser.$id, $id: 'existing-session' }
        }
      } catch (e: any) {
        if (String(e?.message || '').includes('EMAIL_NOT_VERIFIED')) {
          throw e
        }
        // No active session, proceed with login
      }

      // Create new session (use SDK when available, otherwise fallback to REST)
      // Note: Don't delete existing session first - it causes 401 errors if no session exists
      if (typeof window !== 'undefined') {
        const proxyResp = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
        const proxyData = await proxyResp.json().catch(() => ({}))
        if (!proxyResp.ok) throw new Error(proxyData.error || 'Login failed')
        const sessionCheck = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }).catch(() => null)
        const sessionData = sessionCheck ? await sessionCheck.json().catch(() => null) : null
        return {
          session: { $id: proxyData.sessionId || sessionData?.user?.$id || 'proxy' },
          userId: sessionData?.user?.$id || proxyData.userId || null,
          user: sessionData?.user || (proxyData.userId ? { $id: proxyData.userId } : null),
          profile: null,
        }
      }

      let session: any = null
      if (account && typeof (account as any).createEmailPasswordSession === 'function') {
        session = await (account as any).createEmailPasswordSession(email, password)
      } else if (account && typeof (account as any).createEmailSession === 'function') {
        session = await (account as any).createEmailSession(email, password)
      } else {
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/sessions/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Login failed')
        session = data
      }

      // Get user info
      let user: any = null
      try {
        if (account && typeof (account as any).get === 'function') {
          user = await (account as any).get()
        } else {
          const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account', {
            method: 'GET',
            headers: { 'X-Appwrite-Project': projectId || '' },
            credentials: 'include',
          })
          user = await resp.json()
        }
      } catch (e) {
        console.warn('Failed to get user info:', e)
      }

      // Email verification is mandatory before app access.
      if (user) {
        const verified = isAppwriteEmailVerified(user)

        if (!verified) {
          try {
            await this.resendVerification(email)
          } catch (verificationError) {
            console.warn('Failed to send verification reminder during login:', verificationError)
          }
          try {
            await account.deleteSession('current')
          } catch (logoutError) {
            if (!isNoActiveSessionError(logoutError)) {
              console.warn('Failed to clear unverified session after login:', logoutError)
            }
          }
          throw new Error('EMAIL_NOT_VERIFIED: Please verify your email address before signing in. We sent you a fresh verification email.')
        }

        // Try to update profile status, create profile if it doesn't exist or lacks client permissions
        try {
          await ensureProfileViaApi(
            user.$id,
            { name: user.name || email.split('@')[0], email },
            { isOnline: true, lastSeen: new Date().toISOString() }
          )
          devLog(`[login] Ensured profile status for user: ${user.$id}`)
        } catch (profileError: any) {
          console.warn("[login] Server profile ensure failed, trying client status update:", profileError)
          try {
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
              isOnline: true,
              lastSeen: new Date().toISOString(),
            })
          } catch (clientProfileError) {
            console.warn("[login] Failed to update user status:", clientProfileError)
          }
        }
      }

      return session
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = error?.message || "Login failed"
      throw new Error(errorMessage.includes("Invalid") ? "Invalid email or password" : errorMessage)
    }
  },

  // Google OAuth login
  async loginWithOAuth(provider: string) {
    try {
      if (typeof window === "undefined") {
        throw new Error("OAuth login only works in browser")
      }

      const normalizedProvider = provider.toLowerCase()
      const supportedProviders = new Set(["google"])

      if (!supportedProviders.has(normalizedProvider)) {
        throw new Error(`Unsupported OAuth provider: ${provider}`)
      }

      window.location.href = `/oauth/start?provider=${encodeURIComponent(normalizedProvider)}`
      return null
    } catch (error: any) {
      console.error("OAuth login error:", error)
      throw new Error(error?.message || "OAuth login failed")
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      if (typeof window !== 'undefined') {
        return await fetchSessionUser()
      }

      return await account.get()
    } catch (error) {
      return null
    }
  },

  // Get current user profile
  async getCurrentUserProfile() {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        const payload = await response.json().catch(() => null)
        if (response.ok && payload?.profile) {
          return payload.profile
        }
        if (response.ok && payload?.user) {
          return {
            $id: payload.user.$id,
            userId: payload.user.$id,
            name: payload.user.name || '',
            email: payload.user.email || '',
          }
        }
        return null
      }

      const user = await account.get()
      if (!user) return null
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id)
    } catch (error) {
      console.error("Get current user profile error:", error)
      return null
    }
  },

  // Logout
  async logout() {
    try {
      const user = await this.getCurrentUser()

      // Update user offline status
      if (user) {
        try {
          if (typeof window !== 'undefined') {
            await ensureProfileViaApi(user.$id, {}, {
              isOnline: false,
              lastSeen: new Date().toISOString(),
            })
          } else {
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
              isOnline: false,
              lastSeen: new Date().toISOString(),
            })
          }
        } catch (updateError) {
          console.warn("Failed to update offline status:", updateError)
        }
      }

      if (typeof window !== 'undefined') {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch (e) {
          console.warn('Failed to clear local session cookie:', e)
        }
      }

      // Delete session only in server/runtime contexts where Appwrite is directly reachable
      if (typeof window !== 'undefined') {
        return { success: true }
      }

      return await account.deleteSession("current")
    } catch (error: any) {
      console.error("Logout error:", error)
      throw new Error(error?.message || "Logout failed")
    }
  },

  // Update user name
  async updateName(name: string) {
    try {
      return await account.updateName(name)
    } catch (error: any) {
      console.error("Update name error:", error)
      throw new Error(error?.message || "Failed to update name")
    }
  },

  // Update password (wrapper for consistency)
  async updatePassword(newPassword: string, oldPassword: string) {
    try {
      return await account.updatePassword(newPassword, oldPassword)
    } catch (error: any) {
      console.error("Update password error:", error)
      throw new Error(error?.message || "Failed to update password")
    }
  },

  // Change password (legacy alias)
  async changePassword(newPassword: string, oldPassword: string) {
    try {
      return await account.updatePassword(newPassword, oldPassword)
    } catch (error: any) {
      console.error("Change password error:", error)
      throw new Error(error?.message || "Failed to change password")
    }
  },

  // Update private application preferences stored in Appwrite account prefs
  async updatePrefs(prefs: Record<string, any>) {
    try {
      if (typeof (account as any).updatePrefs === 'function') {
        return await (account as any).updatePrefs(prefs)
      }

      const response = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/prefs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId || ''
        },
        body: JSON.stringify(prefs),
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Failed to update preferences')
      return data
    } catch (error: any) {
      console.error('Update prefs error:', error)
      throw new Error(error?.message || 'Failed to update preferences')
    }
  },

  // Update email address after confirming the current password
  async updateEmail(email: string, password: string) {
    try {
      if (typeof (account as any).updateEmail === 'function') {
        return await (account as any).updateEmail(email, password)
      }

      const response = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId || ''
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Failed to update email')
      return data
    } catch (error: any) {
      console.error('Update email error:', error)
      throw new Error(error?.message || 'Failed to update email')
    }
  },

  // Delete the current authenticated account
  async deleteAccount() {
    try {
      if (typeof (account as any).delete === 'function') {
        return await (account as any).delete()
      }

      const response = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account', {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': projectId || ''
        },
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Failed to delete account')
      return data
    } catch (error: any) {
      console.error('Delete account error:', error)
      throw new Error(error?.message || 'Failed to delete account')
    }
  },

  // Request password reset
  async requestPasswordReset(email: string) {
    try {
      if (typeof window !== 'undefined') {
        const resp = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data.error || 'Failed to request password reset')
        return data
      }

      if (account && typeof (account as any).createRecovery === 'function') {
        return await (account as any).createRecovery(
          email,
          `${((getEnv().NEXT_PUBLIC_APP_URL || '').endsWith('/') ? (getEnv().NEXT_PUBLIC_APP_URL || '').slice(0, -1) : (getEnv().NEXT_PUBLIC_APP_URL || ''))}/reset-password`
        )
      } else {
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/recovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify({
            email,
            url: `${((getEnv().NEXT_PUBLIC_APP_URL || '').endsWith('/') ? (getEnv().NEXT_PUBLIC_APP_URL || '').slice(0, -1) : (getEnv().NEXT_PUBLIC_APP_URL || ''))}/reset-password`,
          }),
          credentials: 'include',
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Failed to request password reset')
        return data
      }
    } catch (error: any) {
      console.error("Password reset request error:", error)
      throw new Error(error?.message || "Failed to request password reset")
    }
  },

  // Confirm password reset
  async confirmPasswordReset(userId: string, secret: string, newPassword: string, confirmPassword: string) {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (typeof window !== 'undefined') {
        const resp = await fetch('/api/auth/confirm-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, secret, password: newPassword, passwordAgain: confirmPassword }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data.error || 'Failed to reset password')
        return data
      }
      if (account && typeof (account as any).updateRecovery === 'function') {
        return await (account as any).updateRecovery(userId, secret, newPassword, confirmPassword)
      } else {
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/recovery', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify({ userId, secret, password: newPassword, passwordAgain: confirmPassword }),
          credentials: 'include',
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Failed to reset password')
        return data
      }
    } catch (error: any) {
      console.error("Password reset confirmation error:", error)
      throw new Error(error?.message || "Failed to reset password")
    }
  },

  // Confirm email verification from Appwrite verification link
  async confirmEmailVerification(userId: string, secret: string) {
    try {
      if (!userId || !secret) {
        throw new Error('Verification link is missing required parameters')
      }
      if (typeof window !== 'undefined') {
        const resp = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, secret }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) throw new Error(data.error || 'Failed to verify email')
        return data
      }
      if (account && typeof (account as any).updateVerification === 'function') {
        return await (account as any).updateVerification(userId, secret)
      }
      const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/verification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId || ''
        },
        body: JSON.stringify({ userId, secret }),
        credentials: 'include',
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data.message || 'Failed to verify email')
      return data
    } catch (error: any) {
      console.error('Email verification confirmation error:', error)
      throw new Error(error?.message || 'Failed to verify email')
    }
  },

  // Resend verification email (best-effort)
  async resendVerification(email?: string) {
    try {
      if (typeof window !== 'undefined') {
        const sessionResp = await fetch('/api/auth/session', { credentials: 'include' })
        const sessionPayload = await sessionResp.json().catch(() => null)
        const userId = sessionPayload?.user?.$id || sessionPayload?.userId || sessionPayload?.profile?.userId
        if (userId) {
          const resp = await fetch('/api/auth/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId }),
          })
          const data = await resp.json().catch(() => ({}))
          if (!resp.ok) throw new Error(data.error || 'Failed to resend verification')
          return data
        }
        throw new Error('No active session found to resend verification')
      }

      if (account && typeof (account as any).createVerification === 'function') {
        return await (account as any).createVerification((getEnv().NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') + '/verify-email')
      } else {
        const body: any = {
          url: `${((getEnv().NEXT_PUBLIC_APP_URL || '').endsWith('/') ? (getEnv().NEXT_PUBLIC_APP_URL || '').slice(0, -1) : (getEnv().NEXT_PUBLIC_APP_URL || ''))}/verify-email`,
        }
        if (email) body.email = email
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify(body),
          credentials: 'include',
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Failed to resend verification')
        return data
      }
    } catch (error: any) {
      console.error('Resend verification error:', error)
      throw new Error(error?.message || 'Failed to resend verification')
    }
  },
}


async function ensureProfileViaApi(userId: string, defaults: Record<string, unknown> = {}, updates?: Record<string, unknown>) {
  const response = await fetch('/api/profiles/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, defaults, updates }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Failed to ensure profile')
  }

  return payload.profile
}

const profileEnsureDeduper = createProfileEnsureDeduper<any>()

async function fetchOwnSessionProfile(userId: string) {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.profile?.$id !== userId) return null
  return payload.profile
}

// Profile Functions
export const profileService = {
  /**
   * Ensure a profile exists for the user. Creates one if missing.
   * This is the primary way to guarantee profile existence.
   */
  async ensureProfileExists(userId: string, defaults: {
    name?: string
    email?: string
  } = {}): Promise<any> {
    return profileEnsureDeduper.ensure(userId, async () => {
      try {
        const profile = await ensureProfileViaApi(userId, defaults)
        devLog(`[ensureProfileExists] Profile ensured via API`, { id: profile.$id })
        return profile
      } catch (apiError: any) {
        // Do not retry the mutation endpoint or fall back to a client-side
        // create. The server route is the sole authenticated write path.
        const existing = await fetchOwnSessionProfile(userId).catch(() => null)
        if (existing) {
          devLog(`[ensureProfileExists] Reused profile from authenticated session`, { id: existing.$id })
          return existing
        }

        console.warn(`[ensureProfileExists] Server profile ensure failed:`, apiError)
        throw apiError
      }
    })
  },

  // Get user profile (returns null if not found, use ensureProfileExists for guaranteed profile)
  async getProfile(userId: string) {
    try {
      devLog(`[getProfile] Attempting to fetch profile for user: ${userId}`)
      const sessionResponse = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }).catch(() => null)
      const sessionPayload = sessionResponse ? await sessionResponse.json().catch(() => null) : null
      const profile = sessionPayload?.profile?.$id === userId
        ? sessionPayload.profile
        : (await apiJson(`/api/profiles/list?userId=${encodeURIComponent(userId)}`)).profile
      if (!profile?.$id) return null
      devLog(`[getProfile] Successfully fetched profile`, {
        userId: profile.$id,
        name: profile.name,
      })
      return profile
    } catch (error: any) {
      // Profile not found is expected for new users
      if ((error instanceof AppwriteException && error.code === 404) || error?.code === 404 || error?.message?.includes('not found')) {
        console.warn(`[getProfile] Profile not found for user: ${userId}. Use ensureProfileExists() to create one.`)
        return null
      }
      console.error(`[getProfile] Error fetching profile for user ${userId}:`, error)
      return null
    }
  },

  // Get profile by username (search by name with underscores converted to spaces)
  async getProfileByUsername(username: string) {
    try {
      const normalizedUsername = normalizeUsername(username)
      
      const result = await this.getAllProfiles(200, 0)
      
      // Filter results to find matching name (case-insensitive)
      const matchingProfile = result.documents.find((profile: any) => {
        const profileName = (profile.name || "").toLowerCase()
         const profileUsername = normalizeUsername(profile.username || profileName)
         const nameUsername = normalizeUsername(profileName)
         const emailUsername = normalizeUsername(profile.email?.split("@")[0] || "")
         return profileUsername === normalizedUsername || 
           nameUsername === normalizedUsername ||
           emailUsername === normalizedUsername
      })
      
      return matchingProfile || null
    } catch (error) {
      console.error("Get profile by username error:", error)
      return null
    }
  },

  // Update user profile (create if doesn't exist)
  async updateProfile(userId: string, data: any) {
    const safeAttributes = ['name', 'username', 'bio', 'location', 'website', 'avatar', 'email', 'isOnline', 'studyStreak', 'totalPoints', 'level', 'badges', 'avatarFileId']
    const optionalAttributes = [
      'interests',
      'identity',
      'vibes',
      'learningGoals',
      'learningPace',
      'preferredSessionTypes',
      'availability',
      'currentFocusAreas',
    ]
    
    const filterData = (d: any, includeOptional: boolean) => {
      const attrs = includeOptional ? [...safeAttributes, ...optionalAttributes] : safeAttributes
      const result: any = {}
      attrs.forEach(attr => {
        if (attr in d) {
          result[attr] = d[attr]
        }
      })
      return result
    }

    try {
      // First try to update with all attributes
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
        ...filterData(data, true),
        updatedAt: new Date().toISOString(),
      })
    } catch (error: any) {
      // If unknown attribute error, retry without optional attributes
      if (error?.message?.includes('Unknown attribute')) {
        console.warn(`Unknown attribute in update, retrying without optional attrs:`, error.message)
        try {
          return await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
            ...filterData(data, false),
            updatedAt: new Date().toISOString(),
          })
        } catch (retryError) {
          console.error("Update profile error after retry:", retryError)
          throw retryError
        }
      }
      // If document not found, create it instead
      if (error?.code === 404 || error?.code === 401 || error?.message?.includes('not found') || error?.message?.includes('missing scope') || error?.message?.includes('permissions')) {
        console.warn("Profile missing or not writable, ensuring profile via API:", userId)
        try {
          return await ensureProfileViaApi(
            userId,
            { name: data.name || "", email: data.email || "" },
            filterData(data, true)
          )
        } catch (apiError) {
          console.warn("Server profile creation failed, trying client fallback:", apiError)
          try {
            return await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
              userId: userId,
              name: data.name || "",
              username: data.username || normalizeUsername(data.name || data.email || userId) || `user_${userId.slice(0, 6)}`,
              email: data.email || "",
              bio: data.bio || "",
              location: data.location || "",
              website: data.website || "",
              avatar: data.avatar || "",
              joinedAt: new Date().toISOString(),
              isOnline: true,
              studyStreak: 0,
              totalPoints: 0,
              level: 1,
              badges: [],
              ...filterData(data, false),
              updatedAt: new Date().toISOString(),
            })
          } catch (createError) {
            console.error("Failed to create profile:", createError)
            throw createError
          }
        }
      }
      console.error("Update profile error:", error)
      throw error
    }
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string) {
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/profiles/avatar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-user-id': userId },
        body: form,
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.avatar) {
        throw new Error(payload?.error || 'Could not update the profile picture')
      }
      return String(payload.avatar)
    } catch (error) {
      console.error("Upload avatar error:", error)
      throw error
    }
  },

  // Get all profiles (for search, leaderboard, etc.)
  async getAllProfiles(limit = 50, offset = 0) {
    try {
      const response = await apiJson(`/api/profiles/list?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return { documents: response.profiles || [], total: response.total || 0 }
    } catch (error) {
      if (!isNoActiveSessionError(error)) console.error("Get all profiles error:", error)
      throw error
    }
  },

  // Follow a user - creates two-way relationship
  async followUser(followerId: string, followingId: string) {
    try {
      if (!followerId || !followingId) {
        throw new Error("Both user IDs are required")
      }

      if (followerId === followingId) {
        throw new Error("You cannot follow yourself")
      }

      const followerProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId)
      const followingProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId)

      const following = Array.isArray(followerProfile.following) ? followerProfile.following : []
      if (following.includes(followingId)) {
        return { success: true, message: "Already following" }
      }

      const newFollowing = [...following, followingId]
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      })

      const followers = Array.isArray(followingProfile.followers) ? followingProfile.followers : []
      const newFollowers = [...followers, followerId]
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId, {
        followers: newFollowers,
        followerCount: newFollowers.length,
      })

      // Create notification (standardized fields)
      try {
        await notificationService.createNotification(
          followingId,
          "New Follower",
          `${followerProfile.name} started following you`,
          "follow",
          {
            actorId: followerId,
            actorName: followerProfile.name,
            actorAvatar: followerProfile.avatar,
          }
        )
      } catch (e) {
        console.error("Failed to create follow notification:", e)
      }

      return { success: true }
    } catch (error) {
      console.error("Follow user error:", error)
      throw error
    }
  },

  // Unfollow a user - removes two-way relationship
  async unfollowUser(followerId: string, followingId: string) {
    try {
      if (!followerId || !followingId) {
        throw new Error("Both user IDs are required")
      }

      const followerProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId)
      const followingProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId)

      const following = Array.isArray(followerProfile.following) ? followerProfile.following : []
      const newFollowing = following.filter((id: string) => id !== followingId)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      })

      const followers = Array.isArray(followingProfile.followers) ? followingProfile.followers : []
      const newFollowers = followers.filter((id: string) => id !== followerId)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId, {
        followers: newFollowers,
        followerCount: newFollowers.length,
      })

      return { success: true }
    } catch (error) {
      console.error("Unfollow user error:", error)
      throw error
    }
  },

  // Check if user follows another
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId)
      const following = Array.isArray(profile.following) ? profile.following : []
      return following.includes(followingId)
    } catch (error) {
      const message = String((error as any)?.message || '').toLowerCase()
      if (!(message.includes('could not be found') || message.includes('not found'))) {
        console.error("Check following error:", error)
      }
      return false
    }
  },
}

// Pod/Team Functions
export const podService = {
  /**
   * Create a new pod - DATABASE ONLY (no Teams dependency)
   */
  async createPod(name: string, description: string, userId: string, metadata: any = {}) {
    try {
      if (!userId || !userId.trim()) {
        throw new Error("User ID is required")
      }

      if (!name || !name.trim()) {
        throw new Error("Pod name is required")
      }

      if (name.length > 100) {
        throw new Error("Pod name too long (max 100 characters)")
      }

      if (!metadata?.image) {
        const safeMetadata = {
          ...metadata,
          tags: Array.isArray(metadata?.tags) ? metadata.tags.filter((tag: unknown) => typeof tag === 'string').slice(0, 20) : [],
          maxMembers: Number.isFinite(Number(metadata?.maxMembers)) ? Math.max(2, Math.min(500, Number(metadata.maxMembers))) : undefined,
        }

        const response = await apiJson('/api/pods', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description: description || '',
            userId,
            metadata: safeMetadata,
          }),
        })

        return { pod: response.pod }
      }

      // Upload pod image if provided
      let imageUrl = ""
      try {
        const response = await storage.createFile(BUCKETS.POST_IMAGES, "unique()", metadata.image)
        imageUrl = storage.getFileView(BUCKETS.POST_IMAGES, response.$id).toString()
      } catch (e) {
        console.error("Failed to upload pod image:", e)
      }

      // Generate a unique teamId (required by schema, but we're not using Appwrite Teams)
      const generatedTeamId = `pod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Create the pod document (database-only, no Teams)
      const pod = await databases.createDocument(DATABASE_ID, COLLECTIONS.PODS, "unique()", {
        teamId: generatedTeamId,
        name: name.trim(),
        description: description || "",
        creatorId: userId,
        members: [userId],
        memberCount: 1,
        image: imageUrl,
        category: metadata.category || metadata.subject || "general",
        isPrivate: metadata.isPrivate || false,
        isActive: true,
        isPublic: metadata.isPublic !== false,
        subject: metadata.subject || "",
        difficulty: metadata.difficulty || "Beginner",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return { pod }
    } catch (error) {
      console.error("Create pod error:", error)
      throw error
    }
  },

  /**
   * Join a pod - FIXED with proper member count and chat room
   */
  async joinPod(podId: string, userId: string, userEmail?: string) {
    try {
      if (!podId || !userId) {
        throw new Error("Pod ID and User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Check if already a member
      const members = Array.isArray(pod.members) ? pod.members : []
      if (members.includes(userId)) {
        return {
          success: true,
          alreadyMember: true,
          message: "Already a member",
          memberCount: members.length,
          members: members,
          pod: pod,
        }
      }

      // Add user to members
      const updatedMembers = [...members, userId]

      // Update pod with new members
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: new Date().toISOString(),
      })

      // VERIFICATION STEP: Re-fetch to ensure count is correct
      const verified = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      const verifiedMembers = Array.isArray(verified.members) ? verified.members : []

      // Add user to pod's chat room
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId),
        ])

        let chatRoomId = ""

        if (chatRooms.documents.length > 0) {
          const chatRoom = chatRooms.documents[0]
          const chatMembers = Array.isArray(chatRoom.members) ? chatRoom.members : []
          chatRoomId = chatRoom.$id

          if (!chatMembers.includes(userId)) {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.CHAT_ROOMS,
              chatRoom.$id,
              {
                members: [...chatMembers, userId],
              }
            )
          }

          // Drop a lightweight system message into the pod chat
          try {
            const joinerProfile = await profileService.getProfile(userId)
            const joinerName = joinerProfile?.name || "New member"
            await databases.createDocument(DATABASE_ID, COLLECTIONS.MESSAGES, "unique()", {
              roomId: chatRoomId,
              senderId: "system",
              authorId: "system",
              senderName: "System",
              senderAvatar: "",
              content: `${joinerName} joined the pod`,
              timestamp: new Date().toISOString(),
              readBy: [],
              isEdited: false,
            })
          } catch (messageErr) {
            console.error("Failed to record join message:", messageErr)
          }
        }
      } catch (e) {
        console.error("Failed to add user to chat room:", e)
      }

      // Create notification for pod creator
      try {
        if (pod.creatorId !== userId) {
          const userProfile = await profileService.getProfile(userId)
          await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
            userId: pod.creatorId,
            type: "pod_join",
            actor: userId,
            actorName: userProfile?.name || "Someone",
            message: `${userProfile?.name || "Someone"} joined your pod: ${pod.name}`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error("Failed to create notification:", e)
      }

      return {
        success: true,
        memberCount: verifiedMembers.length,
        members: verifiedMembers,
        pod: updated,
      }
    } catch (error: any) {
      console.error("Join pod error:", error)
      throw new Error(error?.message || "Failed to join pod")
    }
  },

  // Generate shareable invite link for a pod
  generateInviteLink(podId: string) {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const inviteCode = btoa(`pod:${podId}:${Date.now()}`).replace(/=/g, '')
    return `${baseUrl}/app/pods/join?invite=${inviteCode}&pod=${podId}`
  },

  // Parse invite link and extract pod ID
  parseInviteLink(inviteUrl: string): string | null {
    try {
      const url = new URL(inviteUrl)
      const podId = url.searchParams.get('pod')
      return podId
    } catch {
      return null
    }
  },

  // Add member to pod by email (for pod owners/admins)
  async addMemberByEmail(podId: string, email: string, inviterId: string) {
    try {
      // Find user by email using proper query
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [
          Query.equal("email", email),
          Query.limit(1)
        ]
      )
      
      if (!profiles.documents || profiles.documents.length === 0) {
        throw new Error("No user found with this email address")
      }

      const targetProfile = profiles.documents[0]

      // Join the pod
      return await this.joinPod(podId, targetProfile.$id, email)
    } catch (error: any) {
      console.error("Add member by email error:", error)
      throw new Error(error?.message || "Failed to add member")
    }
  },

  /**
   * Leave a pod
   */
  async leavePod(podId: string, userId: string) {
    try {
      if (!podId || !userId) {
        throw new Error("Pod ID and User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      const members = Array.isArray(pod.members) ? pod.members : []
      if (!members.includes(userId)) {
        throw new Error("User is not a member of this pod")
      }

      // Remove user from members
      const updatedMembers = members.filter((id: string) => id !== userId)

      // Update pod
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        updatedAt: new Date().toISOString(),
      })

      // Remove user from pod's chat room
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId),
        ])

        if (chatRooms.documents.length > 0) {
          const chatRoom = chatRooms.documents[0]
          const chatMembers = Array.isArray(chatRoom.members) ? chatRoom.members : []

          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CHAT_ROOMS,
            chatRoom.$id,
            {
              members: chatMembers.filter((id: string) => id !== userId),
            }
          )
        }
      } catch (e) {
        console.error("Failed to remove user from chat room:", e)
      }

      return { success: true, memberCount: updatedMembers.length }
    } catch (error) {
      console.error("Leave pod error:", error)
      throw error
    }
  },

  /**
   * Get user's pods with pagination
   */
  async getUserPods(userId: string, limit = 50, offset = 0) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const response = await apiJson(`/api/pods?myPods=true&userId=${encodeURIComponent(userId)}&limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return { documents: response.documents || response.pods || [], total: response.total || 0 }
    } catch (error) {
      console.error("Get user pods error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get all pods with filters and pagination
   */
  async getAllPods(limit = 50, offset = 0, filters: any = {}) {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })

      if (filters.isPublic !== undefined) params.set('isPublic', String(filters.isPublic))
      if (filters.subject) params.set('subject', String(filters.subject))
      if (filters.difficulty) params.set('difficulty', String(filters.difficulty))
      if (filters.search) params.set('search', String(filters.search))

      const response = await apiJson(`/api/pods?${params.toString()}`)
      return { documents: response.documents || response.pods || [], total: response.total || 0 }
    } catch (error) {
      console.error("Get all pods error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get pod details by ID
   */
  async getPodDetails(podId: string) {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}`)
      return response.pod || response.data || response
    } catch (error) {
      console.error("Get pod details error:", error)
      throw error
    }
  },

  /**
   * Update pod information
   */
  async updatePod(podId: string, updates: { name?: string; description?: string; image?: File }) {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      }

      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          throw new Error("Pod name cannot be empty")
        }
        updateData.name = updates.name.trim()
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description
      }

      if (updates.image) {
        const response = await storage.createFile(BUCKETS.POST_IMAGES, "unique()", updates.image)
        updateData.image = storage.getFileView(BUCKETS.POST_IMAGES, response.$id).toString()
      }

      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, updateData)
      return updated
    } catch (error) {
      console.error("Update pod error:", error)
      throw error
    }
  },

  /**
   * Delete a pod (creator only)
   */
  async deletePod(podId: string, userId: string) {
    try {
      if (!podId || !userId) {
        throw new Error("Pod ID and User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Verify user is creator
      if (pod.creatorId !== userId) {
        throw new Error("Only the pod creator can delete this pod")
      }

      // Delete pod image if exists
      if (pod.image) {
        try {
          const fileId = pod.image.split("/").pop()?.split("?")[0]
          if (fileId) {
            await storage.deleteFile(BUCKETS.POST_IMAGES, fileId)
          }
        } catch (e) {
          console.error("Failed to delete pod image:", e)
        }
      }

      // Delete chat rooms
      const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
        Query.equal("podId", podId),
      ])

      for (const chatRoom of chatRooms.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, chatRoom.$id)
        } catch (e) {
          console.error("Failed to delete chat room:", e)
        }
      }

      // Finally delete the pod
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      return { success: true }
    } catch (error) {
      console.error("Delete pod error:", error)
      throw error
    }
  },

  /**
   * Get member count for a pod
   */
  async getMemberCount(podId: string): Promise<number> {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      const members = Array.isArray(pod.members) ? pod.members : []

      return members.length
    } catch (error) {
      console.error("Get member count error:", error)
      return 0
    }
  },

  /**
   * Get pod members with profiles
   */
  async getPodMembers(podId: string, limit = 100) {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      const memberIds = Array.isArray(pod.members) ? pod.members : []

      // Fetch member profiles
      const members = await Promise.all(
        memberIds.map(async (memberId: string) => {
          try {
            const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, memberId)
            return {
              $id: memberId,
              name: profile.name,
              avatar: profile.avatar,
              email: profile.email,
            }
          } catch (e) {
            return { $id: memberId, name: `User ${memberId.slice(0, 6)}` }
          }
        })
      )

      return {
        documents: members.slice(0, limit),
        total: members.length,
      }
    } catch (error) {
      console.error("Get pod members error:", error)
      return { documents: [], total: 0 }
    }
  },

  // Pod operations handled via API routes

  /**
   * Join pod with invite code
   */
  async joinWithInviteCode(inviteCode: string, userId: string) {
    try {
      if (!inviteCode || !userId) {
        throw new Error("Invite code and User ID are required")
      }

      // Find pod with this invite code
      const pods = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PODS, [
        Query.equal("inviteCode", inviteCode),
      ])

      if (pods.documents.length === 0) {
        throw new Error("Invalid invite code")
      }

      const pod = pods.documents[0]

      // Check if invite is expired
      if (pod.inviteExpiry) {
        const expiry = new Date(pod.inviteExpiry)
        if (expiry < new Date()) {
          throw new Error("Invite code has expired")
        }
      }

      // Join the pod
      const joinResult = await this.joinPod(pod.$id, userId)
      return { ...joinResult, pod }
    } catch (error) {
      console.error("Join with invite code error:", error)
      throw error
    }
  },

  /**
   * Make member admin
   */
  async makeAdmin(podId: string, userId: string, targetUserId: string) {
    try {
      if (!podId || !userId || !targetUserId) {
        throw new Error("Pod ID, User ID, and Target User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Verify user is creator
      if (pod.creatorId !== userId) {
        throw new Error("Only pod creator can make members admin")
      }

      // Check if target is a member
      const members = Array.isArray(pod.members) ? pod.members : []
      if (!members.includes(targetUserId)) {
        throw new Error("User is not a member of this pod")
      }

      // Add to admins
      const admins = Array.isArray(pod.admins) ? pod.admins : []
      if (!admins.includes(targetUserId)) {
        admins.push(targetUserId)
      }

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        admins,
      })

      // Create notification
      try {
        const targetProfile = await profileService.getProfile(targetUserId)
        await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
          userId: targetUserId,
          type: "admin_promotion",
          message: `You are now an admin of ${pod.name}`,
          actor: userId,
          podId,
          read: false,
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Failed to create notification:", e)
      }

      return { success: true, admins }
    } catch (error) {
      console.error("Make admin error:", error)
      throw error
    }
  },

  /**
   * Remove admin role
   */
  async removeAdmin(podId: string, userId: string, targetUserId: string) {
    try {
      if (!podId || !userId || !targetUserId) {
        throw new Error("Pod ID, User ID, and Target User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Verify user is creator
      if (pod.creatorId !== userId) {
        throw new Error("Only pod creator can remove admin role")
      }

      // Remove from admins
      const admins = Array.isArray(pod.admins) ? pod.admins : []
      const updatedAdmins = admins.filter((id: string) => id !== targetUserId)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        admins: updatedAdmins,
      })

      return { success: true, admins: updatedAdmins }
    } catch (error) {
      console.error("Remove admin error:", error)
      throw error
    }
  },

  /**
   * Remove member from pod (admin/creator only)
   */
  async removeMember(podId: string, userId: string, targetUserId: string) {
    try {
      if (!podId || !userId || !targetUserId) {
        throw new Error("Pod ID, User ID, and Target User ID are required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Verify user is creator or admin
      const admins = Array.isArray(pod.admins) ? pod.admins : []
      if (pod.creatorId !== userId && !admins.includes(userId)) {
        throw new Error("Only pod creator or admins can remove members")
      }

      // Can't remove creator
      if (targetUserId === pod.creatorId) {
        throw new Error("Cannot remove pod creator")
      }

      // Check if target is a member
      const members = Array.isArray(pod.members) ? pod.members : []
      if (!members.includes(targetUserId)) {
        throw new Error("User is not a member of this pod")
      }

      // Remove from members
      const updatedMembers = members.filter((id: string) => id !== targetUserId)

      // Update pod
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
      })

      // Remove from chat room
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId),
        ])

        if (chatRooms.documents.length > 0) {
          const chatRoom = chatRooms.documents[0]
          const chatMembers = Array.isArray(chatRoom.members) ? chatRoom.members : []

          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CHAT_ROOMS,
            chatRoom.$id,
            {
              members: chatMembers.filter((id: string) => id !== targetUserId),
            }
          )
        }
      } catch (e) {
        console.error("Failed to remove from chat room:", e)
      }

      // Create notification
      try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
          userId: targetUserId,
          type: "removed_from_pod",
          message: `You were removed from ${pod.name}`,
          podId,
          read: false,
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Failed to create notification:", e)
      }

      return { success: true, memberCount: updatedMembers.length }
    } catch (error) {
      console.error("Remove member error:", error)
      throw error
    }
  },

  // Recommend pods for a user based on profile prefs and pod metadata
  async recommendPodsForUser(userId: string, limit = 5) {
    try {
      const cacheKey = `${userId}-${limit}`
      const cached = matchCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < MATCH_CACHE_TTL) {
        return cached.data
      }

      const profile = await profileService.getProfile(userId)
      const podsRes = await this.getAllPods(100, 0, {})
      const ranked = rankPodsForUser(profile || {}, podsRes.documents || [], limit)
      matchCache.set(cacheKey, { timestamp: Date.now(), data: ranked })
      return ranked
    } catch (error) {
      console.error("Recommend pods error:", error)
      return []
    }
  },

  assignMatchVariant(userId: string) {
    if (typeof window === "undefined") return "auto-join"
    const key = `match-ab-variant-${userId}`
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const variants = ["auto-join", "prompted"]
    const variant = variants[Math.floor(Math.random() * variants.length)]
    window.localStorage.setItem(key, variant)
    return variant
  },

  async logMatchExperiment(payload: { userId: string; variant: string; recommended: string[]; joined: string[] }) {
    try {
      const functionId = process.env.NEXT_PUBLIC_APPWRITE_MATCH_FUNCTION
      if (functionId && functions) {
        await functions.createExecution(functionId, JSON.stringify(payload))
        return
      }

      await databases.createDocument(DATABASE_ID, "match_experiments", "unique()", {
        userId: payload.userId,
        variant: payload.variant,
        recommended: payload.recommended,
        joined: payload.joined,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.warn("logMatchExperiment failed", err)
    }
  },

  async autoMatchAndJoin(userId: string, profile: any, options?: { matchLimit?: number; joinLimit?: number; variant?: string }) {
    const variant = options?.variant || this.assignMatchVariant(userId)
    const matchLimit = options?.matchLimit ?? 5
    const joinLimit = options?.joinLimit ?? 3

    const podsRes = await this.getAllPods(100, 0, {})
    const ranked = rankPodsForUser(profile || {}, podsRes.documents || [], matchLimit)
    const recommended = ranked.map((r) => r.pod || r).slice(0, matchLimit)

    const userPods = await this.getUserPods(userId)
    const existingIds = new Set((userPods.documents || []).map((p: any) => p.$id || p.id))

    const joinTargets = recommended.filter((p) => !existingIds.has(p.$id || p.id)).slice(0, joinLimit)
    const joined: string[] = []

    if (variant === "auto-join") {
      for (const pod of joinTargets) {
        try {
          await this.joinPod(pod.$id || pod.id, userId)
          joined.push(pod.$id || pod.id)
        } catch (err) {
          console.warn("auto-join failed", pod?.id || pod?.$id, err)
        }
      }
    }

    await this.logMatchExperiment({ userId, variant, recommended: recommended.map((p) => p.$id || p.id), joined })

    return { variant, recommended, joined }
  },

  async getReactions(podId: string) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, "pod_reactions", [Query.equal("podId", podId)])
      const counts: Record<string, number> = {}
      ;(res.documents || []).forEach((doc: any) => {
        const key = doc.itemId
        const val = typeof doc.count === "number" ? doc.count : 0
        counts[key] = (counts[key] || 0) + val
      })
      return counts
    } catch (err) {
      console.warn("getReactions failed", err)
      return {}
    }
  },

  async incrementReaction(podId: string, itemId: string, itemType: string, userId: string, delta = 1) {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, "pod_reactions", [
        Query.equal("podId", podId),
        Query.equal("itemId", itemId),
        Query.equal("userId", userId),
      ])

      if (existing.documents.length > 0) {
        const doc = existing.documents[0]
        const next = Math.max(0, (doc.count || 0) + delta)
        await databases.updateDocument(DATABASE_ID, "pod_reactions", doc.$id, { count: next, updatedAt: new Date().toISOString() })
        const totals = await this.getReactions(podId)
        return totals[itemId] || next
      }

      await databases.createDocument(DATABASE_ID, "pod_reactions", "unique()", {
        podId,
        itemId,
        itemType,
        userId,
        count: Math.max(1, delta),
        updatedAt: new Date().toISOString(),
      })
      const totals = await this.getReactions(podId)
      return totals[itemId] || Math.max(1, delta)
    } catch (err) {
      console.warn("incrementReaction failed", err)
      throw err
    }
  },

  async getPledge(podId: string, userId: string) {
    try {
      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/commitment`)
      return response.data || null
    } catch (err: any) {
      console.warn("getPledge failed", err)
      return null
    }
  },

  async savePledge(podId: string, userId: string, pledge: string) {
    try {
      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/commitment`, {
        method: 'POST',
        body: JSON.stringify({ pledge }),
      })
      return response.data || response
    } catch (err: any) {
      console.error("savePledge failed", err)
      throw err
    }
  },

  async listCheckIns(podId: string, limit = 20, offset = 0) {
    try {
      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/check-ins?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return { documents: response.data || response.documents || [], total: response.total || 0 }
    } catch (err: any) {
      console.warn("listCheckIns failed", err)
      return { documents: [], total: 0 }
    }
  },

  async addCheckIn(podId: string, userId: string, note: string, userName?: string) {
    try {
      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/check-ins`, {
        method: 'POST',
        body: JSON.stringify({ note, userName }),
      })
      return response.data || response
    } catch (err: any) {
      console.error("addCheckIn failed", err)
      throw err
    }
  },

  async listRsvps(podId: string) {
    try {
      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/rsvps`)
      return { documents: response.data || response.documents || [], total: response.total || 0 }
    } catch (err: any) {
      console.warn("listRsvps failed", err)
      return { documents: [], total: 0 }
    }
  },

  async toggleRsvp(podId: string, eventId: string, userId: string, isGoing: boolean) {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_RSVPS, [
        Query.equal("podId", podId),
        Query.equal("eventId", eventId),
        Query.equal("userId", userId),
      ])

      if (existing.documents.length > 0) {
        const doc = existing.documents[0]
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_RSVPS, doc.$id, {
          isGoing,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.POD_RSVPS, "unique()", {
          podId,
          eventId,
          userId,
          isGoing,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      const countRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_RSVPS, [
        Query.equal("podId", podId),
        Query.equal("eventId", eventId),
        Query.equal("isGoing", true),
      ])

      return { isGoing, count: (countRes.documents || []).length }
    } catch (err: any) {
      // Gracefully handle missing collection - just return a fallback
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        console.warn("toggleRsvp: Collection not found, returning fallback")
        return { isGoing, count: 0 }
      }
      console.error("toggleRsvp failed", err)
      throw err
    }
  },

  // Pod operations handled via API routes
}

// Study plan service
export const studyPlanService = {
  async getPlan(userId: string, date: string) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, "study_plans", [
        Query.equal("userId", userId),
        Query.equal("date", date),
      ])
      return res.documents[0] || null
    } catch (err) {
      console.warn("getPlan failed", err)
      return null
    }
  },

  async upsertPlan(payload: { userId: string; date: string; items: any[]; completedIds: string[]; sourceSignals?: string[] }) {
    try {
      const existing = await this.getPlan(payload.userId, payload.date)
      if (existing) {
        return await databases.updateDocument(DATABASE_ID, "study_plans", existing.$id, {
          items: payload.items,
          completedIds: payload.completedIds,
          sourceSignals: payload.sourceSignals || existing.sourceSignals || [],
          updatedAt: new Date().toISOString(),
        })
      }
      return await databases.createDocument(DATABASE_ID, "study_plans", "unique()", {
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.warn("upsertPlan failed", err)
      throw err
    }
  },
}

// Chat/Messaging Functions
function parseRoomMembers(room: any): string[] {
  if (Array.isArray(room?.members)) {
    return room.members.filter(Boolean)
  }
  if (typeof room?.members === "string") {
    try {
      const parsed = JSON.parse(room.members)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  if (Array.isArray(room?.participants)) {
    return room.participants.filter(Boolean)
  }
  if (typeof room?.participants === "string") {
    try {
      const parsed = JSON.parse(room.participants)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

function getDirectRoomKey(room: any): string {
  return parseRoomMembers(room).sort().join(":")
}

export const chatService = {
  /**
   * Get or create a direct message room between two users
   */
  async getOrCreateDirectRoom(userA: string, userB: string) {
    if (!userA || !userB) throw new Error("Both user IDs are required")
    const currentUser = await fetchSessionUser()
    const recipientId = currentUser?.$id === userA ? userB : userA

    const response = await apiJson('/api/messages/direct-room', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    })

    return response.room || response.data || response
  },

  async getOrCreateDirectRoomByUsername(username: string) {
    if (!username?.trim()) {
      throw new Error('Username is required')
    }

    const response = await apiJson('/api/messages/direct-room', {
      method: 'POST',
      body: JSON.stringify({ recipientUsername: username.trim() }),
    })

    return response.room || response.data || response
  },


  async createGroupRoom(name: string, memberIds: string[]) {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error('Select at least one member')
    }

    const response = await apiJson('/api/messages/group-room', {
      method: 'POST',
      body: JSON.stringify({ name, memberIds }),
    })

    return response.room || response.data || response
  },

  async getOrCreatePodRoom(podId: string, podName = "Pod Chat", members: string[] = []) {
    try {
      if (!podId) throw new Error("Pod ID is required")

      const response = await apiJson(`/api/pods/${encodeURIComponent(podId)}/chat-room`, {
        method: 'GET',
      })

      return response.data || response.room || response
    } catch (error) {
      console.error("Get or create pod room error:", error)
      throw error
    }
  },

  /**
   * Send a message with proper validation
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    messageTypeOrMetadata: "text" | "image" | "file" | "system" | {
      senderName?: string
      senderAvatar?: string
      replyTo?: string | null
      fileUrl?: string
      fileName?: string
      fileSize?: number
      fileId?: string
      fileType?: string
      durationMs?: number
      transcript?: string
      transcriptStatus?: "ready" | "unavailable" | "failed"
      resourceId?: string
      resourceTitle?: string
      resourceType?: string
      clientMessageId?: string
    } = "text",
    metadata: {
      senderName?: string
      senderAvatar?: string
      replyTo?: string | null
      fileUrl?: string
      fileName?: string
      fileSize?: number
      fileId?: string
      fileType?: string
      durationMs?: number
      transcript?: string
      transcriptStatus?: "ready" | "unavailable" | "failed"
      resourceId?: string
      resourceTitle?: string
      resourceType?: string
      clientMessageId?: string
    } = {}
  ) {
    try {
      const type = typeof messageTypeOrMetadata === "string" ? messageTypeOrMetadata : "text"
      if (typeof messageTypeOrMetadata === "object") {
        metadata = messageTypeOrMetadata
      }

      const clientMessageId = metadata.clientMessageId || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`)

      // Validate inputs
      if (!roomId || !senderId || !content) {
        throw new Error("Room ID, Sender ID, and content are required")
      }

      if (!content.trim()) {
        throw new Error("Message cannot be empty")
      }

      if (content.length > 5000) {
        throw new Error("Message exceeds 5000 character limit")
      }

      // Get sender profile if name not provided
      let senderName = metadata.senderName || ""
      let senderAvatar = metadata.senderAvatar || ""

      if (!senderName) {
        try {
          const profile = await profileService.getProfile(senderId)
          senderName = profile?.name || `User ${senderId.slice(0, 6)}`
          senderAvatar = profile?.avatar || ""
        } catch (e) {
          senderName = `User ${senderId.slice(0, 6)}`
        }
      }

      const response = await apiJson('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          senderId,
          content: content.trim(),
          clientMessageId,
          type,
          metadata: {
            senderName,
            senderAvatar,
            replyTo: metadata.replyTo || null,
            fileUrl: metadata.fileUrl || null,
            fileName: metadata.fileName || null,
            fileSize: metadata.fileSize || null,
            fileId: metadata.fileId || null,
            fileType: metadata.fileType || null,
            durationMs: metadata.durationMs || null,
            transcript: metadata.transcript || null,
            transcriptStatus: metadata.transcriptStatus || null,
            resourceId: metadata.resourceId || null,
            resourceTitle: metadata.resourceTitle || null,
            resourceType: metadata.resourceType || null,
          },
        }),
      })

      return response.message || response.data || response
    } catch (error) {
      console.error("Send message error:", error)
      throw error
    }
  },

  async updateMessage(messageId: string, action: 'edit' | 'delete' | 'pin' | 'star', payload: { content?: string } = {}) {
    if (!messageId || !action) {
      throw new Error('Message ID and action are required')
    }

    const response = await apiJson(`/api/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action,
        content: payload.content || '',
      }),
    })

    return response.message || response.data || response
  },


  async toggleReaction(messageId: string, emoji: string) {
    if (!messageId || !emoji) {
      throw new Error('Message ID and emoji are required')
    }

    const response = await apiJson(`/api/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'react', emoji }),
    })

    return response.message || response.data || response
  },

  async deleteMessage(messageId: string) {
    if (!messageId) {
      throw new Error('Message ID is required')
    }

    const response = await apiJson(`/api/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
    })

    return response.message || response.data || response
  },

  async reportMessage(messageId: string, reporterId: string, reason = 'policy_violation', description = '') {
    if (!messageId || !reporterId) {
      throw new Error('Message ID and reporter ID are required')
    }

    const response = await apiJson('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        reporterId,
        contentId: messageId,
        contentType: 'message',
        reason,
        description,
      }),
    })

    return response.reportId || response.message || response.data || response
  },

  /**
   * Get messages from a chat room with pagination - FIXED
   */
  async getMessages(roomId: string, limit = 50, offset = 0) {
    try {
      if (!roomId) {
        throw new Error("Room ID is required")
      }

      const response = await apiJson(`/api/messages/room/${encodeURIComponent(roomId)}?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return {
        documents: response.messages || response.documents || [],
        total: response.total || 0,
        members: response.members || [],
      }
    } catch (error) {
      if (!isNoActiveSessionError(error)) console.error("Get messages error:", error)
      throw error
    }
  },

  // Get a single message by ID
  async getMessage(messageId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.MESSAGES, messageId)
    } catch (error) {
      console.error("Get message error:", error)
      return null
    }
  },

  // Subscribe to real-time messages using the Appwrite Realtime service.
  // Appwrite's current Web SDK keeps one socket per Realtime instance and updates
  // subscriptions in-place, which avoids reconnect flicker and CONNECTING-state sends.
  subscribeToMessages(roomId: string, callback: (message: any) => void) {
    let closed = false
    let subscription: { close?: () => Promise<void> | void } | null = null

    const pushIfRelevant = (event: any) => {
      const payload = event?.payload || event?.data || event
      const messageRoomId = payload?.roomId || payload?.data?.roomId || payload?.payload?.roomId
      if (messageRoomId === roomId) {
        callback(payload?.payload || payload?.data || payload)
      }
    }

    void ensureRealtimeAuthenticated().then((authenticated) => {
      if (!authenticated || closed) return null
      return realtime.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`, pushIfRelevant)
    })
      .then((nextSubscription) => {
        if (!nextSubscription) return
        if (closed) {
          Promise.resolve(nextSubscription.close?.()).catch(() => undefined)
          return
        }
        subscription = nextSubscription
      })
      .catch((error) => {
        if (!closed) console.warn('Realtime message subscription unavailable:', error)
      })

    return () => {
      closed = true
      Promise.resolve(subscription?.close?.()).catch(() => undefined)
    }
  },

  subscribeToChatRooms(userId: string, callback: (room: any) => void) {
    let closed = false
    let subscription: { close?: () => Promise<void> | void } | null = null

    const pushIfRelevant = (event: any) => {
      const room = event?.payload || event?.data || event
      const members = Array.isArray(room?.members)
        ? room.members
        : typeof room?.members === 'string'
          ? (() => { try { return JSON.parse(room.members) } catch { return [] } })()
          : []
      if (members.includes(userId) || room?.roomId === userId || room?.lastMessageSenderId) {
        callback(room)
      }
    }

    void ensureRealtimeAuthenticated().then((authenticated) => {
      if (!authenticated || closed) return null
      return realtime.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.CHAT_ROOMS}.documents`, pushIfRelevant)
    })
      .then((nextSubscription) => {
        if (!nextSubscription) return
        if (closed) {
          Promise.resolve(nextSubscription.close?.()).catch(() => undefined)
          return
        }
        subscription = nextSubscription
      })
      .catch((error) => {
        if (!closed) console.warn('Realtime room subscription unavailable:', error)
      })

    return () => {
      closed = true
      Promise.resolve(subscription?.close?.()).catch(() => undefined)
    }
  },

  // Upload file attachment through the authenticated server route so storage
  // permissions are applied by the Appwrite Server SDK instead of relying on a
  // public bucket-level create grant.
  async uploadAttachment(file: File, userId: string, roomId = '', options: { durationMs?: number } = {}) {
    try {
      if (!file) throw new Error('File is required')
      if (!userId) throw new Error('User ID is required')

      const sessionUser = await fetchSessionUser()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', roomId)
      if (options.durationMs && Number.isFinite(options.durationMs)) {
        formData.append('durationMs', String(Math.max(0, Math.round(options.durationMs))))
      }

      const response = await fetch('/api/messages/attachments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(sessionUser?.$id ? { 'x-user-id': sessionUser.$id } : {}),
          ...(sessionUser?.role ? { 'x-user-role': sessionUser.role } : {}),
        },
        body: formData,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Upload failed with ${response.status}`)
      }

      return payload.attachment
    } catch (error) {
      console.error("Upload attachment error:", error)
      throw error
    }
  },

  // Direct message operations handled via API routes

  // Get user's chat rooms
  async getUserChatRooms(userId: string) {
    try {
      // Get pod rooms
      const userPods = await podService.getUserPods(userId)
      const podDocuments = Array.isArray(userPods?.documents) ? userPods.documents : []
      const podRooms = await Promise.all(
        podDocuments.map(async (pod: any) => {
          try {
            const room = await this.getOrCreatePodRoom(
              pod.$id || pod.id || pod.podId || pod.teamId,
              pod.name,
              Array.isArray(pod.members) ? pod.members : [userId],
            )
            return room
          } catch (e) {
            return null
          }
        }),
      )

      let directRooms: any[] = []
      try {
        const dmResponse = await apiJson(`/api/messages/send?userId=${encodeURIComponent(userId)}`)
        directRooms = Array.isArray(dmResponse?.rooms)
          ? dmResponse.rooms.map((room: any) => ({
              ...room,
              type: room.type === 'dm' ? 'direct' : room.type || 'direct',
              members: parseRoomMembers(room),
            }))
          : []
      } catch (e) {
        console.warn("Failed to fetch direct rooms:", e)
      }

      return {
        podRooms: podRooms.filter((room) => room !== null),
        directRooms: Array.isArray(directRooms) ? directRooms : [],
      }
    } catch (error) {
      console.error("Get user chat rooms error:", error)
      return { podRooms: [], directRooms: [] }
    }
  },

  /**
   * Mark message as read
   */
  async markRoomMessages(roomId: string, messageIds: string[], state: 'delivered' | 'read' = 'read') {
    if (!roomId || !Array.isArray(messageIds) || messageIds.length === 0) return { success: true, updated: 0 }
    const request = () => apiJson(`/api/messages/room/${encodeURIComponent(roomId)}/receipts`, {
      method: 'POST',
      body: JSON.stringify({ messageIds: Array.from(new Set(messageIds)).slice(0, 200), state }),
    })

    try {
      return await request()
    } catch (error: any) {
      if (![429, 500, 502, 503, 504].includes(Number(error?.status))) throw error
      await new Promise((resolve) => window.setTimeout(resolve, 300))
      return request()
    }
  },

  subscribeToReceipts(roomId: string, callback: (receipt: any) => void) {
    let closed = false
    let subscription: { close?: () => Promise<void> | void } | null = null
    void ensureRealtimeAuthenticated().then((authenticated) => {
      if (!authenticated || closed) return null
      return realtime.subscribe(`databases.${DATABASE_ID}.collections.message_receipts.documents`, (event: any) => {
        const receipt = event?.payload || event?.data || event
        if (!closed && receipt?.roomId === roomId) callback(receipt)
      })
    })
      .then((nextSubscription) => {
        if (!nextSubscription) return
        if (closed) void nextSubscription.close?.()
        else subscription = nextSubscription
      })
      .catch((error) => {
        if (!closed && process.env.NODE_ENV === 'development') console.warn('Realtime receipt subscription unavailable:', error)
      })
    return () => {
      closed = true
      void subscription?.close?.()
    }
  },

  async markMessageAsRead(messageId: string, _userId: string, roomId?: string) {
    if (!roomId) throw new Error('Room ID is required to mark a message as read')
    return this.markRoomMessages(roomId, [messageId], 'read')
  },

  /**
   * Create a direct chat room between two users
   */
  async createDirectChat(userId1: string, userId2: string) {
    return await this.getOrCreateDirectRoom(userId1, userId2)
  },
}

export const presenceService = {
  async updatePresence(roomId: string, options: { isTyping?: boolean; isOnline?: boolean } = {}) {
    if (!roomId) {
      throw new Error('Room ID is required')
    }

    const response = await apiJson('/api/chat/presence', {
      method: 'POST',
      body: JSON.stringify({
        roomId,
        isTyping: Boolean(options.isTyping),
        isOnline: options.isOnline === undefined ? true : Boolean(options.isOnline),
      }),
    })

    return response.presence || response.data || response
  },

  async getPresence(roomId: string) {
    if (!roomId) {
      throw new Error('Room ID is required')
    }

    const response = await apiJson(`/api/chat/presence?roomId=${encodeURIComponent(roomId)}`)
    return response.presence || response.data || []
  },

  subscribeToPresence(roomId: string, callback: (presence: any) => void) {
    let closed = false
    let subscription: { close?: () => Promise<void> | void } | null = null

    const pushIfRelevant = (event: any) => {
      const presence = event?.payload || event?.data || event
      if (presence?.roomId === roomId) {
        callback(presence)
      }
    }

    realtime
      .subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.CHAT_PRESENCE}.documents`, pushIfRelevant, [Query.equal('roomId', roomId)])
      .then((nextSubscription) => {
        if (closed) {
          Promise.resolve(nextSubscription.close?.()).catch(() => undefined)
          return
        }
        subscription = nextSubscription
      })
      .catch((error) => {
        if (!closed) console.warn('Realtime presence subscription unavailable:', error)
      })

    return () => {
      closed = true
      Promise.resolve(subscription?.close?.()).catch(() => undefined)
    }
  },
}

// Challenge Functions
export const challengeService = {
  async listChallenges(userId: string) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHALLENGES, [
        Query.contains("participants", userId),
      ])
      return res.documents || []
    } catch (err: any) {
      // Graceful fallback if collection does not exist
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem(`challenges-${userId}`)
        if (cached) return JSON.parse(cached)
      }
      console.warn("listChallenges fallback", err)
      return []
    }
  },

  async createChallenge(ownerId: string, data: { title: string; description?: string; difficulty?: string; points?: number; dueDate?: string }) {
    if (!ownerId) throw new Error("Owner is required")
    const payload = {
      title: data.title,
      description: data.description || "",
      difficulty: data.difficulty || "Medium",
      points: data.points ?? 50,
      status: "active",
      ownerId,
      participants: [ownerId],
      createdAt: new Date().toISOString(),
      dueDate: data.dueDate || null,
    }

    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.CHALLENGES, "unique()", payload)
      return doc
    } catch (err: any) {
      if (typeof window !== "undefined") {
        const key = `challenges-${ownerId}`
        const existing = window.localStorage.getItem(key)
        const parsed = existing ? JSON.parse(existing) : []
        const localDoc = { ...payload, $id: `local-${Date.now()}` }
        window.localStorage.setItem(key, JSON.stringify([localDoc, ...parsed]))
        return localDoc
      }
      throw err
    }
  },

  async completeChallenge(challengeId: string, userId: string) {
    if (!challengeId || !userId) throw new Error("Challenge ID and user ID are required")
    try {
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.CHALLENGES, challengeId, {
        status: "completed",
        completedBy: userId,
        completedAt: new Date().toISOString(),
      })
      return updated
    } catch (err: any) {
      if (typeof window !== "undefined") {
        const key = `challenges-${userId}`
        const existing = window.localStorage.getItem(key)
        if (existing) {
          const parsed = JSON.parse(existing)
          const next = parsed.map((c: any) => (c.$id === challengeId ? { ...c, status: "completed", completedBy: userId, completedAt: new Date().toISOString() } : c))
          window.localStorage.setItem(key, JSON.stringify(next))
          return next.find((c: any) => c.$id === challengeId)
        }
      }
      throw err
    }
  },
}

// Resource/File Functions
export const resourceService = {
  /**
   * Upload a resource with validation
   */
  async uploadResource(
    userId: string,
    file: File,
    metadata: {
      title?: string
      description?: string
      podId?: string
      visibility?: string
      tags?: string[]
    } = {}
  ) {
    try {
      if (!userId || !file) {
        throw new Error("User ID and file are required")
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/json",
        "application/zip",
        "image/webp",
        "image/svg+xml",
        "text/plain",
        "text/csv",
        "text/markdown",
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "video/webm",
        "audio/mpeg",
        "audio/mp4",
        "audio/webm",
        "audio/ogg",
        "audio/wav",
      ]

      const broadlySupported = ["text/", "image/", "video/", "audio/"].some((prefix) => file.type.startsWith(prefix))
      if (!allowedTypes.includes(file.type) && !broadlySupported) {
        throw new Error(`File type not allowed. Use a document, image, video, audio, archive, or text/code file.`)
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large (max 50MB)")
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', metadata.title || file.name)
      formData.append('description', metadata.description || '')
      formData.append('podId', metadata.podId || '')
      formData.append('visibility', metadata.visibility || 'public')
      formData.append('tags', JSON.stringify(Array.isArray(metadata.tags) ? metadata.tags.slice(0, 10) : []))
      formData.append('userId', userId)

      const response = await fetch('/api/resources', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(typeof window !== 'undefined' ? { 'x-user-id': userId } : {}),
        },
        body: formData,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to upload resource')
      }

      return payload.resource || payload.data || payload
    } catch (error) {
      console.error("Upload resource error:", error)
      throw error
    }
  },

  /**
   * Get resources with filtering
   */
  async getResources(filters: string | { podId?: string; visibility?: string; authorId?: string; search?: string } = {}, limit = 50, offset = 0) {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })

      if (typeof filters === "string") {
        if (filters) params.set('podId', filters)
      } else {
        if (filters.podId) params.set('podId', filters.podId)
        if (filters.visibility) params.set('visibility', filters.visibility)
        if (filters.authorId) params.set('authorId', filters.authorId)
        if (filters.search) params.set('search', filters.search)
      }

      const response = await apiJson(`/api/resources?${params.toString()}`)
      return { documents: response.documents || [], total: response.total || 0 }
    } catch (error) {
      console.error("Get resources error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get bookmarked resources for a user
   */
  async getBookmarkedResources(userId: string, limit = 50, offset = 0) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const resources = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        [
          Query.search("bookmarkedBy", userId),
          Query.orderDesc("createdAt"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

      return resources
    } catch (error) {
      console.error("Get bookmarked resources error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Toggle bookmark on resource
   */
  async toggleBookmarkResource(resourceId: string, userId: string) {
    try {
      if (!resourceId || !userId) {
        throw new Error("Resource ID and User ID are required")
      }

      const resource = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)
      const bookmarkedBy = Array.isArray(resource.bookmarkedBy) ? resource.bookmarkedBy : []

      const isBookmarked = bookmarkedBy.includes(userId)
      const newBookmarkedBy = isBookmarked
        ? bookmarkedBy.filter((id: string) => id !== userId)
        : [...bookmarkedBy, userId]

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        resourceId,
        {
          bookmarkedBy: newBookmarkedBy,
        }
      )

      return {
        success: true,
        bookmarked: !isBookmarked,
        resource: updated,
      }
    } catch (error) {
      console.error("Toggle bookmark resource error:", error)
      throw error
    }
  },

  /**
   * Toggle like on resource
   */
  async toggleLikeResource(resourceId: string, userId: string) {
    try {
      if (!resourceId || !userId) {
        throw new Error("Resource ID and User ID are required")
      }

      const response = await apiJson(`/api/resources/${encodeURIComponent(resourceId)}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      return response.resource || response.data || response
    } catch (error) {
      console.error("Toggle like resource error:", error)
      throw error
    }
  },

  /**
   * Download a resource and increment download count
   */
  async downloadResource(resourceId: string) {
    try {
      if (!resourceId) {
        throw new Error("Resource ID is required")
      }

      const response = await apiJson(`/api/resources/${encodeURIComponent(resourceId)}/download`)
      return { url: response.url }
    } catch (error) {
      console.error("Download resource error:", error)
      throw error
    }
  },

  async incrementResourceView(resourceId: string) {
    try {
      if (!resourceId) {
        throw new Error("Resource ID is required")
      }

      const resource = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)
      const nextViews = (resource.views || 0) + 1

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId, {
        views: nextViews,
        updatedAt: new Date().toISOString(),
      })

      return { success: true, views: nextViews }
    } catch (error) {
      console.error("Increment resource view error:", error)
      throw error
    }
  },

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: string, userId: string) {
    try {
      if (!resourceId || !userId) {
        throw new Error("Resource ID and User ID are required")
      }

      const resource = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)

      // Verify ownership
      if (resource.authorId !== userId) {
        throw new Error("Only the uploader can delete this resource")
      }

      // Delete file from storage
      try {
        const fileId = resource.fileUrl?.split("/").pop()?.split("?")[0]
        if (fileId) {
          await storage.deleteFile(BUCKETS.RESOURCES, fileId)
        }
      } catch (e) {
        console.error("Failed to delete resource file:", e)
      }

      // Delete document
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)

      return { success: true }
    } catch (error) {
      console.error("Delete resource error:", error)
      throw error
    }
  },
}

// Feed/Posts Functions
export const feedService = {
  /**
   * Create a new post with proper validation and image handling
   */
  async createPost(
    authorId: string,
    content: string,
    metadata: {
      type?: string
      imageFiles?: File[]
      attachments?: Array<{
        fileId?: string
        fileUrl: string
        fileName: string
        fileSize?: number
        fileType?: string
      }>
      visibility?: string
      podId?: string
      tags?: string[]
      authorName?: string
      authorAvatar?: string
      authorUsername?: string
    } = {}
  ) {
    try {
      if (!authorId || !authorId.trim()) {
        throw new Error("Author ID is required")
      }

      // Validate content
      if (!content || !content.trim()) {
        throw new Error("Post content cannot be empty")
      }

      if (content.length > 5000) {
        throw new Error("Post content exceeds 5000 character limit")
      }

      const normalizeUsername = (name?: string) =>
        name && name.trim().length > 0
          ? `@${name.trim().toLowerCase().replace(/\s+/g, "_")}`
          : ""

      // Get author profile info
      let authorName = metadata.authorName || ""
      let authorAvatar = metadata.authorAvatar || ""
      let authorUsername = metadata.authorUsername || ""

      if (!authorName) {
        try {
          const profile = await profileService.getProfile(authorId)
          if (profile) {
            authorName = profile.name || ""
            authorAvatar = profile.avatar || ""
            const profileUsername = profile.username || normalizeUsername(profile.name)
            authorUsername = profileUsername || `@user_${authorId.slice(0, 6)}`
          } else {
            // Profile doesn't exist - try to get user account info as fallback
            console.warn(`[createPost] Profile not found for ${authorId}, attempting to get account info`)
            try {
              const user = await account.get()
              if (user && user.$id === authorId) {
                authorName = user.name || ""
                authorUsername = `@${(user.name || "user").toLowerCase().replace(/\\s+/g, '_')}`
                devLog(`[createPost] Using account info: ${authorName}`)
              }
            } catch (accountErr) {
              console.error("[createPost] Failed to get account info:", accountErr)
            }
          }
        } catch (e) {
          console.error("[createPost] Failed to fetch profile:", e)
        }
      }

      // Final fallback if still no author name
      if (!authorName) {
        authorName = "Anonymous User"
        console.warn(`[createPost] No author name found for ${authorId}, using fallback`)
      }

      // Fallback username if not found
      if (!authorUsername) {
        authorUsername = normalizeUsername(authorName) || `@user_${authorId.slice(0, 6)}`
      }

      const cleanTags = Array.isArray(metadata.tags)
        ? metadata.tags.filter((tag: unknown) => typeof tag === 'string' && tag.trim()).slice(0, 10)
        : []

      const response = await apiJson('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          authorId,
          content,
          metadata: {
            ...metadata,
            imageFiles: undefined,
            attachments: Array.isArray(metadata.attachments) ? metadata.attachments.slice(0, 6) : [],
            tags: cleanTags,
            authorName,
            authorAvatar,
            authorUsername,
          },
        }),
      })

      const post = response.post
      const podId = post?.podId

      // Notify pod members if post is in a pod
      if (podId) {
        try {
          const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
          const members = Array.isArray(pod.members) ? pod.members : []
          // Notify all pod members except author
          for (const memberId of members.filter(m => m !== authorId)) {
            try {
              await notificationService.createNotification(
                memberId,
                "New Pod Post",
                `${authorName} posted in ${pod.name}`,
                "pod_post",
                {
                  postId: post.$id,
                  podId: podId,
                  actorId: authorId,
                  actorName: authorName,
                  actorAvatar: authorAvatar,
                }
              )
            } catch (e) {
              console.error(`Failed to notify member ${memberId}:`, e)
            }
          }
        } catch (e) {
          console.error("Failed to send pod post notifications:", e)
        }
      }

      return post
    } catch (error) {
      console.error("Create post error:", error)
      throw error
    }
  },

  /**
   * Get posts by user with proper pagination
   */
  async getUserPosts(userId: string, limit = 50, offset = 0) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const response = await apiJson(`/api/posts?authorId=${encodeURIComponent(userId)}&limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return { documents: response.documents || response.posts || [], total: response.total || 0 }
    } catch (error) {
      console.error("Get user posts error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get feed posts (public + user's pods) with proper pagination
   */
  async getFeedPosts(userId?: string, limit = 20, offset = 0) {
    try {
      const response = await apiJson(`/api/posts?userId=${encodeURIComponent(userId || '')}&limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return { documents: response.documents || response.posts || [], total: response.total || 0 }
    } catch (error) {
      console.error("Get feed posts error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get saved posts with proper pagination
   */
  async getSavedPosts(userId: string, limit = 50, offset = 0) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const response = await apiJson(`/api/posts/saved?userId=${encodeURIComponent(userId)}&limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return {
        documents: response.posts || response.documents || [],
        total: response.total || 0,
      }
    } catch (error) {
      if (!isNoActiveSessionError(error)) console.error("Get saved posts error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Update a post with validation
   */
  async updatePost(postId: string, updates: { content?: string; tags?: string[] }) {
    try {
      if (!postId) {
        throw new Error("Post ID is required")
      }

      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      }

      if (updates.content !== undefined) {
        if (!updates.content || !updates.content.trim()) {
          throw new Error("Post content cannot be empty")
        }
        if (updates.content.length > 5000) {
          throw new Error("Post content exceeds 5000 character limit")
        }
        updateData.content = updates.content
      }

      if (Array.isArray(updates.tags)) {
        updateData.tags = updates.tags.slice(0, 10)
      }

      const updatedPost = await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, updateData)
      return updatedPost
    } catch (error) {
      console.error("Update post error:", error)
      throw error
    }
  },

  /**
   * Delete a post and all related data
   */
  async deletePost(postId: string) {
    try {
      if (!postId) {
        throw new Error("Post ID is required")
      }

      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      // Delete images from storage
      if (post.imageUrls && Array.isArray(post.imageUrls)) {
        for (const imageUrl of post.imageUrls) {
          try {
            const fileId = imageUrl.split("/").pop()?.split("?")[0]
            if (fileId) {
              await storage.deleteFile(BUCKETS.POST_IMAGES, fileId)
            }
          } catch (e) {
            console.error("Failed to delete image:", e)
          }
        }
      }

      // Delete all comments on this post
      const comments = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMMENTS, [
        Query.equal("postId", postId),
      ])

      for (const comment of comments.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COMMENTS, comment.$id)
        } catch (e) {
          console.error("Failed to delete comment:", e)
        }
      }

      // Delete saved post entries
      const savedEntries = await databases.listDocuments(DATABASE_ID, "saved_posts", [
        Query.equal("postId", postId),
      ])

      for (const entry of savedEntries.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, "saved_posts", entry.$id)
        } catch (e) {
          console.error("Failed to delete saved entry:", e)
        }
      }

      // Finally delete the post itself
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)
      return { success: true }
    } catch (error) {
      console.error("Delete post error:", error)
      throw error
    }
  },

  /**
   * Toggle like on post with proper validation
   */
  async toggleLike(postId: string, userId: string) {
    try {
      if (!postId || !userId) {
        throw new Error("Post ID and User ID are required")
      }

      const response = await apiJson(`/api/posts/${encodeURIComponent(postId)}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      return response.post || response.data || response
    } catch (error) {
      console.error("Toggle like error:", error)
      throw error
    }
  },

  /**
   * Get post likes
   */
  async getPostLikes(postId: string) {
    try {
      if (!postId) {
        throw new Error("Post ID is required")
      }

      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)
      return {
        likes: post.likes || 0,
        likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
      }
    } catch (error) {
      console.error("Get post likes error:", error)
      return { likes: 0, likedBy: [] }
    }
  },

  /**
   * Toggle save post status
   */
  async toggleSavePost(postId: string, userId: string) {
    try {
      if (!postId || !userId) {
        throw new Error("Post ID and User ID are required")
      }

      const response = await apiJson(`/api/posts/${encodeURIComponent(postId)}/save`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      return response.data || response
    } catch (error) {
      console.error("Toggle save post error:", error)
      throw error
    }
  },

  /**
   * Check if post is saved by user
   */
  async isPostSaved(postId: string, userId: string): Promise<boolean> {
    try {
      const result = await databases.listDocuments(DATABASE_ID, "saved_posts", [
        Query.equal("postId", postId),
        Query.equal("userId", userId),
      ])

      return result.documents.length > 0
    } catch (error) {
      console.error("Check save status error:", error)
      return false
    }
  },
}

// Comment Functions
export const commentService = {
  /**
   * Create a comment with proper validation
   */
  async createComment(
    postId: string,
    authorId: string,
    content: string,
    metadata: {
      authorName?: string
      authorAvatar?: string
      authorUsername?: string
      replyTo?: string | null
    } = {}
  ) {
    try {
      // Validate inputs
      if (!postId || !authorId || !content) {
        throw new Error("Post ID, Author ID, and content are required")
      }

      if (!content.trim()) {
        throw new Error("Comment content cannot be empty")
      }

      if (content.length > 2000) {
        throw new Error("Comment content exceeds 2000 character limit")
      }

      const response = await apiJson(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          userId: authorId,
          content,
          replyTo: metadata.replyTo || null,
        }),
      })

      return response.comment || response.data || response
    } catch (error) {
      console.error("Create comment error:", error)
      throw error
    }
  },

  /**
   * Get comments for a post with proper pagination and ordering
   */
  async getComments(postId: string, limit = 50, offset = 0) {
    try {
      if (!postId) {
        throw new Error("Post ID is required")
      }

      const response = await apiJson(`/api/posts/${encodeURIComponent(postId)}/comments?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`)
      return {
        documents: response.comments || response.data || response.documents || [],
        total: response.total || 0,
      }
    } catch (error) {
      console.error("Get comments error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get replies to a comment
   */
  async getReplies(commentId: string, limit = 20) {
    try {
      if (!commentId) {
        throw new Error("Comment ID is required")
      }

      const replies = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMMENTS, [
        Query.equal("replyTo", commentId),
        Query.orderAsc("timestamp"),
        Query.limit(Math.min(limit, 100)),
      ])

      return replies
    } catch (error) {
      console.error("Get replies error:", error)
      return { documents: [] }
    }
  },

  /**
   * Toggle like on comment with proper validation
   */
  async toggleLike(commentId: string, userId: string) {
    try {
      if (!commentId || !userId) {
        throw new Error("Comment ID and User ID are required")
      }

      const response = await apiJson(`/api/comments/${encodeURIComponent(commentId)}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      return response.comment || response.data || response
    } catch (error) {
      console.error("Toggle like comment error:", error)
      throw error
    }
  },

  /**
   * Update comment with validation
   */
  async updateComment(commentId: string, content: string) {
    try {
      if (!commentId || !content) {
        throw new Error("Comment ID and content are required")
      }

      if (!content.trim()) {
        throw new Error("Comment content cannot be empty")
      }

      if (content.length > 2000) {
        throw new Error("Comment content exceeds 2000 character limit")
      }

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        commentId,
        {
          content: content,
          updatedAt: new Date().toISOString(),
        }
      )

      return updated
    } catch (error) {
      console.error("Update comment error:", error)
      throw error
    }
  },

  /**
   * Delete comment with proper cleanup
   */
  async deleteComment(commentId: string) {
    try {
      if (!commentId) {
        throw new Error("Comment ID is required")
      }

      // Get comment details to find post
      const comment = await databases.getDocument(DATABASE_ID, COLLECTIONS.COMMENTS, commentId)

      // Delete the comment first
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COMMENTS, commentId)

      // Then decrement post comment count
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, comment.postId)
      const newCommentCount = Math.max((post.comments || 1) - 1, 0)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, comment.postId, {
        comments: newCommentCount,
      })

      return { success: true }
    } catch (error) {
      console.error("Delete comment error:", error)
      throw error
    }
  },

  /**
   * Get comment likes
   */
  async getCommentLikes(commentId: string) {
    try {
      if (!commentId) {
        throw new Error("Comment ID is required")
      }

      const comment = await databases.getDocument(DATABASE_ID, COLLECTIONS.COMMENTS, commentId)

      return {
        likes: comment.likes || 0,
        likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
      }
    } catch (error) {
      console.error("Get comment likes error:", error)
      return { likes: 0, likedBy: [] }
    }
  },
}

// Calendar Functions
export const calendarService = {
  // Create calendar event
  // Note: Database schema only has: userId, title, startTime, endTime, type, podId, createdAt, isCompleted
  async createEvent(
    userId: string,
    title: string,
    startTime: string,
    endTime: string,
    metadata: any = {},
  ) {
    try {
      const response = await apiJson('/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          title,
          startTime,
          endTime,
          metadata,
        }),
      })

      const event = response.event

      // Notify pod members if event is for a pod
      if (metadata.podId) {
        try {
          const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, metadata.podId)
          const creator = await profileService.getProfile(userId)
          const members = Array.isArray(pod.members) ? pod.members : []

          for (const memberId of members.filter((m: string) => m !== userId)) {
            try {
              await notificationService.createNotification(
                memberId,
                "New Event",
                `${creator?.name || "Someone"} scheduled: ${title}`,
                "event",
                {
                  eventId: event.$id,
                  podId: metadata.podId,
                  startTime: startTime,
                  actorId: userId,
                }
              )
            } catch (e) {
              console.error(`Failed to notify member ${memberId}:`, e)
            }
          }
        } catch (e) {
          console.error("Failed to send event notifications:", e)
        }
      }

      // Notify attendees if specified
      if (Array.isArray(metadata.attendees) && metadata.attendees.length > 0) {
        try {
          const creator = await profileService.getProfile(userId)

          for (const attendeeId of metadata.attendees.filter((a: string) => a !== userId)) {
            try {
              await notificationService.createNotification(
                attendeeId,
                "You're Invited",
                `${creator?.name || "Someone"} invited you to: ${title}`,
                "event_invite",
                {
                  eventId: event.$id,
                  startTime: startTime,
                  actorId: userId,
                }
              )
            } catch (e) {
              console.error(`Failed to notify attendee ${attendeeId}:`, e)
            }
          }
        } catch (e) {
          console.error("Failed to send attendee notifications:", e)
        }
      }

      return event
    } catch (error) {
      console.error("Create event error:", error)
      throw error
    }
  },

  // Get user events
  async getUserEvents(userId: string, startDate?: string, endDate?: string) {
    try {
      const queries = [Query.equal('userId', userId)]

      if (startDate) queries.push(Query.greaterThanEqual('startTime', startDate))
      if (endDate) queries.push(Query.lessThanEqual('endTime', endDate))

      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, queries)
    } catch (error) {
      console.error("Get user events error:", error)
      return { documents: [] }
    }
  },

  // Get pod events
  async getPodEvents(podId: string, limit = 50, offset = 0) {
    try {
      const queries = [Query.equal('podId', podId)]
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, queries)
    } catch (error) {
      console.error("Get pod events error:", error)
      return { documents: [] }
    }
  },

  // Update event
  async updateEvent(eventId: string, updates: any) {
    try {
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, eventId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Update event error:", error)
      throw error
    }
  },

  // Delete event
  async deleteEvent(eventId: string) {
    try {
      return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, eventId)
    } catch (error: any) {
      // Handle 404 errors gracefully (event may have already been deleted or never existed in DB)
      if (error?.code === 404 || error?.type === "document_not_found") {
        console.warn("Event not found, may be a local/mock event:", eventId)
        return { $id: eventId, deleted: true }
      }
      console.error("Delete event error:", error)
      throw error
    }
  },
}

// Notification Functions
export const notificationService = {
  // Create notification
  async createNotification(userId: string, title: string, message: string, type = "info", metadata: any = {}) {
    try {
      // Ensure title is always set (Appwrite schema requires it)
      const notificationTitle = title && title.trim() ? title : type.charAt(0).toUpperCase() + type.slice(1)
      return await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
        userId: userId,
        title: notificationTitle,
        message: message,
        type: type, // info, success, warning, error, pod_join, message, resource, event
        isRead: false,
        timestamp: new Date().toISOString(),
        actionUrl: metadata.actionUrl || null,
        actionText: metadata.actionText || null,
        imageUrl: metadata.imageUrl || null,
        ...metadata,
      })
    } catch (error) {
      console.error("Create notification error:", error)
      throw error
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [
          Query.equal("userId", userId),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc("timestamp"),
        ],
      )
    } catch (error) {
      console.error("Get notifications error:", error)
      return { documents: [] }
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notificationId, {
        isRead: true,
        readAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Mark notification as read error:", error)
      throw error
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    try {
      const notifications = await this.getUserNotifications(userId, 100)

      await Promise.all(
        notifications.documents.filter((notif: any) => !notif.isRead).map((notif: any) => this.markAsRead(notif.$id)),
      )

      return true
    } catch (error) {
      console.error("Mark all as read error:", error)
      throw error
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    let closed = false
    let subscription: { close?: () => Promise<void> | void } | null = null
    void ensureRealtimeAuthenticated().then((authenticated) => {
      if (!authenticated || closed) return null
      return realtime.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.NOTIFICATIONS}.documents`, (event: any) => {
        const notification = event?.payload || event?.data || event
        if (!closed && notification?.userId === userId) callback(notification)
      })
    }).then((nextSubscription) => {
      if (!nextSubscription) return
      if (closed) void nextSubscription.close?.()
      else subscription = nextSubscription
    }).catch((error) => {
      if (!closed && process.env.NODE_ENV === 'development') console.warn('Realtime notification subscription unavailable:', error)
    })
    return () => {
      closed = true
      void subscription?.close?.()
    }
  },
}

// Analytics Service
export const analyticsService = {
  /**
   * Track study time
   */
  async trackStudyTime(userId: string, podId: string, duration: number, subject?: string) {
    try {
      // For now, store in user profile or create an analytics collection
      const profile = await profileService.getProfile(userId)
      
      // Create activity log entry
      await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
        userId,
        type: "activity_log",
        message: `Studied for ${Math.floor(duration / 60)} minutes`,
        metadata: JSON.stringify({ podId, duration, subject, type: "study" }),
        timestamp: new Date().toISOString(),
      })

      return { success: true, duration }
    } catch (error) {
      console.error("Track study time error:", error)
      throw error
    }
  },

  /**
   * Track user activity
   */
  async trackActivity(userId: string, action: string, metadata: any = {}) {
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
        userId,
        type: "activity_log",
        message: action,
        metadata: JSON.stringify({ ...metadata, action, timestamp: new Date().toISOString() }),
        timestamp: new Date().toISOString(),
      })

      return { success: true }
    } catch (error) {
      console.error("Track activity error:", error)
      return { success: false }
    }
  },

  /**
   * Get study stats for user
   */
  async getStudyStats(userId: string, startDate?: string, endDate?: string) {
    try {
      // Get user's pods
      const pods = await podService.getUserPods(userId, 100, 0)
      
      // Get calendar events (study sessions)
      const events = await calendarService.getUserEvents(userId, startDate, endDate)
      
      // Calculate stats
      const totalPods = pods.documents.length
      const totalStudySessions = events.documents.filter((e: any) => e.type === "study").length
      const completedSessions = events.documents.filter((e: any) => e.isCompleted).length
      
      return {
        totalPods,
        totalStudySessions,
        completedSessions,
        completionRate: totalStudySessions > 0 ? (completedSessions / totalStudySessions) * 100 : 0,
        events: events.documents,
      }
    } catch (error) {
      console.error("Get study stats error:", error)
      return { totalPods: 0, totalStudySessions: 0, completedSessions: 0, completionRate: 0, events: [] }
    }
  },

  /**
   * Get activity log
   */
  async getActivityLog(userId: string, limit = 50, offset = 0) {
    try {
      const activities = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
        Query.equal("userId", userId),
        Query.equal("type", "activity_log"),
        Query.orderDesc("timestamp"),
        Query.limit(limit),
        Query.offset(offset),
      ])

      return activities
    } catch (error) {
      console.error("Get activity log error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get pod statistics
   */
  async getPodStats(podId: string) {
    try {
      const pod = await podService.getPodDetails(podId)
      const members = await podService.getPodMembers(podId, 100)
      const events = await calendarService.getPodEvents(podId, 100, 0)
      
      // Get messages count
      let messagesCount = 0
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId),
        ])
        
        if (chatRooms.documents.length > 0) {
          const messages = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
            Query.equal("roomId", chatRooms.documents[0].$id),
          ])
          messagesCount = messages.total
        }
      } catch (e) {
        console.error("Failed to get messages count:", e)
      }

      return {
        memberCount: members.total,
        eventsCount: events.documents.length,
        messagesCount,
        createdAt: pod.createdAt,
        activity: "active", // Could calculate based on last message/event
      }
    } catch (error) {
      console.error("Get pod stats error:", error)
      return { memberCount: 0, eventsCount: 0, messagesCount: 0, activity: "unknown" }
    }
  },

  /**
   * Get resource usage stats
   */
  async getResourceStats(userId: string) {
    try {
      // Get user's uploaded resources
      const resources = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
        Query.equal("authorId", userId),
      ])

      return {
        totalResources: resources.total,
        resources: resources.documents,
      }
    } catch (error) {
      console.error("Get resource stats error:", error)
      return { totalResources: 0, resources: [] }
    }
  },

  /**
   * Get achievement progress
   */
  async getAchievementProgress(userId: string) {
    try {
      const profile = await profileService.getProfile(userId)
      
      return {
        level: profile?.level || 1,
        totalPoints: profile?.totalPoints || 0,
        studyStreak: profile?.studyStreak || 0,
        badges: profile?.badges || [],
      }
    } catch (error) {
      console.error("Get achievement progress error:", error)
      return { level: 1, totalPoints: 0, studyStreak: 0, badges: [] }
    }
  },

  /**
   * Generate analytics report
   */
  async generateReport(userId: string, startDate: string, endDate: string) {
    try {
      const studyStats = await this.getStudyStats(userId, startDate, endDate)
      const activityLog = await this.getActivityLog(userId, 100, 0)
      const achievements = await this.getAchievementProgress(userId)
      const resourceStats = await this.getResourceStats(userId)

      return {
        period: { startDate, endDate },
        studyStats,
        achievements,
        resourceStats,
        activityLog: activityLog.documents,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Generate report error:", error)
      throw error
    }
  },

  /**
   * Export analytics (placeholder - would need actual PDF/CSV generation)
   */
  async exportAnalytics(userId: string, format: "pdf" | "csv" = "csv") {
    try {
      const report = await this.generateReport(userId, "", "")
      
      // For CSV format, convert to CSV string
      if (format === "csv") {
        const csv = `User Analytics Report
Generated: ${report.generatedAt}

Study Stats:
Total Pods: ${report.studyStats.totalPods}
Total Sessions: ${report.studyStats.totalStudySessions}
Completed: ${report.studyStats.completedSessions}
Completion Rate: ${report.studyStats.completionRate}%

Achievements:
Level: ${report.achievements.level}
Points: ${report.achievements.totalPoints}
Streak: ${report.achievements.studyStreak} days
Badges: ${report.achievements.badges.length}

Resources:
Total: ${report.resourceStats.totalResources}
`
        return { format: "csv", data: csv, filename: `analytics-${userId}-${Date.now()}.csv` }
      }

      return { format, data: JSON.stringify(report, null, 2), filename: `analytics-${userId}-${Date.now()}.json` }
    } catch (error) {
      console.error("Export analytics error:", error)
      throw error
    }
  },

  /**
   * Update learning goals (stored in profile)
   */
  async updateLearningGoals(userId: string, goals: string[]) {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
        learningGoals: goals,
      })

      return { success: true, goals }
    } catch (error) {
      console.error("Update learning goals error:", error)
      throw error
    }
  },

  /**
   * Track goal progress
   */
  async trackGoalProgress(userId: string, goalId: string, progress: number) {
    try {
      await this.trackActivity(userId, "Goal Progress Updated", {
        goalId,
        progress,
        timestamp: new Date().toISOString(),
      })

      return { success: true, goalId, progress }
    } catch (error) {
      console.error("Track goal progress error:", error)
      throw error
    }
  },
}

export default client
