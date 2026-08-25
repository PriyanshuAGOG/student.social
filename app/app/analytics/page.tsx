"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Clock, Target, Trophy, Download, Share2, Brain, Flame, Loader2 } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/lib/auth-context"
import { calendarService, feedService, podService, profileService, resourceService } from "@/lib/appwrite"
import { buildAnalyticsSnapshot } from "@/lib/engagement-scoring"
import { AppPageHeader } from "@/components/internal/AppPageHeader"

const COLORS = ["#3f6f6b", "#78815f", "#76556d", "#c79043", "#5d716b"]

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [pods, setPods] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [profile, postsRes, podsRes, resourcesRes, eventsRes] = await Promise.all([
          profileService.getProfile(user.$id),
          feedService.getUserPosts(user.$id, 100, 0),
          podService.getUserPods(user.$id, 100, 0),
          resourceService.getResources({ authorId: user.$id }, 100, 0),
          calendarService.getUserEvents(user.$id),
        ])

        setProfileData(profile)
        setPosts(postsRes.documents || [])
        setPods(podsRes.documents || [])
        setResources(resourcesRes.documents || [])
        setEvents(eventsRes.documents || [])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user?.$id])

  const snapshot = useMemo(
    () => buildAnalyticsSnapshot({ profile: profileData, posts, pods, resources, events }),
    [events, pods, posts, profileData, resources],
  )

  const studyData = snapshot.weeklyPattern
  const subjectData = snapshot.topicDistribution.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }))
  const metrics = [
    { ...snapshot.metrics[0], icon: Flame, color: "text-[#3f6f6b]" },
    { ...snapshot.metrics[1], icon: Clock, color: "text-[#78815f]" },
    { ...snapshot.metrics[2], icon: Target, color: "text-[#c79043]" },
    { ...snapshot.metrics[3], icon: Brain, color: "text-[#76556d]" },
  ]
  const goals = snapshot.goals
  const achievements = snapshot.achievements

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <AppPageHeader
          title="Analytics"
          meta={<span>{snapshot.metrics[0]?.value || "—"} {snapshot.metrics[0]?.title || "learning activity"}</span>}
          actions={<><Button><Download />Export</Button><Button variant="outline"><Share2 />Share</Button></>}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-secondary ${metric.color}`}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Pattern</CardTitle>
                  <CardDescription>Measured from your actual scheduled and completed study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="hours" stroke="#3f6f6b" fill="#3f6f6b" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Topic Distribution</CardTitle>
                  <CardDescription>Weighted from your posts, pods, resources, and session subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={subjectData} dataKey="hours" nameKey="name" outerRadius={100} label>
                          {subjectData.map((entry, index) => (
                            <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Focus and Sessions</CardTitle>
                <CardDescription>Combined weekly workload and focus trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] min-h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#76556d" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="focus" fill="#78815f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            {goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.current / goal.target) * 100))
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.title}</CardTitle>
                    <CardDescription>{goal.deadline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={percent} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{goal.current}</span>
                      <span>{goal.target}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${achievement.earned ? "text-yellow-500" : "text-muted-foreground"}`} />
                    {achievement.title}
                  </CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
