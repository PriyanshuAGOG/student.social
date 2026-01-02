"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { podService, calendarService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import {
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Play,
  Settings,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react"

type Pod = {
  id: string
  name: string
  members: number
  subject: string
  nextSession?: string
  progress: number
  color: string
}

type StudySession = {
  id: string
  title: string
  duration: number
  completed: boolean
  podName: string
  podId?: string
  scheduledTime: string
}

type PerformanceMetric = {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  color: string
  icon: LucideIcon
}

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"]

const ACTIVE_CHALLENGE = {
  id: "focus-boost",
  title: "Deep Work Challenge",
  description: "Complete three focused study sessions today to keep your streak alive.",
  difficulty: "Medium",
  points: 120,
  timeLeft: "12h left",
  participants: 42,
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [myPods, setMyPods] = useState<Pod[]>([])
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const [podsRes, eventsRes] = await Promise.all([
          podService.getUserPods(user.$id),
          calendarService.getUserEvents(user.$id),
        ])

        const podDocs = podsRes?.documents ?? []
        const events = eventsRes?.documents ?? []

        const nextByPod: Record<string, Date> = {}
        events.forEach((ev: any) => {
          if (!ev.podId || !ev.startTime) return
          const start = new Date(ev.startTime)
          if (!nextByPod[ev.podId] || start < nextByPod[ev.podId]) {
            nextByPod[ev.podId] = start
          }
        })

        const pods = podDocs.map((p: any, idx: number) => {
          const podId = p.$id || p.teamId
          const nextSession = nextByPod[podId]
            ? nextByPod[podId].toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : p.nextSession || ""
          return {
            id: podId,
            name: p.name || "Untitled Pod",
            members: p.memberCount || p.members?.length || 0,
            subject: p.subject || p.category || "General",
            nextSession,
            progress: p.progress || 0,
            color: COLORS[idx % COLORS.length],
          }
        })

        const podNameMap = new Map(pods.map((pod) => [pod.id, pod.name]))
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]
        const sessions = events
          .filter((ev: any) => (ev.startTime || "").startsWith(todayStr))
          .map((ev: any) => {
            const start = new Date(ev.startTime)
            const end = new Date(ev.endTime || ev.startTime)
            const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
            return {
              id: ev.$id,
              title: ev.title || "Study Session",
              duration: durationMinutes,
              completed: Boolean(ev.isCompleted),
              podName: podNameMap.get(ev.podId) || "Pod Session",
              podId: ev.podId,
              scheduledTime: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          })

        setMyPods(pods)
        setTodaySessions(sessions)
      } catch (error: any) {
        console.error(error)
        toast({ title: "Failed to load dashboard", description: error?.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user?.$id, toast])

  const handleScheduleSession = () => {
    router.push("/app/calendar?mode=schedule")
    toast({ title: "Schedule Session", description: "Opening calendar to schedule your study session" })
  }

  const handleNewSession = () => {
    router.push("/app/pods")
    toast({ title: "New Session", description: "Opening pods to start a new session" })
  }

  const handleContinueChallenge = () => {
    router.push(`/app/challenges/${ACTIVE_CHALLENGE.id}`)
    toast({ title: "Challenge Opened", description: `Continuing ${ACTIVE_CHALLENGE.title}` })
  }

  const handleViewCalendar = () => {
    router.push("/app/calendar")
  }

  const handleJoinPod = (podId: string) => {
    router.push(`/app/pods/${podId}`)
  }

  const handleJoinSession = (sessionId: string) => {
    const session = todaySessions.find((s) => s.id === sessionId)
    if (session?.podId) {
      router.push(`/app/pods/${session.podId}`)
    } else {
      handleViewCalendar()
    }
    toast({ title: "Joining Session", description: session?.title || "Opening session" })
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "ai":
        router.push("/app/ai")
        return
      case "explore":
        router.push("/app/explore")
        return
      case "vault":
        router.push("/app/vault")
        return
      case "analytics":
        router.push("/app/analytics")
        return
      default:
        toast({ title: "Feature", description: `Opening ${action}...` })
    }
  }

  const completedSessions = todaySessions.filter((s) => s.completed).length
  const totalStudyTime = todaySessions.reduce((acc, session) => acc + session.duration, 0)
  const weeklyProgress = todaySessions.length
    ? Math.min(100, Math.round((completedSessions / todaySessions.length) * 100))
    : 0

  const subjectData = useMemo(() => {
    const counts: Record<string, number> = {}
    myPods.forEach((p) => {
      counts[p.subject] = (counts[p.subject] || 0) + 1
    })
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      hours: count * 2,
      percentage: count,
      color: COLORS[idx % COLORS.length],
    }))
  }, [myPods])

  const studyData = useMemo(() => {
    const todayLabel = currentTime.toLocaleDateString("en-US", { weekday: "short" })
    return [
      {
        name: todayLabel,
        hours: Number((totalStudyTime / 60).toFixed(1)),
        sessions: todaySessions.length,
        focus: weeklyProgress,
      },
    ]
  }, [currentTime, totalStudyTime, todaySessions.length, weeklyProgress])

  const performanceMetrics = useMemo<PerformanceMetric[]>(() => {
    return [
      {
        title: "Sessions Completed",
        value: `${completedSessions}/${todaySessions.length || 1}`,
        change: "Today&apos;s total",
        trend: "up",
        color: "text-green-600",
        icon: Clock,
      },
      {
        title: "Study Time",
        value: `${Math.floor(totalStudyTime / 60)}h ${totalStudyTime % 60}m`,
        change: "Today",
        trend: "up",
        color: "text-blue-600",
        icon: Timer,
      },
      {
        title: "Active Pods",
        value: `${myPods.length}`,
        change: "Joined",
        trend: "up",
        color: "text-purple-600",
        icon: Users,
      },
      {
        title: "Weekly Progress",
        value: `${weeklyProgress}%`,
        change: "Based on completions",
        trend: "up",
        color: "text-orange-600",
        icon: TrendingUp,
      },
    ]
  }, [completedSessions, myPods.length, todaySessions.length, totalStudyTime, weeklyProgress])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/app/notifications")}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/app/settings")}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here&apos;s your learning overview</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        <div className="space-y-4">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ""}!</h2>
                  <p className="text-sm text-muted-foreground">Ready to continue your learning journey?</p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleScheduleSession} size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Schedule</span>
                  </Button>
                  <Button onClick={handleNewSession} variant="outline" size="sm" className="bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Sessions</p>
                    <p className="text-lg md:text-xl font-bold">
                      {completedSessions}/{todaySessions.length}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Study Time</p>
                    <p className="text-lg md:text-xl font-bold">
                      {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Timer className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Pods</p>
                    <p className="text-lg md:text-xl font-bold">{myPods.length}</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Progress</p>
                    <p className="text-lg md:text-xl font-bold">{weeklyProgress}%</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="space-y-4">
            <div className="flex space-x-1 bg-secondary/50 rounded-lg p-1 max-w-fit">
              {[
                { value: "overview", label: "Overview" },
                { value: "analytics", label: "Analytics" },
                { value: "schedule", label: "Schedule" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* My Pods */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      My Pods
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/app/pods")}>
                      <span className="text-xs">View All</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLoading && <div className="text-sm text-muted-foreground">Loading pods...</div>}
                    {!isLoading && myPods.length === 0 && (
                      <div className="text-sm text-muted-foreground">No pods yet. Join or create one to get started.</div>
                    )}
                    {!isLoading &&
                      myPods.map((pod) => (
                        <div
                          key={pod.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleJoinPod(pod.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pod.color }} />
                            <div>
                              <h4 className="font-medium text-sm">{pod.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {pod.members} members{pod.nextSession ? ` • Next: ${pod.nextSession}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <Progress value={pod.progress} className="w-12 h-1.5" />
                              <span className="text-xs font-medium">{pod.progress}%</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {pod.subject}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                {/* Active Challenge */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Active Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">{ACTIVE_CHALLENGE.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{ACTIVE_CHALLENGE.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            ACTIVE_CHALLENGE.difficulty === "Easy"
                              ? "secondary"
                              : ACTIVE_CHALLENGE.difficulty === "Medium"
                                ? "default"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {ACTIVE_CHALLENGE.difficulty}
                        </Badge>
                        <div className="text-right">
                          <p className="text-xs font-medium">{ACTIVE_CHALLENGE.points} points</p>
                          <p className="text-xs text-muted-foreground">{ACTIVE_CHALLENGE.timeLeft}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {ACTIVE_CHALLENGE.participants} participants
                      </div>
                      <Button onClick={handleContinueChallenge} className="w-full">
                        <Target className="w-4 h-4 mr-2" />
                        Continue Challenge
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start bg-transparent h-auto p-3"
                      onClick={() => handleQuickAction("ai")}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs">AI Assistant</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start bg-transparent h-auto p-3"
                      onClick={() => handleQuickAction("explore")}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Explore</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start bg-transparent h-auto p-3"
                      onClick={() => handleQuickAction("vault")}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Resources</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start bg-transparent h-auto p-3"
                      onClick={() => handleQuickAction("analytics")}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs">Analytics</span>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Study Streak */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Study Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-primary">15</div>
                      <p className="text-xs text-muted-foreground">Days in a row</p>
                      <div className="flex justify-center gap-1">
                        {[...Array(7)].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Keep it up! You&apos;re on fire 🔥</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {performanceMetrics.map((metric) => (
                    <Card key={metric.title}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{metric.title}</p>
                            <p className="text-sm font-bold">{metric.value}</p>
                            <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                              {metric.change}
                            </p>
                          </div>
                          <div className={`p-2 rounded-full bg-secondary ${metric.color}`}>
                            <metric.icon className="w-3 h-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Study Hours Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Weekly Study Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={studyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject Distribution */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Subject Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={subjectData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="hours"
                        >
                          {subjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-4">
                {/* Today&apos;s Schedule */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Today&apos;s Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoading && <div className="text-sm text-muted-foreground">Loading sessions...</div>}
                      {!isLoading && todaySessions.length === 0 && (
                        <div className="text-sm text-muted-foreground">No sessions scheduled for today.</div>
                      )}
                      {!isLoading &&
                        todaySessions.map((session) => (
                          <div
                            key={session.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              session.completed
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "hover:bg-accent/50 cursor-pointer"
                            }`}
                            onClick={() => !session.completed && handleJoinSession(session.id)}
                          >
                            <div className="flex items-start space-x-4">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  session.completed ? "bg-green-500" : "bg-orange-500"
                                }`}
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{session.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {session.podName} • {session.duration} min • {session.scheduledTime}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.completed ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                                >
                                  ✓ Completed
                                </Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  <Play className="w-3 h-3 mr-1" />
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-3" onClick={handleViewCalendar}>
                      <Calendar className="w-4 h-4 mr-2" />
                      View Full Calendar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
