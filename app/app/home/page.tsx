"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Play,
  Target,
  Zap,
  Star,
  ChevronRight,
  CalendarDays,
  Timer,
  Brain,
  FileText,
  BarChart3,
  CheckCircle2,
  ListChecks,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AIAssistant } from "@/components/ai-assistant"
import { useAuth } from "@/lib/auth-context"
import { podService, calendarService, studyPlanService, resourceService, profileService, notificationService } from "@/lib/appwrite"

interface StudySession {
  id: string
  title: string
  duration: number
  completed: boolean
  podName: string
  scheduledTime: string
  startAt: string
  hasNotes?: boolean
}

interface Pod {
  id: string
  name: string
  members: number
  subject: string
  nextSession: string
  progress: number
  color: string
}

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  points: number
  timeLeft: string
  participants: number
}

interface StudyPlanItem {
  id: string
  title: string
  description: string
  actionLabel: string
  actionHref: string
  status: "pending" | "done"
}

interface WeakResource {
  id: string
  title: string
  description: string
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [myPods, setMyPods] = useState<Pod[]>([])
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([])
  const [recommendedPods, setRecommendedPods] = useState<any[]>([])
  const [activeChallenge] = useState<Challenge | null>(null)
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([])
  const [planSignals, setPlanSignals] = useState<string[]>(["sessions", "pods"])
  const storageKey = user?.$id ? `studyPlan:${user.$id}:${new Date().toISOString().slice(0, 10)}` : ""

