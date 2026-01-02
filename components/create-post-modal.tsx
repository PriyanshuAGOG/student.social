"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, X, ImageIcon, Link, Hash, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { authService, feedService, podService } from "@/lib/appwrite"

interface Post {
  id: string
  title?: string
  content: string
  author: {
    name: string
    avatar: string
    username: string
  }
  timestamp: string
  likes: number
  comments: number
  shares: number
  tags: string[]
  pod?: {
    id: string
    name: string
    members: number
  }
  attachments?: string[]
  isLiked: boolean
  isBookmarked: boolean
}

interface CreatePostModalProps {
  onPostCreated: (post: Post) => void
}

const SUGGESTED_TAGS = [
  "DSA",
  "SystemDesign",
  "WebDev",
  "MachineLearning",
  "Interview",
  "Tutorial",
  "Question",
  "Resource",
  "Achievement",
  "Help",
]

export function CreatePostModal({ onPostCreated }: CreatePostModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedPod, setSelectedPod] = useState("public") // Updated default value
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState<any | null>(null)
  const [pods, setPods] = useState<any[]>([])

  useEffect(() => {
    const loadProfileAndPods = async () => {
      try {
        const [p, podRes] = await Promise.all([
          authService.getCurrentUserProfile(),
          authUser?.$id ? podService.getUserPods(authUser.$id) : Promise.resolve({ documents: [] }),
        ])
        setProfile(p)
        setPods(podRes.documents || [])
      } catch (e) {
        // ignore
      }
    }
    if (isOpen) loadProfileAndPods()
  }, [isOpen, authUser?.$id])

  const user = {
    name: authUser?.name || profile?.name || "",
    avatar: profile?.avatar || "",
    username: authUser?.email ? `@${authUser.email.split("@")[0]}` : "",
  }

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post",
        variant: "destructive",
      })
      return
    }

    if (!authUser?.$id) {
      toast({ title: "Sign in required", description: "Please sign in to post", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const visibility = selectedPod === "public" ? "public" : "pod"
      const podId = selectedPod === "public" ? null : selectedPod

      const created = await feedService.createPost(authUser.$id, content.trim(), "text", {
        podId,
        visibility,
        tags,
      })

      const podMeta = podId ? pods.find((p) => p.$id === podId || p.teamId === podId) : undefined

      const newPost: Post = {
        id: created.$id,
        title: title.trim() || undefined,
        content: created.content || content.trim(),
        author: user,
        timestamp: created.timestamp || new Date().toISOString(),
        likes: created.likes || 0,
        comments: created.comments || 0,
        shares: created.shares || 0,
        tags: created.tags || tags,
        pod:
          visibility === "pod" && podMeta
            ? { id: podMeta.$id || podMeta.teamId, name: podMeta.name, members: podMeta.memberCount || 0 }
            : undefined,
        isLiked: false,
        isBookmarked: false,
      }

      onPostCreated(newPost)

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      })

      // Reset form on success
      setTitle("")
      setContent("")
      setSelectedPod("public")
      setTags([])
      setNewTag("")
      setIsOpen(false)
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to create post", description: error?.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>Share your thoughts, questions, or achievements with the community</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.username}</p>
            </div>
          </div>

          {/* Pod Selection */}
          <div className="space-y-2">
            <Label htmlFor="pod">Post to Pod (optional)</Label>
            <Select value={selectedPod} onValueChange={setSelectedPod}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pod or post publicly" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Post</SelectItem>
                  {pods.map((pod) => (
                    <SelectItem key={pod.$id || pod.teamId} value={pod.$id || pod.teamId}>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{pod.name}</span>
                        <span className="text-xs text-muted-foreground">({pod.memberCount || pod.members?.length || 0} members)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Add a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind? Share your thoughts, ask questions, or celebrate achievements..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{content.length}/2000</p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag(newTag)
                    }
                  }}
                  className="pl-8"
                  maxLength={20}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(newTag)}
                disabled={!newTag.trim() || tags.includes(newTag) || tags.length >= 5}
              >
                Add
              </Button>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Suggested tags:</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag))
                  .slice(0, 6)
                  .map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAddTag(tag)}
                      disabled={tags.length >= 5}
                    >
                      #{tag}
                    </Button>
                  ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{tags.length}/5 tags used</p>
          </div>

          {/* Media Attachments (Future Feature) */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                <ImageIcon className="w-4 h-4 mr-2" /> {/* Updated usage */}
                Image
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Link className="w-4 h-4 mr-2" />
                Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Media attachments coming soon!</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
