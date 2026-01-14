"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus, X, ImageIcon, Send, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { profileService, podService } from "@/lib/appwrite"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreatePostModalProps {
  onPostCreated?: (post: any) => void
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
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState("public") // public, pod, private
  const [selectedPodId, setSelectedPodId] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [error, setError] = useState<string>("")
  const [pods, setPods] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Dynamically import feedService to avoid circular dependencies
  const [feedService, setFeedService] = useState<any>(null)

  useEffect(() => {
    const loadServices = async () => {
      const { feedService: fs } = await import("@/lib/appwrite")
      setFeedService(fs)
    }
    loadServices()
  }, [])

  // Load user profile and pods when modal opens
  useEffect(() => {
    if (!isOpen || !user?.$id) return

    const load = async () => {
      try {
        const [p, podsRes] = await Promise.all([
          profileService.getProfile(user.$id),
          podService.getUserPods(user.$id),
        ])
        setProfile(p)
        setPods(podsRes.documents || [])
      } catch (error) {
        console.error("Failed to load profile/pods:", error)
      }
    }

    load()
  }, [isOpen, user?.$id])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (imageFiles.length + files.length > 4) {
      setError("Maximum 4 images allowed")
      return
    }

    setImageFiles([...imageFiles, ...files])

    // Create previews
    const newPreviews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string)
          if (newPreviews.length === files.length) {
            setImagePreview([...imagePreview, ...newPreviews])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreview(imagePreview.filter((_, i) => i !== index))
  }

  const displayName = profile?.name || user?.name || ""
  const username = displayName
    ? `@${displayName.toLowerCase().replace(/\s+/g, "_")}`
    : user?.email
      ? `@${user.email.split("@")[0]}`
      : ""
  const avatar = profile?.avatar || ""

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    // Validation
    if (!content.trim()) {
      setError("Post content cannot be empty")
      return
    }

    if (content.length > 5000) {
      setError("Post content is too long (max 5000 characters)")
      return
    }

    if (visibility === "pod" && !selectedPodId) {
      setError("Please select a pod for pod-only posts")
      return
    }

    if (!feedService) {
      setError("Service not available, please try again")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const post = await feedService.createPost(
        user?.$id,
        content,
        {
          type: imageFiles.length > 0 ? "image" : "text",
          imageFiles: imageFiles,
          visibility: visibility,
          podId: selectedPodId || null,
          tags: tags,
          authorName: displayName,
          authorAvatar: avatar,
          authorUsername: username,
        }
      )

      toast({
        title: "Success!",
        description: "Your post has been created",
        variant: "default",
      })

      // Reset form
      setContent("")
      setVisibility("public")
      setSelectedPodId("")
      setTags([])
      setImageFiles([])
      setImagePreview([])
      setIsOpen(false)

      // Call callback if provided
      if (onPostCreated) {
        onPostCreated(post)
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create post"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>Share your thoughts, resources, or achievements with the community</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, ask questions, or share resources..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setError("")
              }}
              rows={6}
              maxLength={5000}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{content.length} / 5000</span>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {imagePreview.map((preview, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                  <img src={preview} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Visibility & Pod Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="pod">Pod Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibility === "pod" && (
              <div className="space-y-2">
                <Label htmlFor="pod">Select Pod</Label>
                <Select value={selectedPodId} onValueChange={setSelectedPodId}>
                  <SelectTrigger id="pod">
                    <SelectValue placeholder="Choose a pod..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pods.map((pod) => (
                      <SelectItem key={pod.$id} value={pod.$id}>
                        {pod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (max 5)</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag(newTag)
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(newTag)}
                  disabled={!newTag}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageFiles.length >= 4 || isSubmitting}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Images ({imageFiles.length}/4)
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
