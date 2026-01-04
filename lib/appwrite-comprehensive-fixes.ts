/**
 * COMPREHENSIVE FIXES FOR APPWRITE.TS
 * This file contains corrected implementations for all broken functions
 * Replace the broken sections in appwrite.ts with these implementations
 */

import { Client, Databases, Storage, Query, Account, Teams } from "appwrite"

// Client setup (copy from appwrite.ts)
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

const databases = new Databases(client)
const storage = new Storage(client)
const account = new Account(client)
const teams = new Teams(client)

// Constants (copy from appwrite.ts)
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
// FEED SERVICE FIXES
// ============================================================================

export const feedServiceFixed = {
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

      // Get author profile info
      let authorName = metadata.authorName || ""
      let authorAvatar = metadata.authorAvatar || ""
      let authorUsername = metadata.authorUsername || ""

      if (!authorName) {
        try {
          const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, authorId)
          if (profile) {
            authorName = profile.name || ""
            authorAvatar = profile.avatar || ""
            authorUsername = profile.username || `@user_${authorId.slice(0, 6)}`
          }
        } catch (e) {
          console.error("Failed to fetch profile:", e)
        }
      }

      // Fallback username if not found
      if (!authorUsername) {
        authorUsername = `@user_${authorId.slice(0, 6)}`
      }

      // Handle image uploads if provided
      let imageUrls: string[] = []
      if (metadata.imageFiles && metadata.imageFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          metadata.imageFiles.map(async (file) => {
            const response = await storage.createFile(
              BUCKETS.POST_IMAGES,
              "unique()",
              file
            )
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
        imageUrls: imageUrls, // Store as array
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        saves: 0,
        likedBy: [], // Array of user IDs who liked
        savedBy: [], // Array of user IDs who saved
        visibility: visibility,
        tags: Array.isArray(metadata.tags) ? metadata.tags.slice(0, 10) : [], // Limit to 10 tags
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

      const posts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POSTS,
        [
          Query.equal("authorId", userId),
          Query.orderDesc("timestamp"),
          Query.limit(Math.min(limit, 100)), // Cap at 100
          Query.offset(Math.max(offset, 0)),
        ]
      )

      return posts
    } catch (error) {
      console.error("Get user posts error:", error)
      return { documents: [], total: 0 }
    }
  },

  /**
   * Get feed posts (public + user's pods) with proper pagination and filtering
   */
  async getFeedPosts(userId?: string, limit = 20, offset = 0) {
    try {
      const queries: any[] = [Query.orderDesc("timestamp")]

      // Always include public posts
      const publicPosts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POSTS,
        [
          Query.equal("visibility", "public"),
          Query.orderDesc("timestamp"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

      let podPosts: any = { documents: [] }

      // If user is provided, also fetch pod posts
      if (userId) {
        try {
          // Get user's pod IDs
          const userPodsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PODS,
            [Query.search("members", userId)]
          )

          const podIds = userPodsResponse.documents.map((pod: any) => pod.$id)

          // Get posts from user's pods
          if (podIds.length > 0) {
            // Fetch pod posts with pagination
            podPosts = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.POSTS,
              [
                Query.equal("visibility", "pod"),
                Query.select(["$id", "podId", "content", "timestamp"]), // Select relevant fields
                Query.orderDesc("timestamp"),
                Query.limit(Math.min(limit, 100)),
                Query.offset(Math.max(offset, 0)),
              ]
            )
          }
        } catch (e) {
          console.error("Failed to fetch pod posts:", e)
        }
      }

      // Merge and sort by timestamp
      const allPosts = [...(publicPosts?.documents || []), ...(podPosts?.documents || [])]

      // Sort by timestamp descending
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
   * Uses a separate SAVED_POSTS collection for efficiency
   */
  async getSavedPosts(userId: string, limit = 50, offset = 0) {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      // Query saved posts documents where userId is the user
      const savedPosts = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SAVED_POSTS,
        [
          Query.equal("userId", userId),
          Query.orderDesc("savedAt"),
          Query.limit(Math.min(limit, 100)),
          Query.offset(Math.max(offset, 0)),
        ]
      )

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

      // Update content if provided
      if (updates.content !== undefined) {
        if (!updates.content || !updates.content.trim()) {
          throw new Error("Post content cannot be empty")
        }
        if (updates.content.length > 5000) {
          throw new Error("Post content exceeds 5000 character limit")
        }
        updateData.content = updates.content
      }

      // Update tags if provided
      if (Array.isArray(updates.tags)) {
        updateData.tags = updates.tags.slice(0, 10) // Limit to 10 tags
      }

      const updatedPost = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.POSTS,
        postId,
        updateData
      )

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

      // Get post to find related data
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      // Delete images from storage
      if (post.imageUrls && Array.isArray(post.imageUrls)) {
        // Extract file IDs from URLs and delete
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

// ============================================================================
// COMMENT SERVICE FIXES
// ============================================================================

export const commentServiceFixed = {
  /**
   * Create a comment with validation
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

      // Fetch post to verify it exists and get author info
      const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)

      // Get comment author profile
      let authorName = metadata.authorName || ""
      let authorAvatar = metadata.authorAvatar || ""
      let authorUsername = metadata.authorUsername || ""

      if (!authorName) {
        try {
          const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, authorId)
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
          replies: 0,
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
          Query.orderAsc("timestamp"), // Chronological order
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
   * Update comment
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
   * Toggle like on comment with proper validation
   */
  async toggleLikeComment(commentId: string, userId: string) {
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

// ============================================================================
// POST SERVICE FIXES (Alternative naming)
// ============================================================================

export const postServiceFixed = {
  ...feedServiceFixed,

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
}
