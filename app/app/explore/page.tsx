"use client"

/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = [
  { id: "all", label: "All", icon: Globe },
  { id: "programming", label: "Programming", icon: BookOpen },
  { id: "mathematics", label: "Mathematics", icon: Target },
  { id: "science", label: "Science", icon: Zap },
  { id: "language", label: "Languages", icon: MessageCircle },
  { id: "business", label: "Business", icon: TrendingUp },
  { id: "design", label: "Design", icon: Star },
]

const FEATURED_PODS = [
  {
    id: "1",
    name: "Advanced React Patterns",
    description: "Master advanced React concepts including hooks, context, and performance optimization",
    category: "programming",
    members: 1247,
    avatar: "/placeholder.svg?height=80&width=80&text=React",
    banner: "/placeholder.svg?height=200&width=400&text=React+Banner",
    tags: ["React", "JavaScript", "Frontend", "Hooks"],
    difficulty: "Advanced",
    rating: 4.8,
    reviews: 156,
    isActive: true,
    lastActivity: "2 hours ago",
    mentor: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=32&width=32&text=SC",
      title: "Senior Frontend Developer",
    },
    stats: {
      posts: 234,
      resources: 45,
      discussions: 89,
    },
    isJoined: false,
    isPinned: false,
    visibility: "public",
  },
  {
    id: "2",
    name: "Data Science Fundamentals",
    description: "Learn the basics of data science, statistics, and machine learning with Python",
    category: "programming",
    members: 892,
    avatar: "/placeholder.svg?height=80&width=80&text=DS",
    banner: "/placeholder.svg?height=200&width=400&text=Data+Science",
    tags: ["Python", "Data Science", "ML", "Statistics"],
    difficulty: "Beginner",
    rating: 4.6,
    reviews: 203,
    isActive: true,
    lastActivity: "1 hour ago",
    mentor: {
      name: "Dr. Michael Rodriguez",
      avatar: "/placeholder.svg?height=32&width=32&text=MR",
      title: "Data Scientist",
    },
    stats: {
      posts: 189,
      resources: 67,
      discussions: 145,
    },
    isJoined: true,
    isPinned: false,
    visibility: "public",
  },
  {
    id: "3",
    name: "NEET Biology Mastery",
    description: "Comprehensive biology preparation for NEET with expert guidance and practice tests",
    category: "science",
    members: 2156,
    avatar: "/placeholder.svg?height=80&width=80&text=BIO",
    banner: "/placeholder.svg?height=200&width=400&text=Biology+NEET",
    tags: ["Biology", "NEET", "Medical", "Exam Prep"],
    difficulty: "Intermediate",
    rating: 4.9,
    reviews: 324,
    isActive: true,
    lastActivity: "30 minutes ago",
    mentor: {
      name: "Dr. Priya Sharma",
      avatar: "/placeholder.svg?height=32&width=32&text=PS",
      title: "Biology Professor",
    },
    stats: {
      posts: 456,
      resources: 123,
      discussions: 267,
    },
    isJoined: false,
    isPinned: true,
    visibility: "public",
  },
  {
    id: "4",
    name: "Digital Marketing Strategy",
    description: "Learn modern digital marketing techniques, SEO, social media, and analytics",
    category: "business",
    members: 743,
    avatar: "/placeholder.svg?height=80&width=80&text=DM",
    banner: "/placeholder.svg?height=200&width=400&text=Digital+Marketing",
    tags: ["Marketing", "SEO", "Social Media", "Analytics"],
    difficulty: "Intermediate",
    rating: 4.5,
    reviews: 98,
    isActive: true,
    lastActivity: "4 hours ago",
    mentor: {
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

  const handleJoinPod = (podName: string) => {
    toast({
      title: "Join Request Sent",
      description: `Your request to join ${podName} has been sent to the moderators.`,
    })
  }

  const handleBookmark = (podName: string) => {
    toast({
      title: "Pod Bookmarked",
      description: `${podName} has been added to your bookmarks.`,
    })
  }

  const handleShare = (podName: string) => {
    toast({
      title: "Pod Shared",
      description: `Share link for ${podName} copied to clipboard.`,
    })
  }

  const filteredPods = FEATURED_PODS.filter((pod) => {
    const matchesSearch =
      pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || pod.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const renderPodCard = (pod: (typeof FEATURED_PODS)[0]) => (
    <Card key={pod.id} className="hover:shadow-lg transition-all duration-200 group">
      <div className="relative">
        <img src={pod.banner || "/placeholder.svg"} alt={pod.name} className="w-full h-48 object-cover rounded-t-lg" />
        <div className="absolute top-4 left-4">
          <Badge className={getDifficultyColor(pod.difficulty)}>{pod.difficulty}</Badge>
        </div>
        <div className="absolute top-4 right-4 flex space-x-2">
          {pod.isPinned && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBookmark(pod.name)}>
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(pod.name)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-4 left-4">
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage src={pod.avatar || "/placeholder.svg"} />
            <AvatarFallback>{pod.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg line-clamp-1">{pod.name}</h3>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{pod.rating}</span>
                <span>({pod.reviews})</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{pod.description}</p>
          </div>

          {/* Mentor Info */}
          <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
            <Avatar className="w-8 h-8">
              <AvatarImage src={pod.mentor.avatar || "/placeholder.svg"} />
              <AvatarFallback>{pod.mentor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{pod.mentor.name}</p>
              <p className="text-xs text-muted-foreground">{pod.mentor.title}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-semibold text-sm">{pod.stats.posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="font-semibold text-sm">{pod.stats.resources}</p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </div>
            <div>
              <p className="font-semibold text-sm">{pod.stats.discussions}</p>
              <p className="text-xs text-muted-foreground">Discussions</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {pod.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {pod.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{pod.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {pod.members.toLocaleString()}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {pod.lastActivity}
              </span>
            </div>

            {pod.isJoined ? (
              <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Users className="w-4 h-4 mr-2" />
                Joined
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleJoinPod(pod.name)} className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Request to Join
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
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
              <Button className="bg-primary hover:bg-primary/90">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredPods.map(renderPodCard)}</div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPods.slice(0, 6).map(renderPodCard)}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPods.slice(2, 8).map(renderPodCard)}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPods.slice(1, 7).map(renderPodCard)}
            </div>
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