  const buildStudyPlan = (
    sessions: StudySession[],
    pods: Pod[],
    weakResource?: WeakResource,
    reminderItem?: StudyPlanItem,
  ) => {
    const items: StudyPlanItem[] = []
    const firstPod = pods[0]
    const upcoming = sessions.find((s) => !s.completed)
    const completed = sessions.filter((s) => s.completed)

    if (upcoming) {
      items.push({
        id: `join-${upcoming.id}`,
        title: `Join ${upcoming.title}`,
        description: `${upcoming.podName || "Pod"} • ${upcoming.scheduledTime}`,
        actionLabel: "Open calendar",
        actionHref: `/app/calendar?event=${upcoming.id}`,
        status: "pending",
      })
    } else {
      items.push({
        id: "schedule",
        title: "Schedule a quick session",
        description: "No sessions today. Add a 30-minute block to stay on track.",
        actionLabel: "Schedule",
        actionHref: "/app/calendar?mode=schedule",
        status: "pending",
      })
    }

    if (reminderItem) {
      items.push(reminderItem)
    }

    if (firstPod) {
      items.push({
        id: "vault-review",
        title: "Review pod resources",
        description: `${firstPod.name} vault • focus on newest uploads`,
        actionLabel: "Open vault",
        actionHref: `/app/vault?pod=${firstPod.id}`,
        status: "pending",
      })
      items.push({
        id: "pod-check-in",
        title: "Post a quick check-in",
        description: "Share what you finished and what&apos;s next in pod chat.",
        actionLabel: "Open pod",
        actionHref: `/app/pods/${firstPod.id}`,
        status: "pending",
      })
    }

    if (weakResource) {
      items.push({
        id: `weak-${weakResource.id}`,
        title: `Focus: ${weakResource.title}`,
        description: weakResource.description || "Reinforce a weak area with a targeted resource.",
        actionLabel: "Open resource",
        actionHref: `/app/vault?resource=${weakResource.id}`,
        status: "pending",
      })
    }

    if (completed.length > 0) {
      items.push({
        id: "log-progress",
        title: "Log a 2-minute recap",
        description: "Note wins and blockers to keep your streak meaningful.",
        actionLabel: "Open analytics",
        actionHref: "/app/analytics",
        status: "pending",
      })
    }

    return items
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const storedPlanRaw = storageKey ? localStorage.getItem(storageKey) : null
        const storedPlan: Record<string, "pending" | "done"> = storedPlanRaw ? JSON.parse(storedPlanRaw) : {}

        const todayStr = new Date().toISOString().split("T")[0]
        const [serverPlan, podsRes, eventsRes, profile] = await Promise.all([
          studyPlanService.getPlan(user.$id, todayStr),
          podService.getUserPods(user.$id),
          calendarService.getUserEvents(user.$id),
          profileService.getProfile(user.$id),
        ])
        const serverStatuses: Record<string, "pending" | "done"> = {}
        if (serverPlan?.completedIds) {
          serverPlan.completedIds.forEach((id: string) => {
            serverStatuses[id] = "done"
          })
        }

        const pods = (podsRes.documents || []).map((p: any) => ({
          id: p.$id || p.teamId,
          name: p.name,
          members: p.memberCount || p.members?.length || 0,
          subject: p.subject || p.category || "General",
          nextSession: p.nextSession || "",
          progress: p.progress || 0,
          color: "bg-primary",
        }))
        setMyPods(pods)

        try {
          const recos = await podService.recommendPodsForUser(user.$id, 3)
          setRecommendedPods(recos)
        } catch (recoErr) {
          console.warn(recoErr)
        }

        const sessions = (eventsRes.documents || [])
          .filter((ev: any) => (ev.startTime || "").startsWith(todayStr))
          .map((ev: any) => ({
            id: ev.$id,
            title: ev.title,
            hasNotes: typeof ev.notes === "string" && ev.notes.trim().length > 0,
            duration: Math.max(
              0,
              Math.round((new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000),
            ),
            completed: Boolean(ev.isCompleted || (typeof ev.notes === "string" && ev.notes.trim().length > 0)),
            podName: pods.find((p) => p.id === ev.podId)?.name || "",
            scheduledTime: new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            startAt: ev.startTime,
          }))
        setTodaySessions(sessions)
        const focusAreas: string[] = Array.isArray(profile?.currentFocusAreas) ? profile.currentFocusAreas : []
        const primaryFocus = (focusAreas[0] || "").trim()
        let weakResource: WeakResource | undefined
        if (primaryFocus) {
          try {
            const resourcesRes = await resourceService.getResources({ search: primaryFocus, podId: pods[0]?.id }, 6, 0)
            const docs = resourcesRes?.documents || []
            const tagged = docs.find((doc: any) => Array.isArray(doc.tags) && doc.tags.includes(primaryFocus))
            const pick = tagged || docs[0]
            if (pick) {
              weakResource = {
                id: pick.$id,
                title: pick.title || pick.fileName || primaryFocus,
                description: pick.description || `Reinforce ${primaryFocus} with a pod resource.`,
              }
            }
          } catch (resourceErr) {
            console.warn("resource suggestions failed", resourceErr)
          }
        }

        const upcomingSession = sessions.find((s) => !s.completed)
        let reminderItem: StudyPlanItem | undefined
        if (upcomingSession?.startAt) {
          const minutesUntil = Math.max(0, Math.round((new Date(upcomingSession.startAt).getTime() - Date.now()) / 60000))
          if (minutesUntil > 0 && minutesUntil <= 240) {
            reminderItem = {
              id: `reminder-${upcomingSession.id}`,
              title: "Set a prep reminder",
              description: `Starts in ${minutesUntil} min. Add a quick reminder for focus time.`,
              actionLabel: "Open event",
              actionHref: `/app/calendar?event=${upcomingSession.id}`,
              status: "pending",
            }
            const reminderKey = `planReminderSent:${upcomingSession.id}:${todayStr}`
            const alreadySent = localStorage.getItem(reminderKey)
            if (!alreadySent && user?.$id) {
              notificationService.createNotification(user.$id, "Upcoming session", "Starts soon – add a quick prep reminder.", "info", {
                actionUrl: `/app/calendar?event=${upcomingSession.id}`,
                actionText: "Open event",
              }).catch((err) => console.warn("reminder notification failed", err))
              localStorage.setItem(reminderKey, "1")
            }
          }
        }

        const freshPlan = buildStudyPlan(sessions, pods, weakResource, reminderItem)
        const autoCompleted = new Set<string>()
        sessions.filter((s) => s.completed).forEach((s) => autoCompleted.add(`join-${s.id}`))
        const noteCompleted = sessions.some((s) => s.hasNotes)
        const mergedPlan = freshPlan.map((item) => {
          const autoStatus = autoCompleted.has(item.id) ? "done" : undefined
          const status = autoStatus || serverStatuses[item.id] || storedPlan[item.id] || item.status
          return { ...item, status }
        })
        const signals = ["sessions", "pods"]
        if (autoCompleted.size > 0) signals.push("attendance")
        if (noteCompleted) signals.push("notes")
        if (weakResource) signals.push("profile", "resources")
        if (reminderItem) signals.push("reminders")
        setPlanSignals(Array.from(new Set(signals)))
        setStudyPlan(mergedPlan)
      } catch (e: any) {
        console.error(e)
        toast({ title: "Failed to load home", description: e?.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.$id, toast, storageKey])

  const handleScheduleSession = () => {
    router.push("/app/calendar?mode=schedule")
    toast({
      title: "Schedule Session",
      description: "Opening calendar to schedule your study session",
    })
  }

  const handleNewSession = () => {
    router.push("/app/calendar?mode=create")
    toast({
      title: "New Session",
      description: "Create a new study session in calendar",
    })
  }

  const handleContinueChallenge = () => {
    if (!activeChallenge) return
    router.push(`/app/challenges/${activeChallenge.id}`)
    toast({
      title: "Challenge Opened",
      description: `Continuing ${activeChallenge.title}`,
    })
  }

  const handleViewCalendar = () => {
    router.push("/app/calendar")
  }

  const handleJoinPod = (podId: string) => {
    router.push(`/app/pods/${podId}`)
  }

  const completedSessions = todaySessions.filter((s) => s.completed).length
  const totalStudyTime = todaySessions.reduce((acc, session) => acc + session.duration, 0)
  const weeklyProgress = todaySessions.length > 0
    ? Math.min(100, Math.round((todaySessions.filter((s) => s.completed).length / todaySessions.length) * 100))
    : 0
  const pendingPlan = studyPlan.filter((item) => item.status === "pending").length

  const handlePlanAction = (href: string, title: string) => {
    router.push(href)
    toast({ title: "Next up", description: title })
  }

  const persistPlanStatus = (items: StudyPlanItem[]) => {
    if (!storageKey) return
    const payload: Record<string, "pending" | "done"> = {}
    const completedIds: string[] = []
    items.forEach((i) => {
      payload[i.id] = i.status
      if (i.status === "done") completedIds.push(i.id)
    })
    localStorage.setItem(storageKey, JSON.stringify(payload))

    const todayStr = new Date().toISOString().split("T")[0]
    studyPlanService.upsertPlan({
      userId: user?.$id || "",
      date: todayStr,
      items,
      completedIds,
      sourceSignals: planSignals,
    }).catch((err) => console.warn("plan upsert failed", err))
  }

  const togglePlanItem = (id: string) => {
    setStudyPlan((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, status: item.status === "done" ? "pending" : "done" } : item,
      )
      persistPlanStatus(next)
      return next
    })
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 pb-20 md:pb-6 overflow-auto max-h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ""}! 👋</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <Button onClick={handleScheduleSession} className="bg-primary hover:bg-primary/90 flex-1 md:flex-none text-xs md:text-sm h-9 md:h-10">
            <Calendar className="w-4 h-4 mr-1 md:mr-2" />
            Schedule
          </Button>
          <Button onClick={handleNewSession} variant="outline" className="flex-1 md:flex-none text-xs md:text-sm h-9 md:h-10">
            <Plus className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-lg md:text-2xl font-bold">{completedSessions}/{todaySessions.length}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Study Time</p>
                <p className="text-lg md:text-2xl font-bold">
                  {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
                </p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Timer className="w-4 h-4 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Pods</p>
                <p className="text-lg md:text-2xl font-bold">{myPods.length}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-lg md:text-2xl font-bold">{weeklyProgress}%</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Pods */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                My Pods
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/app/pods")}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && <div className="text-sm text-muted-foreground">Loading pods...</div>}
              {!isLoading && myPods.length === 0 && (
                <div className="text-sm text-muted-foreground">No pods yet. Join or create one to get started.</div>
              )}
              {myPods.map((pod) => (
                <div
                  key={pod.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleJoinPod(pod.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pod.color}`} />
                    <div>
                      <h4 className="font-medium">{pod.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {pod.members} members {pod.nextSession ? `• Next: ${pod.nextSession}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Progress value={pod.progress} className="w-16 h-2" />
                      <span className="text-sm font-medium">{pod.progress}%</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {pod.subject}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Today&apos;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading schedule...</div>
              ) : todaySessions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No sessions scheduled today.</div>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        session.completed ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${session.completed ? "bg-green-500" : "bg-orange-500"}`} />
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.podName || "General"} • {session.duration} min • {session.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.completed ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            Completed
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => router.push(`/app/calendar?event=${session.id}`)}>
                            <Play className="w-4 h-4 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" className="w-full mt-4" onClick={handleViewCalendar}>
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Challenge */}
          {activeChallenge && (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Active Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{activeChallenge.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{activeChallenge.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      activeChallenge.difficulty === "Easy"
                        ? "secondary"
                        : activeChallenge.difficulty === "Medium"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {activeChallenge.difficulty}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activeChallenge.points} points</p>
                    <p className="text-xs text-muted-foreground">{activeChallenge.timeLeft} left</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {activeChallenge.participants} participants
                </div>
                <Button onClick={handleContinueChallenge} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Continue Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/app/ai")}
              >
                <Brain className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/app/explore")}
              >
                <Users className="w-4 h-4 mr-2" />
                Explore Pods
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/app/vault")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Resource Vault
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/app/analytics")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Today&apos;s Study Plan
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {pendingPlan}/{studyPlan.length} pending
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Building your plan...</div>
              ) : studyPlan.length === 0 ? (
                <div className="text-sm text-muted-foreground">No plan yet. Add a session to get a tailored flow.</div>
              ) : (
                studyPlan.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          item.status === "done"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[11px]">
                            {item.actionLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => togglePlanItem(item.id)}>
                        <CheckCircle2 className={`w-4 h-4 ${item.status === "done" ? "text-green-600" : ""}`} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handlePlanAction(item.actionHref, item.title)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {recommendedPods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recommended Pods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedPods.map(({ pod, score }) => (
                  <div key={pod.$id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-semibold">{pod.name}</p>
                        <p className="text-xs text-muted-foreground">{pod.subject || pod.category || "General"}</p>
                      </div>
                      <Badge variant="secondary">{score}% match</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {pod.description?.slice(0, 80) || "Collaborative study pod"}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {pod.memberCount ?? pod.members?.length ?? 0} members
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleJoinPod(pod.$id)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Study Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">7</div>
                <p className="text-sm text-muted-foreground">Days in a row</p>
                <div className="flex justify-center gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Keep it up! You&apos;re on fire 🔥</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}
