/**
 * PART 2: POD, PROFILE, CHAT, and RESOURCE SERVICE FIXES
 * These are the remaining critical services that need comprehensive fixes
 */

import { Client, Databases, Storage, Query, Account, Teams } from "appwrite"

// Client setup
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

const databases = new Databases(client)
const storage = new Storage(client)
const account = new Account(client)
const teams = new Teams(client)

// Constants
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!
const COLLECTIONS = {
  PROFILES: process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID!,
  POSTS: process.env.NEXT_PUBLIC_POSTS_COLLECTION_ID!,
  COMMENTS: process.env.NEXT_PUBLIC_COMMENTS_COLLECTION_ID!,
  PODS: process.env.NEXT_PUBLIC_PODS_COLLECTION_ID!,
  MESSAGES: process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!,
  CHAT_ROOMS: process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID!,
  RESOURCES: process.env.NEXT_PUBLIC_RESOURCES_COLLECTION_ID!,
  NOTIFICATIONS: process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!,
  CALENDAR_EVENTS: process.env.NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID!,
  SAVED_POSTS: process.env.NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID!,
}

const BUCKETS = {
  AVATARS: process.env.NEXT_PUBLIC_AVATARS_BUCKET_ID!,
  RESOURCES: process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID!,
  ATTACHMENTS: process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID!,
  POST_IMAGES: process.env.NEXT_PUBLIC_POST_IMAGES_BUCKET_ID!,
  POD_IMAGES: process.env.NEXT_PUBLIC_POD_IMAGES_BUCKET_ID!,
}

// ============================================================================
// POD SERVICE FIXES
// ============================================================================

