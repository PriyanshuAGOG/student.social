"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, FileText, Loader2, MessageSquare, Settings, Sparkles, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { listPodResources, listPodSessions, listPodTasks } from "@/lib/appwrite/pods"
import { calculatePodHealthScore, calculateUserPodProgress } from "@/lib/appwrite/pod-calculations"
import { usePodRealtime } from "@/hooks/use-pod-realtime"

const tabs = [
  ["overview", "Overview"],
  ["roadmap", "Roadmap"],
  ["tasks", "Tasks"],
  ["study-room", "Study Room"],
  ["chat", "Chat"],
  ["resources", "Resources"],
  ["members", "Members"],
  ["leaderboard", "Leaderboard"],
  ["insights", "Insights"],
  ["settings", "Settings"],
] as const

export function Pod2TabPage({ tab }: { tab: string }) {
  const params = useParams()
  const podId = params.podId as string
  const [tasks, setTasks] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [taskRes, sessionRes, resourceRes] = await Promise.all([
        listPodTasks(podId).catch(() => ({ documents: [] })),
        listPodSessions(podId).catch(() => ({ documents: [] })),
        listPodResources(podId).catch(() => ({ documents: [] })),
      ])
      setTasks(taskRes.documents || [])
      setSessions(sessionRes.documents || [])
      setResources(resourceRes.documents || [])
    } catch (err: any) {
      setError(err?.message || "Could not load this pod workspace.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (podId) load()
  }, [podId])

  const realtime = usePodRealtime(podId, ["pod_tasks", "pod_sessions", "pod_resources"], () => load())

  const todayTasks = tasks.filter((task) => ["today", "submitted"].includes(task.status)).slice(0, 5)
  const upcomingSession = sessions
    .filter((session) => new Date(session.startsAt || session.startTime || 0).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt || a.startTime).getTime() - new Date(b.startsAt || b.startTime).getTime())[0]
  const progress = useMemo(() => calculateUserPodProgress({ tasks, sessions }), [tasks, sessions])
  const health = useMemo(() => calculatePodHealthScore({ tasks, sessions }), [tasks, sessions])

  return (
    <main className="min-h-screen bg-[#050506] text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="border-white/10 bg-white/8 text-white hover:bg-white/10">Pod 2.0 workspace</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal md:text-4xl">Learning operating system</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/58">
                Today focus, sprint work, sessions, resources, accountability, and insights in one calm workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${realtime.isLive ? "bg-white" : "bg-white/25"}`} aria-hidden="true" />
              <span className="text-xs text-white/52">{realtime.error || (realtime.isLive ? "Live sync active" : "Live sync paused")}</span>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0B0B0C] p-1" aria-label="Pod sections">
            {tabs.map(([value, label]) => (
              <Link
                key={value}
                href={value === "overview" ? `/app/pods/${podId}` : `/app/pods/${podId}/${value}`}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${tab === value ? "bg-white text-black" : "text-white/62 hover:bg-white/8 hover:text-white"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-[20px] border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-white/10 bg-[#111113] text-white">
            <CardContent className="flex flex-col items-start gap-3 p-6">
              <AlertCircle className="h-5 w-5" />
              <div>
                <h2 className="font-semibold">Workspace data could not load</h2>
                <p className="text-sm text-white/58">{error}</p>
              </div>
              <Button onClick={load} className="bg-white text-black hover:bg-[#EDEDED]">Retry</Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Metric icon={CheckCircle2} label="Your progress" value={`${progress}%`} detail="Calculated from real pod activity" />
                <Metric icon={BarChart3} label="Pod health" value={`${health}%`} detail="Activity, completion, sessions" />
                <Metric icon={CalendarDays} label="Next session" value={upcomingSession ? "Scheduled" : "None"} detail={upcomingSession?.title || "Create a session to anchor the week"} />
              </div>
              <Card className="border-white/10 bg-[#111113] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />Today&apos;s Focus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayTasks.length ? todayTasks.map((task) => (
                    <div key={task.$id} className="rounded-2xl border border-white/10 bg-[#0B0B0C] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="mt-1 text-sm text-white/54">{task.description || "No description yet."}</p>
                        </div>
                        <Badge className="bg-white text-black hover:bg-white">{task.points || 10} pts</Badge>
                      </div>
                    </div>
                  )) : (
                    <Empty icon={CheckCircle2} title="No focus tasks yet" body="Create or move tasks into Today so members know exactly what to do next." action="Open tasks" href={`/app/pods/${podId}/tasks`} />
                  )}
                </CardContent>
              </Card>
              <TabSpecific tab={tab} podId={podId} tasks={tasks} sessions={sessions} resources={resources} />
            </div>
            <aside className="space-y-4">
              <Card className="border-white/10 bg-[#111113] text-white">
                <CardHeader><CardTitle className="text-base">Sprint Signal</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-white/58">Progress uses tasks, sessions, check-ins, resources, and reviews when available.</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-[#111113] text-white">
                <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild className="justify-start bg-white text-black hover:bg-[#EDEDED]"><Link href={`/app/pods/${podId}/tasks`}>Create task</Link></Button>
                  <Button asChild variant="outline" className="justify-start border-white/10 bg-transparent text-white hover:bg-white/8"><Link href={`/app/pods/${podId}/resources`}>Upload resource</Link></Button>
                  <Button asChild variant="outline" className="justify-start border-white/10 bg-transparent text-white hover:bg-white/8"><Link href={`/app/pods/${podId}/chat`}>Open channels</Link></Button>
                </CardContent>
              </Card>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}

function Metric({ icon: Icon, label, value, detail }: any) {
  return (
    <Card className="border-white/10 bg-[#111113] text-white transition hover:border-white/20">
      <CardContent className="p-5">
        <Icon className="h-4 w-4 text-white/62" />
        <p className="mt-4 text-sm text-white/54">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-white/42">{detail}</p>
      </CardContent>
    </Card>
  )
}

function Empty({ icon: Icon, title, body, action, href }: any) {
  return (
    <div className="rounded-2xl border border-dashed border-white/14 bg-[#0B0B0C] p-6">
      <Icon className="h-5 w-5 text-white/60" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/54">{body}</p>
      <Button asChild className="mt-4 bg-white text-black hover:bg-[#EDEDED]"><Link href={href}>{action}</Link></Button>
    </div>
  )
}

function TabSpecific({ tab, podId, tasks, sessions, resources }: any) {
  const copy: Record<string, { icon: any; title: string; body: string }> = {
    roadmap: { icon: FileText, title: "Roadmap timeline", body: "Roadmap data is ready for phases, lessons, tasks, sessions, and milestones." },
    tasks: { icon: CheckCircle2, title: `${tasks.length} tasks`, body: "Task board data is connected to the Pod 2.0 task collection and realtime refresh." },
    "study-room": { icon: CalendarDays, title: `${sessions.length} sessions`, body: "Sessions, meeting links, agenda, attendance, and notes have a dedicated data model." },
    chat: { icon: MessageSquare, title: "Organized channels", body: "Pod messages and reactions use channel-scoped collections to prevent inflated reactions." },
    resources: { icon: FileText, title: `${resources.length} resources`, body: "Knowledge base files, links, notes, and attachments use the Pod 2.0 resources model." },
    members: { icon: Users, title: "Accountability directory", body: "Membership roles, progress, streaks, skills, and notification preferences are modeled." },
    leaderboard: { icon: Trophy, title: "Positive scoring", body: "Leaderboard helpers rank points, streaks, resources, sessions, reviews, and improvement." },
    insights: { icon: BarChart3, title: "Actionable insights", body: "Health and completion helpers power mentor interventions when enough data exists." },
    settings: { icon: Settings, title: "Safe controls", body: "Role helpers separate owner, mentor, moderator, member, and guest capabilities." },
    overview: { icon: Sparkles, title: "Operating view", body: "The overview answers what to do today, progress, session state, and pod health." },
  }
  const item = copy[tab] || copy.overview
  return <Empty icon={item.icon} title={item.title} body={item.body} action="Back to legacy pod" href={`/app/pods/${podId}`} />
}
