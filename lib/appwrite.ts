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
  COMMENTS: "comments",
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
        console.log(`[register] Creating profile for user: ${user.$id}, name: ${name}, email: ${email}`)
        const profile = await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
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
        console.log(`[register] Profile created successfully:`, { id: profile.$id, name: profile.name })
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

      // First, check if there's already an active session
      try {
        const currentUser = await account.get()
        if (currentUser) {
          // Already logged in, return existing session info
          console.log("User already has an active session")
          return { userId: currentUser.$id, $id: 'existing-session' }
        }
      } catch (e) {
        // No active session, proceed with login
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
          console.log(`[login] Updated profile status for user: ${user.$id}`)
        } catch (profileError: any) {
          // Profile might not exist - try to create it
          if (profileError?.code === 404 || profileError?.message?.includes('not be found')) {
            console.log(`[login] Profile not found for user ${user.$id}, creating new profile`)
            try {
              const newProfile = await databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id, {
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
              console.log(`[login] Profile created successfully:`, { id: newProfile.$id, name: newProfile.name })
            } catch (createError) {
              console.error("[login] Failed to create profile:", createError)
            }
          } else {
            console.warn("[login] Failed to update user status:", profileError)
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
      console.log(`[getProfile] Attempting to fetch profile for user: ${userId}`)
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId)
      console.log(`[getProfile] Successfully fetched profile:`, { 
        userId: profile.$id, 
        name: profile.name,
        email: profile.email 
      })
      return profile
    } catch (error: any) {
      // Profile not found is expected for new users
      if (error?.code === 404 || error?.message?.includes('not found')) {
        console.warn(`[getProfile] Profile not found for user: ${userId}. This may indicate the profile was not created during registration.`)
        return null
      }
      console.error(`[getProfile] Error fetching profile for user ${userId}:`, error)
      return null
    }
  },

  // Get profile by username (search by name with underscores converted to spaces)
  async getProfileByUsername(username: string) {
    try {
      // Convert username format (john_doe) to name format (john doe) for search
      const searchName = username.replace(/_/g, " ")
      
      // Search for profile by name - fetch ALL profiles to ensure we find the user
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [
          Query.limit(5000) // Increased limit to search through all profiles
        ]
      )
      
      // Filter results to find matching name (case-insensitive)
      const matchingProfile = result.documents.find((profile: any) => {
        const profileName = (profile.name || "").toLowerCase()
        const profileUsername = profileName.replace(/\s+/g, "_")
        return profileUsername === username.toLowerCase() || 
               profileName === searchName.toLowerCase() ||
               profile.email?.split("@")[0]?.toLowerCase() === username.toLowerCase()
      })
      
      return matchingProfile || null
    } catch (error) {
      console.error("Get profile by username error:", error)
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

      // Create notification
      try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
          userId: followingId,
          type: "follow",
          actor: followerId,
          actorName: followerProfile.name,
          actorAvatar: followerProfile.avatar,
          message: `${followerProfile.name} started following you`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Failed to create notification:", e)
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
      console.error("Check following error:", error)
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
      if (!name || !name.trim()) {
        throw new Error("Pod name is required")
      }

      if (name.length > 100) {
        throw new Error("Pod name too long (max 100 characters)")
      }

      // Upload pod image if provided
      let imageUrl = ""
      if (metadata.image) {
        try {
          const response = await storage.createFile(BUCKETS.POD_IMAGES, "unique()", metadata.image)
          imageUrl = storage.getFileView(BUCKETS.POD_IMAGES, response.$id).toString()
        } catch (e) {
          console.error("Failed to upload pod image:", e)
        }
      }

      // Create the pod document (database-only, no Teams)
      const pod = await databases.createDocument(DATABASE_ID, COLLECTIONS.PODS, "unique()", {
        name: name.trim(),
        description: description || "",
        creatorId: userId,
        members: [userId], // Creator is first member
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

      // Create a chat room for the pod
      try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, "unique()", {
          podId: pod.$id,
          name: `${name} Chat`,
          type: "pod",
          members: [userId],
          createdAt: new Date().toISOString(),
          isActive: true,
        })
      } catch (e) {
        console.error("Failed to create pod chat room:", e)
      }

      // Send welcome message
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", pod.$id),
        ])

        if (chatRooms.documents.length > 0) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.MESSAGES, "unique()", {
            roomId: chatRooms.documents[0].$id,
            senderId: "system",
            content: `🎉 Welcome to ${name}! This is your pod's group chat.`,
            timestamp: new Date().toISOString(),
            readBy: [],
          })
        }
      } catch (e) {
        console.error("Failed to send welcome message:", e)
      }

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

      const pods = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PODS,
        [
          Query.contains("members", userId),
          Query.orderDesc("createdAt"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

      return pods
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
      const queries = [
        Query.orderDesc("createdAt"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ]

      if (filters.isPublic !== undefined) {
        queries.push(Query.equal('isPublic', filters.isPublic))
      }
      if (filters.subject) {
        queries.push(Query.equal('subject', filters.subject))
      }
      if (filters.difficulty) {
        queries.push(Query.equal('difficulty', filters.difficulty))
      }
      if (filters.search) {
        queries.push(Query.search('name', filters.search))
      }

      return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PODS, queries)
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

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      return pod
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
        const response = await storage.createFile(BUCKETS.POD_IMAGES, "unique()", updates.image)
        updateData.image = storage.getFileView(BUCKETS.POD_IMAGES, response.$id).toString()
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
            await storage.deleteFile(BUCKETS.POD_IMAGES, fileId)
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

  /**
   * Generate invite link for pod
   */
  async generateInviteLink(podId: string, userId?: string, expiryDays = 7) {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Verify user is creator or admin when userId is provided
      if (userId) {
        const admins = Array.isArray(pod.admins) ? pod.admins : []
        if (pod.creatorId !== userId && !admins.includes(userId)) {
          throw new Error("Only pod creator or admins can generate invite links")
        }
      }

      // Generate invite code
      const inviteCode = `${podId.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + expiryDays)

      // Update pod with invite code
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
        inviteCode,
        inviteExpiry: expiry.toISOString(),
      })

      return {
        inviteCode,
        inviteLink: typeof window !== 'undefined' 
          ? `${window.location.origin}/app/pods/join?code=${inviteCode}` 
          : `https://peerspark.com/app/pods/join?code=${inviteCode}`,
        expiresAt: expiry.toISOString(),
      }
    } catch (error) {
      console.error("Generate invite link error:", error)
      throw error
    }
  },

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
      // Handle authorization errors - store locally as fallback
      if (err?.code === 401 || err?.message?.includes('not authorized')) {
        console.warn("savePledge: Not authorized - saving locally as fallback")
        // Return a mock document for local storage fallback
        return { $id: `local-${Date.now()}`, podId, userId, pledge, weekOf: new Date().toISOString().slice(0, 10) }
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
      // Handle authorization errors - return mock for local fallback
      if (err?.code === 401 || err?.message?.includes('not authorized')) {
        console.warn("addCheckIn: Not authorized - using local fallback")
        return { 
          $id: `local-${Date.now()}`, 
          podId, 
          userId, 
          note, 
          userName: userName || "Member",
          createdAt: new Date().toISOString() 
        }
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

  // Update pod details (for pod owners)
  async updatePod(podId: string, userId: string, updates: { name?: string; description?: string; subject?: string; difficulty?: string; isPublic?: boolean }) {
    try {
      // Verify the user is the pod creator
      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      if (pod.creatorId !== userId) {
        throw new Error("You can only edit pods you created")
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      }

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.subject !== undefined) updateData.subject = updates.subject
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic

      // Update the pod document
      const updatedPod = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, updateData)

      // Also update the team name if it was changed
      if (updates.name) {
        try {
          await teams.updateName(podId, updates.name)
        } catch (teamError) {
          console.warn("Failed to update team name:", teamError)
        }
      }

      return updatedPod
    } catch (error) {
      console.error("Update pod error:", error)
      throw error
    }
  },

  // Delete pod (for pod owners)
  async deletePod(podId: string, userId: string) {
    try {
      // Verify the user is the pod creator
      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      if (pod.creatorId !== userId) {
        throw new Error("You can only delete pods you created")
      }

      // Delete the pod document
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PODS, podId)

      // Try to delete the team as well
      try {
        await teams.delete(podId)
      } catch (teamError) {
        console.warn("Failed to delete team:", teamError)
      }

      // Delete associated chat rooms
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId)
        ])
        for (const room of chatRooms.documents) {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, room.$id)
        }
      } catch (chatError) {
        console.warn("Failed to delete chat rooms:", chatError)
      }

      return { success: true }
    } catch (error) {
      console.error("Delete pod error:", error)
      throw error
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
  /**
   * Get or create a direct message room between two users
   */
  async getOrCreateDirectRoom(userA: string, userB: string) {
    if (!userA || !userB) throw new Error("Both user IDs are required")

    const members = [userA, userB].sort()
    const roomKey = `dm_${members[0]}_${members[1]}`

    // Try to find an existing DM room
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
        Query.equal("type", "dm"),
        Query.contains("members", members[0]),
        Query.contains("members", members[1]),
      ])

      if (existing.documents?.length) {
        return existing.documents[0]
      }
    } catch (err) {
      console.warn("DM lookup failed, will attempt to create", err)
    }

    // Create the room
    const room = await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, roomKey, {
      name: "Direct Messages",
      type: "dm",
      members,
      createdAt: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
    })

    return room
  },

  /**
   * Send a message with proper validation
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    metadata: { senderName?: string; senderAvatar?: string } = {}
  ) {
    try {
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
          senderName = profile.name || `User ${senderId.slice(0, 6)}`
          senderAvatar = profile.avatar || ""
        } catch (e) {
          senderName = `User ${senderId.slice(0, 6)}`
        }
      }

      // Create message
      const message = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        "unique()",
        {
          roomId: roomId,
          senderId: senderId,
          content: content.trim(),
          senderName: senderName,
          senderAvatar: senderAvatar,
          timestamp: new Date().toISOString(),
          readBy: [senderId],
          isEdited: false,
        }
      )

      // Update chat room's last message timestamp
      try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, roomId, {
          lastMessage: content.substring(0, 100),
          lastMessageTime: new Date().toISOString(),
          lastMessageSenderId: senderId,
        })
      } catch (e) {
        console.error("Failed to update chat room:", e)
      }

      return message
    } catch (error) {
      console.error("Send message error:", error)
      throw error
    }
  },

  /**
   * Get messages from a chat room with pagination - FIXED
   */
  async getMessages(roomId: string, limit = 50, offset = 0) {
    try {
      if (!roomId) {
        throw new Error("Room ID is required")
      }

      const messages = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
        Query.equal("roomId", roomId),
        Query.orderDesc("timestamp"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ])

      // Reverse to get chronological order
      return {
        documents: messages.documents.reverse(),
        total: messages.total,
      }
    } catch (error) {
      console.error("Get messages error:", error)
      return { documents: [], total: 0 }
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

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    try {
      if (!messageId || !userId) {
        throw new Error("Message ID and User ID are required")
      }

      const message = await databases.getDocument(DATABASE_ID, COLLECTIONS.MESSAGES, messageId)
      const readBy = Array.isArray(message.readBy) ? message.readBy : []

      if (!readBy.includes(userId)) {
        readBy.push(userId)
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.MESSAGES, messageId, {
          readBy: readBy,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Mark message as read error:", error)
      throw error
    }
  },

  /**
   * Create a direct chat room between two users
   */
  async createDirectChat(userId1: string, userId2: string) {
    try {
      if (!userId1 || !userId2) {
        throw new Error("Both user IDs are required")
      }

      // Check if chat already exists
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
        Query.equal("type", "direct"),
      ])

      const existingChat = existing.documents.find(
        (room: any) =>
          room.members &&
          room.members.length === 2 &&
          room.members.includes(userId1) &&
          room.members.includes(userId2)
      )

      if (existingChat) {
        return existingChat
      }

      // Create new direct chat
      const chatRoom = await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, "unique()", {
        type: "direct",
        members: [userId1, userId2],
        createdAt: new Date().toISOString(),
      })

      return chatRoom
    } catch (error) {
      console.error("Create direct chat error:", error)
      throw error
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
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type not allowed. Allowed: PDF, Word, Excel, Images, TXT`)
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large (max 50MB)")
      }

      // Upload file
      const response = await storage.createFile(BUCKETS.RESOURCES, "unique()", file)
      const fileUrl = storage.getFileView(BUCKETS.RESOURCES, response.$id).toString()
      const downloadUrl = storage.getFileDownload(BUCKETS.RESOURCES, response.$id).toString()

      // Create resource document
      const resource = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.RESOURCES,
        "unique()",
        {
          uploadedBy: userId,
          title: metadata.title || file.name,
          description: metadata.description || "",
          fileUrl: fileUrl,
          downloadUrl: downloadUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          podId: metadata.podId || null,
          tags: Array.isArray(metadata.tags) ? metadata.tags.slice(0, 10) : [],
          bookmarkedBy: [],
          downloads: 0,
          createdAt: new Date().toISOString(),
        }
      )

      return resource
    } catch (error) {
      console.error("Upload resource error:", error)
      throw error
    }
  },

  /**
   * Get resources with filtering
   */
  async getResources(podId?: string, limit = 50, offset = 0) {
    try {
      const queries: any[] = [
        Query.orderDesc("createdAt"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ]

      if (podId) {
        queries.push(Query.equal("podId", podId))
      }

      const resources = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, queries)

      return resources
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
   * Delete a resource
   */
  async deleteResource(resourceId: string, userId: string) {
    try {
      if (!resourceId || !userId) {
        throw new Error("Resource ID and User ID are required")
      }

      const resource = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, resourceId)

      // Verify ownership
      if (resource.uploadedBy !== userId) {
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
      visibility?: string
      podId?: string
      tags?: string[]
      authorName?: string
      authorAvatar?: string
      authorUsername?: string
    } = {}
  ) {
    try {
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
                console.log(`[createPost] Using account info: ${authorName}`)
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

      // Handle image uploads if provided
      let imageUrls: string[] = []
      if (metadata.imageFiles && metadata.imageFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          metadata.imageFiles.map(async (file) => {
            const response = await storage.createFile(BUCKETS.POST_IMAGES, "unique()", file)
            // Generate view URL
            return storage.getFileView(BUCKETS.POST_IMAGES, response.$id).toString()
          })
        )
        imageUrls = uploadedFiles
      }

      // Ensure pod visibility and podId are consistent
      const visibility = metadata.visibility || "public"
      const podId = visibility === "pod" ? metadata.podId || null : null

      // Create post document
      const post = await databases.createDocument(DATABASE_ID, COLLECTIONS.POSTS, "unique()", {
        authorId: authorId,
        content: content,
        type: metadata.type || "text",
        podId: podId,
        imageUrls: imageUrls,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        saves: 0,
        likedBy: [],
        savedBy: [],
        visibility: visibility,
        tags: Array.isArray(metadata.tags) ? metadata.tags.slice(0, 10) : [],
        authorName: authorName,
        authorAvatar: authorAvatar,
        authorUsername: authorUsername,
      })

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

      const posts = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
        Query.equal("authorId", userId),
        Query.orderDesc("timestamp"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ])

      return posts
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
      // Fetch public posts
      const publicPosts = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
        Query.equal("visibility", "public"),
        Query.orderDesc("timestamp"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ])

      let podPosts: any = { documents: [] }

      // If user is provided, also fetch pod posts
      if (userId) {
        try {
          // Get user's pod IDs
          const userPodsResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PODS, [
            Query.contains("members", userId),
          ])

          const podIds = userPodsResponse.documents.map((pod: any) => pod.$id)

          // Get posts from user's pods
          if (podIds.length > 0) {
            podPosts = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
              Query.equal("visibility", "pod"),
              Query.orderDesc("timestamp"),
              Query.limit(Math.min(limit, 100)),
              Query.offset(Math.max(offset, 0)),
            ])
          }
        } catch (e) {
          console.error("Failed to fetch pod posts:", e)
        }
      }

      // Merge and sort by timestamp
      const allPosts = [...(publicPosts?.documents || []), ...(podPosts?.documents || [])]
      allPosts.sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || "").getTime()
        const timeB = new Date(b.timestamp || "").getTime()
        return timeB - timeA
      })

      // Return only the limit number of posts
      return {
        documents: allPosts.slice(0, limit),
        total: allPosts.length,
      }
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

      const savedPosts = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_POSTS, [
        Query.equal("userId", userId),
        Query.orderDesc("savedAt"),
        Query.limit(Math.min(limit, 100)),
        Query.offset(Math.max(offset, 0)),
      ])

      // Fetch full post documents
      const posts = await Promise.all(
        savedPosts.documents.map(async (saved: any) => {
          try {
            const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, saved.postId)
            return post
          } catch (e) {
            console.error("Failed to fetch post:", saved.postId, e)
            return null
          }
        })
      )

      // Filter out null posts
      const validPosts = posts.filter((p) => p !== null)

      return {
        documents: validPosts,
        total: validPosts.length,
      }
    } catch (error) {
      console.error("Get saved posts error:", error)
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
      const savedEntries = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_POSTS, [
        Query.equal("postId", postId),
      ])

      for (const entry of savedEntries.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SAVED_POSTS, entry.$id)
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

      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      const likedBy = Array.isArray(post.likedBy) ? post.likedBy : []
      const isLiked = likedBy.includes(userId)

      const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      })

      // Create notification for post author if liking (not self-like)
      if (!isLiked && post.authorId !== userId) {
        try {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
            userId: post.authorId,
            type: "like",
            actor: userId,
            postId: postId,
            message: `Someone liked your post`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error("Failed to create like notification:", e)
        }
      }

      return {
        likes: newLikedBy.length,
        isLiked: !isLiked,
        post: updated,
      }
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

      // Check if post is already saved
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_POSTS, [
        Query.equal("postId", postId),
        Query.equal("userId", userId),
      ])

      if (existing.documents.length > 0) {
        // Already saved, remove it
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SAVED_POSTS, existing.documents[0].$id)
        return { saved: false }
      } else {
        // Not saved, create new save
        await databases.createDocument(DATABASE_ID, COLLECTIONS.SAVED_POSTS, "unique()", {
          postId: postId,
          userId: userId,
          savedAt: new Date().toISOString(),
        })
        return { saved: true }
      }
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
      const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SAVED_POSTS, [
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

      // Fetch post to verify it exists
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      // Get comment author profile
      let authorName = metadata.authorName || ""
      let authorAvatar = metadata.authorAvatar || ""
      let authorUsername = metadata.authorUsername || ""

      if (!authorName) {
        try {
          const profile = await profileService.getProfile(authorId)
          if (profile) {
            authorName = profile.name || ""
            authorAvatar = profile.avatar || ""
            authorUsername = profile.username || `@user_${authorId.slice(0, 6)}`
          }
        } catch (e) {
          console.error("Failed to fetch profile:", e)
        }
      }

      if (!authorUsername) {
        authorUsername = `@user_${authorId.slice(0, 6)}`
      }

      // Create comment
      const comment = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        "unique()",
        {
          postId: postId,
          authorId: authorId,
          content: content,
          timestamp: new Date().toISOString(),
          likes: 0,
          likedBy: [],
          authorName: authorName,
          authorAvatar: authorAvatar,
          authorUsername: authorUsername,
        }
      )

      // Increment post comment count
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        comments: (post.comments || 0) + 1,
      })

      // Create notification for post author (if not self-commenting)
      if (post.authorId !== authorId) {
        try {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
            userId: post.authorId,
            type: "comment",
            actor: authorId,
            actorName: authorName,
            actorAvatar: authorAvatar,
            postId: postId,
            commentId: comment.$id,
            message: `${authorName} commented on your post`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error("Failed to create notification:", e)
        }
      }

      return comment
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

      const comments = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        [
          Query.equal("postId", postId),
          Query.orderAsc("timestamp"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

      return comments
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

      const comment = await databases.getDocument(DATABASE_ID, COLLECTIONS.COMMENTS, commentId)

      const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : []
      const isLiked = likedBy.includes(userId)

      const newLikedBy = isLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId]

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMENTS,
        commentId,
        {
          likes: newLikedBy.length,
          likedBy: newLikedBy,
        }
      )

      return {
        likes: newLikedBy.length,
        isLiked: !isLiked,
        comment: updated,
      }
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
        Query.equal("uploadedBy", userId),
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
