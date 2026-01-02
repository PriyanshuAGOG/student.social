"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Crown, Flame, Clock, BookOpen, TrendingUp, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { placeholder } from "@/utils/placeholder" // Assuming placeholder is imported from a utils file

const GLOBAL_LEADERBOARD = [
  {
    rank: 1,
    name: "Arjun Patel",
    username: "arjun_codes",
    avatar: placeholder(40, 40),
    points: 2450,
    streak: 45,
    studyHours: 156,
    badge: "DSA Master",
    change: "up",
    pods: ["DSA Masters", "System Design"],
  },
  {
    rank: 2,
    name: "Riya Sharma",
    username: "riya_neet",
    avatar: placeholder(40, 40),
    points: 2380,
    streak: 38,
    studyHours: 142,
    badge: "Biology Expert",
    change: "same",
    pods: ["NEET Biology Squad", "Chemistry Hub"],
  },
  {
    rank: 3,
    name: "Priya Gupta",
    username: "priya_designs",
    avatar: placeholder(40, 40),
    points: 2290,
    streak: 32,
    studyHours: 128,
    badge: "Design Guru",
    change: "up",
    pods: ["Design Thinking Hub", "UI/UX Masters"],
  },
  {
    rank: 4,
    name: "Karan Singh",
    username: "karan_startup",
    avatar: placeholder(40, 40),
    points: 2150,
    streak: 28,
    studyHours: 118,
    badge: "Entrepreneur",
    change: "down",
    pods: ["Startup Fundamentals", "Business Strategy"],
  },
  {
    rank: 5,
    name: "Kundan Singh",
    username: "kundan_learner",
    avatar: placeholder(40, 40),
    points: 1980,
    streak: 15,
    studyHours: 98,
    badge: "Rising Star",
    change: "up",
    pods: ["DSA Masters", "NEET Biology Squad"],
    isCurrentUser: true,
  },
]

const POD_LEADERBOARDS = [
  {
    podName: "DSA Masters",
    members: 24,
    topPerformers: [
      { name: "Arjun Patel", points: 890, avatar: placeholder(32, 32) },
      { name: "Rohit Kumar", points: 765, avatar: placeholder(32, 32) },
      { name: "Kundan Singh", points: 654, avatar: placeholder(32, 32) },
    ],
  },
  {
    podName: "NEET Biology Squad",
    members: 18,
    topPerformers: [
      { name: "Riya Sharma", points: 945, avatar: placeholder(32, 32) },
      { name: "Anita Verma", points: 823, avatar: placeholder(32, 32) },
      { name: "Kundan Singh", points: 567, avatar: placeholder(32, 32) },
    ],
  },
  {
    podName: "Design Thinking Hub",
    members: 12,
    topPerformers: [
      { name: "Priya Gupta", points: 876, avatar: placeholder(32, 32) },
      { name: "Amit Sharma", points: 743, avatar: placeholder(32, 32) },
      { name: "Neha Jain", points: 621, avatar: placeholder(32, 32) },
    ],
  },
]

const ACHIEVEMENTS_LEADERBOARD = [
  {
    name: "Most Consistent Learner",
    winner: "Riya Sharma",
    metric: "38-day streak",
    avatar: placeholder(32, 32),
  },
  {
    name: "Knowledge Sharer",
    winner: "Arjun Patel",
    metric: "45 resources shared",
    avatar: placeholder(32, 32),
  },
  {
    name: "Community Helper",
    winner: "Priya Gupta",
    metric: "89 doubts resolved",
    avatar: placeholder(32, 32),
  },
  {
    name: "Session Leader",
    winner: "Karan Singh",
    metric: "23 sessions hosted",
    avatar: placeholder(32, 32),
  },
]

