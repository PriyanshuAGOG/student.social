import { Client, Account, Databases, Storage, Teams, Avatars, Functions, Messaging, Query } from "appwrite"
import { rankPodsForUser } from "./pod-matching"

// Debug function to log initialization
const debugLog = (message: string, data?: any) => {
  if (typeof window !== "undefined") {
    console.log(`[Appwrite] ${message}`, data || "")
  }
}

// Initialize Appwrite Client with your credentials
const endpoint = typeof window !== "undefined" 
  ? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT 
  : process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  : process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

debugLog("Initializing with endpoint:", endpoint)
debugLog("Initializing with project:", projectId)

const client = new Client()
export { client }

if (!endpoint) {
  console.error("[Appwrite] ERROR: NEXT_PUBLIC_APPWRITE_ENDPOINT not set in environment")
}
if (!projectId) {
  console.error("[Appwrite] ERROR: NEXT_PUBLIC_APPWRITE_PROJECT_ID not set in environment")
}

client
  .setEndpoint(endpoint || "https://fra.cloud.appwrite.io/v1")
  .setProject(projectId || "68921a0d00146e65d29b")

debugLog("Client initialized successfully")

// Initialize Appwrite services with proper client
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const teams = new Teams(client)
export const avatars = new Avatars(client)
export const functions = new Functions(client)
export const messaging = new Messaging(client)
const matchCache = new Map<string, { timestamp: number; data: any[] }>()
const MATCH_CACHE_TTL = 1000 * 60 * 5 // 5 minutes

// Verify Account service has methods
debugLog("Account service methods:", Object.keys(account).slice(0, 5))

