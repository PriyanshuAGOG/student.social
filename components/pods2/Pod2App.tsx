"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Command,
  Compass,
  Download,
  FileText,
  Filter,
  Flame,
  FolderOpen,
  Gauge,
  Hash,
  Info,
  LayoutDashboard,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  MonitorUp,
  MoreHorizontal,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Upload,
  Users,
  Video,
  Wand2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCallContext } from "@/components/call/CallProvider"
import { chatService } from "@/lib/appwrite"
import { pod2Api } from "@/lib/pods/client"
import { calculateLeaderboard } from "@/lib/pods/calculations"
import type { PodBundle, PodDocument, PodMessage, PodProfile, PodResource, PodTask } from "@/lib/pods/types"
import { usePodRealtime } from "@/hooks/pods/use-pod-realtime"
import { CourseJourney } from "@/components/pods2/CourseJourney"
import { humanTextError } from "@/lib/validation/human-text"

const tabs = [
  ["overview", "Home", LayoutDashboard],
  ["roadmap", "Plan", BookOpen],
  ["study-room", "Room", Video],
  ["chat", "Chat", MessageSquare],
] as const

const podTypes = [
  ["sprint_7_day", "7-day sprint", "Fast outcomes and daily momentum."],
  ["challenge_14_day", "14-day challenge", "Structured practice with accountability."],
  ["cohort_30_day", "30-day cohort", "Balanced roadmap, sessions, and review."],
  ["ongoing_community", "Ongoing community", "Persistent learning and peer support."],
  ["project_based", "Project-based", "Build a portfolio-ready artifact."],
  ["exam_prep", "Exam prep", "Practice, revision, and mock reviews."],
  ["mentor_led", "Mentor-led", "Guided learning with tighter moderation."],
] as const

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not scheduled"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function roleCanManage(role?: string) {
  return ["owner", "mentor", "moderator"].includes(role || "")
}

function displayName(profile: PodProfile | null | undefined, userId?: string) {
  return profile?.name || profile?.username || (userId ? `Member ${userId.slice(0, 5)}` : "Member")
}

function initials(profile: PodProfile | null | undefined, userId?: string) {
  const name = displayName(profile, userId)
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "M"
}

function memberProfile(bundle: PodBundle, userId?: string) {
  if (!userId) return null
  return bundle.memberships.find((member) => member.userId === userId)?.profile || null
}

function PersonAvatar({ profile, userId, size = "md" }: { profile?: PodProfile | null; userId?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"
  return (
    <div className={cx("shrink-0 overflow-hidden rounded-full border border-white/10 bg-white text-black", sizeClass)} aria-hidden="true">
      {profile?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold">{initials(profile, userId)}</div>
      )}
    </div>
  )
}

function nextBestTask(bundle: PodBundle) {
  return bundle.tasks.find((task) => task.status === "today") || bundle.tasks.find((task) => task.status === "this_week") || bundle.tasks.find((task) => task.status !== "completed" && task.status !== "archived")
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ss-pods-experience min-h-dvh bg-[#050505] text-white">{children}</div>
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cx("rounded-[20px] border border-white/10 bg-[#111113] p-5 transition duration-200 hover:border-white/20", className)}>
      {children}
    </section>
  )
}

function EmptyState({ icon: Icon, title, body, action }: { icon: any; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-[#0B0B0C] p-8 text-center">
      <Icon className="mb-4 h-9 w-9 text-white/70" aria-hidden="true" />
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/55">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

function SkeletonPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] space-y-5 p-6 md:p-8">
        <div className="h-36 animate-pulse rounded-[24px] bg-white/[0.06]" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.06] lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.06]" />
        </div>
      </div>
    </Shell>
  )
}

