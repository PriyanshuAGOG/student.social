// @ts-nocheck
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { podService, profileService } from "@/lib/appwrite"
import { rankPodsForUser } from "@/lib/pod-matching"
import { BookOpen, Calendar, ChevronRight, Compass, Loader2, MessageSquare, Plus, Search, Sparkles, Target, TrendingUp, Users, Video } from "lucide-react"

const TAB_VALUES = ["overview", "my-pods", "discover"] as const

const CATEGORY_ICONS: Record<string, any> = {
  Programming: BookOpen,
  Design: Sparkles,
  Medical: Target,
  Languages: MessageSquare,
  Business: TrendingUp,
  Science: Compass,
}

export default function PodsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [joiningPodId, setJoiningPodId] = useState<string | null>(null)
  const [myPods, setMyPods] = useState<any[]>([])
  const [allPods, setAllPods] = useState<any[]>([])
  const [matchScores, setMatchScores] = useState<Record<string, number>>({})
  const [podFormTouched, setPodFormTouched] = useState<Record<string, boolean>>({})
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

  useEffect(() => {
    const requestedTab = searchParams.get("tab")
    const shouldOpenCreate = searchParams.get("create") === "1"
    if (requestedTab && TAB_VALUES.includes(requestedTab as any)) {
      setActiveTab(requestedTab)
    }
    if (shouldOpenCreate) {
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const [myPodsRes, allPodsRes, profile] = await Promise.all([
          podService.getUserPods(user.$id, 100, 0),
          podService.getAllPods(150, 0, {}),
          profileService.getProfile(user.$id),
        ])

        const mine = myPodsRes.documents || []
        const everyPod = allPodsRes.documents || []
        setMyPods(mine)
        setAllPods(everyPod)

        if (profile) {
          const ranked = rankPodsForUser(profile, everyPod, everyPod.length)
          const scoreMap: Record<string, number> = {}
          ranked.forEach(({ pod, score }) => {
            scoreMap[pod.$id || pod.teamId] = score
          })
          setMatchScores(scoreMap)
        }
      } catch (error: any) {
        console.error(error)
        toast({ title: "Failed to load pods", description: error?.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [toast, user?.$id])

  const myPodIds = useMemo(() => new Set(myPods.map((pod) => pod.$id || pod.teamId)), [myPods])

  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    allPods.forEach((pod) => {
      const category = pod.category || pod.subject || "Other"
      counts[category] = (counts[category] || 0) + 1
    })
    return ["All", ...Object.keys(counts).sort()].map((name) => ({
      name,
      count: name === "All" ? allPods.length : counts[name],
    }))
  }, [allPods])

  const discoverPods = useMemo(() => {
    return allPods
      .filter((pod) => {
        const matchesSearch =
          !searchQuery ||
          pod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pod.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pod.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory =
          selectedCategory === "All" ||
          pod.category === selectedCategory ||
          pod.subject === selectedCategory

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => (matchScores[b.$id || b.teamId] || 0) - (matchScores[a.$id || a.teamId] || 0))
  }, [allPods, matchScores, searchQuery, selectedCategory])

  const recommendedPods = useMemo(
    () => discoverPods.filter((pod) => !myPodIds.has(pod.$id || pod.teamId)).slice(0, 6),
    [discoverPods, myPodIds],
  )

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const openPod = (podId: string) => router.push(`/app/pods/${podId}`)
  const openPodChat = (podId: string) => router.push(`/app/chat?room=${podId}`)
  const openCalendar = (podId: string) => router.push(`/app/calendar?pod=${podId}`)

  const handleJoinPod = async (pod: any) => {
    if (!user?.$id) return
    const podId = pod.$id || pod.teamId
    if (!podId) return

    if (myPodIds.has(podId)) {
      openPod(podId)
      return
    }

    setJoiningPodId(podId)
    try {
      const result = await podService.joinPod(podId, user.$id, user.email)
      if (!result.alreadyMember) {
        setMyPods((prev) => [{ ...pod, memberCount: (pod.memberCount || pod.members?.length || 0) + 1 }, ...prev])
        setAllPods((prev) =>
          prev.map((item) =>
            (item.$id || item.teamId) === podId
              ? { ...item, memberCount: (item.memberCount || item.members?.length || 0) + 1 }
              : item,
          ),
        )
      }
      toast({
        title: result.alreadyMember ? "Already in pod" : "Joined pod",
        description: result.alreadyMember ? `Opening ${pod.name}` : `${pod.name} is now in your workspace.`,
      })
      openPod(podId)
    } catch (error: any) {
      toast({ title: "Failed to join pod", description: error?.message, variant: "destructive" })
    } finally {
      setJoiningPodId(null)
    }
  }

  const getPodFieldError = (field: "name" | "description" | "category") => {
    if (field === "name" && !newPod.name.trim()) return "Pod name is required."
    if (field === "description" && newPod.description.trim().length < 20) return "Description must be at least 20 characters."
    if (field === "category" && !newPod.category) return "Choose a category so learners can discover this pod."
    return ""
  }

  const handleCreatePod = async () => {
    const requiredErrors = [getPodFieldError("name"), getPodFieldError("description"), getPodFieldError("category")].filter(Boolean)
    if (requiredErrors.length > 0 || !user?.$id) {
      setPodFormTouched({ name: true, description: true, category: true })
      toast({ title: "Incomplete pod setup", description: requiredErrors.join(" "), variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const tagsArray = newPod.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
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
      setMyPods((prev) => [pod, ...prev])
      setAllPods((prev) => [pod, ...prev])
      setIsCreateDialogOpen(false)
      setPodFormTouched({})
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
      toast({ title: "Pod created", description: `${pod.name} is ready.` })
      openPod(pod.$id)
    } catch (error: any) {
      toast({ title: "Failed to create pod", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    { label: "Pods joined", value: myPods.length, detail: "Active communities" },
    { label: "Discoverable pods", value: allPods.length, detail: "Open across the network" },
    { label: "Recommended now", value: recommendedPods.length, detail: "Ranked to your profile" },
  ]

  const renderPodCard = (pod: any, mode: "mine" | "discover") => {
    const podId = pod.$id || pod.teamId
    const isMember = myPodIds.has(podId)
    const isJoining = joiningPodId === podId
    const score = matchScores[podId]
    const Icon = CATEGORY_ICONS[pod.category || pod.subject] || Compass

    return (
      <Card key={podId} className="border-border/60 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">{pod.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{pod.category || pod.subject || "General"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{pod.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {typeof score === "number" && <Badge variant="secondary">{score}% fit</Badge>}
              {pod.difficulty && <Badge className={getDifficultyColor(pod.difficulty)}>{pod.difficulty}</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{pod.memberCount ?? pod.members?.length ?? 0}</span>
            {pod.nextSession && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{pod.nextSession}</span>}
          </div>

          {mode === "mine" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{typeof pod.progress === "number" ? `${pod.progress}%` : "Not tracked yet"}</span>
              </div>
              <Progress value={pod.progress || 0} className="h-2" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(pod.tags || []).slice(0, 4).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>

          <div className="flex gap-2">
            {mode === "mine" ? (
              <>
                <Button className="flex-1" onClick={() => openPod(podId)}>
                  <Video className="h-4 w-4 mr-2" />
                  Enter pod
                </Button>
                <Button variant="outline" size="icon" onClick={() => openPodChat(podId)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => openCalendar(podId)}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button className="flex-1" onClick={() => handleJoinPod(pod)} disabled={isJoining}>
                  {isJoining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isMember ? <ChevronRight className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isMember ? "Open pod" : isJoining ? "Joining..." : "Join pod"}
                </Button>
                <Button variant="outline" size="icon" onClick={() => openPod(podId)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 pt-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary">Pods workspace</Badge>
              <h1 className="text-3xl font-bold tracking-tight">Pods</h1>
              <p className="text-muted-foreground max-w-2xl">
                One workspace for your current pods, recommended pods, and discovery flows.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab("discover")}>
                <Search className="h-4 w-4 mr-2" />
                Discover pods
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create pod
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="my-pods">My pods</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended for you</CardTitle>
                  <CardDescription>Ranked from your profile fit, interests, availability, and pod freshness.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading recommendations...</div>
                  ) : recommendedPods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recommendations yet. Create or join a pod to build your graph.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {recommendedPods.map((pod) => renderPodCard(pod, "discover"))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current pod operations</CardTitle>
                  <CardDescription>Your active pods, schedules, and chat entry points.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading pod workspace...</div>
                  ) : myPods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You have not joined any pods yet.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {myPods.slice(0, 6).map((pod) => renderPodCard(pod, "mine"))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-pods" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your pods...</div>
              ) : myPods.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No joined pods yet. Move to Discover to join one.</CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {myPods.map((pod) => renderPodCard(pod, "mine"))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search pods, topics, or tags" className="pl-10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category.name] || Compass
                    return (
                      <Button
                        key={category.name}
                        type="button"
                        variant={selectedCategory === category.name ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {category.name}
                        <span className="ml-2 text-xs opacity-80">{category.count}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading discover catalog...</div>
              ) : discoverPods.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No pods match the current search and category filters.</CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {discoverPods.map((pod) => renderPodCard(pod, "discover"))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create a pod</DialogTitle>
            <DialogDescription>Set up a production-grade pod with subject, difficulty, availability, and matching metadata.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pod-name">Pod name <span className="text-destructive">*</span></Label>
              <Input id="pod-name" value={newPod.name} maxLength={80} aria-invalid={Boolean(podFormTouched.name && getPodFieldError("name"))} onBlur={() => setPodFormTouched((prev) => ({ ...prev, name: true }))} onChange={(event) => setNewPod((prev) => ({ ...prev, name: event.target.value }))} />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{podFormTouched.name && getPodFieldError("name") ? <span className="text-destructive">{getPodFieldError("name")}</span> : "Use a clear, searchable name."}</span><span>{newPod.name.length}/80</span></div>
            </div>
            <div>
              <Label htmlFor="pod-description">Description <span className="text-destructive">*</span></Label>
              <Textarea id="pod-description" rows={4} maxLength={500} aria-invalid={Boolean(podFormTouched.description && getPodFieldError("description"))} value={newPod.description} onBlur={() => setPodFormTouched((prev) => ({ ...prev, description: true }))} onChange={(event) => setNewPod((prev) => ({ ...prev, description: event.target.value }))} />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{podFormTouched.description && getPodFieldError("description") ? <span className="text-destructive">{getPodFieldError("description")}</span> : "Explain outcomes, cadence, and who should join."}</span><span>{newPod.description.length}/500</span></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={newPod.category} onValueChange={(value) => { setPodFormTouched((prev) => ({ ...prev, category: true })); setNewPod((prev) => ({ ...prev, category: value })) }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
                {podFormTouched.category && getPodFieldError("category") && <p className="mt-1 text-xs text-destructive">{getPodFieldError("category")}</p>}
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={newPod.difficulty} onValueChange={(value) => setNewPod((prev) => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Session style</Label>
                <Select value={newPod.sessionType} onValueChange={(value) => setNewPod((prev) => ({ ...prev, sessionType: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="async">Async</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ideal learner type</Label>
                <Select value={newPod.idealLearnerType} onValueChange={(value) => setNewPod((prev) => ({ ...prev, idealLearnerType: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pod-duration">Session length (minutes)</Label>
                <Input id="pod-duration" type="number" min={15} max={240} value={newPod.averageSessionLength} onChange={(event) => setNewPod((prev) => ({ ...prev, averageSessionLength: event.target.value }))} />
              </div>
              <div>
                <Label>Availability</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { id: "weekday-morning", label: "Weekday mornings" },
                    { id: "weekday-evening", label: "Weekday evenings" },
                    { id: "weekend", label: "Weekends" },
                  ].map((slot) => (
                    <Button
                      key={slot.id}
                      type="button"
                      size="sm"
                      variant={newPod.availability.includes(slot.id) ? "default" : "outline"}
                      onClick={() =>
                        setNewPod((prev) => ({
                          ...prev,
                          availability: prev.availability.includes(slot.id)
                            ? prev.availability.filter((item) => item !== slot.id)
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
              <Label htmlFor="pod-tags">Tags</Label>
              <Input id="pod-tags" placeholder="React, JavaScript, Frontend" value={newPod.tags} onChange={(event) => setNewPod((prev) => ({ ...prev, tags: event.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePod} disabled={isLoading || Boolean(getPodFieldError("name") || getPodFieldError("description") || getPodFieldError("category"))}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create pod
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