// Database and Collection IDs - You'll need to create these in Appwrite
export const DATABASE_ID = "peerspark-main-db"
export const COLLECTIONS = {
  PROFILES: "profiles",
  POSTS: "posts",
  MESSAGES: "messages",
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
      // Create user account (use SDK when available, otherwise fallback to REST)
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
            await (account as any).createVerification(typeof window !== 'undefined' ? window.location.origin + '/verify-email' : '/')
          } else {
            await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': projectId || '' },
              body: JSON.stringify({ url: (typeof window !== 'undefined' ? window.location.origin + '/verify-email' : '/') }),
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
        await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
          userId: user.$id,
          name: name,
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
      } catch (profileError: any) {
        // Profile creation might fail due to permissions - this is OK for now
        // The profile will be created on first login instead
        console.warn("Profile creation deferred to first login:", profileError?.message || profileError)
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

      // Create new session (use SDK when available, otherwise fallback to REST)
      // Note: Don't delete existing session first - it causes 401 errors if no session exists
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

      // Check email verification (optional - can be disabled for testing)
      if (user) {
        const verified = user?.emailVerification === true
          || user?.emailVerified === true
          || user?.status === 'verified'
          || user?.status === true
          || user?.status === 1
        
        // Uncomment below to enforce email verification
        // if (!verified) {
        //   try { await account.deleteSession('current') } catch (e) {}
        //   throw new Error('Please verify your email address before logging in')
        // }

        // Try to update profile status, create profile if it doesn't exist
        try {
          await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
            isOnline: true,
            lastSeen: new Date().toISOString(),
          })
        } catch (profileError: any) {
          // Profile might not exist - try to create it
          if (profileError?.code === 404 || profileError?.message?.includes('not be found')) {
            console.log("Profile not found, creating new profile:", user.$id)
            try {
              await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
                userId: user.$id,
                name: user.name || email.split('@')[0],
                email: email,
                bio: "",
                interests: [],
                avatar: "",
                joinedAt: new Date().toISOString(),
                isOnline: true,
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
            } catch (createError) {
              console.warn("Failed to create profile on login:", createError)
            }
          } else {
            console.warn("Failed to update user status:", profileError)
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

  // OAuth login (Google, GitHub, etc.)
  async loginWithOAuth(provider: string) {
    try {
      if (typeof window === "undefined") {
        throw new Error("OAuth login only works in browser")
      }

      return await account.createOAuth2Session(
        provider as any,
        `${window.location.origin}/app/feed`,
        `${window.location.origin}/login`,
      )
    } catch (error: any) {
      console.error("OAuth login error:", error)
      throw new Error(error?.message || "OAuth login failed")
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      return await account.get()
    } catch (error) {
      return null
    }
  },

  // Get current user profile
  async getCurrentUserProfile() {
    try {
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
      const user = await account.get()

      // Update user offline status
      if (user) {
        try {
          await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
            isOnline: false,
            lastSeen: new Date().toISOString(),
          })
        } catch (updateError) {
          console.warn("Failed to update offline status:", updateError)
        }
      }

      // Delete session
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

  // Request password reset
  async requestPasswordReset(email: string) {
    try {
      if (account && typeof (account as any).createRecovery === 'function') {
        return await (account as any).createRecovery(email, `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`)
      } else {
        const resp = await fetch((endpoint || "https://fra.cloud.appwrite.io/v1") + '/account/recovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId || ''
          },
          body: JSON.stringify({ email, url: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password` }),
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

  // Resend verification email (best-effort)
  async resendVerification(email?: string) {
    try {
      if (account && typeof (account as any).createVerification === 'function') {
        return await (account as any).createVerification(typeof window !== 'undefined' ? window.location.origin + '/verify-email' : '/')
      } else {
        const body: any = { url: (typeof window !== 'undefined' ? window.location.origin + '/verify-email' : '/') }
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

// Profile Functions
export const profileService = {
  // Get user profile
  async getProfile(userId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId)
    } catch (error: any) {
      // Profile not found is expected for new users
      if (error?.code === 404 || error?.message?.includes('not found')) {
        console.warn("Profile not found for user:", userId)
        return null
      }
      console.error("Get profile error:", error)
      return null
    }
  },

  // Update user profile (create if doesn't exist)
  async updateProfile(userId: string, data: any) {
    const safeAttributes = ['name', 'bio', 'avatar', 'email', 'isOnline', 'studyStreak', 'totalPoints', 'level', 'badges', 'avatarFileId']
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
      if (error?.code === 404 || error?.message?.includes('not found')) {
        console.warn("Profile not found, creating new profile:", userId)
        try {
          return await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
            userId: userId,
            name: data.name || "",
            email: "",
            bio: data.bio || "",
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
      console.error("Update profile error:", error)
      throw error
    }
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string) {
    try {
      // Delete old avatar if exists
      try {
        const profile = await this.getProfile(userId)
        if (profile?.avatarFileId) {
          await storage.deleteFile(BUCKETS.AVATARS, profile.avatarFileId)
        }
      } catch (e) {
        // Ignore if no old avatar
      }

      // Upload new avatar
      const uploaded = await storage.createFile(BUCKETS.AVATARS, "unique()", file)
      const avatarUrl = storage.getFileView(BUCKETS.AVATARS, uploaded.$id)

      // Update profile with new avatar
      await this.updateProfile(userId, {
        avatar: avatarUrl.toString(),
        avatarFileId: uploaded.$id,
      })

      return avatarUrl.toString()
    } catch (error) {
      console.error("Upload avatar error:", error)
      throw error
    }
  },

  // Get all profiles (for search, leaderboard, etc.)
  async getAllProfiles(limit = 50, offset = 0) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [])
    } catch (error) {
      console.error("Get all profiles error:", error)
      throw error
    }
  },
}

// Pod/Team Functions
export const podService = {
  // Create new pod
  // Note: Database schema only has: teamId, name, description, creatorId, members, subject, difficulty, isActive, isPublic, createdAt, memberCount
  async createPod(name: string, description: string, userId: string, metadata: any = {}) {
    try {
      // Create team in Appwrite Teams
      const team = await teams.create("unique()", name, [userId])

      // Store pod metadata in database (only attributes that exist in schema)
      const pod = await databases.createDocument(DATABASE_ID, COLLECTIONS.PODS, team.$id, {
        teamId: team.$id,
        name: name,
        description: description,
        creatorId: userId,
        members: [userId], // Must be an array, not JSON string
        subject: metadata.subject || "",
        difficulty: metadata.difficulty || "Beginner",
        isActive: true,
        isPublic: metadata.isPublic !== false,
        createdAt: new Date().toISOString(),
        memberCount: 1,
        idealLearnerType: metadata.idealLearnerType || [],
        sessionType: metadata.sessionType || [],
        averageSessionLength: metadata.averageSessionLength || null,
        commonAvailability: metadata.commonAvailability || [],
        matchingTags: metadata.matchingTags || [],
      })

      // Create default chat room for the pod
      // Note: chat_rooms schema has: type, podId, name, createdAt, isActive
      await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, `${team.$id}_general`, {
        podId: team.$id,
        name: "General",
        type: "pod",
        createdAt: new Date().toISOString(),
        isActive: true,
      })

      return { team, pod }
    } catch (error) {
      console.error("Create pod error:", error)
      throw error
    }
  },

  // Join pod
  async joinPod(podId: string, userId: string) {
    try {
      // Add user to team
      const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/pod-invite` : 'https://example.com/pod-invite'
      await teams.createMembership(podId, [], inviteUrl, userId)

      // Update pod member count and list
      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      // Handle members as array (new format) or JSON string (legacy)
      let currentMembers: string[] = []
      if (Array.isArray(pod.members)) {
        currentMembers = pod.members
      } else if (typeof pod.members === 'string') {
        try { currentMembers = JSON.parse(pod.members) } catch { currentMembers = [] }
      }
      const updatedMembers = [...new Set([...currentMembers, userId])] // Avoid duplicates

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        memberCount: updatedMembers.length,
        members: updatedMembers, // Store as array, not JSON string
      })

      // Create notification for pod creator
      await notificationService.createNotification(
        pod.creatorId,
        "New Member Joined",
        `Someone joined your pod "${pod.name}"`,
        "pod_join",
        { podId, userId },
      )

      return true
    } catch (error) {
      console.error("Join pod error:", error)
      throw error
    }
  },

  // Leave pod
  async leavePod(podId: string, userId: string) {
    try {
      // Get user's membership and remove from team
      const memberships = await teams.listMemberships(podId)
      const membership = memberships.memberships.find((m) => m.userId === userId)

      if (membership) {
        await teams.deleteMembership(podId, membership.$id)
      }

      // Update pod member count and list
      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      // Handle members as array (new format) or JSON string (legacy)
      let currentMembers: string[] = []
      if (Array.isArray(pod.members)) {
        currentMembers = pod.members
      } else if (typeof pod.members === 'string') {
        try { currentMembers = JSON.parse(pod.members) } catch { currentMembers = [] }
      }
      const updatedMembers = currentMembers.filter((id: string) => id !== userId)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        memberCount: Math.max(0, updatedMembers.length),
        members: updatedMembers, // Store as array, not JSON string
        updatedAt: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error("Leave pod error:", error)
      throw error
    }
  },

  // Get user's pods
  async getUserPods(userId: string) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PODS, [Query.contains('members', userId)])
    } catch (error) {
      console.error("Get user pods error:", error)
      return { documents: [] }
    }
  },

  // Get all public pods
  async getAllPods(limit = 50, offset = 0, filters: any = {}) {
    try {
      const queries = [Query.equal('isPublic', true), Query.equal('isActive', true)]

      if (filters.subject) queries.push(Query.equal('subject', filters.subject))
      if (filters.difficulty) queries.push(Query.equal('difficulty', filters.difficulty))
      if (filters.search) queries.push(Query.contains('name', filters.search))

      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PODS, queries)
    } catch (error) {
      console.error("Get all pods error:", error)
      return { documents: [] }
    }
  },

  // Get pod details
  async getPodDetails(podId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
    } catch (error) {
      console.error("Get pod details error:", error)
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
        return next
      }

      const created = await databases.createDocument(DATABASE_ID, "pod_reactions", "unique()", {
        podId,
        itemId,
        itemType,
        userId,
        count: Math.max(1, delta),
        updatedAt: new Date().toISOString(),
      })
      return created.count || delta
    } catch (err) {
      console.warn("incrementReaction failed", err)
      throw err
    }
  },

  async getPledge(podId: string, userId: string) {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_COMMITMENTS, [
        Query.equal("podId", podId),
        Query.equal("userId", userId),
      ])
      return res.documents[0] || null
    } catch (err: any) {
      // Gracefully handle missing collection
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        return null
      }
      console.warn("getPledge failed", err)
      return null
    }
  },

  async savePledge(podId: string, userId: string, pledge: string) {
    try {
      const existing = await this.getPledge(podId, userId)
      const payload = {
        podId,
        userId,
        pledge,
        weekOf: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      }

      if (existing) {
        return await databases.updateDocument(DATABASE_ID, COLLECTIONS.POD_COMMITMENTS, existing.$id, payload)
      }

      return await databases.createDocument(DATABASE_ID, COLLECTIONS.POD_COMMITMENTS, "unique()", {
        ...payload,
        createdAt: new Date().toISOString(),
      })
    } catch (err: any) {
      // Gracefully handle missing collection
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        console.warn("savePledge: Collection not found")
        return null
      }
      console.error("savePledge failed", err)
      throw err
    }
  },

  async listCheckIns(podId: string, limit = 20, offset = 0) {
    try {
      const queries = [
        Query.equal("podId", podId),
        Query.orderDesc("createdAt"),
      ]
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_CHECK_INS, queries)
    } catch (err: any) {
      // Gracefully handle missing collection
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        return { documents: [], total: 0 }
      }
      console.warn("listCheckIns failed", err)
      return { documents: [], total: 0 }
    }
  },

  async addCheckIn(podId: string, userId: string, note: string, userName?: string) {
    try {
      return await databases.createDocument(DATABASE_ID, COLLECTIONS.POD_CHECK_INS, "unique()", {
        podId,
        userId,
        note,
        userName: userName || "Member",
        createdAt: new Date().toISOString(),
      })
    } catch (err: any) {
      // Gracefully handle missing collection
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        console.warn("addCheckIn: Collection not found")
        return null
      }
      console.error("addCheckIn failed", err)
      throw err
    }
  },

  async listRsvps(podId: string) {
    try {
      const queries = [
        Query.equal("podId", podId),
        Query.orderDesc("updatedAt"),
      ]
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.POD_RSVPS, queries)
    } catch (err: any) {
      // Gracefully handle missing collection
      if (err?.code === 404 || err?.message?.includes('could not be found')) {
        return { documents: [], total: 0 }
      }
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
      console.error("upsertPlan failed", err)
      throw err
    }
  },
}