function PodCard({ pod, mine }: { pod: PodDocument; mine?: boolean }) {
  const id = pod.$id
  const completion = Math.max(0, Math.min(100, Number(pod.completionRate || 0)))
  return (
    <article className="ss-pod-card group rounded-[22px] border border-white/10 bg-[#111113] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-start gap-3">
        <div className="ss-pod-card-mark" aria-hidden="true"><span /><span /><span /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="border-white/10 bg-white text-black hover:bg-white">{pod.category || "General"}</Badge>
            <Badge variant="outline" className="border-white/15 text-white">{pod.difficulty || "beginner"}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-1 text-[17px] font-semibold text-white">{pod.name}</h3>
          <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-white/60">{pod.shortOutcome || pod.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-white/55">
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{pod.memberCount || 0}</span>
        <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />{pod.weeklyActivityScore || 0} active</span>
        {pod.nextSessionAt ? <span className="ml-auto flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(pod.nextSessionAt)}</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/45"><span>{mine ? "Your progress" : "Pod progress"}</span><span>{completion}%</span></div>
          <Progress value={completion} className="h-1.5 bg-white/10" />
        </div>
        <Button asChild className="h-9 rounded-full bg-white px-4 text-black hover:bg-white/90">
          <Link href={`/app/pods/${id}/${mine ? "overview" : "preview"}`}>{mine ? "Continue" : "Explore"}<ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </article>
  )
}

export function PodDiscoveryPage() {
  const [pods, setPods] = useState<PodDocument[]>([])
  const [myPods, setMyPods] = useState<PodDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [difficulty, setDifficulty] = useState("All")
  const [discoveryMode, setDiscoveryMode] = useState<"recommended" | "active" | "soon" | "mentor">("recommended")
  const [collection, setCollection] = useState<"mine" | "discover">("mine")
  const [filterChoice, setFilterChoice] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    pod2Api.listPods().then((data) => {
      if (cancelled) return
      setPods(data.pods || [])
      setMyPods(data.myPods || [])
      setError("")
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Failed to load pods.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const matchesCoreFilters = (pod: PodDocument) => {
      const haystack = `${pod.name} ${pod.shortOutcome || ""} ${pod.description || ""} ${(pod.tags || []).join(" ")}`.toLowerCase()
      return (!search || haystack.includes(search.toLowerCase()))
        && (category === "All" || pod.category === category)
        && (difficulty === "All" || pod.difficulty === difficulty)
    }
    const now = Date.now()
    const twoWeeks = now + 14 * 24 * 60 * 60 * 1000
    const result = pods.filter(matchesCoreFilters).filter((pod) => {
      if (discoveryMode === "mentor") return pod.type === "mentor_led" || Boolean(pod.mentorId)
      if (discoveryMode === "soon") {
        const startsAt = pod.nextSessionAt ? new Date(pod.nextSessionAt).getTime() : Number.NaN
        return Number.isFinite(startsAt) && startsAt >= now && startsAt <= twoWeeks
      }
      return true
    })
    if (discoveryMode === "active") {
      return [...result].sort((a, b) => Number(b.weeklyActivityScore || 0) - Number(a.weeklyActivityScore || 0))
    }
    if (discoveryMode === "soon") {
      return [...result].sort((a, b) => new Date(a.nextSessionAt || 0).getTime() - new Date(b.nextSessionAt || 0).getTime())
    }
    return result
  }, [pods, search, category, difficulty, discoveryMode])

  const filteredMyPods = useMemo(() => myPods.filter((pod) => {
    const haystack = `${pod.name} ${pod.shortOutcome || ""} ${pod.description || ""} ${(pod.tags || []).join(" ")}`.toLowerCase()
    return (!search || haystack.includes(search.toLowerCase()))
      && (category === "All" || pod.category === category)
      && (difficulty === "All" || pod.difficulty === difficulty)
  }), [myPods, search, category, difficulty])

  const categories = ["All", ...Array.from(new Set(pods.map((pod) => pod.category || "General")))]

  if (loading) return <SkeletonPage />

  return (
    <Shell>
      <div className="ss-pods-home mx-auto max-w-[1320px] space-y-5 p-4 md:p-8">
        <header className="ss-pods-page-head">
          <div><span>Study together</span><h1 className="text-3xl font-bold tracking-normal text-white md:text-4xl">Your learning circles</h1><p>Focused spaces for showing up, making progress, and learning with people.</p></div>
          <Button asChild className="hidden h-10 rounded-full bg-white px-4 font-semibold text-black hover:bg-white/90 md:inline-flex"><Link href="/app/pods/create"><Plus className="mr-1.5 h-4 w-4" />New pod</Link></Button>
        </header>

        <section className="ss-pods-momentum" aria-label="Your pod momentum">
          <div><span className="ss-pods-kicker">This week</span><h2>Keep your circle moving.</h2><p>{myPods.length ? `${myPods.length} active ${myPods.length === 1 ? "pod" : "pods"} waiting for your next check-in.` : "Find a circle with the same goal, or start one of your own."}</p></div>
          <div className="ss-pods-momentum-stats"><span><strong>{myPods.length}</strong><small>active pods</small></span><span><strong>{myPods.reduce((sum, pod) => sum + Number(pod.weeklyActivityScore || 0), 0)}</strong><small>weekly activity</small></span><span><strong>{filtered.length}</strong><small>to discover</small></span></div>
        </section>

        <div className="ss-pods-switch" role="tablist" aria-label="Pod collection">
          <button type="button" role="tab" aria-selected={collection === "mine"} onClick={() => setCollection("mine")} className={collection === "mine" ? "is-active" : ""}>My pods <span>{myPods.length}</span></button>
          <button type="button" role="tab" aria-selected={collection === "discover"} onClick={() => setCollection("discover")} className={collection === "discover" ? "is-active" : ""}>Discover</button>
        </div>

        <div className="ss-pods-tools">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={collection === "mine" ? "Search your pods" : "Search topics or outcomes"} className="h-11 rounded-full border-white/10 bg-[#0B0B0C] pl-10 text-white placeholder:text-white/35 focus-visible:ring-white/20" /></div>
          <Button type="button" variant="outline" className="h-11 rounded-full border-white/10 bg-transparent px-4 text-white hover:bg-white/10" onClick={() => { setCategory("All"); setDifficulty("All"); setDiscoveryMode("recommended"); setFilterChoice("") }}><Filter className="mr-1.5 h-4 w-4" />Reset</Button>
        </div>

        {collection === "discover" ? <div className="ss-pods-filter-row">
          <Select value={filterChoice} onValueChange={(value) => {
            setFilterChoice(value)
            const [group, choice] = value.split(":")
            if (group === "category") setCategory(choice)
            if (group === "difficulty") setDifficulty(choice)
            if (group === "mode") setDiscoveryMode(choice as typeof discoveryMode)
          }}>
            <SelectTrigger aria-label="Filter discoverable pods" className="h-10 w-full rounded-full border-white/10 bg-[#0B0B0C] text-white sm:w-64"><Filter className="h-4 w-4" /><SelectValue placeholder="Filter pods" /></SelectTrigger>
            <SelectContent>
              <SelectGroup><SelectLabel>Category</SelectLabel>{categories.map((item) => <SelectItem key={item} value={`category:${item}`}>{item}</SelectItem>)}</SelectGroup>
              <SelectSeparator />
              <SelectGroup><SelectLabel>Difficulty</SelectLabel>{["All", "beginner", "intermediate", "advanced", "expert"].map((item) => <SelectItem key={item} value={`difficulty:${item}`}>{item}</SelectItem>)}</SelectGroup>
              <SelectSeparator />
              <SelectGroup><SelectLabel>Discovery</SelectLabel><SelectItem value="mode:recommended">Recommended</SelectItem><SelectItem value="mode:active">Most active</SelectItem><SelectItem value="mode:soon">Starting soon</SelectItem><SelectItem value="mode:mentor">Mentor-led</SelectItem></SelectGroup>
            </SelectContent>
          </Select>
          <span>{category !== "All" ? category : "All topics"} · {difficulty !== "All" ? difficulty : "Any level"} · {discoveryMode === "recommended" ? "Recommended" : discoveryMode === "active" ? "Most active" : discoveryMode === "soon" ? "Starting soon" : "Mentor-led"}</span>
        </div> : null}

        {error ? <EmptyState icon={RefreshCw} title="Could not load pods" body={error} action={<Button onClick={() => location.reload()} className="rounded-xl bg-white text-black">Retry</Button>} /> : null}

        {collection === "mine" ? <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Active Pods</h2>
            <Button asChild variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white"><Link href="/app/pods?filter=mine">View all</Link></Button>
          </div>
          {filteredMyPods.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredMyPods.map((pod) => <PodCard key={pod.$id} pod={pod} mine />)}</div> : myPods.length ? <EmptyState icon={Search} title="No active pods match" body="Adjust your search or filters to see your learning spaces." /> : <EmptyState icon={Compass} title="No active pods yet" body="Join a pod or create your own learning workspace to start seeing daily focus and progress here." action={<Button asChild className="rounded-xl bg-white text-black"><Link href="/app/pods/create">Create Pod</Link></Button>} />}
        </section> : null}

        {collection === "discover" ? <section id="recommended-pods" className="scroll-mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{discoveryMode === "active" ? "Most Active Pods" : discoveryMode === "soon" ? "Starting Soon" : discoveryMode === "mentor" ? "Mentor-led Pods" : "Recommended Pods"}</h2><span className="text-sm text-white/45">{filtered.length} found</span></div>
          {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((pod) => <PodCard key={pod.$id} pod={pod} />)}</div> : <EmptyState icon={Search} title="No pods found" body="Reset filters or create a new pod for this outcome." action={<Button onClick={() => { setSearch(""); setCategory("All"); setDifficulty("All"); setDiscoveryMode("recommended"); setFilterChoice("") }} className="rounded-xl bg-white text-black">Reset filters</Button>} />}
        </section> : null}
      </div>
    </Shell>
  )
}

function getPodFieldError(field: 'name' | 'category' | 'shortOutcome' | 'description', value: string): string | null {
  const trimmed = value.trim()
  if (field === 'name') return humanTextError('Pod name', trimmed, 3)
  if (field === 'category') return humanTextError('Pod category', trimmed, 2)
  if (field === 'shortOutcome' && trimmed.length < 10) return 'Short outcome must be at least 10 characters.'
  if (field === 'description' && trimmed.length < 20) return 'Description must be at least 20 characters.'
  return null
}

