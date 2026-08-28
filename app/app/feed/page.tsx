"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, Share2, Bookmark, Search, Users, MoreHorizontal, User, Flag, Sparkles, Flame, Clock, Trophy, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { CommentsSection } from "@/components/comments-section"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { feedService, podService, profileService } from "@/lib/appwrite"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PostAttachment {
  fileId?: string
  fileUrl: string
  fileName: string
  fileSize?: number
  fileType?: string
}

interface Post {
  id: string
  title?: string
  content: string
  authorId?: string
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
  attachments?: PostAttachment[]
  isLiked: boolean
  isBookmarked: boolean
  kind?: "post" | "achievement"
  visibility?: "public" | "pod"
}


function parsePostAttachments(value: unknown): PostAttachment[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item) as PostAttachment
        } catch {
          return null
        }
      }
      return item as PostAttachment
    })
    .filter((item): item is PostAttachment => Boolean(item?.fileUrl && item?.fileName))
}

function PostMediaCarousel({ attachments }: { attachments: PostAttachment[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = attachments[Math.min(activeIndex, attachments.length - 1)]
  const isImage = active.fileType?.startsWith("image/")
  const isVideo = active.fileType?.startsWith("video/")
  const move = (direction: number) => setActiveIndex((current) => (current + direction + attachments.length) % attachments.length)

  return (
    <div className="student-post-media" aria-label={`${attachments.length} post attachment${attachments.length === 1 ? "" : "s"}`}>
      <div className="student-post-media-stage">
        {isImage ? (
          <a href={active.fileUrl} target="_blank" rel="noreferrer" className="relative block h-full w-full">
            <Image src={active.fileUrl} alt={active.fileName || "Post image"} fill unoptimized sizes="(max-width: 768px) 100vw, 680px" className="object-contain" />
          </a>
        ) : isVideo ? (
          <video src={active.fileUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={active.fileName || "Post video"} />
        ) : (
          <a href={active.fileUrl} target="_blank" rel="noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background/85 text-primary"><FileText className="h-5 w-5" /></span>
            <span className="max-w-full truncate text-sm font-semibold">{active.fileName}</span>
            {active.fileSize ? <span className="text-xs text-muted-foreground">{(active.fileSize / 1024 / 1024).toFixed(2)} MB · Open attachment</span> : null}
          </a>
        )}
        {attachments.length > 1 ? (
          <>
            <button type="button" onClick={() => move(-1)} className="student-post-media-nav is-left" aria-label="Previous attachment"><ChevronLeft /></button>
            <button type="button" onClick={() => move(1)} className="student-post-media-nav is-right" aria-label="Next attachment"><ChevronRight /></button>
            <span className="student-post-media-count">{activeIndex + 1} / {attachments.length}</span>
          </>
        ) : null}
      </div>
      {attachments.length > 1 ? (
        <div className="student-post-media-dots" aria-label="Choose attachment">
          {attachments.map((attachment, index) => <button type="button" key={attachment.fileId || attachment.fileUrl} onClick={() => setActiveIndex(index)} className={index === activeIndex ? "is-active" : ""} aria-label={`Show attachment ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} />)}
        </div>
      ) : null}
    </div>
  )
}

const INITIAL_POSTS: Post[] = []

interface StudyingNowUser {
  id: string
  name: string
  avatar?: string
  podName?: string
  focus?: string
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(() => new Set())
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Post[]>([])
  const [studyingNow, setStudyingNow] = useState<StudyingNowUser[]>([])
  const [celebrationText, setCelebrationText] = useState("")
  const [celebrationPod, setCelebrationPod] = useState<string>("public")
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [pods, setPods] = useState<any[]>([])

  const formatUsername = (name?: string) =>
    name && name.trim().length > 0
      ? `@${name.trim().toLowerCase().replace(/\s+/g, "_")}`
      : ""

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const [res, podsRes, profilesRes, savedRes] = await Promise.all([
          feedService.getFeedPosts(user.$id),
          podService.getUserPods(user.$id),
          profileService.getAllProfiles(200, 0),
          feedService.getSavedPosts(user.$id),
        ])
        const savedIds = new Set((savedRes.documents || []).map((post: any) => post.$id))
        const profileMap = new Map<string, any>()
        ;(profilesRes.documents || []).forEach((prof: any) => {
          profileMap.set(prof.$id, prof)
        })

        const mapped: Post[] = (res.documents || []).map((d: any) => {
          const authorProfile = profileMap.get(d.authorId) || profileMap.get(d.author?.id)
          const authorName = authorProfile?.name || d.authorName || d.author?.name || d.author || "Someone"
          const authorUsername =
            formatUsername(authorProfile?.name) || d.authorUsername || d.author?.username || (d.authorId ? `@${String(d.authorId).slice(0, 6)}` : "")
          const authorAvatar = authorProfile?.avatar || d.authorAvatar || d.author?.avatar || "/placeholder.svg"
          const likedBy = d.likedBy || []

          return {
            id: d.$id,
            content: d.content || "",
            authorId: d.authorId || d.author?.id,
            author: {
              name: authorName,
              avatar: authorAvatar,
              username: authorUsername,
            },
            timestamp: d.timestamp || "",
            likes: d.likes || 0,
            comments: d.comments || 0,
            shares: d.shares || 0,
            tags: d.tags || [],
            attachments: parsePostAttachments(d.attachments).length > 0
              ? parsePostAttachments(d.attachments)
              : (Array.isArray(d.imageUrls) ? d.imageUrls : d.imageUrl ? [d.imageUrl] : []).map((url: string) => ({ fileUrl: url, fileName: "Post image", fileType: "image/*" })),
            isLiked: likedBy.includes(user.$id),
            isBookmarked: savedIds.has(d.$id),
            kind: d.type === "achievement" ? "achievement" : "post",
            visibility: d.visibility || "public",
          }
        })
        const podDocs = podsRes.documents || []
        setPods(podDocs)
        const memberIds = new Set<string>()
        const podMemberMap = new Map<string, string[]>()
        podDocs.forEach((p: any) => {
          const members = Array.isArray(p.members)
            ? p.members
            : typeof p.members === "string"
              ? (() => { try { return JSON.parse(p.members) } catch { return [] } })()
              : []
          const podId = p.$id || p.teamId
          podMemberMap.set(podId, members)
          members.forEach((m: string) => memberIds.add(m))
        })

        const onlineProfiles = (profilesRes.documents || []).filter((prof: any) => memberIds.has(prof.$id) && prof.isOnline)
        const studyingList: StudyingNowUser[] = onlineProfiles.slice(0, 6).map((prof: any) => {
          const podEntry = Array.from(podMemberMap.entries()).find(([, members]) => members.includes(prof.$id))
          const podName = podEntry
            ? podDocs.find((p: any) => (p.$id || p.teamId) === podEntry[0])?.name
            : undefined
          return {
            id: prof.$id,
            name: prof.name || "Studier",
            avatar: prof.avatar || "/placeholder.svg",
            podName,
            focus: Array.isArray(prof.currentFocusAreas) ? prof.currentFocusAreas[0] : undefined,
          }
        })
        setStudyingNow(studyingList)

        const podAchievements: Post[] = []
        podDocs.forEach((pod: any) => {
          const progress = pod.progress || 0
          if (progress >= 70) {
            podAchievements.push({
              id: `ach-progress-${pod.$id || pod.teamId}`,
              title: `${pod.name} hit ${progress}% momentum!`,
              content: "Pod progress milestone unlocked.",
              author: {
                name: pod.name || "Pod",
                avatar: "/placeholder.svg",
                username: pod.$id || pod.teamId || "",
              },
              timestamp: pod.updatedAt || new Date().toISOString(),
              likes: 0,
              comments: 0,
              shares: 0,
              tags: ["achievement", pod.subject || "pod"],
              pod: { id: pod.$id || pod.teamId, name: pod.name, members: pod.memberCount || 0 },
              isLiked: false,
              isBookmarked: false,
              kind: "achievement",
              visibility: pod.isPublic ? "public" : "pod",
            })
          }
          const members = podMemberMap.get(pod.$id || pod.teamId) || []
          const levelUps = onlineProfiles.filter((p: any) => members.includes(p.$id) && (p.level || 0) >= 2 && p.totalPoints)
          levelUps.slice(0, 3).forEach((prof: any) => {
            podAchievements.push({
              id: `ach-level-${pod.$id || pod.teamId}-${prof.$id}`,
              title: `${prof.name || "Member"} leveled up in ${pod.name}`,
              content: `${prof.name || "Member"} reached level ${prof.level || 2} with ${prof.totalPoints || 0} pts.`,
              author: {
                name: pod.name || "Pod",
                avatar: prof.avatar || "/placeholder.svg",
                username: pod.$id || pod.teamId || "",
              },
              timestamp: new Date().toISOString(),
              likes: 0,
              comments: 0,
              shares: 0,
              tags: ["achievement", "rank"],
              pod: { id: pod.$id || pod.teamId, name: pod.name, members: pod.memberCount || 0 },
              isLiked: false,
              isBookmarked: false,
              kind: "achievement",
              visibility: pod.isPublic ? "public" : "pod",
            })
          })
        })
        setAchievements(podAchievements)

        const merged = [...podAchievements, ...mapped].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
        setPosts(merged)
      } catch (e: any) {
        if (e?.status === 401 || e?.code === 401) return
        console.error(e)
        toast({ title: "Failed to load feed", description: e?.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.$id, toast])

  const handleLike = async (postId: string) => {
    if (!user?.$id) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    try {
      const updated = await feedService.toggleLike(postId, user.$id)
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: updated.likes || 0,
                isLiked: updated.isLiked,
              }
            : post,
        ),
      )
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to like post", description: error?.message, variant: "destructive" })
    }
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.$id) return
    try {
      const result = await feedService.toggleSavePost(postId, user.$id)
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isBookmarked: result.saved } : post,
        ),
      )

      toast({
        title: result.saved ? "Added to bookmarks" : "Removed from bookmarks",
        description: result.saved ? "Post saved to your bookmarks" : "Post removed from your saved items",
      })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to update bookmark", description: error?.message, variant: "destructive" })
    }
  }

  const handleShare = async (postId: string) => {
    const post = posts.find((p) => p.id === postId)
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
            title: "Link copied",
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

  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: newCount } : post
      )
    )
  }

  const handlePostClick = (authorId: string, username?: string) => {
    if (user?.$id && authorId === user.$id) {
      router.push('/app/profile')
      return
    }

    const profileSlug = (username || authorId).replace('@', '')
    router.push(`/app/profile/${profileSlug}`)
  }

  const handleReportPost = async (postId: string) => {
    if (!user?.$id) {
      toast({ title: "Sign in required", description: "Please sign in to report content.", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: user.$id,
          contentId: postId,
          contentType: "post",
          reason: "policy_violation",
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error?.message || data?.error || "Report failed")
      }
      toast({
        title: "Report received",
        description: "Thanks for helping keep Student.social safe. Our team will review it.",
      })
    } catch (error: any) {
      toast({ title: "Report failed", description: error?.message || "Please try again.", variant: "destructive" })
    }
  }

  useEffect(() => {
    const receiveCreatedPost = (event: Event) => {
      const newPost = (event as CustomEvent<Post>).detail
      if (newPost?.id) setPosts((prev) => prev.some((post) => post.id === newPost.id) ? prev : [newPost, ...prev])
    }
    window.addEventListener("student:post-created", receiveCreatedPost)
    return () => window.removeEventListener("student:post-created", receiveCreatedPost)
  }, [])

  const togglePostExpansion = (postId: string) => {
    setExpandedPostIds((current) => {
      const next = new Set(current)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const handleCelebrate = async () => {
    if (!user?.$id) {
      toast({ title: "Sign in required", description: "Please sign in to celebrate", variant: "destructive" })
      return
    }
    if (!celebrationText.trim()) {
      toast({ title: "Add a milestone", description: "Share what you are celebrating." })
      return
    }
    setIsCelebrating(true)
    try {
      const visibility = celebrationPod === "public" ? "public" : "pod"
      const created = await feedService.createPost(user.$id, celebrationText.trim(), {
        type: "achievement",
        visibility,
        podId: celebrationPod === "public" ? undefined : celebrationPod,
        tags: ["celebration", "milestone"],
        authorName: profile?.name || user.name,
        authorAvatar: profile?.avatar,
        authorUsername: formatUsername(profile?.name || user.name) || (user.email ? `@${user.email.split("@")[0]}` : ""),
      })
      const podMeta = celebrationPod === "public" ? undefined : pods.find((p: any) => p.$id === celebrationPod || p.teamId === celebrationPod)
      const celebrationName = profile?.name || user.name || "You"
      const celebrationAvatar = profile?.avatar || "/placeholder.svg"
      const celebrationUsername = formatUsername(profile?.name || user.name) || (user.email ? `@${user.email.split("@")[0]}` : "")
      const newPost: Post = {
        id: created.$id,
        title: "Celebration",
        content: celebrationText.trim(),
        author: {
          name: celebrationName,
          avatar: celebrationAvatar,
          username: celebrationUsername,
        },
        timestamp: created.timestamp || new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        tags: created.tags || ["celebration"],
        pod: visibility === "pod" && podMeta
          ? { id: podMeta.$id || podMeta.teamId, name: podMeta.name, members: podMeta.memberCount || 0 }
          : undefined,
        isLiked: false,
        isBookmarked: false,
        kind: "achievement",
        visibility,
      }
      setPosts((prev) => [newPost, ...prev])
      setCelebrationText("")
      setCelebrationPod("public")
      toast({ title: "Shared!", description: "Milestone shared with your podmates." })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to share", description: error?.message, variant: "destructive" })
    } finally {
      setIsCelebrating(false)
    }
  }

  const followingIds = new Set(Array.isArray(profile?.following) ? profile.following : [])
  const filteredPosts = posts.filter((post) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "following" && Boolean(post.authorId && followingIds.has(post.authorId))) ||
      (activeTab === "pods" && post.pod)

    return matchesTab
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Filters */}
      <div className="hidden md:block p-4 md:p-8 pb-2 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="pods">My Pods</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="student-feed-mobile-controls md:hidden px-4 py-3 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs">
              Following
            </TabsTrigger>
            <TabsTrigger value="pods" className="text-xs">
              Pods
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="space-y-4" aria-label="Loading feed posts">
                {[0, 1, 2].map((item) => (
                  <Card key={item} className="animate-pulse border-0 shadow-sm md:border">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 rounded bg-muted" />
                          <div className="h-3 w-20 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-5/6 rounded bg-muted" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p>Try adjusting your search or filters</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="student-feed-post hover:shadow-md transition-shadow border-0 md:border shadow-sm">
                  <CardHeader className="pb-3 px-4 md:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all" 
                          onClick={() => handlePostClick(post.authorId || '', post.author.username)}
                        >
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
                            <h4 
                              className="font-semibold text-sm cursor-pointer hover:underline" 
                              onClick={() => handlePostClick(post.authorId || '', post.author.username)}
                            >
                              {post.author.name}
                            </h4>
                            <span className="text-muted-foreground text-sm hidden md:inline">
                              {post.author.username}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{post.timestamp ? new Date(post.timestamp).toLocaleString() : ""}</span>
                            {post.pod && (
                              <>
                                <span>•</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-muted"
                                  onClick={() => router.push(`/app/pods/${post.pod?.id}`)}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  {post.pod.name}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBookmark(post.id)}
                          className={`h-8 w-8 ${post.isBookmarked ? "text-yellow-500" : ""}`}
                          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark this post"}
                        >
                          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open post actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePostClick(post.authorId || '', post.author.username)}>
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(post.id)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBookmark(post.id)}>
                              <Bookmark className="w-4 h-4 mr-2" />
                              {post.isBookmarked ? "Remove Bookmark" : "Bookmark"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleReportPost(post.id)}
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Report Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 md:px-6">
                    {post.title && <h3 className="font-semibold text-lg mb-2">{post.title}</h3>}
                    <div className={`student-post-copy whitespace-pre-wrap ${expandedPostIds.has(post.id) ? "is-expanded" : ""}`}>{post.content}</div>
                    {post.content.length > 260 ? (
                      <button type="button" className="student-post-more" onClick={() => togglePostExpansion(post.id)}>
                        {expandedPostIds.has(post.id) ? "Show less" : "Continue reading"}
                      </button>
                    ) : null}

                    {post.attachments && post.attachments.length > 0 ? <PostMediaCarousel attachments={post.attachments} /> : null}

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
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
                          className={`student-post-action ${post.isLiked ? "is-active" : ""}`}
                          aria-label={`${post.isLiked ? "Unlike" : "Like"} this post`}
                        >
                          <Heart className={`w-4 h-4 mr-1 md:mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                          <span className="text-xs md:text-sm">{post.likes}</span>
                        </Button>
                        <div className="student-post-action" aria-label={`${post.comments} comments`}>
                          <MessageCircle className="w-4 h-4 mr-1 md:mr-2" />
                          <span className="text-xs md:text-sm">{post.comments}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(post.id)}
                          className="student-post-action"
                          aria-label="Share this post"
                        >
                          <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                          <span className="text-xs md:text-sm hidden md:inline">{post.shares}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {post.kind !== "achievement" && (
                      <CommentsSection
                        postId={post.id}
                        initialCommentCount={post.comments}
                        onCommentCountChange={(count) => handleCommentCountChange(post.id, count)}
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-semibold">Pod Achievements</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No achievements yet. Keep the momentum going!</p>
                ) : (
                  achievements.slice(0, 4).map((ach) => (
                    <div key={ach.id} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{ach.title || "Achievement"}</p>
                        <p className="text-xs text-muted-foreground">{ach.pod?.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{ach.visibility === "pod" ? "Pod" : "Public"}</Badge>
                          <span>{ach.timestamp ? new Date(ach.timestamp).toLocaleString() : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5" />
                  <h3 className="font-semibold">Who&apos;s Studying Now</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {studyingNow.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one is live right now.</p>
                ) : (
                  studyingNow.map((person) => (
                    <div key={person.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={person.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {person.focus ? `Focusing on ${person.focus}` : person.podName || "Studying"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" /> Live
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Celebrate a Milestone</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Shout out a win or pod milestone..."
                  value={celebrationText}
                  onChange={(e) => setCelebrationText(e.target.value)}
                  className="min-h-[90px]"
                />
                <div className="flex items-center gap-3">
                  <Select value={celebrationPod} onValueChange={setCelebrationPod}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      {pods.map((p: any) => (
                        <SelectItem key={p.$id || p.teamId} value={p.$id || p.teamId}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleCelebrate} disabled={isCelebrating}>
                    {isCelebrating ? "Sharing..." : "Share"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  )
}