// Chat/Messaging Functions
export const chatService = {
  // Send message to pod or direct chat
  // Note: messages schema has: roomId, authorId, content, type, timestamp, isEdited, replyTo, fileUrl, reactions
  async sendMessage(roomId: string, userId: string, content: string, type = "text", metadata: any = {}) {
    try {
      const message = await databases.createDocument(DATABASE_ID, COLLECTIONS.MESSAGES, "unique()", {
        roomId: roomId,
        authorId: userId,
        content: content,
        type: type, // text, image, file, audio, video
        timestamp: new Date().toISOString(),
        isEdited: false,
        replyTo: metadata.replyTo || null,
        fileUrl: metadata.fileUrl || null,
        reactions: [], // Must be an array per Appwrite schema
      })

      return message
    } catch (error) {
      console.error("Send message error:", error)
      throw error
    }
  },

  // Get messages for a room/chat
  async getMessages(roomId: string, limit = 50, offset = 0) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [Query.equal('roomId', roomId)])
    } catch (error) {
      console.error("Get messages error:", error)
      return { documents: [] }
    }
  },

  // Subscribe to real-time messages using client subscription
  subscribeToMessages(roomId: string, callback: (message: any) => void) {
    // For now, we'll use polling instead of real-time subscriptions
    // In production, you'd set up Appwrite realtime subscriptions
    const pollMessages = async () => {
      try {
        const messages = await this.getMessages(roomId, 1)
        if (messages.documents.length > 0) {
          callback(messages.documents[0])
        }
      } catch (error) {
        console.error("Poll messages error:", error)
      }
    }

    const interval = setInterval(pollMessages, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  },

  // Upload file attachment
  async uploadAttachment(file: File, userId: string) {
    try {
      const uploaded = await storage.createFile(BUCKETS.ATTACHMENTS, "unique()", file)
      const fileUrl = storage.getFileView(BUCKETS.ATTACHMENTS, uploaded.$id)

      return {
        fileId: uploaded.$id,
        fileUrl: fileUrl.toString(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }
    } catch (error) {
      console.error("Upload attachment error:", error)
      throw error
    }
  },

  // Create or get direct message room
  async getOrCreateDirectRoom(userId1: string, userId2: string) {
    try {
      // Create consistent room ID
      const roomId = [userId1, userId2].sort().join("_")

      try {
        // Try to get existing room
        return await databases.getDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, roomId)
      } catch (e) {
        // Create new room if doesn't exist
        // Note: Only include fields that exist in the schema
        return await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, roomId, {
          type: "direct",
          name: "Direct Message",
          podId: null, // Use null for direct messages
          createdAt: new Date().toISOString(),
          isActive: true,
        })
      }
    } catch (error) {
      console.error("Get or create direct room error:", error)
      throw error
    }
  },

  // Get user's chat rooms
  async getUserChatRooms(userId: string) {
    try {
      // Get pod rooms
      const userPods = await podService.getUserPods(userId)
      const podRooms = await Promise.all(
        userPods.documents.map(async (pod: any) => {
          try {
            return await databases.getDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, `${pod.teamId}_general`)
          } catch (e) {
            return null
          }
        }),
      )

      // Get direct message rooms - query by type only since participants may not be indexed
      // Then filter client-side for rooms that include this user
      let directRooms: any[] = []
      try {
        const allDirectRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("type", "direct"),
        ])
        // Filter rooms where user is a participant (handle both array and string formats)
        directRooms = (allDirectRooms.documents || []).filter((room: any) => {
          const participants = room.participants || []
          if (Array.isArray(participants)) {
            return participants.includes(userId)
          }
          // Handle JSON string format
          if (typeof participants === 'string') {
            try {
              const parsed = JSON.parse(participants)
              return Array.isArray(parsed) && parsed.includes(userId)
            } catch {
              return false
            }
          }
          return false
        })
      } catch (e) {
        console.warn("Failed to fetch direct rooms:", e)
      }

      return {
        podRooms: podRooms.filter((room) => room !== null),
        directRooms: directRooms,
      }
    } catch (error) {
      console.error("Get user chat rooms error:", error)
      return { podRooms: [], directRooms: [] }
    }
  },
}

