"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, Clock, TrendingUp, Filter, Calendar, Video, MessageSquare, BookOpen, Target, Globe, Award, ChevronRight } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { podService, profileService } from "@/lib/appwrite"
import { rankPodsForUser } from "@/lib/pod-matching"

type PodDoc = {
  $id: string
  name: string
  description: string
  category?: string
  subject?: string
  members?: string[]
  memberCount?: number
  difficulty?: string
  tags?: string[]
  mentor?: string
  nextSession?: string
  progress?: number
  streak?: number
  cover?: string
  isActive?: boolean
  isPublic?: boolean
}

const CATEGORY_ICONS: Record<string, any> = {
  Programming: BookOpen,
  Design: Target,
  Medical: Award,
  Languages: MessageSquare,
  Business: TrendingUp,
}

export default function PodsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("my-pods")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [myPods, setMyPods] = useState<PodDoc[]>([])
  const [explorePods, setExplorePods] = useState<PodDoc[]>([])
  const [podMatches, setPodMatches] = useState<Record<string, number>>({})
  const [newPod, setNewPod] = useState({
    name: "",
    description: "",
    category: "",
    difficulty: "",
    tags: "",
    isPublic: true,
    sessionType: "live",
    idealLearnerType: "beginner",
    averageSessionLength: "60",
    availability: [] as string[],
  })
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const [myPodsRes, exploreRes, profile] = await Promise.all([
          podService.getUserPods(user.$id),
          podService.getAllPods(50, 0, {}),
          profileService.getProfile(user.$id),
        ])
        setMyPods(myPodsRes.documents || [])
        const pods = exploreRes.documents || []
        setExplorePods(pods)

        // Compute match scores client-side for now
        if (profile) {
          const ranked = rankPodsForUser(profile, pods, pods.length)
          const scoreMap: Record<string, number> = {}
          ranked.forEach(({ pod, score }) => {
            scoreMap[pod.$id] = score
          })
          setPodMatches(scoreMap)
        }
      } catch (e) {
        console.error(e)
        toast({ title: "Failed to load pods", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.$id, toast])

  const handleJoinPod = (podId: string) => {
    router.push(`/app/pods/${podId}`)
  }

  const handleCreatePod = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreatePodSubmit = async () => {
    if (!newPod.name || !newPod.description || !newPod.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    if (!user?.$id) {
      toast({ title: "Not signed in", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const tagsArray = newPod.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const metadata = {
        subject: newPod.category,
        difficulty: newPod.difficulty || "Beginner",
        tags: tagsArray,
        sessionType: [newPod.sessionType],
        idealLearnerType: [newPod.idealLearnerType],
        averageSessionLength: Number(newPod.averageSessionLength) || null,
        commonAvailability: newPod.availability,
        matchingTags: tagsArray,
        isPublic: newPod.isPublic,
      }

      const { pod } = await podService.createPod(newPod.name, newPod.description, user.$id, metadata)

      toast({
        title: "Pod Created!",
        description: `${newPod.name} is live. Redirecting...`,
      })

      setNewPod({
        name: "",
        description: "",
        category: "",
        difficulty: "",
        tags: "",
        isPublic: true,
        sessionType: "live",
        idealLearnerType: "beginner",
        averageSessionLength: "60",
        availability: [],
      })
      setIsCreateDialogOpen(false)
      setMyPods((prev) => [{ ...pod }, ...prev])
      router.push(`/app/pods/${pod.$id}`)
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to create pod", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinExplorePod = (podId: string, podName: string) => {
    toast({
      title: "Joining Pod",
      description: `Welcome to ${podName}! Redirecting...`,
    })
    router.push(`/app/pods/${podId}`)
  }

  const handlePodChat = (podId: string) => {
    router.push(`/app/chat?room=${podId}`)
    toast({
      title: "Opening Chat",
      description: "Redirecting to pod chat...",
    })
  }

  const handlePodCalendar = (podId: string) => {
    router.push(`/app/calendar?pod=${podId}`)
    toast({
      title: "Opening Calendar",
      description: "Viewing pod schedule...",
    })
  }

  const filteredExplorePods = useMemo(() => {
    return (explorePods || []).filter((pod) => {
      const matchesSearch =
        pod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pod.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "All" || pod.category === selectedCategory || pod.subject === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [explorePods, searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    explorePods.forEach((pod) => {
      const cat = pod.category || pod.subject || "Other"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return ["All", ...Object.keys(counts)].map((name) => ({ name, count: name === "All" ? explorePods.length : counts[name] }))
  }, [explorePods])

  const getDifficultyColor = (difficulty?: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">My Pods</h1>
            <p className="text-sm text-muted-foreground">Your learning communities</p>
          </div>
          <Button size="sm" onClick={handleCreatePod} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Study Pods</h1>
              <p className="text-muted-foreground">Join communities and learn together</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button onClick={handleCreatePod} className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pod
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-secondary/50 rounded-lg p-1 max-w-fit">
            {[
              { value: "my-pods", label: "My Pods", icon: Users },
              { value: "explore", label: "Explore", icon: Search },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* My Pods Tab */}
        {activeTab === "my-pods" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myPods.length === 0 && !isLoading && (
                <div className="col-span-full text-center text-muted-foreground">No pods yet. Join or create one.</div>
              )}
              {myPods.map((pod) => (
                <Card key={pod.$id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{pod.name}</h3>
                          {pod.isActive === false && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{pod.description}</p>
                      </div>
                      <Badge variant="outline">{pod.category || pod.subject || "General"}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {pod.memberCount ?? pod.members?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof podMatches[pod.$id] === "number" && (
                          <Badge variant="secondary" className="text-xs">
                            {podMatches[pod.$id]}% match
                          </Badge>
                        )}
                        {pod.difficulty && <Badge className={getDifficultyColor(pod.difficulty)}>{pod.difficulty}</Badge>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-muted-foreground">{typeof pod.progress === "number" ? `${pod.progress}%` : "No progress yet"}</span>
                      </div>
                      <Progress value={pod.progress || 0} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {pod.nextSession && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {pod.nextSession}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(pod.tags || []).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button onClick={() => handleJoinPod(pod.$id)} className="flex-1 bg-primary hover:bg-primary/90">
                        <Video className="w-4 h-4 mr-2" />
                        Enter Pod
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent" onClick={() => handlePodChat(pod.$id)}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent" onClick={() => handlePodCalendar(pod.$id)}>
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Explore Tab */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search pods, topics, or mentors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category.name] || Globe
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.name
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explore Pods Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExplorePods.map((pod) => (
                <Card key={pod.$id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{pod.name}</h3>
                          {pod.isPublic === false && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Private</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{pod.description}</p>
                      </div>
                      <Badge variant="outline">{pod.category || pod.subject || "General"}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {pod.memberCount ?? pod.members?.length ?? 0}
                        </span>
                      </div>
                      {pod.difficulty && <Badge className={getDifficultyColor(pod.difficulty)}>{pod.difficulty}</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(pod.tags || []).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        onClick={() => handleJoinExplorePod(pod.$id, pod.name)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Join Pod
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent" onClick={() => handleJoinPod(pod.$id)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExplorePods.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pods found</h3>
                <p className="text-muted-foreground">Try adjusting your search or browse different categories</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Pod Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Create New Pod</DialogTitle>
            <DialogDescription>Start a new learning community and invite others to join</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pod-name">Pod Name *</Label>
              <Input
                id="pod-name"
                placeholder="e.g., Advanced React Patterns"
                value={newPod.name}
                onChange={(e) => setNewPod({ ...newPod, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pod-description">Description *</Label>
              <Textarea
                id="pod-description"
                placeholder="Describe what your pod is about..."
                value={newPod.description}
                onChange={(e) => setNewPod({ ...newPod, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pod-category">Category *</Label>
                <Select value={newPod.category} onValueChange={(value) => setNewPod({ ...newPod, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pod-difficulty">Difficulty</Label>
                <Select value={newPod.difficulty} onValueChange={(value) => setNewPod({ ...newPod, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Session style</Label>
                <Select value={newPod.sessionType} onValueChange={(value) => setNewPod({ ...newPod, sessionType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="async">Async</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ideal learner type</Label>
                <Select
                  value={newPod.idealLearnerType}
                  onValueChange={(value) => setNewPod({ ...newPod, idealLearnerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select learner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="interview-prep">Interview prep</SelectItem>
                    <SelectItem value="exam-prep">Exam prep</SelectItem>
                    <SelectItem value="skill-growth">Skill growth</SelectItem>
                    <SelectItem value="career-switch">Career switcher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pod-length">Typical session length (minutes)</Label>
                <Input
                  id="pod-length"
                  type="number"
                  min={15}
                  max={240}
                  value={newPod.averageSessionLength}
                  onChange={(e) => setNewPod({ ...newPod, averageSessionLength: e.target.value })}
                />
              </div>
              <div>
                <Label>Common availability</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { id: "weekday-morning", label: "Weekday mornings" },
                    { id: "weekday-evening", label: "Weekday evenings" },
                    { id: "weekend", label: "Weekends" },
                  ].map((slot) => (
                    <Button
                      key={slot.id}
                      size="sm"
                      type="button"
                      variant={newPod.availability.includes(slot.id) ? "default" : "outline"}
                      onClick={() =>
                        setNewPod((prev) => ({
                          ...prev,
                          availability: prev.availability.includes(slot.id)
                            ? prev.availability.filter((s) => s !== slot.id)
                            : [...prev.availability, slot.id],
                        }))
                      }
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="pod-tags">Tags (comma separated)</Label>
              <Input
                id="pod-tags"
                placeholder="e.g., React, JavaScript, Frontend"
                value={newPod.tags}
                onChange={(e) => setNewPod({ ...newPod, tags: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreatePodSubmit} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Pod"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
