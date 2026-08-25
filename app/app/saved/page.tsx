"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Share2, Bookmark, Search, Trash2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { feedService } from "@/lib/appwrite"
import { AppPageHeader } from "@/components/internal/AppPageHeader"

interface SavedPost {
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
  savedAt: string
  isLiked: boolean
}

// Sample posts will be replaced with actual saved posts from database
const SAVED_POSTS: SavedPost[] = []

export default function SavedPage() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>(SAVED_POSTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load saved posts from database
  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!user?.$id) {
        setIsLoading(false)
        return
      }
      
      try {
        // Try to load saved posts from feed service
        const result = await feedService.getSavedPosts?.(user.$id)
        if (result?.documents) {
          const posts = result.documents.map((p: any) => ({
            id: p.$id,
            title: p.title || "",
            content: p.content || "",
            author: {
              name: p.authorName || "User",
              avatar: p.authorAvatar || "/placeholder.svg",
              username: p.authorUsername || "@user",
            },
            timestamp: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "",
            likes: p.likes || 0,
            comments: p.comments || 0,
            shares: p.shares || 0,
            tags: p.tags || [],
            savedAt: p.savedAt ? new Date(p.savedAt).toLocaleDateString() : "Recently",
            isLiked: (p.likedBy || []).includes(user.$id),
          }))
          setSavedPosts(posts)
        }
      } catch (error) {
        console.error("Failed to load saved posts:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSavedPosts()
  }, [user?.$id])

  const handleUnsave = async (postId: string) => {
    if (!user?.$id) return
    try {
      await feedService.toggleSavePost(postId, user.$id)
      setSavedPosts((prev) => prev.filter(post => post.id !== postId))
      toast({
        title: "Post Removed",
        description: "Post removed from your saved items",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Failed to remove saved post",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLike = async (postId: string) => {
    if (!user?.$id) return
    try {
      const updated = await feedService.toggleLike(postId, user.$id)
      setSavedPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: updated.isLiked,
                likes: updated.likes || 0,
              }
            : post,
        ),
      )
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Failed to like post",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (postId: string) => {
    const post = savedPosts.find((p) => p.id === postId)
    if (post) {
      const shareUrl = `${window.location.origin}/app/feed?post=${postId}`
      try {
        if (navigator.share) {
          await navigator.share({
            title: post.title || "Student.social post",
            text: post.content.slice(0, 160),
            url: shareUrl,
          })
        } else {
          await navigator.clipboard.writeText(shareUrl)
          toast({
            title: "Link copied!",
            description: "Post link has been copied to your clipboard.",
          })
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          toast({ title: "Share failed", description: "Could not share this post right now.", variant: "destructive" })
        }
      }
    }
  }

  const filteredPosts = savedPosts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-3 md:px-8 md:pt-6 pb-20 md:pb-8">
        <AppPageHeader title="Saved" meta={<span>{savedPosts.length} items</span>} />

        <div className="student-library-search">
          <Search className="w-4 h-4" />
          <Input
            placeholder="Search saved posts, people, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Saved</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No saved posts</h3>
                    <p>Posts you bookmark will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="student-feed-post hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm">{post.author.name}</h4>
                            <span className="text-muted-foreground text-sm hidden md:inline">
                              {post.author.username}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{post.timestamp}</span>
                            <span>•</span>
                            <span>Saved {post.savedAt}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsave(post.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {post.title && <h3 className="font-semibold text-lg mb-2">{post.title}</h3>}
                    <div className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</div>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-1 md:space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={`${post.isLiked ? "text-red-500" : ""} hover:text-red-500 h-8 px-2 md:px-3`}
                        >
                          <Heart className={`w-4 h-4 mr-1 md:mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                          <span className="text-xs md:text-sm">{post.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-blue-500 h-8 px-2 md:px-3"
                        >
                          <MessageCircle className="w-4 h-4 mr-1 md:mr-2" />
                          <span className="text-xs md:text-sm">{post.comments}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(post.id)}
                          className="hover:text-green-500 h-8 px-2 md:px-3"
                        >
                          <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                          <span className="text-xs md:text-sm hidden md:inline">{post.shares}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Saved posts will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Saved resources will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