// Resource/File Functions
export const resourceService = {
  // Upload resource
  async uploadResource(file: File, metadata: any) {
    try {
      const uploaded = await storage.createFile(BUCKETS.RESOURCES, "unique()", file)
      const fileUrl = storage.getFileView(BUCKETS.RESOURCES, uploaded.$id)

      const resource = await databases.createDocument(DATABASE_ID, COLLECTIONS.RESOURCES, "unique()", {
        fileId: uploaded.$id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: fileUrl.toString(),
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
        authorId: metadata.authorId,
        podId: metadata.podId || null,
        visibility: metadata.visibility || "public", // public, pod, private
        category: metadata.category || "other",
        uploadedAt: new Date().toISOString(),
        downloads: 0,
        likes: 0,
        views: 0,
        isApproved: true, // Auto-approve for now
      })

      return resource
    } catch (error) {
      console.error("Upload resource error:", error)
      throw error
    }
  },

  // Get resources with filters
  async getResources(filters: any = {}, limit = 50, offset = 0) {
    try {
      const queries: string[] = []

      if (filters.authorId) queries.push(Query.equal("authorId", filters.authorId))
      if (filters.podId) queries.push(Query.equal("podId", filters.podId))
      if (filters.visibility) queries.push(Query.equal("visibility", filters.visibility))
      if (filters.category) queries.push(Query.equal("category", filters.category))
      if (filters.search) queries.push(Query.contains("title", filters.search))
      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset))
      queries.push(Query.orderDesc("uploadedAt"))

      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, queries)
    } catch (error) {
      console.error("Get resources error:", error)
      return { documents: [] }
    }
  },

  // Download resource
  async downloadResource(resourceId: string) {
    try {
      const resource = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)

      // Increment download count
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId, {
        downloads: resource.downloads + 1,
      })

      return storage.getFileDownload(BUCKETS.RESOURCES, resource.fileId)
    } catch (error) {
      console.error("Download resource error:", error)
      throw error
    }
  },
}

