"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Share2, Bookmark, Search, Filter, ArrowLeft, Trash2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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

const SAVED_POSTS: SavedPost[] = [
  {
    id: "1",
    title: "Complete Guide to System Design Interviews",
    content: "After months of preparation, here's everything you need to know about system design interviews...",
    author: {
      name: "Arjun Patel",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "@arjun_codes",
    },
    timestamp: "2h",
    likes: 24,
    comments: 8,
    shares: 3,
    tags: ["SystemDesign", "Interview", "FAANG"],
    savedAt: "2 days ago",
    isLiked: false,
  },
  {
    id: "2",
    content: "Best resources for learning React in 2024. Here's my curated list...",
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "@sarah_dev",
    },
    timestamp: "1d",
    likes: 45,
    comments: 12,
    shares: 8,
    tags: ["React", "Learning", "Resources"],
    savedAt: "1 week ago",
    isLiked: true,
  },
]

export default function SavedPage() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>(SAVED_POSTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()
  const { toast } = useToast()

  const handleUnsave = (postId: string) => {
    setSavedPosts(savedPosts.filter(post => post.id !== postId))
    toast({
      title: "Post Removed",
      description: "Post removed from your saved items",
    })
  }

  const handleLike = (postId: string) => {
    setSavedPosts(
      savedPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    )
  }

  const handleShare = (postId: string) => {
    const post = savedPosts.find((p) => p.id === postId)
    if (post) {
      navigator.clipboard.writeText(`https://peerspark.com/post/${postId}`)
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      })
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
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Saved Posts</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Saved Posts</h1>
              <p className="text-muted-foreground">Your bookmarked posts and resources</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search saved posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search saved posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
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
                <Card key={post.id} className="hover:shadow-md transition-shadow">
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
