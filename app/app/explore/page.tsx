"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Users,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  Target,
  Zap,
  Globe,
  UserPlus,
  Eye,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Plus,
  Loader2,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { podService, profileService } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  { id: "all", label: "All", icon: Globe },
  { id: "programming", label: "Programming", icon: BookOpen },
  { id: "mathematics", label: "Mathematics", icon: Target },
  { id: "science", label: "Science", icon: Zap },
  { id: "language", label: "Languages", icon: MessageCircle },
  { id: "business", label: "Business", icon: TrendingUp },
  { id: "design", label: "Design", icon: Star },
]

interface Pod {
  $id: string
  teamId?: string
  name: string
  description: string
  creatorId: string
  members: string[]
  subject?: string
  difficulty?: string
  isActive: boolean
  isPublic: boolean
  createdAt: string
  memberCount: number
  matchingTags?: string[]
  creatorName?: string
  isJoined?: boolean
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [activeTab, setActiveTab] = useState("featured")
  const [pods, setPods] = useState<Pod[]>([])
  const [userPods, setUserPods] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joiningPodId, setJoiningPodId] = useState<string | null>(null)
  const [inviteLinkDialog, setInviteLinkDialog] = useState<{ open: boolean; link: string; podName: string }>({
    open: false,
    link: "",
    podName: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Load pods from database
  useEffect(() => {
    const loadPods = async () => {
      setIsLoading(true)
      try {
        const [allPodsRes, userPodsRes] = await Promise.all([
          podService.getAllPods(100, 0, {}),
          user?.$id ? podService.getUserPods(user.$id) : Promise.resolve({ documents: [] }),
        ])

        const userPodIds = (userPodsRes.documents || []).map((p: any) => p.$id || p.teamId)
        setUserPods(userPodIds)

        // Enrich pods with creator names
        const enrichedPods = await Promise.all(
          (allPodsRes.documents || []).map(async (pod: any) => {
            let creatorName = "Unknown"
            try {
              const creatorProfile = await profileService.getProfile(pod.creatorId)
              if (creatorProfile?.name) {
                creatorName = creatorProfile.name
              }
            } catch {
              // Use default name
            }
            return {
              ...pod,
              creatorName,
              isJoined: userPodIds.includes(pod.$id || pod.teamId),
            }
          })
        )

        setPods(enrichedPods)
      } catch (error: any) {
        console.error("Failed to load pods:", error)
        toast({
          title: "Error loading pods",
          description: error?.message || "Could not load pods. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPods()
  }, [user?.$id, toast])
      name: "Alex Thompson",
      avatar: "/placeholder.svg?height=32&width=32&text=AT",
      title: "Marketing Director",
    },
    stats: {
      posts: 167,
      resources: 34,
      discussions: 78,
    },
    isJoined: false,
    isPinned: false,
    visibility: "public",
  },
  {
    id: "5",
    name: "Calculus Study Group",
    description: "Master calculus concepts with peer learning and collaborative problem solving",
    category: "mathematics",
    members: 567,
    avatar: "/placeholder.svg?height=80&width=80&text=CALC",
    banner: "/placeholder.svg?height=200&width=400&text=Calculus",
    tags: ["Calculus", "Mathematics", "Problem Solving"],
    difficulty: "Intermediate",
    rating: 4.7,
    reviews: 89,
    isActive: true,
    lastActivity: "1 hour ago",
    mentor: {
      name: "Prof. David Kim",
      avatar: "/placeholder.svg?height=32&width=32&text=DK",
      title: "Mathematics Professor",
    },
    stats: {
      posts: 234,
      resources: 56,
      discussions: 123,
    },
    isJoined: false,
    isPinned: false,
    visibility: "public",
  },
  {
    id: "6",
    name: "UI/UX Design Principles",
    description: "Learn design thinking, user research, prototyping, and modern design tools",
    category: "design",
    members: 934,
    avatar: "/placeholder.svg?height=80&width=80&text=UX",
    banner: "/placeholder.svg?height=200&width=400&text=UI+UX+Design",
    tags: ["UI/UX", "Design", "Figma", "Prototyping"],
    difficulty: "Beginner",
    rating: 4.6,
    reviews: 145,
    isActive: true,
    lastActivity: "3 hours ago",
    mentor: {
      name: "Emma Wilson",
      avatar: "/placeholder.svg?height=32&width=32&text=EW",
      title: "Senior UX Designer",
    },
    stats: {
      posts: 198,
      resources: 78,
      discussions: 156,
    },
    isJoined: false,
    isPinned: false,
    visibility: "public",
  },
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [activeTab, setActiveTab] = useState("featured")
  const { toast } = useToast()

  const handleJoinPod = async (pod: Pod) => {
    if (!user?.$id) {
      toast({
        title: "Login required",
        description: "Please log in to join pods.",
        variant: "destructive",
      })
      return
    }

    const podId = pod.$id || pod.teamId
    if (!podId) return

    setJoiningPodId(podId)
    try {
      const result = await podService.joinPod(podId, user.$id, user.email)
      
      if (result.alreadyMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${pod.name}.`,
        })
      } else {
        toast({
          title: "Joined successfully!",
          description: `You've joined ${pod.name}. Welcome to the community!`,
        })
        
        // Update local state
        setPods(prev => prev.map(p => 
          (p.$id || p.teamId) === podId 
            ? { ...p, isJoined: true, memberCount: (p.memberCount || 0) + 1 }
            : p
        ))
        setUserPods(prev => [...prev, podId])
      }
    } catch (error: any) {
      toast({
        title: "Failed to join",
        description: error?.message || "Could not join the pod. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJoiningPodId(null)
    }
  }

  const handleBookmark = (podName: string) => {
    toast({
      title: "Pod Bookmarked",
      description: `${podName} has been added to your bookmarks.`,
    })
  }

  const handleShare = (pod: Pod) => {
    const podId = pod.$id || pod.teamId
    if (!podId) return

    const inviteLink = podService.generateInviteLink(podId)
    
    // Try to copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        toast({
          title: "Link copied!",
          description: `Share link for ${pod.name} copied to clipboard.`,
        })
      }).catch(() => {
        setInviteLinkDialog({ open: true, link: inviteLink, podName: pod.name })
      })
    } else {
      setInviteLinkDialog({ open: true, link: inviteLink, podName: pod.name })
    }
  }

  const handleViewPod = (pod: Pod) => {
    const podId = pod.$id || pod.teamId
    if (podId) {
      router.push(`/app/pods/${podId}`)
    }
  }

  const handleCreatePod = () => {
    router.push('/app/pods/create')
  }

  const filteredPods = pods.filter((pod) => {
    const matchesSearch =
      pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pod.matchingTags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || 
      (pod.subject?.toLowerCase() === selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const renderPodCard = (pod: Pod) => {
    const podId = pod.$id || pod.teamId
    const isJoining = joiningPodId === podId
    const tags = pod.matchingTags || []
    const createdDate = pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : "Recently"

    return (
      <Card key={podId} className="hover:shadow-lg transition-all duration-200 group overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 h-32 flex items-center justify-center">
          <div className="absolute top-4 left-4">
            <Badge className={getDifficultyColor(pod.difficulty || "Beginner")}>{pod.difficulty || "All Levels"}</Badge>
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBookmark(pod.name)}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare(pod)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Invite Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewPod(pod)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
              {pod.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <CardContent className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{pod.name}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{pod.description}</p>
            </div>

            {/* Creator Info */}
            <div className="flex items-center space-x-3 p-2 bg-secondary/30 rounded-lg">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs">{(pod.creatorName || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Created by {pod.creatorName || "User"}</p>
                <p className="text-xs text-muted-foreground">{createdDate}</p>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {(pod.memberCount || 0).toLocaleString()}
                </span>
                {pod.subject && (
                  <Badge variant="secondary" className="text-xs">{pod.subject}</Badge>
                )}
              </div>

              {pod.isJoined ? (
                <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" onClick={() => handleViewPod(pod)}>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Joined
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleJoinPod(pod)} className="bg-primary hover:bg-primary/90" disabled={isJoining}>
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Invite Link Dialog */}
      <Dialog open={inviteLinkDialog.open} onOpenChange={(open) => setInviteLinkDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Invite Link</DialogTitle>
            <DialogDescription>Share this link to invite others to join {inviteLinkDialog.podName}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={inviteLinkDialog.link} readOnly className="flex-1" />
            <Button onClick={() => {
              navigator.clipboard?.writeText(inviteLinkDialog.link)
              toast({ title: "Copied!", description: "Link copied to clipboard." })
            }}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="p-4 md:p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Explore Pods</h1>
              <p className="text-muted-foreground">Discover learning communities that match your interests</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreatePod}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pod
              </Button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="space-y-4 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search pods, topics, or mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="featured">🌟 Featured</TabsTrigger>
              <TabsTrigger value="trending">🔥 Trending</TabsTrigger>
              <TabsTrigger value="new">✨ New</TabsTrigger>
              <TabsTrigger value="recommended">💡 For You</TabsTrigger>
            </TabsList>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Created</SelectItem>
                <SelectItem value="members">Most Members</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="featured" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading pods...</span>
              </div>
            ) : filteredPods.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pods found</h3>
                <p className="text-muted-foreground mb-4">Try a different search or category, or create your own pod!</p>
                <Button onClick={handleCreatePod}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create a Pod
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredPods.map(renderPodCard)}</div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPods.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).slice(0, 6).map(renderPodCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPods.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6).map(renderPodCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommended" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPods.filter(p => !p.isJoined).slice(0, 6).map(renderPodCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            Load More Pods
          </Button>
        </div>
      </div>
    </div>
  )
}