export const podServiceFixed = {
  /**
   * Create a new pod with all necessary setup
   */
  async createPod(
    creatorId: string,
    name: string,
    metadata: {
      description?: string
      image?: File
      category?: string
      isPrivate?: boolean
    } = {}
  ) {
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
        const response = await storage.createFile(BUCKETS.POD_IMAGES, "unique()", metadata.image)
        imageUrl = storage.getFileView(BUCKETS.POD_IMAGES, response.$id).toString()
      }

      // Create the pod document
      const pod = await databases.createDocument(DATABASE_ID, COLLECTIONS.PODS, "unique()", {
        name: name.trim(),
        description: metadata.description || "",
        creatorId: creatorId,
        members: [creatorId], // Creator is first member
        memberCount: 1,
        image: imageUrl,
        category: metadata.category || "general",
        isPrivate: metadata.isPrivate || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Create a chat room for the pod
      try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, "unique()", {
          podId: pod.$id,
          name: `${name} Chat`,
          type: "pod", // pod, direct, group
          members: [creatorId],
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Failed to create pod chat room:", e)
      }

      return pod
    } catch (error) {
      console.error("Create pod error:", error)
      throw error
    }
  },

  /**
   * Get all pods with pagination
   */
  async getAllPods(limit = 50, offset = 0) {
    try {
      const pods = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PODS,
        [
          Query.orderDesc("createdAt"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

      return pods
    } catch (error) {
      console.error("Get all pods error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get pods for a user
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
          Query.search("members", userId),
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
   * Get a single pod by ID
   */
  async getPodById(podId: string) {
    try {
      if (!podId) {
        throw new Error("Pod ID is required")
      }

      const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      return pod
    } catch (error) {
      console.error("Get pod error:", error)
      throw error
    }
  },

  /**
   * Join a pod - FIXED with proper member count verification
   */
  async joinPod(podId: string, userId: string) {
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

      // VERIFICATION STEP: Re-fetch pod to ensure member count is correct
      const verified = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
      const verifiedMembers = Array.isArray(verified.members) ? verified.members : []

      // Add user to pod's chat room
      try {
        const chatRooms = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CHAT_ROOMS, [
          Query.equal("podId", podId),
        ])

        if (chatRooms.documents.length > 0) {
          const chatRoom = chatRooms.documents[0]
          const chatMembers = Array.isArray(chatRoom.members) ? chatRoom.members : []

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
        }
      } catch (e) {
        console.error("Failed to add user to chat room:", e)
      }

      // Create notification for pod creator
      try {
        if (pod.creatorId !== userId) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, "unique()", {
            userId: pod.creatorId,
            type: "pod_join",
            actor: userId,
            podId: podId,
            message: `Someone joined your pod: ${pod.name}`,
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
    } catch (error) {
      console.error("Join pod error:", error)
      throw error
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

      // Prevent creator from leaving (optional, can be removed)
      if (pod.creatorId === userId && members.length > 1) {
        throw new Error("Pod creator must transfer ownership before leaving")
      }

      // Remove user from members
      const updatedMembers = members.filter((id: string) => id !== userId)

      // Update pod
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PODS, podId, {
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

      // Delete all posts in this pod
      const posts = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
        Query.equal("podId", podId),
      ])

      for (const post of posts.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POSTS, post.$id)
        } catch (e) {
          console.error("Failed to delete post:", e)
        }
      }

      // Delete pod chat room
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
   * Get pod members
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
}

// ============================================================================
// PROFILE SERVICE FIXES
// ============================================================================

export const profileServiceFixed = {
  /**
   * Follow a user - creates two-way relationship
   */
  async followUser(followerId: string, followingId: string) {
    try {
      if (!followerId || !followingId) {
        throw new Error("Both user IDs are required")
      }

      if (followerId === followingId) {
        throw new Error("You cannot follow yourself")
      }

      // Get both profiles
      const followerProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId)
      const followingProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId)

      // Check if already following
      const following = Array.isArray(followerProfile.following) ? followerProfile.following : []
      if (following.includes(followingId)) {
        return { success: true, message: "Already following" }
      }

      // Add to follower's following list
      const newFollowing = [...following, followingId]
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      })

      // Add to following user's followers list
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

  /**
   * Unfollow a user - removes two-way relationship
   */
  async unfollowUser(followerId: string, followingId: string) {
    try {
      if (!followerId || !followingId) {
        throw new Error("Both user IDs are required")
      }

      const followerProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId)
      const followingProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, followingId)

      // Remove from follower's following list
      const following = Array.isArray(followerProfile.following) ? followerProfile.following : []
      const newFollowing = following.filter((id: string) => id !== followingId)

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, followerId, {
        following: newFollowing,
        followingCount: newFollowing.length,
      })

      // Remove from following user's followers list
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

  /**
   * Check if user follows another
   */
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

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File) {
    try {
      if (!userId || !file) {
        throw new Error("User ID and file are required")
      }

      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image")
      }

      // Upload to storage
      const response = await storage.createFile(BUCKETS.AVATARS, "unique()", file)
      const avatarUrl = storage.getFileView(BUCKETS.AVATARS, response.$id).toString()

      // Update profile
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
        avatar: avatarUrl,
        updatedAt: new Date().toISOString(),
      })

      return { success: true, avatar: avatarUrl, profile: updated }
    } catch (error) {
      console.error("Upload avatar error:", error)
      throw error
    }
  },
}

// ============================================================================
// CHAT SERVICE FIXES
// ============================================================================

export const chatServiceFixed = {
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
          const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, senderId)
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
   * Get messages from a chat room with pagination
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

  /**
   * Get user's chat rooms
   */
  async getUserChatRooms(userId: string) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      const chatRooms = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CHAT_ROOMS,
        [
          Query.search("members", userId),
          Query.orderDesc("lastMessageTime"),
        ]
      )

      return chatRooms
    } catch (error) {
      console.error("Get user chat rooms error:", error)
      return { documents: [], total: 0 }
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
}

// ============================================================================
// RESOURCE SERVICE FIXES
// ============================================================================

export const resourceServiceFixed = {
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