// Feed/Posts Functions
export const feedService = {
  // Create post
  // Note: posts schema has: authorId, content, type, podId, timestamp, likes, comments, imageUrl, visibility, tags, likedBy
  async createPost(authorId: string, content: string, type = "text", metadata: any = {}) {
    try {
      return await databases.createDocument(DATABASE_ID, COLLECTIONS.POSTS, "unique()", {
        authorId: authorId,
        content: content,
        type: type, // text, image, resource, achievement, poll
        podId: metadata.podId || null,
        imageUrl: metadata.imageUrl || null,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        likedBy: [], // Must be an array, not JSON string
        visibility: metadata.visibility || "public", // public, pod, followers
        tags: metadata.tags || [], // Must be an array, not JSON string
      })
    } catch (error) {
      console.error("Create post error:", error)
      throw error
    }
  },

  // Get posts by user ID
  async getUserPosts(userId: string, limit = 50, offset = 0) {
    try {
      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [Query.equal('authorId', userId)])
    } catch (error) {
      console.error("Get user posts error:", error)
      return { documents: [] }
    }
  },

  // Get feed posts
  async getFeedPosts(userId?: string, limit = 20, offset = 0) {
    try {
      // Fetch public posts
      const publicPosts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POSTS,
        [Query.equal('visibility', 'public')]
      )

      // Optionally fetch pod posts if user has pods
      let podPosts: any = { documents: [] }
      if (userId) {
        const userPods = await podService.getUserPods(userId)
        const podIds = userPods.documents.map((pod: any) => pod.teamId)
        if (podIds.length > 0) {
          podPosts = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.POSTS,
            [Query.equal('visibility', 'pod')]
          )
        }
      }

      // Merge and sort by timestamp desc
      const combined = [...(publicPosts?.documents || []), ...(podPosts?.documents || [])]
      combined.sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || ''))

      return { documents: combined }
    } catch (error) {
      console.error("Get feed posts error:", error)
      return { documents: [] }
    }
  },

  // Like/unlike post
  async toggleLike(postId: string, userId: string) {
    try {
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)
      const currentLikes = post.likes || 0
      const likedBy = post.likedBy || []

      const isLiked = likedBy.includes(userId)
      const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1
      const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        likes: newLikes,
        likedBy: newLikedBy,
      })
    } catch (error) {
      console.error("Toggle like error:", error)
      throw error
    }
  },

  // Subscribe to real-time posts
  subscribeToFeed(callback: (post: any) => void) {
    // For now, we'll use polling instead of real-time subscriptions
    const pollPosts = async () => {
      try {
        const posts = await this.getFeedPosts(undefined, 1)
        if (posts.documents.length > 0) {
          callback(posts.documents[0])
        }
      } catch (error) {
        console.error("Poll posts error:", error)
      }
    }

    const interval = setInterval(pollPosts, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  },

  // Get saved posts for a user
  async getSavedPosts(userId: string, limit = 50, offset = 0) {
    try {
      // Get posts where the user has bookmarked them
      // Note: This assumes posts have a savedBy array field or we store saved posts separately
      const posts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POSTS,
        []
      )
      
      // Filter posts that the user has saved (bookmarked)
      // For now, we'll try to find posts with savedBy array containing userId
      const savedPosts = posts.documents.filter((post: any) => {
        const savedBy = post.savedBy || post.bookmarkedBy || []
        return savedBy.includes(userId)
      })
      
      return { documents: savedPosts }
    } catch (error) {
      console.error("Get saved posts error:", error)
      return { documents: [] }
    }
  },

  // Save/unsave a post (bookmark)
  async toggleSavePost(postId: string, userId: string) {
    try {
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)
      const savedBy = post.savedBy || post.bookmarkedBy || []
      
      const isSaved = savedBy.includes(userId)
      const newSavedBy = isSaved 
        ? savedBy.filter((id: string) => id !== userId) 
        : [...savedBy, userId]
      
      return await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        savedBy: newSavedBy,
      })
    } catch (error) {
      console.error("Toggle save post error:", error)
      throw error
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
      return await databases.createDocument(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, "unique()", {
        userId: userId,
        title: title,
        startTime: startTime,
        endTime: endTime,
        type: metadata.type || "study", // study, meeting, deadline, exam
        podId: metadata.podId || null,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      })
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
    } catch (error) {
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
      return await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
        userId: userId,
        title: title,
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
    // For now, we'll use polling instead of real-time subscriptions
    const pollNotifications = async () => {
      try {
        const notifications = await this.getUserNotifications(userId, 1)
        if (notifications.documents.length > 0) {
          callback(notifications.documents[0])
        }
      } catch (error) {
        console.error("Poll notifications error:", error)
      }
    }

    const interval = setInterval(pollNotifications, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  },
}