export default function LeaderboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [selectedCategory, setSelectedCategory] = useState("overall")
  const { toast } = useToast()

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

  const getChangeIcon = (change: string) => {
    switch (change) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
              <p className="text-muted-foreground">See how you rank among fellow learners</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
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
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="pods">My Pods</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            {/* Top 3 Podium */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-accent" />
                  Top Performers
                </CardTitle>
                <CardDescription>Leading learners this {selectedPeriod.replace("-", " ")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center space-x-8 mb-8">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className="relative">
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={GLOBAL_LEADERBOARD[1].avatar || placeholder(40, 40)} />
                        <AvatarFallback>{GLOBAL_LEADERBOARD[1].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2">
                        <Medal className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold">{GLOBAL_LEADERBOARD[1].name}</h3>
                    <p className="text-sm text-muted-foreground">{GLOBAL_LEADERBOARD[1].points} points</p>
                    <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 mx-auto mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">2</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="relative">
                      <Avatar className="w-20 h-20 mx-auto mb-2">
                        <AvatarImage src={GLOBAL_LEADERBOARD[0].avatar || placeholder(40, 40)} />
                        <AvatarFallback>{GLOBAL_LEADERBOARD[0].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2">
                        <Crown className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">{GLOBAL_LEADERBOARD[0].name}</h3>
                    <p className="text-sm text-muted-foreground">{GLOBAL_LEADERBOARD[0].points} points</p>
                    <div className="w-24 h-20 bg-yellow-200 dark:bg-yellow-700 mx-auto mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-300 mb-2">1</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className="relative">
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={GLOBAL_LEADERBOARD[2].avatar || placeholder(40, 40)} />
                        <AvatarFallback>{GLOBAL_LEADERBOARD[2].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2">
                        <Medal className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold">{GLOBAL_LEADERBOARD[2].name}</h3>
                    <p className="text-sm text-muted-foreground">{GLOBAL_LEADERBOARD[2].points} points</p>
                    <div className="w-20 h-12 bg-amber-200 dark:bg-amber-700 mx-auto mt-2 rounded-t-lg flex items-end justify-center">
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-300 mb-2">3</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Rankings</CardTitle>
                <CardDescription>All learners ranked by performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {GLOBAL_LEADERBOARD.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors hover:bg-secondary/50 ${
                        user.isCurrentUser ? "bg-primary/10 border-primary/20" : "border-border"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getRankIcon(user.rank)}
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar || placeholder(40, 40)} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          {user.isCurrentUser && <Badge variant="secondary">You</Badge>}
                          <Badge variant="outline">{user.badge}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {user.pods.map((pod) => (
                            <Badge key={pod} variant="secondary" className="text-xs">
                              {pod}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">{user.points}</span>
                          <span className="text-sm text-muted-foreground">pts</span>
                          {getChangeIcon(user.change)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Flame className="w-3 h-3 mr-1 text-accent" />
                            {user.streak}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {user.studyHours}h
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(user.username)}
                        className="bg-transparent"
                      >
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pods" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {POD_LEADERBOARDS.map((pod) => (
                <Card key={pod.podName}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pod.podName}</CardTitle>
                    <CardDescription>{pod.members} members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pod.topPerformers.map((performer, index) => (
                      <div key={performer.name} className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-sm font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={performer.avatar || placeholder(32, 32)} />
                          <AvatarFallback>{performer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">{performer.points} points</p>
                        </div>
                        {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                      View Full Pod Leaderboard
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Leaders</CardTitle>
                <CardDescription>Top performers in different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {ACHIEVEMENTS_LEADERBOARD.map((achievement) => (
                    <div key={achievement.name} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center space-x-3 mb-3">
                        <Trophy className="w-5 h-5 text-accent" />
                        <h3 className="font-semibold">{achievement.name}</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={achievement.avatar || placeholder(32, 32)} />
                          <AvatarFallback>{achievement.winner[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{achievement.winner}</p>
                          <p className="text-sm text-muted-foreground">{achievement.metric}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Flame className="w-5 h-5 mr-2 text-accent" />
                    Study Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {GLOBAL_LEADERBOARD.slice(0, 3).map((user, index) => (
                    <div key={user.name} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || placeholder(40, 40)} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.streak} days</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Study Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {GLOBAL_LEADERBOARD.slice(0, 3).map((user, index) => (
                    <div key={user.name} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || placeholder(40, 40)} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.studyHours} hours</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                    Resources Shared
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {GLOBAL_LEADERBOARD.slice(0, 3).map((user, index) => (
                    <div key={user.name} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || placeholder(40, 40)} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50 + 10)} resources</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
