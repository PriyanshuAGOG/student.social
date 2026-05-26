"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Crown, Flame, Clock, BookOpen, TrendingUp, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { podService, profileService } from "@/lib/appwrite"
import { rankLearners, type ScorePeriod } from "@/lib/engagement-scoring"

type LeaderboardUser = {
  rank: number
  id: string
  name: string
  username: string
  avatar: string
  points: number
  streak: number
  studyHours: number
  badge: string
  isCurrentUser?: boolean
}

export default function LeaderboardPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<ScorePeriod>("monthly")
  const [isLoading, setIsLoading] = useState(true)
  const [profiles, setProfiles] = useState<any[]>([])
  const [allPods, setAllPods] = useState<any[]>([])
  const [userPods, setUserPods] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [profilesRes, allPodsRes, userPodsRes] = await Promise.all([
          profileService.getAllProfiles(200, 0),
          podService.getAllPods(200, 0, {}),
          podService.getUserPods(user.$id, 100, 0),
        ])

        setProfiles(profilesRes.documents || [])
        setAllPods(allPodsRes.documents || [])
        setUserPods(userPodsRes.documents || [])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user?.$id])

  const globalLeaderboard = useMemo<LeaderboardUser[]>(() => {
    return rankLearners(profiles || [], allPods || [], selectedPeriod, user?.$id)
      .slice(0, 20)
      .map((entry) => ({
        rank: entry.rank,
        id: entry.id,
        name: entry.name,
        username: entry.username,
        avatar: entry.avatar,
        points: entry.score,
        streak: entry.streak,
        studyHours: entry.studyHours,
        badge: entry.badge,
        isCurrentUser: entry.isCurrentUser,
      }))
  }, [allPods, profiles, selectedPeriod, user?.$id])

  const podLeaderboards = useMemo(() => {
    return (userPods || []).map((pod: any) => {
      const memberIds = Array.isArray(pod.members) ? pod.members : []
      const topPerformers = globalLeaderboard.filter((entry) => memberIds.includes(entry.id)).slice(0, 3)
      return {
        podName: pod.name || "Pod",
        members: memberIds.length,
        topPerformers,
      }
    })
  }, [globalLeaderboard, userPods])

  const achievements = useMemo(() => {
    const topByStreak = [...globalLeaderboard].sort((a, b) => b.streak - a.streak)[0]
    const topByHours = [...globalLeaderboard].sort((a, b) => b.studyHours - a.studyHours)[0]
    const topByPoints = globalLeaderboard[0]
    return [
      topByStreak && { name: "Most Consistent Learner", winner: topByStreak.name, metric: `${topByStreak.streak}-day streak`, avatar: topByStreak.avatar },
      topByHours && { name: "Deep Work Leader", winner: topByHours.name, metric: `${topByHours.studyHours} hours studied`, avatar: topByHours.avatar },
      topByPoints && { name: "Top Points Earner", winner: topByPoints.name, metric: `${topByPoints.points} points`, avatar: topByPoints.avatar },
    ].filter(Boolean) as Array<{ name: string; winner: string; metric: string; avatar: string }>
  }, [globalLeaderboard])

  const handleViewProfile = (username: string) => {
    toast({
      title: "Opening Profile",
      description: `Loading ${username}'s profile...`,
    })
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold">{rank}</div>
    }
  }

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
              <p className="text-muted-foreground">Ranked from points, streaks, study hours, pod participation, and recent activity</p>
            </div>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="all-time">All Time</option>
          </select>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="pods">My Pods</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Trophy className="w-5 h-5 mr-2 text-accent" />Top Performers</CardTitle>
                <CardDescription>Live rankings for {selectedPeriod.replace("-", " ")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {globalLeaderboard.map((entry) => (
                  <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg border ${entry.isCurrentUser ? "bg-primary/5 border-primary/20" : ""}`}>
                    <div className="flex items-center gap-3">
                      {getRankIcon(entry.rank)}
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>{entry.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <button onClick={() => handleViewProfile(entry.username)} className="font-semibold hover:underline text-left">
                          {entry.name}
                        </button>
                        <p className="text-sm text-muted-foreground">{entry.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.points} pts</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{entry.streak}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.studyHours}h</span>
                      </div>
                      <Badge variant="secondary" className="mt-1">{entry.badge}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pods" className="space-y-4">
            {podLeaderboards.map((pod) => (
              <Card key={pod.podName}>
                <CardHeader>
                  <CardTitle>{pod.podName}</CardTitle>
                  <CardDescription>{pod.members} members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pod.topPerformers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ranked members yet.</p>
                  ) : pod.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold w-6">{index + 1}</span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={performer.avatar} />
                          <AvatarFallback>{performer.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{performer.name}</span>
                      </div>
                      <span className="font-medium">{performer.points} pts</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />{achievement.name}</CardTitle>
                  <CardDescription>{achievement.metric}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={achievement.avatar} />
                    <AvatarFallback>{achievement.winner[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{achievement.winner}</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