export function PodCreateWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    shortOutcome: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
    tags: "",
    idealLearner: "",
    prerequisites: "",
    language: "English",
    maxMembers: "50",
    type: "cohort_30_day",
    roadmapMode: "topic",
    topic: "",
    youtubeUrl: "",
    durationDays: "30",
    defaultSessionDay: "Saturday",
    defaultSessionTime: "10:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    visibility: "public",
    approvalRequired: false,
  })

  const update = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }))
  const title = ["Pod Identity", "Audience", "Structure", "Roadmap Setup", "Schedule", "Access", "Launch Preview"][step]

  async function launch() {
    const fieldError = getPodFieldError('name', form.name)
      || getPodFieldError('category', form.category)
      || getPodFieldError('shortOutcome', form.shortOutcome)
      || getPodFieldError('description', form.description)
    if (fieldError) {
      toast({ title: "Incomplete pod setup", description: fieldError, variant: "destructive" })
      setStep(0)
      return
    }
    setSaving(true)
    try {
      const result = await pod2Api.createPod({
        ...form,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        maxMembers: Number(form.maxMembers || 50),
        durationDays: Number(form.durationDays || 30),
        totalWeeks: Math.ceil(Number(form.durationDays || 30) / 7),
      })
      toast({ title: "Pod launched", description: `${result.pod.name} is ready.` })
      router.push(`/app/pods/${result.pod.$id}/overview`)
    } catch (error: any) {
      toast({ title: "Could not create pod", description: error.message || "Please check required fields and try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1440px] gap-6 p-5 md:grid-cols-[1fr_380px] md:p-8">
        <main className="space-y-6">
          <Button asChild variant="ghost" className="text-white/60 hover:bg-white/10 hover:text-white"><Link href="/app/pods"><ArrowLeft className="mr-2 h-4 w-4" />Pods</Link></Button>
          <div>
            <p className="text-sm text-white/45">Step {step + 1} of 7</p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal">{title}</h1>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, index) => <div key={index} className={cx("h-1.5 rounded-full", index <= step ? "bg-white" : "bg-white/10")} />)}
            </div>
          </div>

          <Panel className="min-h-[500px]">
            {step === 0 && (
              <div className="grid gap-4">
                <Field label="Pod name" count={`${form.name.length}/100`}><Input value={form.name} maxLength={100} onChange={(e) => update("name", e.target.value)} className="pod-input" placeholder="Frontend Systems Sprint" /></Field>
                <Field label="Short outcome" count={`${form.shortOutcome.length}/180`}><Input value={form.shortOutcome} maxLength={180} onChange={(e) => update("shortOutcome", e.target.value)} className="pod-input" placeholder="Ship a production-ready dashboard in 30 days." /></Field>
                <Field label="Description" count={`${form.description.length}/500`}><Textarea value={form.description} maxLength={500} onChange={(e) => update("description", e.target.value)} className="pod-textarea min-h-32" placeholder="Describe the transformation, cadence, and collaboration style." /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category"><Input value={form.category} maxLength={80} onChange={(e) => update("category", e.target.value)} className="pod-input" placeholder="Programming, Design, Mathematics…" /><p className="mt-1 text-xs text-white/40">Use a descriptive topic, not only numbers or symbols.</p></Field>
                  <Field label="Difficulty"><Select value={form.difficulty} onValueChange={(value) => update("difficulty", value)}><SelectTrigger className="pod-input"><SelectValue /></SelectTrigger><SelectContent>{["beginner", "intermediate", "advanced", "expert"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>
                </div>
                <Field label="Tags"><Input value={form.tags} onChange={(e) => update("tags", e.target.value)} className="pod-input" placeholder="react, appwrite, portfolio" /></Field>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4">
                <Field label="Ideal learner"><Textarea value={form.idealLearner} onChange={(e) => update("idealLearner", e.target.value)} className="pod-textarea" /></Field>
                <Field label="Prerequisites"><Textarea value={form.prerequisites} onChange={(e) => update("prerequisites", e.target.value)} className="pod-textarea" /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Language"><Input value={form.language} onChange={(e) => update("language", e.target.value)} className="pod-input" /></Field>
                  <Field label="Max members"><Input type="number" value={form.maxMembers} onChange={(e) => update("maxMembers", e.target.value)} className="pod-input" /></Field>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3 md:grid-cols-2">
                {podTypes.map(([value, label, body]) => (
                  <button key={value} onClick={() => update("type", value)} className={cx("rounded-2xl border p-4 text-left transition hover:border-white/25", form.type === value ? "border-white bg-white text-black" : "border-white/10 bg-[#0B0B0C] text-white")}>
                    <div className="font-semibold">{label}</div>
                    <p className={cx("mt-2 text-sm leading-5", form.type === value ? "text-black/65" : "text-white/55")}>{body}</p>
                  </button>
                ))}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <Tabs value={form.roadmapMode} onValueChange={(value) => update("roadmapMode", value)}>
                  <TabsList className="grid w-full grid-cols-4 rounded-xl bg-[#0B0B0C]">
                    <TabsTrigger value="topic">Topic</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube</TabsTrigger>
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="blank">Blank</TabsTrigger>
                  </TabsList>
                </Tabs>
                {form.roadmapMode === "topic" && <Field label="Topic"><Input value={form.topic} onChange={(e) => update("topic", e.target.value)} className="pod-input" placeholder="Full-stack Appwrite with Next.js" /></Field>}
                {form.roadmapMode === "youtube" && <Field label="YouTube URL"><Input value={form.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} className="pod-input" placeholder="https://youtube.com/watch?v=..." /></Field>}
                <Field label="Duration days"><Input type="number" value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} className="pod-input" /></Field>
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/60">If AI is not configured, Student.social uses a deterministic starter template with phases, lessons, tasks, and first-week focus.</p>
              </div>
            )}
            {step === 4 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Weekly session day"><Input value={form.defaultSessionDay} onChange={(e) => update("defaultSessionDay", e.target.value)} className="pod-input" /></Field>
                <Field label="Session time"><Input value={form.defaultSessionTime} onChange={(e) => update("defaultSessionTime", e.target.value)} className="pod-input" /></Field>
                <Field label="Time zone"><Input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className="pod-input" /></Field>
              </div>
            )}
            {step === 5 && (
              <div className="grid gap-5">
                <Field label="Visibility"><Select value={form.visibility} onValueChange={(value) => update("visibility", value)}><SelectTrigger className="pod-input"><SelectValue /></SelectTrigger><SelectContent>{["public", "private", "invite_only"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0B0C] p-4">
                  <span><span className="block font-medium">Approval required</span><span className="text-sm text-white/50">New members request access before joining.</span></span>
                  <Switch checked={form.approvalRequired} onCheckedChange={(checked) => update("approvalRequired", checked)} />
                </label>
              </div>
            )}
            {step === 6 && (
              <div className="space-y-4">
                <PreviewCard form={form} />
                <div className="grid gap-3 md:grid-cols-3">
                  <Metric label="First week" value={`${Math.ceil(Number(form.durationDays || 30) / 7)} weeks`} />
                  <Metric label="First task" value="Generated" />
                  <Metric label="Channels" value="7 default" />
                </div>
              </div>
            )}
          </Panel>

          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10">Back</Button>
            {step < 6 ? <Button onClick={() => setStep((s) => Math.min(6, s + 1))} className="rounded-xl bg-white text-black hover:bg-white/90">Continue<ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={launch} disabled={saving} className="rounded-xl bg-white text-black hover:bg-white/90">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Launch Pod</Button>}
          </div>
        </main>
        <aside className="space-y-4 md:sticky md:top-6 md:self-start">
          <PreviewCard form={form} />
          <Panel><h3 className="font-semibold">Launch creates</h3><div className="mt-4 space-y-3 text-sm text-white/60">{["Owner membership", "Default channels", "Roadmap and tasks", "First session if configured", "Secure server-side permissions"].map((item) => <div key={item} className="flex gap-2"><Check className="h-4 w-4 text-white" />{item}</div>)}</div></Panel>
        </aside>
      </div>
      <style jsx global>{`.pod-input{height:44px;border-radius:12px;border-color:rgba(255,255,255,.1);background:#0B0B0C;color:white}.pod-textarea{border-radius:12px;border-color:rgba(255,255,255,.1);background:#0B0B0C;color:white}`}</style>
    </Shell>
  )
}

function Field({ label, count, children }: { label: string; count?: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="flex justify-between text-sm font-medium text-white/75">{label}{count ? <span className="text-white/35">{count}</span> : null}</span>{children}</label>
}

function PreviewCard({ form }: { form: any }) {
  return (
    <Panel>
      <div className="mb-4 h-24 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.2),transparent_28%),linear-gradient(135deg,#191919,#050505)]" />
      <h3 className="text-lg font-semibold">{form.name || "Untitled Pod"}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{form.shortOutcome || "Your outcome will appear here."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className="bg-white text-black hover:bg-white">{form.category}</Badge>
        <Badge variant="outline" className="border-white/15 text-white">{form.difficulty}</Badge>
        <Badge variant="outline" className="border-white/15 text-white">{form.type}</Badge>
      </div>
    </Panel>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0B0B0C] p-4"><div className="text-xs text-white/45">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>
}

function PageIntro({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{body}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function PodWorkspacePage({ podId, tab = "overview", preview = false }: { podId: string; tab?: string; preview?: boolean }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [bundle, setBundle] = useState<PodBundle & { leaderboard?: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await pod2Api.getBundle(podId)
      setBundle(data as any)
      setError("")
    } catch (err: any) {
      setError(err.message || "Could not load pod.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [podId])
  usePodRealtime(bundle?.pod.$id, Boolean(user?.$id), () => load())

  useEffect(() => {
    if (!preview && tab === "chat" && bundle?.pod.$id) {
      router.replace(`/app/chat?pod=${encodeURIComponent(bundle.pod.$id)}&name=${encodeURIComponent(bundle.pod.name || "Pod")}`)
    }
  }, [bundle?.pod.$id, bundle?.pod.name, preview, router, tab])

  if (loading) return <SkeletonPage />
  if (error || !bundle) return <Shell><div className="mx-auto max-w-[900px] p-8"><EmptyState icon={RefreshCw} title="Pod could not load" body={error || "The pod may be private, archived, or unavailable."} action={<Button asChild className="rounded-xl bg-white text-black"><Link href="/app/pods">Back to Pods</Link></Button>} /></div></Shell>

  const role = bundle.membership?.role
  const pod = bundle.pod
  const activeTab = preview ? "preview" : tab === "tasks" ? "roadmap" : tab
  const leaderboard = bundle.leaderboard || calculateLeaderboard(bundle.memberships)

  async function join() {
    try {
      await pod2Api.joinPod(pod.$id)
      toast({ title: pod.approvalRequired ? "Request sent" : "Joined pod", description: pod.approvalRequired ? "A moderator will review your request." : "Your workspace is ready." })
      await load()
      router.push(`/app/pods/${pod.$id}/overview`)
    } catch (err: any) {
      toast({ title: "Could not join pod", description: err.message, variant: "destructive" })
    }
  }

  return (
    <Shell>
      <div className="ss-pod-workspace mx-auto max-w-[1320px] p-3 md:p-8">
        <PodHeader bundle={bundle} role={role} onJoin={join} isMember={Boolean(bundle.membership)} />
        {!preview ? (
          <>
            <GuidedStart bundle={bundle} activeTab={activeTab} />
            <nav className="ss-pod-tabs mt-3 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#0B0B0C] p-1" aria-label="Primary pod sections">
              {tabs.map(([value, label, Icon]) => (
                <Link
                  key={value}
                  href={`/app/pods/${pod.$id}/${value}`}
                  className={cx(
                    "flex h-10 items-center justify-center gap-2 rounded-xl px-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    activeTab === value ? "bg-white text-black" : "text-white/55 hover:bg-white/10 hover:text-white",
                  )}
                  aria-current={activeTab === value ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />{label}
                </Link>
              ))}
            </nav>
            <PodUtilityBar bundle={bundle} activeTab={activeTab} role={role} />
          </>
        ) : null}
        <div className="ss-pod-tab-content mt-4 md:mt-6">
          {preview ? <PreviewTab bundle={bundle} onJoin={join} /> : null}
          {activeTab === "overview" ? <OverviewTab bundle={bundle} reload={load} /> : null}
          {activeTab === "roadmap" ? <div className="space-y-8"><CourseJourney bundle={bundle} /><RoadmapTab bundle={bundle} reload={load} /><TasksTab bundle={bundle} reload={load} /></div> : null}
          {activeTab === "study-room" ? <StudyRoomTab bundle={bundle} /> : null}
          {activeTab === "chat" ? <ChatTab bundle={bundle} reload={load} /> : null}
          {activeTab === "resources" ? <ResourcesTab bundle={bundle} reload={load} /> : null}
          {activeTab === "members" ? <MembersTab bundle={bundle} /> : null}
          {activeTab === "leaderboard" ? <LeaderboardTab rows={leaderboard} /> : null}
          {activeTab === "insights" ? <div className="space-y-8"><InsightsTab bundle={bundle} /><LeaderboardTab rows={leaderboard} /></div> : null}
          {activeTab === "settings" ? <SettingsTab bundle={bundle} reload={load} /> : null}
        </div>
      </div>
    </Shell>
  )
}

function PodHeader({ bundle, role, onJoin, isMember }: { bundle: PodBundle; role?: string; onJoin: () => void; isMember: boolean }) {
  const pod = bundle.pod
  const userProgress = Number(bundle.membership?.progressPercent ?? pod.completionRate ?? 0)
  const helpers = bundle.memberships.filter((member) => member.status === "active").slice(0, 5)
  return (
    <header className="ss-pod-header overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0B0C]">
      <div className="ss-pod-mobile-topbar">
        <Link href="/app/pods" aria-label="Back to pods"><ArrowLeft aria-hidden="true" /></Link>
        <span>Pod workspace</span>
        <Button variant="ghost" aria-label="Share pod" className="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10"><Share2 className="h-4 w-4" aria-hidden="true" /></Button>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_320px] md:p-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="bg-white text-black hover:bg-white">Week {pod.currentWeek || 1}/{pod.totalWeeks || 4}</Badge>
            <Badge variant="outline" className="border-white/15 text-white">{role || "preview"}</Badge>
            <Badge variant="outline" className="border-white/15 text-white">{pod.visibility}</Badge>
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-normal md:text-4xl">{pod.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-white/60 md:leading-6">{pod.shortOutcome}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/55 md:text-sm">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" />{pod.memberCount || bundle.memberships.length} members</span>
            <span className="flex items-center gap-2"><CircleDot className="h-4 w-4" aria-hidden="true" />{pod.activeMemberCount || helpers.length} active</span>
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDate(pod.nextSessionAt)}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-4">
          <div className="ss-pod-progress-card rounded-2xl border border-white/10 bg-[#111113] p-4">
            <div className="mb-2 flex justify-between text-xs text-white/50"><span>Your progress</span><span>{userProgress}%</span></div>
            <Progress value={userProgress} className="h-1.5 bg-white/10" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {helpers.map((member) => <PersonAvatar key={member.$id} profile={member.profile} userId={member.userId} size="sm" />)}
              </div>
              <span className="text-xs text-white/45">{helpers.length} learning now</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isMember ? <Button onClick={onJoin} className="h-10 flex-1 rounded-xl bg-white text-black hover:bg-white/90">{pod.approvalRequired ? "Request Access" : "Join Pod"}</Button> : <Button asChild className="h-10 flex-1 rounded-xl bg-white text-black hover:bg-white/90"><Link href={`/app/pods/${pod.$id}/overview`}>Continue</Link></Button>}
            <Button variant="outline" aria-label="Share pod" className="hidden h-10 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 md:inline-flex"><Share2 className="h-4 w-4" aria-hidden="true" /></Button>
            {roleCanManage(role) ? <Button asChild variant="outline" aria-label="Settings" className="h-10 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10"><Link href={`/app/pods/${pod.$id}/settings`}><Settings className="h-4 w-4" aria-hidden="true" /></Link></Button> : null}
          </div>
        </div>
      </div>
    </header>
  )
}

function PodUtilityBar({ bundle, activeTab, role }: { bundle: PodBundle; activeTab: string; role?: string }) {
  const podId = bundle.pod.$id
  const items = [
    { value: "resources", label: "Library", detail: `${bundle.resources.length} resources`, icon: FolderOpen },
    { value: "members", label: "People", detail: `${bundle.memberships.length} members`, icon: Users },
    { value: "insights", label: "Progress", detail: "Insights & ranks", icon: BarChart3 },
    ...(roleCanManage(role) ? [{ value: "settings", label: "Manage", detail: "Pod settings", icon: Settings }] : []),
  ]
  return (
    <nav className="ss-pod-utilities" aria-label="Pod utilities">
      {items.map((item) => <Link key={item.value} href={`/app/pods/${podId}/${item.value}`} className={activeTab === item.value ? "is-active" : ""}><span><item.icon aria-hidden="true" /></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ChevronRight aria-hidden="true" /></Link>)}
    </nav>
  )
}

function GuidedStart({ bundle, activeTab }: { bundle: PodBundle; activeTab: string }) {
  const task = nextBestTask(bundle)
  const session = bundle.sessions.find((item) => ["scheduled", "live"].includes(item.status || "scheduled"))
  const steps = [
    { label: "Next task", value: task?.title || "Open the roadmap", href: `/app/pods/${bundle.pod.$id}/roadmap`, icon: ListChecks },
    { label: "Live session", value: session ? formatDate(session.startsAt) : "No session yet", href: `/app/pods/${bundle.pod.$id}/study-room`, icon: CalendarDays },
    { label: "Ask for help", value: "Use Doubts channel", href: `/app/pods/${bundle.pod.$id}/chat`, icon: MessageSquare },
  ]
  return (
    <section className="ss-pod-guided mt-3 rounded-2xl border border-white/10 bg-[#111113] p-2" aria-label="Start here">
      <div className="grid grid-cols-3 gap-1.5">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} className={cx("group flex min-w-0 items-center gap-2 rounded-xl p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:gap-3 md:p-3", activeTab === step.href.split("/").pop() ? "bg-white text-black" : "hover:bg-white/10")}>
            <div className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10", activeTab === step.href.split("/").pop() ? "bg-black text-white" : "bg-white text-black")}>
              <step.icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className={cx("text-xs", activeTab === step.href.split("/").pop() ? "text-black/55" : "text-white/45")}>{step.label}</div>
              <div className="hidden truncate text-sm font-semibold sm:block">{step.value}</div>
            </div>
            <ChevronRight className="ml-auto hidden h-4 w-4 opacity-45 md:block" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function PreviewTab({ bundle, onJoin }: { bundle: PodBundle; onJoin: () => void }) {
  return (
    <div className="space-y-6">
      <Panel className="grid gap-6 md:grid-cols-[1.2fr_.8fr]">
        <div><h2 className="text-2xl font-semibold">What you will achieve</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["Build", "Understand", "Practice", "Review", "Showcase"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-[#0B0B0C] p-4"><Sparkles className="mb-3 h-5 w-5" /><div className="font-semibold">{item}</div><p className="mt-2 text-sm text-white/55">A clear {item.toLowerCase()} outcome for this pod.</p></div>)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#0B0B0C] p-5"><h3 className="font-semibold">Pod Rhythm</h3><div className="mt-4 space-y-3 text-sm text-white/60">{["Monday kickoff", "Daily check-ins", "Midweek doubt session", "Weekend live build/review", "Weekly reflection"].map((item) => <div key={item} className="flex gap-2"><Check className="h-4 w-4 text-white" />{item}</div>)}</div><Button onClick={onJoin} className="mt-5 w-full rounded-xl bg-white text-black">Join Pod</Button></div>
      </Panel>
      <RoadmapTab bundle={bundle} readonly />
    </div>
  )
}

function OverviewTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const todayTasks = bundle.tasks.filter((task) => task.status === "today").slice(0, 4)
  const nextTask = nextBestTask(bundle)
  const nextSession = bundle.sessions.find((session) => ["scheduled", "live"].includes(session.status || "scheduled"))
  const activeMembers = bundle.memberships.filter((member) => member.status === "active")
  const recentActivity = [
    ...bundle.checkins.slice(0, 3).map((item: any) => ({ ...item, kind: "check-in" })),
    ...bundle.messages.slice(-3).map((item: any) => ({ ...item, kind: "message" })),
  ].slice(0, 5)
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Panel className="p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0B0B0C] px-3 py-1 text-xs text-white/55">
                <Target className="h-3.5 w-3.5" aria-hidden="true" /> Start here
              </div>
              <h2 className="text-2xl font-semibold">Today’s Focus</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">One calm path through the pod: complete the next task, check in, and use the right space when you need help.</p>
            </div>
            <Button asChild className="h-11 rounded-xl bg-white px-5 text-black hover:bg-white/90">
              <Link href={nextTask ? `/app/pods/${bundle.pod.$id}/tasks` : `/app/pods/${bundle.pod.$id}/roadmap`}>Start today</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3">
            {(todayTasks.length ? todayTasks : [
              nextTask || { title: "Open the roadmap", points: 10, estimatedMinutes: 10 },
              { title: "Post a daily check-in", points: 5, estimatedMinutes: 3 },
              { title: "Ask one clear question if blocked", points: 0, estimatedMinutes: 5 },
            ]).slice(0, 4).map((task: any, index) => (
              <Link
                key={task.$id || `${task.title}-${index}`}
                href={`/app/pods/${bundle.pod.$id}/${task.$id ? "tasks" : index === 1 ? "overview" : "chat"}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0B0C] p-4 transition hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black"><Check className="h-4 w-4" aria-hidden="true" /></div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{task.title}</div>
                    <div className="text-xs text-white/45">{task.estimatedMinutes || 20} min • {task.points || 0} pts</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">This Week</h2>
              <p className="mt-1 text-sm text-white/55">A compact view of progress, work, and live time.</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white">Week {bundle.pod.currentWeek || 1}</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="Your progress" value={`${bundle.membership?.progressPercent || 0}%`} />
            <Metric label="Tasks left" value={bundle.tasks.filter((t) => t.status !== "completed" && t.status !== "archived").length} />
            <Metric label="Resources" value={bundle.resources.length} />
            <Metric label="Next session" value={nextSession ? formatDate(nextSession.startsAt) : "None"} />
          </div>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          {recentActivity.length ? (
            <div className="mt-4 space-y-3">
              {recentActivity.map((item: any) => {
                const profile = item.senderProfile || item.profile || memberProfile(bundle, item.senderId || item.userId)
                return (
                  <div key={`${item.kind}-${item.$id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B0B0C] p-4 text-sm">
                    <PersonAvatar profile={profile} userId={item.senderId || item.userId} size="sm" />
                    <div className="min-w-0">
                      <div className="text-white"><span className="font-medium">{item.senderName || displayName(profile, item.userId)}</span> posted a {item.kind}</div>
                      <div className="mt-1 truncate text-xs text-white/42">{item.content || item.todayPlan || item.blocker || "Progress update"} • {formatDate(item.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState icon={Activity} title="No activity yet" body="Activity appears as members complete tasks, post check-ins, upload resources, and send messages." />}
        </Panel>
      </div>
      <aside className="space-y-5">
        <Panel>
          <h2 className="text-lg font-semibold">Your Progress</h2>
          <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Streak" value={bundle.membership?.currentStreak || 0} /><Metric label="Points" value={bundle.membership?.totalPoints || 0} /><Metric label="Tasks" value={bundle.membership?.tasksCompleted || 0} /><Metric label="Sessions" value={bundle.membership?.sessionsAttended || 0} /></div>
        </Panel>
        <Panel>
          <h2 className="text-lg font-semibold">People</h2>
          <p className="mt-1 text-sm text-white/55">Active members who can help you move.</p>
          <div className="mt-4 space-y-3">
            {activeMembers.slice(0, 5).map((member) => (
              <Link key={member.$id} href={`/app/profile/${member.profile?.username || member.userId}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B0B0C] p-3 transition hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                <PersonAvatar profile={member.profile} userId={member.userId} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{displayName(member.profile, member.userId)}</div>
                  <div className="text-xs text-white/45">{member.role} • {member.currentStreak || 0} day streak</div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel><h2 className="text-lg font-semibold">Upcoming Session</h2>{nextSession ? <div className="mt-4 space-y-3 text-sm text-white/60"><div className="text-base font-semibold text-white">{nextSession.title}</div><div>{formatDate(nextSession.startsAt)}</div><div>{nextSession.agenda}</div><Button asChild className="w-full rounded-xl bg-white text-black"><Link href={`/app/pods/${bundle.pod.$id}/study-room`}>Join Session</Link></Button><Button variant="outline" className="w-full rounded-xl border-white/10 bg-transparent text-white">Add to calendar</Button></div> : <EmptyState icon={CalendarDays} title="No session scheduled" body="Mentors can schedule a live room from the Study Room tab." />}</Panel>
      </aside>
    </div>
  )
}

function RoadmapTab({ bundle, reload, readonly }: { bundle: PodBundle; reload?: () => void; readonly?: boolean }) {
  const { toast } = useToast()
  async function generate() {
    try {
      await pod2Api.createRoadmap(bundle.pod.$id, { topic: bundle.pod.name, durationDays: 30 })
      toast({ title: "Roadmap generated", description: "Starter phases and tasks were added." })
      reload?.()
    } catch (err: any) {
      toast({ title: "Could not generate roadmap", description: err.message, variant: "destructive" })
    }
  }
  if (!bundle.roadmap.length) return <EmptyState icon={BookOpen} title="No roadmap yet" body="Create a roadmap so members know what to learn and complete each week." action={!readonly && roleCanManage(bundle.membership?.role) ? <div className="flex gap-2"><Button onClick={generate} className="rounded-xl bg-white text-black"><Wand2 className="mr-2 h-4 w-4" />Generate Roadmap</Button><Button variant="outline" className="rounded-xl border-white/10 bg-transparent text-white">Create Manually</Button></div> : null} />
  const phases = bundle.roadmap.filter((item) => item.type === "phase")
  const currentItems = bundle.roadmap.filter((item) => item.type !== "phase" && Number(item.week || 1) <= Number(bundle.pod.currentWeek || 1))
  const nextItem = currentItems.find((item) => item.status !== "completed" && item.status !== "archived") || bundle.roadmap.find((item) => item.type !== "phase")
  return (
    <div>
      <PageIntro
        title="Roadmap"
        body="A simple learning path by week. Start with the highlighted item, then move down the list."
        action={!readonly && roleCanManage(bundle.membership?.role) ? <Button onClick={generate} variant="outline" className="rounded-xl border-white/10 bg-transparent text-white"><Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />Generate next week</Button> : null}
      />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <Panel>
            <h3 className="text-lg font-semibold">Weeks</h3>
            <div className="mt-4 space-y-2">
              {phases.map((phase) => (
                <div key={phase.$id} className={cx("rounded-2xl border p-4", Number(phase.week) === Number(bundle.pod.currentWeek || 1) ? "border-white/24 bg-white text-black" : "border-white/10 bg-[#0B0B0C]")}>
                  <div className={cx("text-xs", Number(phase.week) === Number(bundle.pod.currentWeek || 1) ? "text-black/55" : "text-white/40")}>Week {phase.week}</div>
                  <div className="mt-1 font-medium">{phase.title}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="mt-4 space-y-3"><Metric label="Items" value={bundle.roadmap.length} /><Metric label="Available" value={bundle.roadmap.filter((i) => i.status === "available").length} /><Metric label="Completed" value={bundle.roadmap.filter((i) => i.status === "completed").length} /></div>
          </Panel>
        </aside>
        <div className="space-y-5">
          {nextItem ? (
            <Panel className="border-white/18">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="bg-white text-black hover:bg-white">Next step</Badge>
                  <h3 className="mt-4 text-xl font-semibold">{nextItem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{nextItem.description || "Open this item to keep moving through the pod."}</p>
                </div>
                <Button className="rounded-xl bg-white text-black">Start</Button>
              </div>
            </Panel>
          ) : null}
          <Panel>
            <h3 className="text-lg font-semibold">Learning Path</h3>
            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
              {bundle.roadmap.filter((item) => item.type !== "phase").map((item) => (
                <div key={item.$id} className="grid gap-3 bg-[#0B0B0C] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-white/40">{item.type} • week {item.week} • {item.estimatedMinutes || 20} min</div>
                    <h4 className="mt-1 truncate font-semibold">{item.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/52">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/15 text-white">{item.status || "available"}</Badge>
                    <Button size="sm" variant="outline" className="rounded-xl border-white/10 bg-transparent text-white">Open</Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function TasksTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<PodTask | null>(null)
  const columns = ["today", "this_week", "backlog", "submitted", "reviewed", "completed"]
  async function quickTask() {
    try {
      await pod2Api.createTask(bundle.pod.$id, { title: "New focused task", status: "today", type: "build" })
      toast({ title: "Task created" })
      reload()
    } catch (err: any) {
      toast({ title: "Could not create task", description: err.message, variant: "destructive" })
    }
  }
  return (
    <>
      <PageIntro
        title="Tasks"
        body="Everything is grouped by when it matters. New users can stay in Today and This Week without managing the full board."
        action={roleCanManage(bundle.membership?.role) ? <Button onClick={quickTask} className="rounded-xl bg-white text-black"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create Task</Button> : null}
      />
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Today" value={bundle.tasks.filter((task) => task.status === "today").length} />
        <Metric label="This week" value={bundle.tasks.filter((task) => task.status === "this_week").length} />
        <Metric label="Submitted" value={bundle.tasks.filter((task) => task.status === "submitted").length} />
        <Metric label="Done" value={bundle.tasks.filter((task) => task.status === "completed").length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {columns.map((column) => {
          const tasks = bundle.tasks.filter((task) => (task.status || "backlog") === column)
          return (
            <Panel key={column} className="min-h-[260px] p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-white/70">{column.replace("_", " ")}</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/45">{tasks.length}</span>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <button
                    key={task.$id}
                    onClick={() => setSelected(task)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0B0B0C] p-4 text-left transition hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <div className="font-medium">{task.title}</div>
                    <p className="mt-2 line-clamp-2 text-sm text-white/50">{task.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                      <span>{formatDate(task.dueAt)}</span>
                      <span>{task.points || 0} pts</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )
        })}
      </div>
      <TaskDialog task={selected} podId={bundle.pod.$id} onClose={() => setSelected(null)} onDone={reload} />
    </>
  )
}

function TaskDialog({ task, podId, onClose, onDone }: { task: PodTask | null; podId: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [text, setText] = useState("")
  if (!task) return null
  const activeTask = task
  async function submit() {
    try {
      await pod2Api.submitTask(podId, activeTask.$id, { text })
      toast({ title: "Task submitted", description: "Your mentor can review it now." })
      onDone()
      onClose()
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    }
  }
  return <Dialog open onOpenChange={onClose}><DialogContent className="border-white/10 bg-[#111113] text-white"><DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader><p className="text-sm leading-6 text-white/60">{task.description}</p><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your submission or notes..." className="pod-textarea min-h-32" /><Button onClick={submit} className="rounded-xl bg-white text-black">Submit work</Button></DialogContent></Dialog>
}

function StudyRoomTab({ bundle }: { bundle: PodBundle }) {
  const { toast } = useToast()
  const callContext = useCallContext()
  const [focus, setFocus] = useState(false)
  const [joining, setJoining] = useState(false)
  const session = bundle.sessions.find((item) => item.status === "live") || bundle.sessions[0]
  async function joinCall(mediaType: "voice" | "video") {
    setJoining(true)
    try {
      const room = await chatService.getOrCreatePodRoom(bundle.pod.$id, bundle.pod.name || "Pod study room")
      await callContext.startCall(
        "room",
        room.$id,
        mediaType === "voice" ? "audio" : "video",
        { title: session?.title || `${bundle.pod.name || "Pod"} study room` },
      )
    } catch (err: any) {
      toast({ title: "Could not open the study call", description: err.message || "Please try again.", variant: "destructive" })
    } finally {
      setJoining(false)
    }
  }
  return (
    <div className="ss-study-room">
      <PageIntro title="Study room" body="Everything you need for the next working session—context, a clear agenda, and one calm way to join." />
      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <Panel className="ss-session-stage overflow-hidden p-0">
          <div className="ss-session-stage-head"><div><span>{session?.status === "live" ? "Live now" : session ? "Next session" : "Open room"}</span><h2>{session?.title || `${bundle.pod.name} working session`}</h2><p>{session ? formatDate(session.startsAt) : "Start an instant room whenever your pod is ready to work together."}</p></div><div className="flex gap-2"><Button onClick={() => joinCall("video")} disabled={joining} className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">{joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" aria-hidden="true" />}Join room</Button><Button onClick={() => joinCall("voice")} disabled={joining} variant="outline" className="h-11 rounded-full border-white/10 bg-transparent px-4 text-white hover:bg-white/10"><Mic className="mr-2 h-4 w-4" aria-hidden="true" />Audio</Button></div></div>
          <div className="ss-session-lobby"><div className="ss-session-orbit"><span /><span /><span /><MonitorUp aria-hidden="true" /></div><h3>Your pod’s shared focus space</h3><p>Join when you are ready. Your agenda and notes stay alongside the session so everyone leaves with a clear next step.</p><div><span><Users />{bundle.pod.activeMemberCount || 0} active today</span><span><Clock />{session ? formatDate(session.startsAt) : "Open anytime"}</span></div></div>
        </Panel>
        <aside className="space-y-4">
          <Panel className="ss-room-agenda"><span>Session agenda</span><h3>{session?.agenda ? "What we’re working through" : "Add a simple outcome"}</h3><p>{session?.agenda || "Choose one outcome for the session so everyone knows what success looks like."}</p>{roleCanManage(bundle.membership?.role) ? <Button asChild variant="outline" className="mt-4 rounded-full border-white/10 bg-transparent text-white"><Link href="/app/calendar?mode=schedule">Schedule session</Link></Button> : null}</Panel>
          <Panel><div className="flex items-center justify-between"><div><span className="text-xs text-white/45">Focus block</span><h3 className="mt-1 font-semibold">25 minutes</h3></div><div className="text-2xl font-semibold">25:00</div></div><Button onClick={() => setFocus(!focus)} className="mt-4 w-full rounded-full bg-white text-black"><Timer className="mr-2 h-4 w-4" aria-hidden="true" />{focus ? "Pause focus" : "Start focus"}</Button></Panel>
          <Panel><h3 className="font-semibold">Shared notes</h3><Textarea placeholder="Capture decisions, useful links, and next steps…" className="pod-textarea mt-3 min-h-32" /><Button className="mt-3 w-full rounded-full bg-white text-black">Save to pod library</Button></Panel>
        </aside>
      </div>
    </div>
  )
}

function ChatTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [channelId, setChannelId] = useState(bundle.channels[0]?.$id || "")
  const [draft, setDraft] = useState("")
  const [label, setLabel] = useState<"none" | "question" | "resource" | "update" | "blocker" | "announcement" | "submission">("none")
  const [search, setSearch] = useState("")
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const channel = bundle.channels.find((item) => item.$id === channelId) || bundle.channels[0]
  const messages = bundle.messages.filter((message) => message.channelId === channel?.$id && (!search || message.content?.toLowerCase().includes(search.toLowerCase())))
  async function send() {
    if (!channel || !draft.trim()) return
    try {
      await pod2Api.sendMessage(bundle.pod.$id, channel.$id, { content: draft, label })
      setDraft("")
      reload()
    } catch (err: any) {
      toast({ title: "Message failed", description: err.message, variant: "destructive" })
    }
  }
  async function uploadAttachment(file: File | null | undefined) {
    if (!file) return
    setUploadingAttachment(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const result = await pod2Api.uploadChatAttachment(bundle.pod.$id, formData)
      setDraft((prev) => `${prev}${prev ? "\n" : ""}[${result.attachment.fileName}](${result.attachment.fileUrl})`)
      setLabel("resource")
      toast({ title: "Attachment uploaded", description: "A link was added to the composer." })
    } catch (err: any) {
      toast({ title: "Attachment upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploadingAttachment(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }
  return (
    <div>
      <PageIntro title="Chat" body="Organized channels for questions, blockers, resources, wins, and announcements without burying the learning flow." />
      <div className="grid min-h-[680px] gap-5 lg:grid-cols-[240px_1fr]">
        <Panel className="p-3">
          <div className="mb-3 px-2 text-sm font-semibold text-white/60">Channels</div>
          {bundle.channels.map((item) => (
            <button key={item.$id} onClick={() => setChannelId(item.$id)} className={cx("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60", channel?.$id === item.$id ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white")}>
              <Hash className="h-4 w-4" aria-hidden="true" />{item.name}
            </button>
          ))}
        </Panel>
        <Panel className="flex flex-col p-0">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div><h2 className="font-semibold">#{channel?.name || "general"}</h2><p className="text-xs text-white/45">{channel?.description}</p></div>
            <div className="relative md:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pod-input h-9 pl-9" placeholder="Search messages" /></div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length ? messages.map((message) => <MessageRow key={message.$id} message={message} podId={bundle.pod.$id} reload={reload} />) : <EmptyState icon={MessageSquare} title="No messages yet" body="Start the channel with a question, resource, update, blocker, or submission." />}</div>
          <div className="border-t border-white/10 p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <Select value={label} onValueChange={(value) => setLabel(value as typeof label)}><SelectTrigger className="h-9 w-40 rounded-xl border-white/10 bg-[#0B0B0C] text-white"><SelectValue /></SelectTrigger><SelectContent>{["none", "question", "resource", "update", "blocker", "announcement", "submission"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => uploadAttachment(e.target.files?.[0])} aria-label="Upload chat attachment" />
              <Button type="button" aria-label="Upload attachment" onClick={() => fileInputRef.current?.click()} disabled={uploadingAttachment} variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white">{uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden="true" />}</Button>
              <span className="ml-auto self-center text-xs text-white/38">{search ? `${messages.length} matches` : `${messages.length} messages`}</span>
            </div>
            <div className="flex gap-2"><Textarea ref={textareaRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} className="pod-textarea min-h-12" placeholder="Message this pod..." /><Button onClick={send} aria-label="Send message" className="h-12 rounded-xl bg-white text-black"><Send className="h-4 w-4" aria-hidden="true" /></Button></div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function MessageRow({ message, podId, reload }: { message: PodMessage; podId: string; reload: () => void }) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(message.content || "")
  async function react(emoji: string) {
    try { await pod2Api.toggleReaction(podId, message.$id, emoji); reload() } catch (err: any) { toast({ title: "Reaction failed", description: err.message, variant: "destructive" }) }
  }
  async function save() {
    try { await pod2Api.updateMessage(podId, message.$id, { content }); setEditing(false); reload() } catch (err: any) { toast({ title: "Edit failed", description: err.message, variant: "destructive" }) }
  }
  async function remove() {
    try { await pod2Api.deleteMessage(podId, message.$id); reload() } catch (err: any) { toast({ title: "Delete failed", description: err.message, variant: "destructive" }) }
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B0C] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PersonAvatar profile={message.senderProfile} userId={message.senderId} />
          <div className="min-w-0">
            <div className="truncate font-medium">{message.senderName || displayName(message.senderProfile, message.senderId)}</div>
            <div className="mt-1 text-xs text-white/40">{formatDate(message.createdAt)} {message.edited ? "• edited" : ""}</div>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 border-white/15 text-white">{message.label || "none"}</Badge>
      </div>
      {editing ? <div className="mt-3 space-y-2"><Textarea value={content} onChange={(e) => setContent(e.target.value)} className="pod-textarea" /><Button size="sm" onClick={save} className="rounded-xl bg-white text-black">Save</Button></div> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">{message.deleted ? "Message deleted" : message.content}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        <Button size="sm" variant="ghost" aria-label="React with check" onClick={() => react("✓")} className="h-8 rounded-lg text-white/60 hover:bg-white/10">✓</Button>
        <Button size="sm" variant="ghost" aria-label="React with fire" onClick={() => react("🔥")} className="h-8 rounded-lg text-white/60 hover:bg-white/10">🔥</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-8 rounded-lg text-white/60 hover:bg-white/10">Edit</Button>
        <Button size="sm" variant="ghost" onClick={remove} className="h-8 rounded-lg text-white/60 hover:bg-white/10">Delete</Button>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-white/60 hover:bg-white/10">Create task</Button>
      </div>
    </div>
  )
}

function ResourcesTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-5">
      <PageIntro title="Pod library" body="Files, links, notes, templates, and recordings shared specifically with this learning circle." action={<div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="rounded-full border-white/10 bg-transparent text-white"><Link href={`/app/vault?pod=${bundle.pod.$id}`}><FolderOpen className="mr-2 h-4 w-4" />Open in Vault</Link></Button><Button onClick={() => setOpen(true)} className="rounded-full bg-white text-black"><Upload className="mr-2 h-4 w-4" aria-hidden="true" />Upload here</Button></div>} />
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="All resources" value={bundle.resources.length} />
        <Metric label="Links" value={bundle.resources.filter((resource) => resource.type === "link").length} />
        <Metric label="Files" value={bundle.resources.filter((resource) => resource.storageFileId).length} />
        <Metric label="Useful votes" value={bundle.resources.reduce((sum, resource) => sum + Number(resource.usefulCount || 0), 0)} />
      </div>
      {bundle.resources.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{bundle.resources.map((resource) => <ResourceCard key={resource.$id} resource={resource} />)}</div> : <EmptyState icon={FolderOpen} title="No resources yet" body="Upload a note, link, PDF, video, code file, template, assignment, or recording." action={<Button onClick={() => setOpen(true)} className="rounded-xl bg-white text-black">Upload Resource</Button>} />}
      <ResourceDialog open={open} onOpenChange={setOpen} podId={bundle.pod.$id} onDone={reload} />
    </div>
  )
}

function ResourceCard({ resource }: { resource: PodResource }) {
  return <Panel><div className="flex items-start justify-between gap-3"><FileText className="h-5 w-5 text-white/55" /><Badge variant="outline" className="border-white/15 text-white">{resource.type}</Badge></div><h3 className="mt-4 font-semibold">{resource.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">{resource.description || resource.url || resource.content}</p><div className="mt-4 flex flex-wrap gap-2">{(resource.tags || []).slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="border-white/10 text-white/60">{tag}</Badge>)}</div><div className="mt-5 flex gap-2"><Button size="sm" className="rounded-xl bg-white text-black">Preview</Button><Button size="sm" variant="outline" className="rounded-xl border-white/10 bg-transparent text-white"><Download className="mr-2 h-4 w-4" />Open</Button></div></Panel>
}

function ResourceDialog({ open, onOpenChange, podId, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; podId: string; onDone: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  async function submit() {
    setUploading(true)
    try {
      if (file) {
        const formData = new FormData()
        formData.set("file", file)
        formData.set("title", title || file.name)
        formData.set("description", description)
        formData.set("tags", tags)
        formData.set("visibility", "pod")
        await pod2Api.uploadResource(podId, formData)
      } else {
        await pod2Api.createResource(podId, { title, url, type: "link", description: description || url, visibility: "pod", tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })
      }
      toast({ title: "Resource added" })
      setTitle("")
      setUrl("")
      setDescription("")
      setTags("")
      setFile(null)
      onDone()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "File must match allowed type and size.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#111113] text-white"><DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader><Input value={title} onChange={(e) => setTitle(e.target.value)} className="pod-input" placeholder="Title" /><Input value={url} onChange={(e) => setUrl(e.target.value)} className="pod-input" placeholder="https://... for link resources" /><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="pod-input pt-2" aria-label="Resource file" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="pod-textarea" placeholder="Description" /><Input value={tags} onChange={(e) => setTags(e.target.value)} className="pod-input" placeholder="tags, comma, separated" /><Button onClick={submit} disabled={uploading || (!file && !url)} className="rounded-xl bg-white text-black">{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Save resource</Button></DialogContent></Dialog>
}

function MembersTab({ bundle }: { bundle: PodBundle }) {
  return (
    <div className="space-y-5">
      <PageIntro title="Members" body="Real profiles, roles, progress, and accountability in one calm directory." action={<Button className="rounded-xl bg-white text-black"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Invite</Button>} />
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Total" value={bundle.memberships.length} />
        <Metric label="Active" value={bundle.memberships.filter((member) => member.status === "active").length} />
        <Metric label="Mentors" value={bundle.memberships.filter((member) => ["owner", "mentor"].includes(member.role)).length} />
        <Metric label="Avg progress" value={`${Math.round(bundle.memberships.reduce((sum, member) => sum + Number(member.progressPercent || 0), 0) / Math.max(bundle.memberships.length, 1))}%`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bundle.memberships.map((member) => (
          <Panel key={member.$id}>
            <div className="flex items-center gap-3">
              <PersonAvatar profile={member.profile} userId={member.userId} size="lg" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{displayName(member.profile, member.userId)}</div>
                <div className="truncate text-sm text-white/45">{member.profile?.username ? `@${member.profile.username}` : member.role} • {member.status}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2"><Metric label="Progress" value={`${member.progressPercent || 0}%`} /><Metric label="Streak" value={member.currentStreak || 0} /><Metric label="Points" value={member.totalPoints || 0} /></div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl border-white/10 bg-transparent text-white"><Link href={`/app/profile/${member.profile?.username || member.userId}`}>Profile</Link></Button>
              <Button size="sm" variant="outline" className="rounded-xl border-white/10 bg-transparent text-white">Invite to session</Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function LeaderboardTab({ rows }: { rows: any[] }) {
  const [open, setOpen] = useState(false)
  return <div className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Leaderboard</h2><Button onClick={() => setOpen(true)} variant="outline" className="rounded-xl border-white/10 bg-transparent text-white"><Info className="mr-2 h-4 w-4" aria-hidden="true" />How scoring works</Button></div>{rows.length ? <Panel><div className="space-y-2">{rows.map((row) => <div key={row.userId} className="grid grid-cols-[44px_1fr_auto] gap-3 rounded-2xl border border-white/10 bg-[#0B0B0C] p-4 text-sm md:grid-cols-[54px_1fr_120px_120px] md:items-center"><div className="text-lg font-bold">#{row.rank}</div><div className="flex min-w-0 items-center gap-3"><PersonAvatar profile={{ name: row.name, username: row.username, avatar: row.avatar }} userId={row.userId} /><div className="min-w-0"><div className="truncate font-semibold">{row.name}</div><div className="truncate text-white/45">{row.badge}</div></div></div><div>{row.points} pts</div><div className="hidden md:block">{row.streak} streak</div></div>)}</div></Panel> : <EmptyState icon={Trophy} title="No leaderboard yet" body="Members appear after joining, completing tasks, attending sessions, and posting check-ins." />}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="border-white/10 bg-[#111113] text-white"><DialogHeader><DialogTitle>How scoring works</DialogTitle></DialogHeader><p className="text-sm leading-6 text-white/60">Daily check-in: 5, task completed: 10, task submitted: 20, session attended: 15, resource uploaded: 10, helpful reaction: 2, peer review: 15, final project: 50.</p></DialogContent></Dialog></div>
}

function InsightsTab({ bundle }: { bundle: PodBundle }) {
  const stuck = bundle.checkins.filter((item) => item.helpNeeded || item.status === "blocked").length
  const actions = bundle.insights.flatMap((item) => item.suggestedActions || [])
  const inactive = bundle.memberships.filter((member) => {
    const lastActive = member.lastActiveAt ? new Date(member.lastActiveAt).getTime() : 0
    return member.status === "active" && Date.now() - lastActive > 7 * 24 * 60 * 60 * 1000
  }).length
  return (
    <div>
      <PageIntro title="Insights" body="A short, actionable readout of what needs attention. No noisy charts, just next decisions." />
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Needs help" value={stuck} />
        <Metric label="Inactive" value={inactive} />
        <Metric label="Tasks today" value={bundle.tasks.filter((t) => t.status === "today").length} />
        <Metric label="Health" value={bundle.pod.healthScore || 0} />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Insight title={stuck ? `${stuck} members need help` : "No active blockers"} body={stuck ? "Schedule a doubt session or create a blocker thread before the weekend." : "Check-ins do not show active blockers right now."} cta="Open check-ins" />
        <Insight title={`${bundle.tasks.filter((t) => t.status === "today").length} tasks pinned today`} body="Today’s focus is based on task state and roadmap availability." cta="Review tasks" />
        <Insight title={`${bundle.resources.length} resources available`} body={bundle.resources.length ? "Promote the most useful resources into the roadmap." : "Add starter resources so members have a clear first step."} cta="Open resources" />
        {actions.map((action) => <Insight key={action} title="Suggested intervention" body={action} cta="Apply" />)}
      </div>
    </div>
  )
}

function Insight({ title, body, cta }: { title: string; body: string; cta: string }) {
  return <Panel><Sparkles className="mb-4 h-5 w-5 text-white/60" /><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{body}</p><Button className="mt-5 rounded-xl bg-white text-black">{cta}</Button></Panel>
}

function SettingsTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [name, setName] = useState(bundle.pod.name)
  const [shortOutcome, setShortOutcome] = useState(bundle.pod.shortOutcome || "")
  async function save() {
    try { await pod2Api.updatePod(bundle.pod.$id, { name, shortOutcome }); toast({ title: "Settings updated" }); reload() } catch (err: any) { toast({ title: "Update failed", description: err.message, variant: "destructive" }) }
  }
  if (!roleCanManage(bundle.membership?.role)) return <EmptyState icon={Lock} title="Settings are restricted" body="Only owners, mentors, and moderators can manage this pod." />
  return (
    <div>
      <PageIntro title="Settings" body="Keep pod controls grouped by intent: identity, automation, and safety." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Panel>
          <h2 className="text-xl font-semibold">Basic Details</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">These fields shape what members see first when they open the workspace.</p>
          <div className="mt-5 grid gap-4">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} className="pod-input" /></Field>
            <Field label="Outcome"><Input value={shortOutcome} onChange={(e) => setShortOutcome(e.target.value)} className="pod-input" /></Field>
            <Button onClick={save} className="w-fit rounded-xl bg-white text-black">Save changes</Button>
          </div>
        </Panel>
        <aside className="space-y-5">
          <Panel><h3 className="font-semibold">Automation</h3><p className="mt-2 text-sm text-white/50">Reminders stay quiet and focused.</p><div className="mt-4 space-y-3 text-sm text-white/60">{["Daily check-in reminders", "Task due reminders", "Session reminders", "Inactive nudges", "Weekly summaries"].map((item) => <div key={item} className="flex items-center justify-between gap-4"><span>{item}</span><Switch aria-label={item} /></div>)}</div></Panel>
          <Panel className="border-red-500/20"><h3 className="font-semibold text-red-200">Danger Zone</h3><p className="mt-2 text-sm text-white/50">Pause, archive, and delete actions require typed confirmation and server-side role validation.</p><Button variant="outline" className="mt-4 rounded-xl border-red-500/25 bg-red-950/20 text-red-100">Archive pod</Button></Panel>
        </aside>
      </div>
    </div>
  )
}

export function PodInviteAcceptPage({ inviteCode }: { inviteCode: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [pod, setPod] = useState<PodDocument | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    pod2Api.getInvite(inviteCode).then((data) => {
      if (cancelled) return
      setInvite(data.invite)
      setPod(data.pod)
      setError("")
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Invite could not be loaded.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [inviteCode])

  async function accept() {
    setAccepting(true)
    try {
      const result = await pod2Api.acceptInvite(inviteCode)
      toast({ title: "Invite accepted", description: `You joined ${result.pod.name}.` })
      router.push(`/app/pods/${result.pod.$id}/overview`)
    } catch (err: any) {
      toast({ title: "Could not accept invite", description: err.message, variant: "destructive" })
    } finally {
      setAccepting(false)
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-6 md:p-10">
        {loading ? (
          <div className="h-72 animate-pulse rounded-[24px] bg-white/[0.06]" />
        ) : error || !pod ? (
          <EmptyState icon={Lock} title="Invite unavailable" body={error || "This invite is expired, invalid, or already used."} action={<Button asChild className="rounded-xl bg-white text-black"><Link href="/app/pods">Open Pods</Link></Button>} />
        ) : (
          <Panel>
            <Badge className="bg-white text-black hover:bg-white">Pod invite</Badge>
            <h1 className="mt-5 text-3xl font-bold tracking-normal">{pod.name}</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">{pod.shortOutcome}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Role" value={invite?.role || "member"} />
              <Metric label="Members" value={pod.memberCount || 0} />
              <Metric label="Difficulty" value={pod.difficulty || "beginner"} />
            </div>
            <div className="mt-7 flex gap-3">
              <Button onClick={accept} disabled={accepting} className="rounded-xl bg-white text-black hover:bg-white/90">
                {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Accept Invite
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10">
                <Link href={`/app/pods/${pod.$id}/preview`}>Preview Pod</Link>
              </Button>
            </div>
          </Panel>
        )}
      </main>
    </Shell>
  )
}
