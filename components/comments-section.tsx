"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, MoreHorizontal, Send, Trash2, Edit, Reply, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { commentService } from "@/lib/appwrite"

interface Comment {
  $id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: string
  likes: number
  likedBy: string[]
  replyTo?: string | null
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: string
  initialCommentCount?: number
  onCommentCountChange?: (count: number) => void
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  } catch {
    return dateString
  }
}

function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  onDelete, 
  onEdit,
  currentUserId,
  depth = 0,
}: { 
  comment: Comment
  onReply: (commentId: string) => void
  onLike: (commentId: string) => void
  onDelete: (commentId: string) => void
  onEdit: (commentId: string, content: string) => void
  currentUserId?: string
  depth?: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const isLiked = comment.likedBy?.includes(currentUserId || "")
  const isOwner = currentUserId === comment.authorId

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.$id, editContent.trim())
      setIsEditing(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-12 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.authorAvatar || "/placeholder.svg"} />
          <AvatarFallback>{comment.authorName?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatTimeAgo(comment.timestamp)}</span>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(comment.$id)} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 text-sm h-8"
              />
              <Button size="sm" onClick={handleSaveEdit} className="h-8">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8">Cancel</Button>
            </div>
          ) : (
            <p className="text-sm mt-1 break-words">{comment.content}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.$id)}
              className={`flex items-center gap-1 text-xs hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>
            {depth < 2 && (
              <button
                onClick={() => onReply(comment.$id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.$id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentsSection({ postId, initialCommentCount = 0, onCommentCountChange }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch comments when expanded
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      loadComments()
    }
  }, [isExpanded])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await commentService.getComments(postId)
      const allComments = (response.documents || []) as unknown as Comment[]
      
      // Organize comments into a tree structure
      const topLevelComments = allComments.filter((c) => !c.replyTo)
      const repliesMap = new Map<string, Comment[]>()
      
      allComments.forEach((c) => {
        if (c.replyTo) {
          const existing = repliesMap.get(c.replyTo) || []
          existing.push(c)
          repliesMap.set(c.replyTo, existing)
        }
      })
      
      // Attach replies to parent comments
      const organizedComments: Comment[] = topLevelComments.map((c) => ({
        ...c,
        replies: repliesMap.get(c.$id) || [],
      }))
      
      setComments(organizedComments)
    } catch (error) {
      console.error("Failed to load comments:", error)
      toast({
        title: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !user?.$id) return
    
    setIsSubmitting(true)
    try {
      const rawComment = await commentService.createComment(postId, user.$id, newComment.trim(), replyingTo || undefined)
      const comment = rawComment as unknown as Comment
      
      if (replyingTo) {
        // Add reply to the parent comment
        setComments(prev => prev.map(c => {
          if (c.$id === replyingTo) {
            return {
              ...c,
              replies: [...(c.replies || []), comment],
            }
          }
          return c
        }))
      } else {
        // Add as top-level comment
        setComments(prev => [{ ...comment, replies: [] }, ...prev])
      }
      
      setNewComment("")
      setReplyingTo(null)
      onCommentCountChange?.((initialCommentCount || 0) + 1)
      
      toast({
        title: "Comment posted",
      })
    } catch (error) {
      console.error("Failed to post comment:", error)
      toast({
        title: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user?.$id) {
      toast({ title: "Please sign in to like", variant: "destructive" })
      return
    }
    
    try {
      const updated = await commentService.toggleLike(commentId, user.$id)
      
      // Update local state
      const updateLikes = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.$id === commentId) {
            return { ...c, likes: updated.likes, likedBy: updated.likedBy }
          }
          if (c.replies) {
            return { ...c, replies: updateLikes(c.replies) }
          }
          return c
        })
      }
      
      setComments(updateLikes)
    } catch (error) {
      console.error("Failed to like comment:", error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!user?.$id) return
    
    try {
      await commentService.deleteComment(commentId, user.$id)
      
      // Remove from local state
      const removeComment = (comments: Comment[]): Comment[] => {
        return comments
          .filter(c => c.$id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeComment(c.replies) : [],
          }))
      }
      
      setComments(removeComment)
      onCommentCountChange?.(Math.max(0, (initialCommentCount || 1) - 1))
      
      toast({ title: "Comment deleted" })
    } catch (error) {
      console.error("Failed to delete comment:", error)
      toast({ title: "Failed to delete comment", variant: "destructive" })
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    if (!user?.$id) return
    
    try {
      await commentService.updateComment(commentId, user.$id, content)
      
      // Update local state
      const updateContent = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.$id === commentId) {
            return { ...c, content }
          }
          if (c.replies) {
            return { ...c, replies: updateContent(c.replies) }
          }
          return c
        })
      }
      
      setComments(updateContent)
      toast({ title: "Comment updated" })
    } catch (error) {
      console.error("Failed to update comment:", error)
      toast({ title: "Failed to update comment", variant: "destructive" })
    }
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    setIsExpanded(true)
  }

  const replyingToComment = replyingTo ? comments.find(c => c.$id === replyingTo) : null

  return (
    <div className="border-t mt-4 pt-4">
      {/* Toggle comments button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <MessageCircle className="h-4 w-4" />
        {isExpanded ? "Hide comments" : `View ${initialCommentCount || 0} comment${initialCommentCount !== 1 ? 's' : ''}`}
      </button>

      {isExpanded && (
        <>
          {/* Comment input */}
          <div className="mb-4">
            {replyingTo && replyingToComment && (
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <span>Replying to {replyingToComment.authorName}</span>
                <button onClick={() => setReplyingTo(null)} className="text-primary hover:underline">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={(user?.prefs as Record<string, any>)?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                  disabled={isSubmitting || !user}
                  className="flex-1 h-9"
                />
                <Button 
                  size="sm" 
                  onClick={handleSubmit} 
                  disabled={!newComment.trim() || isSubmitting || !user}
                  className="h-9 px-3"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Comments list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-0 divide-y">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.$id}
                  comment={comment}
                  onReply={handleReply}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  currentUserId={user?.$id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
