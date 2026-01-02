"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Clock, Target, Trophy, Download, Share2, Filter, Zap, Brain, Flame } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const STUDY_DATA = [
  { name: "Mon", hours: 4, sessions: 2, focus: 85 },
  { name: "Tue", hours: 6, sessions: 3, focus: 92 },
  { name: "Wed", hours: 3, sessions: 1, focus: 78 },
  { name: "Thu", hours: 5, sessions: 2, focus: 88 },
  { name: "Fri", hours: 7, sessions: 4, focus: 95 },
  { name: "Sat", hours: 8, sessions: 3, focus: 90 },
  { name: "Sun", hours: 5, sessions: 2, focus: 87 },
]

const SUBJECT_DATA = [
  { name: "DSA", hours: 15, percentage: 35, color: "#3B82F6" },
  { name: "Biology", hours: 12, percentage: 28, color: "#10B981" },
  { name: "Design", hours: 8, percentage: 19, color: "#8B5CF6" },
  { name: "Physics", hours: 5, percentage: 12, color: "#F59E0B" },
  { name: "Others", hours: 3, percentage: 6, color: "#6B7280" },
]

const PERFORMANCE_METRICS = [
  {
    title: "Study Streak",
    value: "15 days",
    change: "+3 from last week",
    trend: "up",
    icon: Flame,
    color: "text-accent",
  },
  {
    title: "Total Study Hours",
    value: "42.5h",
    change: "+8.5h from last week",
    trend: "up",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    title: "Sessions Completed",
    value: "18",
    change: "+5 from last week",
    trend: "up",
    icon: Target,
    color: "text-green-500",
  },
  {
    title: "Average Focus Score",
    value: "88%",
    change: "+5% from last week",
    trend: "up",
    icon: Brain,
    color: "text-purple-500",
  },
]

const ACHIEVEMENTS = [
  {
    id: "1",
    title: "Study Streak Master",
    description: "Maintained 15-day study streak",
    icon: "🔥",
    earned: true,
    date: "2 days ago",
  },
  {
    id: "2",
    title: "Knowledge Sharer",
    description: "Shared 10 resources with community",
    icon: "📚",
    earned: true,
    date: "1 week ago",
  },
  {
    id: "3",
    title: "Pod Leader",
    description: "Led 5 successful study sessions",
    icon: "👑",
    earned: false,
    progress: 60,
  },
  {
    id: "4",
    title: "AI Assistant Pro",
    description: "Used AI tools 50+ times",
    icon: "🤖",
    earned: false,
    progress: 80,
  },
]

const GOALS = [
  {
    id: "1",
    title: "Study 50 hours this month",
    current: 42.5,
    target: 50,
    deadline: "5 days left",
    status: "on-track",
  },
  {
    id: "2",
    title: "Complete DSA course",
    current: 75,
    target: 100,
    deadline: "2 weeks left",
    status: "on-track",
  },
  {
    id: "3",
    title: "Join 3 new pods",
    current: 2,
    target: 3,
    deadline: "1 week left",
    status: "behind",
  },
]

export default function AnalyticsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
              <p className="text-muted-foreground">Track your learning progress and insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {PERFORMANCE_METRICS.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {metric.change}
                    </p>
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
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Study Hours Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Hours</CardTitle>
                  <CardDescription>Your study time distribution over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={STUDY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Distribution</CardTitle>
                  <CardDescription>Time spent on different subjects this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={SUBJECT_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="hours"
                      >
                        {SUBJECT_DATA.map((entry, index) => (
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

            {/* Study Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Study Sessions & Focus Score</CardTitle>
                <CardDescription>Daily sessions completed and focus performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={STUDY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sessions" fill="#10B981" name="Sessions" />
                    <Line yAxisId="right" type="monotone" dataKey="focus" stroke="#8B5CF6" name="Focus Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Your learning performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={STUDY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="focus" stroke="#8B5CF6" strokeWidth={2} name="Focus Score" />
                      <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} name="Study Hours" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Your progress in different subjects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SUBJECT_DATA.map((subject) => (
                    <div key={subject.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {subject.hours}h ({subject.percentage}%)
                        </span>
                      </div>
                      <Progress value={subject.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>Comprehensive breakdown of your learning metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Study Habits</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Average session length</span>
                        <span>2.3 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most productive time</span>
                        <span>2-4 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consistency score</span>
                        <span>92%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Community Engagement</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active pods</span>
                        <span>3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resources shared</span>
                        <span>12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Help requests answered</span>
                        <span>8</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">AI Usage</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Queries this month</span>
                        <span>45</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most used tool</span>
                        <span>Doubt Solver</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Satisfaction rate</span>
                        <span>94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Goals</CardTitle>
                <CardDescription>Track your progress towards your learning objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {GOALS.map((goal) => (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{goal.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={goal.status === "on-track" ? "default" : "destructive"}>
                          {goal.status === "on-track" ? "On Track" : "Behind"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{goal.deadline}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {goal.current} / {goal.target}
                        </span>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Insights</CardTitle>
                <CardDescription>AI-powered recommendations to achieve your goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Study Time Optimization</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You&apos;re 8.5 hours ahead of your monthly goal! Consider allocating more time to weaker subjects.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Consistency Boost</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your 15-day streak is impressive! Maintain this momentum to reach your monthly targets.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Earned Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Earned Achievements</CardTitle>
                  <CardDescription>Badges you&apos;ve unlocked through your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ACHIEVEMENTS.filter((a) => a.earned).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">Earned {achievement.date}</p>
                      </div>
                      <Trophy className="w-5 h-5 text-accent" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>In Progress</CardTitle>
                  <CardDescription>Achievements you&apos;re working towards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ACHIEVEMENTS.filter((a) => !a.earned).map((achievement) => (
                    <div key={achievement.id} className="space-y-3 p-3 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl opacity-50">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Achievement Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Statistics</CardTitle>
                <CardDescription>Your overall achievement progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Total Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">4</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">75%</div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">8</div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