// Jitsi Integration for Video Calls
export const jitsiService = {
  // Generate Jitsi meeting URL
  generateMeetingUrl(roomName: string, displayName: string, options: any = {}) {
    const domain = "meet.jit.si" // Free Jitsi server
    const config = {
      roomName: roomName.replace(/[^a-zA-Z0-9]/g, ""), // Clean room name
      width: options.width || "100%",
      height: options.height || "600px",
      parentNode: options.parentNode || document.body,
      configOverwrite: {
        startWithAudioMuted: options.startMuted || false,
        startWithVideoMuted: options.startVideoMuted || false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        ...options.config,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "chat",
          "recording",
          "livestreaming",
          "etherpad",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "invite",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
          "videobackgroundblur",
          "download",
          "help",
          "mute-everyone",
        ],
        ...options.interfaceConfig,
      },
      userInfo: {
        displayName: displayName,
        email: options.email || "",
      },
    }

    return {
      url: `https://${domain}/${config.roomName}`,
      config: config,
      embedUrl: `https://${domain}/${config.roomName}#config.startWithAudioMuted=${config.configOverwrite.startWithAudioMuted}&config.startWithVideoMuted=${config.configOverwrite.startWithVideoMuted}`,
    }
  },

  // Create meeting for pod
  async createPodMeeting(podId: string, userId: string, title: string) {
    try {
      const pod = await podService.getPodDetails(podId)
      const user = await profileService.getProfile(userId)
      
      if (!user) {
        throw new Error("User profile not found")
      }

      const roomName = `peerspark-${podId}-${Date.now()}`
      const meeting = this.generateMeetingUrl(roomName, user.name, {
        startMuted: true,
        startVideoMuted: false,
      })

      // Create calendar event for the meeting
      await calendarService.createEvent(
        userId,
        `${title} - ${pod.name}`,
        new Date().toISOString(),
        new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        {
          podId: podId,
          meetingUrl: meeting.url,
          type: "meeting",
        }
      )

      // Notify pod members
      await Promise.all(
        pod.members
          .filter((memberId: string) => memberId !== userId)
          .map((memberId: string) =>
            notificationService.createNotification(
              memberId,
              "Meeting Started",
              `${user.name} started a meeting in ${pod.name}`,
              "meeting",
              {
                actionUrl: meeting.url,
                podId: podId,
              }
            ),
          ),
      )

      return meeting
    } catch (error) {
      console.error("Create pod meeting error:", error)
      throw error
    }
  },

  // Create direct meeting
  async createDirectMeeting(userId1: string, userId2: string) {
    try {
      const user1 = await profileService.getProfile(userId1)
      const user2 = await profileService.getProfile(userId2)
      
      if (!user1 || !user2) {
        throw new Error("One or both users not found")
      }

      const roomName = `peerspark-direct-${[userId1, userId2].sort().join("-")}-${Date.now()}`
      const meeting = this.generateMeetingUrl(roomName, user1.name)

      // Notify the other user
      await notificationService.createNotification(userId2, "Video Call", `${user1.name} is calling you`, "call", {
        actionUrl: meeting.url,
        callerId: userId1,
      })

      return meeting
    } catch (error) {
      console.error("Create direct meeting error:", error)
      throw error
    }
  },
}

export default client
