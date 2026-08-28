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
  Compass,
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
  Play,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useCallContext } from "@/components/call/CallProvider"
import { chatService } from "@/lib/appwrite"
import { pod2Api } from "@/lib/pods/client"
import type {
  PodBundle,
  PodDocument,
  PodMessage,
  PodProfile,
  PodResource,
  PodTask,
  RoadmapItem,
} from "@/lib/pods/types"
import { usePodRealtime } from "@/hooks/pods/use-pod-realtime"

const PRIMARY_TABS = [
  ["overview", "Today", Target],
  ["roadmap", "Path", BookOpen],
  ["study-room", "Room", Video],
  ["chat", "Circle", MessageSquare],
] as const

const FORMAT_OPTIONS = [
  { value: "cohort_30_day", label: "Course Cohort", body: "A small group follows one structured learning track together.", icon: BookOpen, max: 8 },
  { value: "project_based", label: "Project Studio", body: "Build one portfolio-ready artifact through milestones and peer review.", icon: MonitorUp, max: 8 },
  { value: "exam_prep", label: "Exam Sprint", body: "Diagnostics, revision cycles, practice, doubt rooms, and mock reviews.", icon: Target, max: 8 },
  { value: "ongoing_community", label: "Study Circle", body: "An ongoing learning circle around one shared subject or skill.", icon: Users, max: 20 },
  { value: "mentor_led", label: "Mentor Cohort", body: "A structured cohort with reviews, office hours, and tighter accountability.", icon: Star, max: 8 },
] as const

type DiscoveryMode = "recommended" | "active" | "soon" | "mentor"
type ContextTab = "notes" | "discuss" | "ai" | "resources"

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function clampProgress(value: unknown) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}

function validDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value?: string) {
  const date = validDate(value)
  if (!date) return "Not scheduled"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function formatDay(value?: string) {
  const date = validDate(value)
  if (!date) return "Flexible"
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date)
}

function roleCanManage(role?: string) {
  return ["owner", "mentor", "moderator"].includes(role || "")
}

function displayName(profile?: PodProfile | null, userId?: string) {
  return profile?.name || profile?.username || (userId ? `Member ${userId.slice(0, 5)}` : "Member")
}

function initials(profile?: PodProfile | null, userId?: string) {
  return displayName(profile, userId).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "M"
}

function PersonAvatar({ profile, userId, size = "md" }: { profile?: PodProfile | null; userId?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cx("pods3-avatar", `is-${size}`)} aria-hidden="true">
      {profile?.avatar ? <img src={profile.avatar} alt="" /> : initials(profile, userId)}
    </span>
  )
}

function formatLabel(type?: string) {
  return FORMAT_OPTIONS.find((item) => item.value === type)?.label || type?.replaceAll("_", " ") || "Learning Pod"
}

function trackLabel(pod: PodDocument) {
  const explicit = typeof pod.trackName === "string" ? pod.trackName : ""
  return explicit || `${pod.category || "General"} learning track`
}

function nextTask(bundle: PodBundle) {
  return bundle.tasks.find((task) => task.status === "today")
    || bundle.tasks.find((task) => task.status === "this_week")
    || bundle.tasks.find((task) => !["completed", "archived"].includes(task.status || "backlog"))
}

function learningItems(bundle: PodBundle) {
  return [...bundle.roadmap]
    .filter((item) => item.type !== "phase")
    .sort((a, b) => Number(a.week || 0) - Number(b.week || 0) || Number(a.order || 0) - Number(b.order || 0))
}

function nextLearningItem(bundle: PodBundle) {
  const items = learningItems(bundle)
  return items.find((item) => item.status === "in_progress")
    || items.find((item) => item.status === "available")
    || items.find((item) => item.status !== "completed" && item.status !== "archived")
    || items[0]
}

function memberProfile(bundle: PodBundle, userId?: string) {
  return bundle.memberships.find((member) => member.userId === userId)?.profile || null
}

function PodsRoot({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("pods3-root", className)}>{children}</div>
}

function EmptyState({ icon: Icon, title, body, action }: { icon: any; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="pods3-empty">
      <span><Icon aria-hidden="true" /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  )
}

function LoadingPage() {
  return (
    <PodsRoot>
      <div className="pods3-skeleton">
        <div className="pods3-shimmer h-36" />
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="pods3-shimmer h-72" />
          <div className="pods3-shimmer h-72" />
          <div className="pods3-shimmer h-72" />
        </div>
      </div>
    </PodsRoot>
  )
}

function ProgressLine({ value }: { value: number }) {
  return <div className="pods3-progress-track"><i style={{ width: `${clampProgress(value)}%` }} /></div>
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="pods3-metric"><span>{label}</span><strong>{value}</strong></div>
}

function PodCard({ pod, mine }: { pod: PodDocument; mine?: boolean }) {
  const progress = clampProgress(pod.completionRate)
  const active = Number(pod.activeMemberCount || pod.weeklyActivityScore || 0)
  const capacity = Number(pod.maxMembers || 0)
  return (
    <article className="pods3-card pods3-card-hover pods3-pod-card">
      <div className="pods3-pod-card-accent" />
      <div className="pods3-pod-card-body">
        <div className="pods3-pod-card-top">
          <div className="pods3-icon-tile"><BookOpen aria-hidden="true" /></div>
          <span className="pods3-pill is-plum">{formatLabel(pod.type)}</span>
        </div>
        <h3>{pod.name}</h3>
        <p className="pods3-pod-card-outcome">{pod.shortOutcome || pod.description || "Learn this outcome with a small group that keeps moving together."}</p>
        <div className="pods3-pod-card-meta">
          <span className="pods3-pill">{pod.difficulty || "beginner"}</span>
          <span className="pods3-pill">{pod.language || "English"}</span>
          {pod.totalWeeks ? <span className="pods3-pill"><Clock />{pod.totalWeeks} weeks</span> : null}
        </div>
        <div className="pods3-pod-card-evidence">
          <span><strong>{pod.memberCount || 0}{capacity ? `/${capacity}` : ""}</strong><small>learners</small></span>
          <span><strong>{active}</strong><small>active</small></span>
          <span><strong>{pod.nextSessionAt ? formatDay(pod.nextSessionAt) : "Flexible"}</strong><small>next live</small></span>
        </div>
        <div className="pods3-pod-card-footer">
          <div>
            <div className="pods3-progress-copy"><span>{mine ? "Your progress" : trackLabel(pod)}</span>{mine ? <span>{progress}%</span> : null}</div>
            {mine ? <ProgressLine value={progress} /> : <div className="pods3-progress-track"><i style={{ width: `${Math.min(100, Number(pod.memberCount || 0) / Math.max(1, capacity || 8) * 100)}%` }} /></div>}
          </div>
          <Button asChild size="sm">
            <Link href={`/app/pods/${pod.$id}/${mine ? "overview" : "preview"}`}>{mine ? "Continue" : "Preview"}<ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

export function PodDiscoveryPage() {
  const [pods, setPods] = useState<PodDocument[]>([])
  const [myPods, setMyPods] = useState<PodDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [collection, setCollection] = useState<"mine" | "discover">("mine")
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState<DiscoveryMode>("recommended")

  useEffect(() => {
    let cancelled = false
    pod2Api.listPods().then((data) => {
      if (cancelled) return
      setPods(data.pods || [])
      setMyPods(data.myPods || [])
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Pods could not load.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const query = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    const source = collection === "mine" ? myPods : pods
    const now = Date.now()
    const soon = now + 14 * 24 * 60 * 60 * 1000
    let result = source.filter((pod) => !query || `${pod.name} ${pod.shortOutcome || ""} ${pod.description || ""} ${pod.category || ""} ${(pod.tags || []).join(" ")}`.toLowerCase().includes(query))
    if (collection === "discover") {
      if (mode === "mentor") result = result.filter((pod) => pod.type === "mentor_led" || Boolean(pod.mentorId))
      if (mode === "soon") result = result.filter((pod) => {
        const date = validDate(pod.nextSessionAt)?.getTime()
        return Boolean(date && date >= now && date <= soon)
      })
      if (mode === "active") result = [...result].sort((a, b) => Number(b.weeklyActivityScore || 0) - Number(a.weeklyActivityScore || 0))
    }
    return result
  }, [collection, mode, myPods, pods, query])

  if (loading) return <LoadingPage />

  const totalActivity = myPods.reduce((sum, pod) => sum + Number(pod.weeklyActivityScore || 0), 0)
  const nextSession = myPods.map((pod) => validDate(pod.nextSessionAt)).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0]

  return (
    <PodsRoot>
      <main className="pods3-page">
        <header className="pods3-discovery-head">
          <div>
            <span className="pods3-eyebrow">Social learning</span>
            <h1 className="pods3-title">Pods</h1>
            <p>Small learning groups with a shared path, a shared rhythm, and enough social gravity to actually finish.</p>
          </div>
          <Button asChild><Link href="/app/pods/create"><Plus className="mr-1.5 h-4 w-4" />Start a pod</Link></Button>
        </header>

        <section className="pods3-discovery-hero">
          <div className="pods3-discovery-hero-copy">
            <span className="pods3-eyebrow">{collection === "mine" ? "Your learning, in motion" : "Find your people, then learn"}</span>
            <h2>{collection === "mine" ? <>Know exactly what to learn <em>today.</em></> : <>The internet has content. <em>Pods add momentum.</em></>}</h2>
            <p>{collection === "mine" ? "Every active Pod should give you one clear next action, a peer to learn with, and a fast path out of blockers." : "Choose the outcome, schedule, level, and cohort that fit. Preview the entire learning rhythm before you commit."}</p>
          </div>
          <div className="pods3-discovery-pulse" aria-label="Learning pulse">
            <div><span><BookOpen /></span><div><strong>{myPods.length}</strong><small>active pods</small></div></div>
            <div><span><Activity /></span><div><strong>{totalActivity}</strong><small>weekly signals</small></div></div>
            <div><span><CalendarDays /></span><div><strong>{nextSession ? formatDay(nextSession.toISOString()) : "Open"}</strong><small>next live session</small></div></div>
          </div>
        </section>

        <div className="pods3-segmented" role="tablist" aria-label="Pod collection">
          <button className={collection === "mine" ? "is-active" : ""} onClick={() => setCollection("mine")}>My pods <small>{myPods.length}</small></button>
          <button className={collection === "discover" ? "is-active" : ""} onClick={() => setCollection("discover")}>Discover <small>{pods.length}</small></button>
        </div>

        <div className="pods3-discovery-tools">
          <div className="pods3-search"><Search aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={collection === "mine" ? "Search your learning spaces" : "Search a skill, outcome, or topic"} /></div>
          <Button variant="outline" onClick={() => { setSearch(""); setMode("recommended") }}><Filter className="mr-1.5 h-4 w-4" />Reset</Button>
        </div>

        {collection === "discover" ? <div className="pods3-filter-chips" aria-label="Discovery filters">
          {(["recommended", "active", "soon", "mentor"] as DiscoveryMode[]).map((item) => <button key={item} className={mode === item ? "is-active" : ""} onClick={() => setMode(item)}>{item === "recommended" ? "Recommended" : item === "active" ? "Most active" : item === "soon" ? "Starting soon" : "Mentor-led"}</button>)}
        </div> : null}

        {error ? <div className="mt-3"><EmptyState icon={RefreshCw} title="Could not load Pods" body={error} action={<Button onClick={() => location.reload()}>Retry</Button>} /></div> : null}

        <div className="pods3-section-head">
          <div><h2>{collection === "mine" ? "Your active learning" : mode === "mentor" ? "Mentor cohorts" : mode === "active" ? "Learning right now" : mode === "soon" ? "Starting soon" : "Recommended Pods"}</h2><p>{collection === "mine" ? "Pick up where you left off." : "Preview the outcome, rhythm, people, and path before joining."}</p></div>
          <span>{filtered.length} {filtered.length === 1 ? "Pod" : "Pods"}</span>
        </div>

        {filtered.length ? <div className="pods3-grid">{filtered.map((pod) => <PodCard key={pod.$id} pod={pod} mine={collection === "mine"} />)}</div> : <EmptyState icon={Compass} title={collection === "mine" ? "Your first Pod starts here" : "No Pods match yet"} body={collection === "mine" ? "Join a small group around one outcome, or start a Pod and invite the people you want to learn with." : "Try a broader search, or create the learning circle you were looking for."} action={<Button asChild><Link href="/app/pods/create">Start a Pod</Link></Button>} />}
      </main>
    </PodsRoot>
  )
}

function fieldError(name: string, outcome: string, description: string) {
  if (name.trim().length < 3) return "Give the Pod a name with at least 3 characters."
  if (outcome.trim().length < 10) return "Describe the learner outcome in at least 10 characters."
  if (description.trim().length < 20) return "Add enough context so learners understand what they are committing to."
  return null
}

export function PodCreateWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: "cohort_30_day",
    name: "",
    shortOutcome: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
    language: "English",
    idealLearner: "",
    prerequisites: "",
    sourceMode: "topic",
    topic: "",
    youtubeUrl: "",
    durationDays: "30",
    maxMembers: "8",
    defaultSessionDay: "Saturday",
    defaultSessionTime: "10:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    visibility: "public",
    approvalRequired: false,
  })
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))
  const format = FORMAT_OPTIONS.find((item) => item.value === form.type) || FORMAT_OPTIONS[0]
  const titles = ["What kind of learning should happen?", "Define the outcome", "Choose the learning source", "Set the social rhythm", "Review the experience"]

  function chooseFormat(value: string) {
    const option = FORMAT_OPTIONS.find((item) => item.value === value)
    setForm((current) => ({ ...current, type: value, maxMembers: String(option?.max || 8) }))
  }

  async function launch() {
    const issue = fieldError(form.name, form.shortOutcome, form.description)
    if (issue) {
      toast({ title: "A few details are missing", description: issue, variant: "destructive" })
      setStep(1)
      return
    }
    setSaving(true)
    try {
      const duration = Math.max(1, Number(form.durationDays || 30))
      const result = await pod2Api.createPod({
        ...form,
        roadmapMode: form.sourceMode,
        maxMembers: Math.max(2, Number(form.maxMembers || format.max)),
        durationDays: duration,
        totalWeeks: Math.max(1, Math.ceil(duration / 7)),
        tags: [form.category, form.difficulty].filter(Boolean),
      })
      toast({ title: "Pod created", description: "Your learning circle is ready for its first cohort." })
      router.push(`/app/pods/${result.pod.$id}/overview`)
    } catch (err: any) {
      toast({ title: "Could not create Pod", description: err.message || "Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PodsRoot className="pods3-create">
      <div className="pods3-create-shell">
        <main className="pods3-create-main">
          <div className="pods3-create-top">
            <Link className="pods3-create-back" href="/app/pods"><ArrowLeft />Pods</Link>
            <div><span className="pods3-step-kicker">Step {step + 1} of 5 · {format.label}</span><h1>{titles[step]}</h1></div>
            <div className="pods3-stepper">{Array.from({ length: 5 }).map((_, index) => <i key={index} className={index <= step ? "is-active" : ""} />)}</div>
          </div>

          <section className="pods3-card pods3-create-panel">
            {step === 0 ? <div className="pods3-format-grid">{FORMAT_OPTIONS.map((option) => {
              const Icon = option.icon
              return <button type="button" key={option.value} className={cx("pods3-format-card", form.type === option.value && "is-active")} onClick={() => chooseFormat(option.value)}><span className={cx("pods3-icon-tile", option.value === "mentor_led" && "is-plum", option.value === "ongoing_community" && "is-olive", option.value === "exam_prep" && "is-rust")}><Icon /></span><strong>{option.label}</strong><p>{option.body}</p></button>
            })}</div> : null}

            {step === 1 ? <div>
              <Field label="Pod name" note={`${form.name.length}/100`}><Input maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Java fundamentals, together" /></Field>
              <Field label="What will learners be able to do?" note={`${form.shortOutcome.length}/180`}><Input maxLength={180} value={form.shortOutcome} onChange={(e) => update("shortOutcome", e.target.value)} placeholder="Build and explain a complete console application in 14 days." /></Field>
              <Field label="What is the experience like?" note={`${form.description.length}/600`}><Textarea maxLength={600} value={form.description} onChange={(e) => update("description", e.target.value)} className="min-h-28" placeholder="Describe the transformation, learning rhythm, project, and how the group helps each other." /></Field>
              <div className="pods3-field-grid">
                <Field label="Topic"><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></Field>
                <Field label="Level"><Select value={form.difficulty} onValueChange={(value) => update("difficulty", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["beginner", "intermediate", "advanced", "expert"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>
              </div>
            </div> : null}

            {step === 2 ? <div>
              <div className="pods3-source-options">
                <button className={cx("pods3-source-option", form.sourceMode === "topic" && "is-active")} onClick={() => update("sourceMode", "topic")}><Sparkles />Topic + AI</button>
                <button className={cx("pods3-source-option", form.sourceMode === "youtube" && "is-active")} onClick={() => update("sourceMode", "youtube")}><Play />YouTube</button>
                <button className={cx("pods3-source-option", form.sourceMode === "manual" && "is-active")} onClick={() => update("sourceMode", "manual")}><PenLine />Manual</button>
              </div>
              {form.sourceMode === "youtube" ? <Field label="Creator-authorized YouTube source"><Input value={form.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." /></Field> : form.sourceMode === "topic" ? <Field label="Topic or curriculum brief"><Textarea value={form.topic} onChange={(e) => update("topic", e.target.value)} className="min-h-28" placeholder="Java fundamentals: variables, control flow, methods, arrays, OOP basics..." /></Field> : <div className="mt-3 pods3-review-row"><span className="pods3-icon-tile"><PenLine /></span><div><strong>Start with a blank track</strong><p>You can build the Path manually after the Pod is created. Existing roadmap tools remain available to mentors.</p></div></div>}
              <div className="mt-3 pods3-review-row"><span className="pods3-icon-tile is-plum"><Shield /></span><div><strong>Source rights stay explicit</strong><p>For commercial creator editions, the V3 model requires an authorized source or license before publication. This screen does not imply rights you have not verified.</p></div></div>
            </div> : null}

            {step === 3 ? <div>
              <div className="pods3-field-grid">
                <Field label="Duration"><Input type="number" value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} /></Field>
                <Field label="Cohort size"><Input type="number" value={form.maxMembers} onChange={(e) => update("maxMembers", e.target.value)} /></Field>
                <Field label="Weekly live day"><Input value={form.defaultSessionDay} onChange={(e) => update("defaultSessionDay", e.target.value)} /></Field>
                <Field label="Live session time"><Input value={form.defaultSessionTime} onChange={(e) => update("defaultSessionTime", e.target.value)} /></Field>
                <Field label="Language"><Input value={form.language} onChange={(e) => update("language", e.target.value)} /></Field>
                <Field label="Timezone"><Input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} /></Field>
              </div>
              <Field label="Who is this for?"><Textarea value={form.idealLearner} onChange={(e) => update("idealLearner", e.target.value)} placeholder="Learners who know the basics and can commit 3-4 hours each week." /></Field>
              <Field label="Prerequisites"><Textarea value={form.prerequisites} onChange={(e) => update("prerequisites", e.target.value)} placeholder="Any knowledge, software, device, or setup learners need before joining." /></Field>
              <div className="pods3-field-grid">
                <Field label="Access"><Select value={form.visibility} onValueChange={(value) => update("visibility", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem><SelectItem value="invite_only">Invite only</SelectItem></SelectContent></Select></Field>
                <label className="pods3-review-row"><span className="pods3-icon-tile is-olive"><Users /></span><div><strong>Approval required</strong><p>Review new members before they enter the learning circle.</p></div><Switch checked={form.approvalRequired} onCheckedChange={(value) => update("approvalRequired", value)} /></label>
              </div>
            </div> : null}

            {step === 4 ? <div className="pods3-review-list">
              <ReviewRow icon={BookOpen} title={`${format.label} · ${form.name || "Untitled Pod"}`} body={form.shortOutcome || "Add the learning outcome before launching."} />
              <ReviewRow icon={Target} title="Learning source" body={form.sourceMode === "youtube" ? form.youtubeUrl || "YouTube source not added yet" : form.sourceMode === "manual" ? "Manual learning path" : form.topic || "Topic-guided path"} tone="plum" />
              <ReviewRow icon={CalendarDays} title={`${form.durationDays || 30} days · ${form.defaultSessionDay} at ${form.defaultSessionTime}`} body={`${form.maxMembers} learners max · ${form.language} · ${form.timezone}`} tone="olive" />
              <ReviewRow icon={Shield} title={`${form.visibility.replaceAll("_", " ")} access`} body={form.approvalRequired ? "New learners require approval." : "Learners can join according to the selected visibility rules."} tone="rust" />
              <ReviewRow icon={Sparkles} title="What happens after launch" body="Student.social creates the Pod collaboration layer. The V3 Track, mastery, creator review, and commerce services can attach without changing this learner-facing information architecture." />
            </div> : null}
          </section>

          <div className="pods3-create-actions">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
            {step < 4 ? <Button onClick={() => setStep((value) => Math.min(4, value + 1))}>Continue<ChevronRight className="ml-1.5 h-4 w-4" /></Button> : <Button disabled={saving} onClick={launch}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}Launch Pod</Button>}
          </div>
        </main>

        <aside className="pods3-card pods3-create-preview">
          <div className="pods3-preview-art" />
          <div className="pods3-create-preview-body">
            <span className="pods3-pill is-plum">{format.label}</span>
            <h3>{form.name || "Your new learning Pod"}</h3>
            <p>{form.shortOutcome || "The outcome is the first thing learners should understand."}</p>
            <div className="pods3-pod-card-meta"><span className="pods3-pill">{form.difficulty}</span><span className="pods3-pill">{form.language}</span><span className="pods3-pill">{form.maxMembers} people</span></div>
          </div>
        </aside>
      </div>
    </PodsRoot>
  )
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return <label className="pods3-field"><span>{label}{note ? <small>{note}</small> : null}</span>{children}</label>
}

function ReviewRow({ icon: Icon, title, body, tone }: { icon: any; title: string; body: string; tone?: "plum" | "olive" | "rust" }) {
  return <div className="pods3-review-row"><span className={cx("pods3-icon-tile", tone && `is-${tone}`)}><Icon /></span><div><strong>{title}</strong><p>{body}</p></div></div>
}

export function PodWorkspacePage({ podId, tab = "overview", preview = false }: { podId: string; tab?: string; preview?: boolean }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [bundle, setBundle] = useState<PodBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const data = await pod2Api.getBundle(podId)
      setBundle(data)
      setError("")
    } catch (err: any) {
      setError(err.message || "This Pod could not load.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [podId])
  usePodRealtime(bundle?.pod.$id, Boolean(user?.$id), () => load())

  if (loading) return <LoadingPage />
  if (!bundle || error) return <PodsRoot><main className="pods3-page"><EmptyState icon={Lock} title="Pod unavailable" body={error || "This Pod may be private, archived, or unavailable."} action={<Button asChild><Link href="/app/pods">Back to Pods</Link></Button>} /></main></PodsRoot>

  async function join() {
    try {
      await pod2Api.joinPod(bundle.pod.$id)
      toast({ title: bundle.pod.approvalRequired ? "Request sent" : "You are in", description: bundle.pod.approvalRequired ? "A moderator will review your request." : "Your Pod is ready." })
      await load()
      router.push(`/app/pods/${bundle.pod.$id}/overview`)
    } catch (err: any) {
      toast({ title: "Could not join", description: err.message || "Please try again.", variant: "destructive" })
    }
  }

  if (preview || tab === "preview") return <PodPreview bundle={bundle} onJoin={join} />
  if (tab === "learn") return <LessonMode bundle={bundle} />

  const activeTab = tab === "tasks" ? "roadmap" : tab === "leaderboard" ? "insights" : tab
  const role = bundle.membership?.role
  return (
    <PodsRoot className="pods3-workspace">
      <div className="pods3-workspace-page">
        <WorkspaceHeader bundle={bundle} role={role} />
        <PrimaryNavigation podId={bundle.pod.$id} activeTab={activeTab} />
        <UtilityNavigation podId={bundle.pod.$id} activeTab={activeTab} canManage={roleCanManage(role)} />
        <div className="pods3-workspace-content">
          {activeTab === "overview" ? <TodayTab bundle={bundle} reload={load} /> : null}
          {activeTab === "roadmap" ? <PathTab bundle={bundle} reload={load} /> : null}
          {activeTab === "study-room" ? <RoomTab bundle={bundle} /> : null}
          {activeTab === "chat" ? <CircleTab bundle={bundle} reload={load} /> : null}
          {activeTab === "resources" ? <LibraryTab bundle={bundle} reload={load} /> : null}
          {activeTab === "members" ? <PeopleTab bundle={bundle} /> : null}
          {activeTab === "insights" ? <ProgressTab bundle={bundle} /> : null}
          {activeTab === "settings" ? <ManageTab bundle={bundle} reload={load} /> : null}
        </div>
      </div>
      <MobilePodNavigation podId={bundle.pod.$id} activeTab={activeTab} />
    </PodsRoot>
  )
}

function WorkspaceHeader({ bundle, role }: { bundle: PodBundle; role?: string }) {
  const progress = clampProgress(bundle.membership?.progressPercent ?? bundle.pod.completionRate)
  const active = bundle.memberships.filter((member) => member.status === "active").slice(0, 5)
  return (
    <header className="pods3-workspace-head">
      <div className="pods3-workspace-head-copy">
        <div className="pods3-workspace-head-top"><Link className="pods3-back-circle" href="/app/pods" aria-label="Back to Pods"><ArrowLeft /></Link><span className="pods3-workspace-head-label">{formatLabel(bundle.pod.type)} · week {bundle.pod.currentWeek || 1}</span></div>
        <h1>{bundle.pod.name}</h1>
        <p>{bundle.pod.shortOutcome || bundle.pod.description}</p>
        <div className="pods3-workspace-head-meta"><span className="pods3-pill"><Users />{bundle.pod.memberCount || bundle.memberships.length} learners</span><span className="pods3-pill"><CircleDot />{bundle.pod.activeMemberCount || active.length} active</span><span className="pods3-pill"><CalendarDays />{formatDate(bundle.pod.nextSessionAt)}</span></div>
      </div>
      <div className="pods3-workspace-head-side">
        <div className="pods3-workspace-progress"><div className="pods3-workspace-progress-top"><span>Your learning progress</span><strong>{progress}%</strong></div><ProgressLine value={progress} /><div className="pods3-workspace-progress-foot"><div className="pods3-avatar-stack">{active.map((member) => <PersonAvatar key={member.$id} profile={member.profile} userId={member.userId} size="sm" />)}</div><span>{active.length ? `${active.length} people moving with you` : role || "member"}</span></div></div>
      </div>
    </header>
  )
}

function PrimaryNavigation({ podId, activeTab }: { podId: string; activeTab: string }) {
  return <nav className="pods3-primary-nav" aria-label="Pod learning areas">{PRIMARY_TABS.map(([value, label, Icon]) => <Link key={value} className={activeTab === value ? "is-active" : ""} href={`/app/pods/${podId}/${value}`}><Icon />{label}</Link>)}</nav>
}

function MobilePodNavigation({ podId, activeTab }: { podId: string; activeTab: string }) {
  return <nav className="pods3-mobile-nav" aria-label="Pod navigation">{PRIMARY_TABS.map(([value, label, Icon]) => <Link key={value} className={activeTab === value ? "is-active" : ""} href={`/app/pods/${podId}/${value}`}><Icon /><small>{label}</small></Link>)}</nav>
}

function UtilityNavigation({ podId, activeTab, canManage }: { podId: string; activeTab: string; canManage: boolean }) {
  const items = [
    ["resources", "Library", FolderOpen],
    ["members", "People", Users],
    ["insights", canManage ? "Mentor & progress" : "Progress", BarChart3],
    ...(canManage ? [["settings", "Manage", Settings] as const] : []),
  ] as const
  return <nav className="pods3-utility-row" aria-label="Pod utilities">{items.map(([value, label, Icon]) => <Link key={value} className={activeTab === value ? "is-active" : ""} href={`/app/pods/${podId}/${value}`}><Icon />{label}</Link>)}<Link href={`/app/calendar?pod=${podId}`}><CalendarDays />Calendar</Link></nav>
}

function TodayTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const unit = nextLearningItem(bundle)
  const task = nextTask(bundle)
  const session = bundle.sessions.find((item) => item.status === "live") || bundle.sessions.find((item) => item.status === "scheduled")
  const peers = bundle.memberships.filter((member) => member.status === "active").slice(0, 5)
  const blockers = bundle.checkins.filter((item) => item.helpNeeded || item.status === "blocked")
  return (
    <div className="pods3-layout">
      <main className="pods3-stack">
        <section className="pods3-card pods3-now-card">
          <div className="pods3-now-copy">
            <span className="pods3-eyebrow"><Sparkles className="h-3 w-3" />Continue learning</span>
            <h2>{unit?.title || task?.title || "Your next meaningful step"}</h2>
            <p>{unit?.description || task?.description || "The Pod will surface one recommended action here so you never have to interpret a dashboard before studying."}</p>
            <div className="pods3-now-meta"><span className="pods3-pill is-teal"><Clock />{unit?.estimatedMinutes || task?.estimatedMinutes || 20} min</span>{unit ? <span className="pods3-pill">{unit.type}</span> : null}{task ? <span className="pods3-pill is-plum">{task.type}</span> : null}</div>
            <div className="pods3-now-actions"><Button asChild><Link href={`/app/pods/${bundle.pod.$id}/learn`}><Play className="mr-1.5 h-4 w-4" />Continue lesson</Link></Button><Button asChild variant="outline"><Link href={`/app/pods/${bundle.pod.$id}/roadmap`}>View Path</Link></Button></div>
          </div>
        </section>

        <section className="pods3-card pods3-panel">
          <div className="pods3-panel-head"><div><h2>Today</h2><p>One calm sequence: learn, prove, connect, recover if needed.</p></div><span className="pods3-pill is-olive">{bundle.pod.currentWeek ? `Week ${bundle.pod.currentWeek}` : "Current week"}</span></div>
          <div className="pods3-today-grid mt-3">
            <ActionCard icon={BookOpen} tone="teal" title={unit?.title || "Open the learning Path"} detail={`${unit?.estimatedMinutes || 20} min · learn`} href={`/app/pods/${bundle.pod.$id}/learn`} />
            <ActionCard icon={Check} tone="plum" title={task?.title || "Complete a mastery action"} detail={task ? `${task.points || 0} pts · ${task.type}` : "Prove what you understand"} href={`/app/pods/${bundle.pod.$id}/roadmap`} />
            <ActionCard icon={Video} tone="olive" title={session?.title || "No live session scheduled"} detail={session ? formatDate(session.startsAt) : "Room stays available for co-working"} href={`/app/pods/${bundle.pod.$id}/study-room`} />
            <ActionCard icon={MessageSquare} tone="rust" title={blockers.length ? `${blockers.length} help request${blockers.length === 1 ? "" : "s"} in the Pod` : "Ask before a blocker grows"} detail="Peers, @AI, then mentor" href={`/app/pods/${bundle.pod.$id}/chat`} />
          </div>
        </section>

        <section className="pods3-card pods3-panel">
          <div className="pods3-panel-head"><div><h2>Pod pulse</h2><p>Social context that helps you learn, not activity for activity’s sake.</p></div><span className="pods3-pill"><Activity />{peers.length} active</span></div>
          <div className="pods3-pulse-list">{peers.slice(0, 4).map((member) => <div key={member.$id} className="pods3-pulse-row"><PersonAvatar profile={member.profile} userId={member.userId} size="sm" /><div><strong>{displayName(member.profile, member.userId)}</strong><small>{member.progressPercent || 0}% through the Pod · {member.currentStreak || 0} day rhythm</small></div><span className="pods3-pill">{member.role}</span></div>)}</div>
        </section>
      </main>
      <aside className="pods3-stack">
        <QuickCheckin bundle={bundle} reload={reload} />
        <section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Next room</h3><p>{session ? "Your next shared moment." : "No live session is scheduled yet."}</p></div><span className="pods3-icon-tile is-olive"><CalendarDays /></span></div>{session ? <div className="mt-3"><strong className="text-sm">{session.title}</strong><p className="mt-1 text-xs text-muted-foreground">{formatDate(session.startsAt)}</p><Button asChild className="mt-3 w-full"><Link href={`/app/pods/${bundle.pod.$id}/study-room`}>Open Room</Link></Button></div> : null}</section>
        <section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Private progress</h3><p>Your learning stays primary. Recognition is contribution-based.</p></div><span className="pods3-icon-tile is-plum"><Gauge /></span></div><div className="pods3-metric-grid mt-3" style={{ gridTemplateColumns: "1fr 1fr" }}><Metric label="Progress" value={`${bundle.membership?.progressPercent || 0}%`} /><Metric label="Streak" value={bundle.membership?.currentStreak || 0} /></div></section>
      </aside>
    </div>
  )
}

function ActionCard({ icon: Icon, tone, title, detail, href }: { icon: any; tone: string; title: string; detail: string; href: string }) {
  return <Link className="pods3-action-card" href={href}><span className={cx("pods3-icon-tile", tone !== "teal" && `is-${tone}`)}><Icon /></span><div className="min-w-0"><strong>{title}</strong><small>{detail}</small></div><ChevronRight /></Link>
}

function QuickCheckin({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [mood, setMood] = useState<"focused" | "okay" | "stuck" | "tired" | "excited">("focused")
  const [plan, setPlan] = useState("")
  const [saving, setSaving] = useState(false)
  const moods = ["focused", "okay", "stuck", "tired", "excited"] as const
  async function submit() {
    setSaving(true)
    try {
      await pod2Api.createCheckin(bundle.pod.$id, { date: new Date().toISOString().slice(0, 10), mood, status: mood === "stuck" ? "blocked" : "planned", todayPlan: plan, helpNeeded: mood === "stuck" })
      toast({ title: "Check-in saved", description: mood === "stuck" ? "Your Pod can now see that you need help." : "Your intention is set." })
      setPlan("")
      reload()
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err.message, variant: "destructive" })
    } finally { setSaving(false) }
  }
  return <section className="pods3-card pods3-panel pods3-checkin"><div className="pods3-panel-head"><div><h3>How are you entering this study block?</h3><p>A 10-second check-in gives the group useful context.</p></div><span className="pods3-icon-tile"><Activity /></span></div><div className="pods3-mood-row">{moods.map((item) => <button key={item} className={mood === item ? "is-active" : ""} onClick={() => setMood(item)}>{item}</button>)}</div><Textarea value={plan} onChange={(e) => setPlan(e.target.value)} placeholder={mood === "stuck" ? "What are you blocked on?" : "What will you finish in this block?"} /><Button disabled={saving} onClick={submit}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}{mood === "stuck" ? "Ask for help" : "Set intention"}</Button></section>
}

function PathTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [selectedWeek, setSelectedWeek] = useState(Number(bundle.pod.currentWeek || 1))
  const [task, setTask] = useState<PodTask | null>(null)
  const items = learningItems(bundle)
  const weeks = Array.from(new Set([...(bundle.roadmap.map((item) => Number(item.week || 1))), 1])).sort((a, b) => a - b)
  const visible = items.filter((item) => Number(item.week || 1) === selectedWeek)
  const recommended = nextLearningItem(bundle)
  async function generate() {
    try {
      await pod2Api.createRoadmap(bundle.pod.$id, { topic: bundle.pod.name, durationDays: Number(bundle.pod.totalWeeks || 4) * 7 })
      toast({ title: "Path updated", description: "Starter learning units were generated." })
      reload()
    } catch (err: any) { toast({ title: "Could not update Path", description: err.message, variant: "destructive" }) }
  }

  return <div>
    <div className="pods3-path-head"><div><span className="pods3-eyebrow">Course + roadmap + work</span><h2>One Path. No competing boards.</h2><p>Lessons, practice, discussions, projects, and required proof stay in one learning timeline.</p></div>{roleCanManage(bundle.membership?.role) ? <Button variant="outline" onClick={generate}><Wand2 className="mr-1.5 h-4 w-4" />Generate next units</Button> : null}</div>
    {!items.length ? <EmptyState icon={BookOpen} title="The learning Path is empty" body="Mentors can generate starter units or build the Path manually. Learners should never have to assemble the course themselves." action={roleCanManage(bundle.membership?.role) ? <Button onClick={generate}>Generate Path</Button> : undefined} /> : <div className="pods3-path-layout">
      <aside className="pods3-card pods3-module-rail">{weeks.map((week) => {
        const count = items.filter((item) => Number(item.week || 1) === week).length
        const done = items.filter((item) => Number(item.week || 1) === week && item.status === "completed").length
        return <button key={week} className={selectedWeek === week ? "is-active" : ""} onClick={() => setSelectedWeek(week)}><span>{week}</span><div className="min-w-0"><strong>Week {week}</strong><small>{done}/{count} complete</small></div></button>
      })}</aside>
      <main className="pods3-stack">
        <section className="pods3-card pods3-module-card">
          <div className="pods3-module-head"><div><span>Week {selectedWeek}</span><h3>{bundle.roadmap.find((item) => item.type === "phase" && Number(item.week || 1) === selectedWeek)?.title || `Learning block ${selectedWeek}`}</h3></div><span className="pods3-pill is-teal">{visible.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0)} min</span></div>
          {visible.map((item) => {
            const linkedTask = bundle.tasks.find((candidate) => candidate.roadmapItemId === item.$id)
            const isNext = recommended?.$id === item.$id
            const isDone = item.status === "completed"
            const isLocked = item.status === "locked"
            return <div key={item.$id} className="pods3-learning-row"><span className={cx("pods3-learning-state", isDone && "is-done", isNext && "is-next", isLocked && "is-locked")}>{isDone ? <Check /> : isLocked ? <Lock /> : item.type === "lesson" ? <Play /> : item.type === "quiz" ? <Target /> : item.type === "project" ? <MonitorUp /> : <BookOpen />}</span><div className="pods3-learning-copy"><span>{item.type} · {item.estimatedMinutes || 20} min</span><strong>{item.title}</strong><p>{item.description}</p></div><div className="pods3-learning-actions">{isNext ? <span className="pods3-pill is-plum">Next</span> : null}{linkedTask ? <Button variant="outline" size="sm" onClick={() => setTask(linkedTask)}>Work</Button> : !isLocked ? <Button asChild variant="outline" size="sm"><Link href={`/app/pods/${bundle.pod.$id}/learn`}>Open</Link></Button> : null}</div></div>
          })}
        </section>
        <section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Proof of work</h3><p>Tasks are attached to the learning Path instead of living in a separate Kanban universe.</p></div><span className="pods3-pill">{bundle.tasks.filter((item) => item.status === "completed").length}/{bundle.tasks.length} done</span></div><div className="pods3-today-grid mt-3">{bundle.tasks.filter((item) => ["today", "this_week", "submitted"].includes(item.status || "")).slice(0, 4).map((item) => <button key={item.$id} className="pods3-action-card text-left" onClick={() => setTask(item)}><span className="pods3-icon-tile is-plum"><Check /></span><div className="min-w-0"><strong>{item.title}</strong><small>{item.status} · {item.points || 0} pts</small></div><ChevronRight /></button>)}</div></section>
      </main>
    </div>}
    <TaskDialog task={task} podId={bundle.pod.$id} onClose={() => setTask(null)} onDone={reload} />
  </div>
}

function TaskDialog({ task, podId, onClose, onDone }: { task: PodTask | null; podId: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast()
  const [text, setText] = useState("")
  if (!task) return null
  async function submit() {
    try {
      await pod2Api.submitTask(podId, task.$id, { text })
      toast({ title: "Work submitted", description: "Your submission is now part of your proof of learning." })
      onDone(); onClose()
    } catch (err: any) { toast({ title: "Submission failed", description: err.message, variant: "destructive" }) }
  }
  return <Dialog open onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{task.description}</p><Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-32" placeholder="Show your work, reflection, reasoning, or relevant link." /><Button onClick={submit}>Submit proof</Button></DialogContent></Dialog>
}

function RoomTab({ bundle }: { bundle: PodBundle }) {
  const callContext = useCallContext()
  const { toast } = useToast()
  const [joining, setJoining] = useState(false)
  const [focus, setFocus] = useState(false)
  const session = bundle.sessions.find((item) => item.status === "live") || bundle.sessions.find((item) => item.status === "scheduled") || bundle.sessions[0]
  async function join(media: "voice" | "video") {
    setJoining(true)
    try {
      const room = await chatService.getOrCreatePodRoom(bundle.pod.$id, bundle.pod.name || "Pod room")
      await callContext.startCall("room", room.$id, media === "voice" ? "audio" : "video", { title: session?.title || `${bundle.pod.name} study room` })
    } catch (err: any) { toast({ title: "Could not open the room", description: err.message || "Please try again.", variant: "destructive" }) }
    finally { setJoining(false) }
  }
  return <div className="pods3-layout"><main className="pods3-card pods3-room-stage"><div className="pods3-room-stage-top"><div><span className="pods3-eyebrow">{session?.status === "live" ? "Live now" : session ? "Next shared session" : "Open study room"}</span><h2>{session?.title || `${bundle.pod.name} working room`}</h2><p>{session ? formatDate(session.startsAt) : "Open an instant room whenever the Pod is ready to work."}</p></div><div className="pods3-room-stage-actions"><Button disabled={joining} onClick={() => join("video")}>{joining ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Video className="mr-1.5 h-4 w-4" />}Join room</Button><Button variant="outline" disabled={joining} onClick={() => join("voice")}><Mic className="mr-1.5 h-4 w-4" />Audio</Button></div></div><div className="pods3-room-visual"><div className="pods3-orbit"><MonitorUp /></div><h3>Work side by side, then leave with a next step.</h3><p>{session?.agenda || "The room keeps the objective, people, notes, and follow-up work in one place instead of turning a call into a dead end."}</p><div className="pods3-room-visual-meta"><span className="pods3-pill"><Users />{bundle.pod.activeMemberCount || 0} active today</span><span className="pods3-pill"><Clock />{session ? formatDate(session.startsAt) : "Open anytime"}</span></div></div></main><aside className="pods3-stack"><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Session objective</h3><p>{session?.agenda || "Choose one outcome so everyone knows what success looks like."}</p></div><span className="pods3-icon-tile"><Target /></span></div></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Focus block</h3><p>25 minutes of shared deep work.</p></div><strong className="pods3-serif text-2xl">25:00</strong></div><Button className="mt-3 w-full" onClick={() => setFocus(!focus)}><Timer className="mr-1.5 h-4 w-4" />{focus ? "Pause focus" : "Start focus"}</Button></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Shared notes</h3><p>Capture decisions, useful links, and follow-up actions.</p></div><span className="pods3-icon-tile is-plum"><PenLine /></span></div><Textarea className="mt-3 min-h-28" placeholder="What should the Pod remember from this room?" /><Button className="mt-3 w-full" variant="outline">Save as Pod resource</Button></section></aside></div>
}

function CircleTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [channelId, setChannelId] = useState(bundle.channels[0]?.$id || "")
  const [draft, setDraft] = useState("")
  const [label, setLabel] = useState<"none" | "question" | "resource" | "blocker" | "update">("none")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const channel = bundle.channels.find((item) => item.$id === channelId) || bundle.channels[0]
  const messages = bundle.messages.filter((item) => item.channelId === channel?.$id)
  const peers = bundle.memberships.filter((item) => item.status === "active").slice(0, 7)
  async function send() {
    if (!channel || !draft.trim()) return
    try {
      await pod2Api.sendMessage(bundle.pod.$id, channel.$id, { content: draft.trim(), label })
      setDraft(""); setLabel("none"); reload()
    } catch (err: any) { toast({ title: "Message failed", description: err.message, variant: "destructive" }) }
  }
  async function upload(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData(); body.set("file", file)
      const result = await pod2Api.uploadChatAttachment(bundle.pod.$id, body)
      setDraft((current) => `${current}${current ? "\n" : ""}[${result.attachment.fileName}](${result.attachment.fileUrl})`)
      setLabel("resource")
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }
  return <section className="pods3-card pods3-circle-layout"><aside className="pods3-channel-rail"><span>Circle</span>{bundle.channels.map((item) => <button key={item.$id} className={channel?.$id === item.$id ? "is-active" : ""} onClick={() => setChannelId(item.$id)}><Hash />{item.name}</button>)}</aside><main className="pods3-circle-main"><header className="pods3-circle-head"><div><strong>#{channel?.name || "general"}</strong><small>{channel?.description || "Learning conversation around this Pod."}</small></div><Button asChild variant="outline" size="sm"><Link href={`/app/ai?pod=${bundle.pod.$id}`}><Sparkles className="mr-1 h-3.5 w-3.5" />Ask AI</Link></Button></header><div className="pods3-channel-pills">{bundle.channels.map((item) => <button key={item.$id} className={channel?.$id === item.$id ? "is-active" : ""} onClick={() => setChannelId(item.$id)}>#{item.name}</button>)}</div><div className="pods3-messages">{messages.length ? messages.map((message) => <CircleMessage key={message.$id} message={message} podId={bundle.pod.$id} reload={reload} />) : <EmptyState icon={MessageSquare} title="Start the learning conversation" body="Ask a precise question, share a resource, post progress, or turn a blocker into a help request." />}</div><div className="pods3-composer"><div className="pods3-composer-tools">{(["none", "question", "blocker", "resource", "update"] as const).map((item) => <button key={item} className={label === item ? "is-active" : ""} onClick={() => setLabel(item)}>{item === "none" ? "Message" : item}</button>)}<input ref={fileRef} type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /><button onClick={() => fileRef.current?.click()}>{uploading ? "Uploading…" : "Attach"}</button></div><div className="pods3-composer-row"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={label === "blocker" ? "What are you trying, where are you stuck, and what kind of help would unblock you?" : "Message the Pod…"} /><Button aria-label="Send" onClick={send}><Send className="h-4 w-4" /></Button></div></div></main><aside className="pods3-circle-people"><span>Learning now</span>{peers.map((member) => <div key={member.$id} className="pods3-peer-row"><PersonAvatar profile={member.profile} userId={member.userId} size="sm" /><div><strong>{displayName(member.profile, member.userId)}</strong><small>{member.progressPercent || 0}% · {member.role}</small></div></div>)}</aside></section>
}

function CircleMessage({ message, podId, reload }: { message: PodMessage; podId: string; reload: () => void }) {
  const { toast } = useToast()
  async function react(emoji: string) {
    try { await pod2Api.toggleReaction(podId, message.$id, emoji); reload() }
    catch (err: any) { toast({ title: "Reaction failed", description: err.message, variant: "destructive" }) }
  }
  return <article className="pods3-message"><PersonAvatar profile={message.senderProfile} userId={message.senderId} size="sm" /><div><div className="pods3-message-head"><strong>{message.senderName || displayName(message.senderProfile, message.senderId)}</strong><time>{formatDate(message.createdAt)}</time>{message.label && message.label !== "none" ? <span className="pods3-pill is-plum">{message.label}</span> : null}</div><p>{message.deleted ? "Message deleted" : message.content}</p><div className="pods3-message-actions"><button onClick={() => react("✓")}>✓ useful</button><button onClick={() => react("🔥")}>🔥</button></div></div></article>
}

function LibraryTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const [open, setOpen] = useState(false)
  return <div className="pods3-stack"><div className="pods3-path-head"><div><span className="pods3-eyebrow">Pod library</span><h2>Everything useful, attached to learning context.</h2><p>Notes, files, links, templates, recordings, and source material stay discoverable without crowding the main navigation.</p></div><Button onClick={() => setOpen(true)}><Upload className="mr-1.5 h-4 w-4" />Add resource</Button></div><div className="pods3-metric-grid"><Metric label="All resources" value={bundle.resources.length} /><Metric label="Files" value={bundle.resources.filter((item) => item.storageFileId).length} /><Metric label="Links" value={bundle.resources.filter((item) => item.type === "link").length} /><Metric label="Useful signals" value={bundle.resources.reduce((sum, item) => sum + Number(item.usefulCount || 0), 0)} /></div>{bundle.resources.length ? <div className="pods3-resource-grid">{bundle.resources.map((item) => <ResourceCard key={item.$id} resource={item} />)}</div> : <EmptyState icon={FolderOpen} title="The Pod library is empty" body="Add source material, notes, templates, recordings, or useful links and attach them to the learning flow." action={<Button onClick={() => setOpen(true)}>Add resource</Button>} />}<ResourceDialog open={open} onOpenChange={setOpen} podId={bundle.pod.$id} onDone={reload} /></div>
}

function ResourceCard({ resource }: { resource: PodResource }) {
  return <article className="pods3-card pods3-card-hover pods3-resource-card"><span className="pods3-icon-tile"><FileText /></span><h3>{resource.title}</h3><p>{resource.description || resource.url || resource.content}</p><div className="pods3-pod-card-meta"><span className="pods3-pill">{resource.type}</span>{resource.attachedToType && resource.attachedToType !== "none" ? <span className="pods3-pill is-teal">{resource.attachedToType}</span> : null}</div>{resource.url ? <Button asChild variant="outline" size="sm" className="mt-3"><a href={resource.url} target="_blank" rel="noreferrer"><LinkIcon className="mr-1 h-3.5 w-3.5" />Open</a></Button> : null}</article>
}

function ResourceDialog({ open, onOpenChange, podId, onDone }: { open: boolean; onOpenChange: (value: boolean) => void; podId: string; onDone: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try {
      if (file) {
        const body = new FormData(); body.set("file", file); body.set("title", title || file.name); body.set("description", description); body.set("visibility", "pod")
        await pod2Api.uploadResource(podId, body)
      } else {
        await pod2Api.createResource(podId, { title, url, description: description || url, type: "link", visibility: "pod" })
      }
      toast({ title: "Resource added" }); onDone(); onOpenChange(false); setTitle(""); setUrl(""); setDescription(""); setFile(null)
    } catch (err: any) { toast({ title: "Could not add resource", description: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add to Pod library</DialogTitle></DialogHeader><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" /><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… for a link" /><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why is this useful, and where does it fit?" /><Button disabled={saving || (!file && !url)} onClick={save}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}Save resource</Button></DialogContent></Dialog>
}

function PeopleTab({ bundle }: { bundle: PodBundle }) {
  const active = bundle.memberships.filter((item) => item.status === "active")
  const buddy = active.find((item) => item.userId !== bundle.membership?.userId)
  return <div className="pods3-stack"><div className="pods3-path-head"><div><span className="pods3-eyebrow">People, pace, support</span><h2>A small cohort should feel human.</h2><p>See who is learning now, who is at a similar pace, and where a peer connection can help.</p></div><Button variant="outline"><Plus className="mr-1.5 h-4 w-4" />Invite</Button></div>{buddy ? <section className="pods3-card pods3-now-card"><div className="pods3-now-copy"><span className="pods3-eyebrow"><Users className="h-3 w-3" />Suggested peer touchpoint</span><h2>Check in with {displayName(buddy.profile, buddy.userId)}.</h2><p>You are in the same learning circle. A low-pressure check-in is often more useful than another streak mechanic.</p><div className="pods3-now-actions"><Button asChild><Link href={`/app/pods/${bundle.pod.$id}/chat`}>Open Circle</Link></Button><Button asChild variant="outline"><Link href={`/app/profile/${buddy.profile?.username || buddy.userId}`}>View profile</Link></Button></div></div></section> : null}<div className="pods3-metric-grid"><Metric label="Learners" value={bundle.memberships.length} /><Metric label="Active" value={active.length} /><Metric label="Mentors" value={bundle.memberships.filter((item) => ["owner", "mentor"].includes(item.role)).length} /><Metric label="Average progress" value={`${Math.round(bundle.memberships.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / Math.max(1, bundle.memberships.length))}%`} /></div><div className="pods3-people-grid">{bundle.memberships.map((member) => <article key={member.$id} className="pods3-card pods3-card-hover pods3-person-card"><div className="pods3-person-head"><PersonAvatar profile={member.profile} userId={member.userId} size="lg" /><div><h3>{displayName(member.profile, member.userId)}</h3><small>{member.profile?.username ? `@${member.profile.username}` : member.role} · {member.status}</small></div></div><p>{member.progressPercent || 0}% through the Pod · {member.currentStreak || 0} day learning rhythm · {member.peerReviewsCompleted || 0} peer reviews</p><div className="pods3-pod-card-meta"><span className="pods3-pill">{member.role}</span>{member.currentStreak ? <span className="pods3-pill is-olive"><Flame />{member.currentStreak}</span> : null}</div><Button asChild size="sm" variant="outline" className="mt-3"><Link href={`/app/profile/${member.profile?.username || member.userId}`}>Profile</Link></Button></article>)}</div></div>
}

function ProgressTab({ bundle }: { bundle: PodBundle }) {
  const canManage = roleCanManage(bundle.membership?.role)
  const blockers = bundle.checkins.filter((item) => item.helpNeeded || item.status === "blocked")
  const pending = bundle.tasks.filter((item) => ["submitted", "reviewed"].includes(item.status || ""))
  const quiet = bundle.memberships.filter((member) => {
    const last = validDate(member.lastActiveAt)?.getTime() || Date.now()
    return member.status === "active" && Date.now() - last > 7 * 24 * 60 * 60 * 1000
  })
  const recognitions = [
    { title: "Consistency", body: `${bundle.membership?.currentStreak || 0} day learning rhythm`, icon: Flame, tone: "olive" },
    { title: "Peer contribution", body: `${bundle.membership?.peerReviewsCompleted || 0} peer reviews completed`, icon: Users, tone: "teal" },
    { title: "Proof of work", body: `${bundle.membership?.tasksCompleted || 0} learning tasks completed`, icon: Trophy, tone: "plum" },
    { title: "Room reliability", body: `${bundle.membership?.sessionsAttended || 0} shared sessions attended`, icon: Video, tone: "rust" },
  ]
  return <div className="pods3-stack"><div className="pods3-path-head"><div><span className="pods3-eyebrow">Private progress first</span><h2>{canManage ? "Mentor queue + cohort health" : "See growth without turning learning into a race."}</h2><p>{canManage ? "Every insight should lead to a real intervention, not another chart." : "Progress, contribution, proof of work, and recovery matter more than a single competitive leaderboard."}</p></div></div><div className="pods3-metric-grid"><Metric label="Your progress" value={`${bundle.membership?.progressPercent || 0}%`} /><Metric label="Tasks completed" value={bundle.membership?.tasksCompleted || 0} /><Metric label="Sessions" value={bundle.membership?.sessionsAttended || 0} /><Metric label="Pod health" value={bundle.pod.healthScore || "—"} /></div><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Contribution recognition</h3><p>Multiple healthy signals replace a single public leaderboard.</p></div><span className="pods3-icon-tile is-plum"><Trophy /></span></div><div className="pods3-recognition-grid mt-3">{recognitions.map((item) => <article key={item.title} className="pods3-card pods3-recognition-card"><span className={cx("pods3-icon-tile", item.tone !== "teal" && `is-${item.tone}`)}><item.icon /></span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>{canManage ? <section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Mentor work queue</h3><p>Prioritize blockers, reviews, and people drifting behind their own plan.</p></div><span className="pods3-pill is-rust">{blockers.length + pending.length + quiet.length} actions</span></div><div className="pods3-mentor-queue"><QueueRow icon={MessageSquare} title={`${blockers.length} unresolved blocker${blockers.length === 1 ? "" : "s"}`} detail="Route to peers, @AI, or schedule a doubt room." /><QueueRow icon={Check} title={`${pending.length} submission${pending.length === 1 ? "" : "s"} in review state`} detail="Review evidence and return actionable feedback." /><QueueRow icon={Activity} title={`${quiet.length} learner${quiet.length === 1 ? "" : "s"} inactive for 7+ days`} detail="Use context before intervening. Silence alone is not failure." /></div></section> : null}</div>
}

function QueueRow({ icon: Icon, title, detail }: { icon: any; title: string; detail: string }) {
  return <div className="pods3-queue-row"><span className="pods3-icon-tile"><Icon /></span><div><strong>{title}</strong><small>{detail}</small></div><Button variant="outline" size="sm">Review</Button></div>
}

function ManageTab({ bundle, reload }: { bundle: PodBundle; reload: () => void }) {
  const { toast } = useToast()
  const [name, setName] = useState(bundle.pod.name)
  const [outcome, setOutcome] = useState(bundle.pod.shortOutcome || "")
  if (!roleCanManage(bundle.membership?.role)) return <EmptyState icon={Lock} title="Pod management is restricted" body="Owners, mentors, and moderators can manage this learning space." />
  async function save() {
    try { await pod2Api.updatePod(bundle.pod.$id, { name, shortOutcome: outcome }); toast({ title: "Pod updated" }); reload() }
    catch (err: any) { toast({ title: "Update failed", description: err.message, variant: "destructive" }) }
  }
  return <div className="pods3-layout"><main className="pods3-stack"><div className="pods3-path-head"><div><span className="pods3-eyebrow">Pod management</span><h2>Manage the experience, not a maze of settings.</h2><p>Identity, learning rhythm, safety, and operational controls stay grouped by intent.</p></div></div><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Identity and outcome</h3><p>The first promise learners see.</p></div><span className="pods3-icon-tile"><PenLine /></span></div><div className="mt-3"><Field label="Pod name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Learning outcome"><Input value={outcome} onChange={(e) => setOutcome(e.target.value)} /></Field><Button className="mt-3" onClick={save}>Save changes</Button></div></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Safety and access</h3><p>Membership and moderation controls should remain explicit and server-validated.</p></div><span className="pods3-icon-tile is-rust"><Shield /></span></div><div className="pods3-review-list mt-3"><ReviewRow icon={Users} title={`${bundle.pod.visibility || "public"} visibility`} body={`${bundle.pod.approvalRequired ? "Approval is required" : "No approval is currently required"} for eligible joins.`} /><ReviewRow icon={Lock} title="Role-gated management" body="Owner, mentor, and moderator actions still rely on the existing server-side permission model." tone="plum" /></div></section></main><aside className="pods3-stack"><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Learning notifications</h3><p>Keep reminders useful and respect quiet hours.</p></div><span className="pods3-icon-tile is-olive"><Bell /></span></div><div className="mt-3 grid gap-3 text-xs">{["Session reminders", "Help responses", "Review requests", "Weekly learning digest"].map((item) => <label key={item} className="flex items-center justify-between gap-4"><span>{item}</span><Switch /></label>)}</div><p className="mt-3 text-[11px] text-muted-foreground">These controls are visual until Pod-level notification preference persistence is wired to the V3 notification service.</p></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Archive</h3><p>High-impact actions should use confirmation and audit logs.</p></div><span className="pods3-icon-tile is-rust"><Lock /></span></div><Button className="mt-3" variant="outline">Archive Pod</Button></section></aside></div>
}

function PodPreview({ bundle, onJoin }: { bundle: PodBundle; onJoin: () => void }) {
  const pod = bundle.pod
  const items = learningItems(bundle).slice(0, 8)
  const sessions = bundle.sessions.filter((item) => item.status !== "cancelled").slice(0, 3)
  return <PodsRoot><main className="pods3-page"><section className="pods3-preview-hero"><div className="pods3-preview-hero-copy"><Link className="pods3-back-circle" href="/app/pods"><ArrowLeft /></Link><span className="pods3-eyebrow mt-4">{formatLabel(pod.type)} · {pod.category || "Learning"}</span><h1>{pod.shortOutcome || pod.name}</h1><p>{pod.description || "A small group follows one shared learning outcome, meets on a clear rhythm, helps one another through blockers, and finishes with evidence of learning."}</p><div className="pods3-workspace-head-meta"><span className="pods3-pill">{pod.difficulty || "beginner"}</span><span className="pods3-pill">{pod.language || "English"}</span><span className="pods3-pill"><Users />{pod.memberCount || bundle.memberships.length}/{pod.maxMembers || 8}</span><span className="pods3-pill"><Clock />{pod.totalWeeks || 4} weeks</span></div></div><aside className="pods3-preview-join"><strong>Learn this with people, not beside them.</strong><p>{pod.approvalRequired ? "Your join request will be reviewed before access is granted." : "Preview the path and social rhythm, then join when the commitment fits."}</p><Button onClick={onJoin}>{pod.approvalRequired ? "Request access" : "Join Pod"}</Button></aside></section><div className="pods3-preview-sections"><main className="pods3-stack"><section className="pods3-card pods3-proof-card"><span className="pods3-eyebrow">Outcome + proof</span><h2>Finish with evidence that you can use the skill.</h2><p>{pod.shortOutcome || "Completion should be tied to meaningful work, mastery checks, projects, peer review, and reflection rather than passive playback."}</p></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Learning Path</h3><p>You can inspect what is ahead even when credential progress is gated.</p></div><span className="pods3-pill is-teal">{bundle.roadmap.length} items</span></div>{items.length ? <div className="mt-3">{items.map((item, index) => <div className="pods3-learning-row" key={item.$id}><span className={cx("pods3-learning-state", index === 0 && "is-next")}><span>{index + 1}</span></span><div className="pods3-learning-copy"><span>{item.type} · week {item.week || 1}</span><strong>{item.title}</strong><p>{item.description}</p></div><span className="pods3-pill">{item.estimatedMinutes || 20} min</span></div>)}</div> : <EmptyState icon={BookOpen} title="Curriculum preview is being prepared" body="The creator has not published learning units to this Pod yet." />}</section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>The social rhythm</h3><p>Know how the group learns together before committing.</p></div><span className="pods3-icon-tile is-olive"><Users /></span></div><div className="pods3-rhythm"><div className="pods3-rhythm-row"><span>Plan</span><p>Set a weekly commitment and know what to do today.</p></div><div className="pods3-rhythm-row"><span>Learn</span><p>Move through source material, practice, and mastery work asynchronously.</p></div><div className="pods3-rhythm-row"><span>Unblock</span><p>Ask peers and grounded AI first, with mentor escalation when needed.</p></div><div className="pods3-rhythm-row"><span>Review</span><p>Use live rooms, peer feedback, projects, and reflection to prove understanding.</p></div></div></section></main><aside className="pods3-stack"><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Upcoming rhythm</h3><p>Live moments should be visible before joining.</p></div><span className="pods3-icon-tile"><CalendarDays /></span></div>{sessions.length ? <div className="pods3-pulse-list">{sessions.map((item) => <div key={item.$id} className="pods3-pulse-row"><span className="pods3-icon-tile is-plum"><Video /></span><div><strong>{item.title}</strong><small>{formatDate(item.startsAt)}</small></div></div>)}</div> : <p className="mt-3 text-xs text-muted-foreground">No live sessions have been published yet.</p>}</section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>People</h3><p>Small enough to know who you are learning with.</p></div><span className="pods3-icon-tile is-plum"><Users /></span></div><div className="pods3-avatar-stack mt-3">{bundle.memberships.slice(0, 7).map((member) => <PersonAvatar key={member.$id} profile={member.profile} userId={member.userId} />)}</div><p className="mt-3 text-xs text-muted-foreground">{bundle.memberships.length} current members · recommended small-cohort experience for course runs.</p></section><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Requirements</h3><p>Clarity before commitment.</p></div><span className="pods3-icon-tile is-rust"><Info /></span></div><div className="pods3-review-list mt-3"><ReviewRow icon={BookOpen} title={pod.language || "English"} body={`${pod.difficulty || "beginner"} level · ${trackLabel(pod)}`} /><ReviewRow icon={Clock} title={`${pod.totalWeeks || 4} week structure`} body={`Timezone: ${pod.timezone || "shown in your local time"}.`} tone="olive" /></div></section></aside></div></main></PodsRoot>
}

function LessonMode({ bundle }: { bundle: PodBundle }) {
  const [context, setContext] = useState<ContextTab>("notes")
  const items = learningItems(bundle)
  const current = nextLearningItem(bundle) || items[0]
  const currentIndex = Math.max(0, items.findIndex((item) => item.$id === current?.$id))
  const relatedTask = bundle.tasks.find((item) => item.roadmapItemId === current?.$id) || nextTask(bundle)
  const sourceUrl = typeof bundle.pod.youtubeUrl === "string" ? bundle.pod.youtubeUrl : ""
  return <PodsRoot className="pods3-focus-mode"><header className="pods3-focus-top"><Link href={`/app/pods/${bundle.pod.$id}/roadmap`} aria-label="Back to Path"><ArrowLeft /></Link><div className="pods3-focus-title"><strong>{current?.title || "Focused lesson"}</strong><small>{bundle.pod.name} · {currentIndex + 1}/{Math.max(1, items.length)}</small></div><Button asChild variant="outline" size="sm"><Link href={`/app/pods/${bundle.pod.$id}/chat`}>Circle</Link></Button></header><div className="pods3-focus-shell"><aside className="pods3-focus-rail"><span>Path</span>{items.slice(0, 20).map((item, index) => <Link key={item.$id} className={item.$id === current?.$id ? "is-active" : ""} href={`/app/pods/${bundle.pod.$id}/learn`}><i>{index + 1}</i><div><strong>{item.title}</strong><small>{item.type} · {item.estimatedMinutes || 20} min</small></div></Link>)}</aside><main className="pods3-focus-main"><section className="pods3-media-stage"><div className="pods3-media-play"><span><Play /></span><strong>{current?.title || "Source lesson"}</strong><small>{sourceUrl ? "Creator/source media attached to this Pod" : "Focused source stage · media integration follows the active Track source"}</small>{sourceUrl ? <Button asChild variant="outline"><a href={sourceUrl} target="_blank" rel="noreferrer">Open source</a></Button> : null}</div></section><div className="pods3-lesson-copy"><span className="pods3-eyebrow">{current?.type || "lesson"} · week {current?.week || bundle.pod.currentWeek || 1}</span><h1>{current?.title || "Continue learning"}</h1><p>{current?.description || "This focused mode keeps the source, objective, discussion, AI help, resources, and next proof action together. Watching alone never marks mastery."}</p><div className="pods3-pod-card-meta"><span className="pods3-pill is-teal"><Clock />{current?.estimatedMinutes || 20} min</span><span className="pods3-pill">{current?.status || "available"}</span>{relatedTask ? <span className="pods3-pill is-plum">Proof required</span> : null}</div></div></main><aside className="pods3-focus-context"><div className="pods3-context-tabs">{(["notes", "discuss", "ai", "resources"] as ContextTab[]).map((item) => <button key={item} className={context === item ? "is-active" : ""} onClick={() => setContext(item)}>{item === "ai" ? "Ask AI" : item}</button>)}</div><div className="pods3-context-body">{context === "notes" ? <><h3>Lesson notes</h3><p>{current?.description || "Notes generated from an approved Track source appear here with evidence links and timestamps."}</p><div className="pods3-note"><strong>Learning objective</strong><p>Explain the concept in your own words, apply it once, then use the mastery or project action to prove understanding.</p></div></> : null}{context === "discuss" ? <><h3>Discuss in context</h3><p>Lesson-level conversation belongs in the same Pod Circle, anchored to the exact unit or source timestamp.</p><Button asChild className="mt-3"><Link href={`/app/pods/${bundle.pod.$id}/chat`}>Open discussion</Link></Button></> : null}{context === "ai" ? <><h3>Course-grounded AI</h3><p>Ask for a simpler explanation, another example, a quiz, or help turning a blocker into a precise Pod question. Graded work should remain yours.</p><Button asChild className="mt-3"><Link href={`/app/ai?pod=${bundle.pod.$id}`}>Ask @AI</Link></Button></> : null}{context === "resources" ? <><h3>Attached resources</h3><p>{bundle.resources.length ? `${bundle.resources.length} Pod resources are available. The Track model can narrow this list to assets attached to the current learning unit.` : "No resources are attached yet."}</p><Button asChild variant="outline" className="mt-3"><Link href={`/app/pods/${bundle.pod.$id}/resources`}>Open Library</Link></Button></> : null}</div></aside></div><footer className="pods3-focus-action"><div><div><span>Next meaningful action</span><strong>{relatedTask?.title || "Return to the Path"}</strong></div><Button asChild><Link href={`/app/pods/${bundle.pod.$id}/roadmap`}>{relatedTask ? "Prove understanding" : "Continue Path"}<ChevronRight className="ml-1 h-4 w-4" /></Link></Button></div></footer></PodsRoot>
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
    pod2Api.getInvite(inviteCode).then((data) => { if (!cancelled) { setInvite(data.invite); setPod(data.pod) } }).catch((err) => { if (!cancelled) setError(err.message || "Invite could not be loaded.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [inviteCode])
  async function accept() {
    setAccepting(true)
    try { const result = await pod2Api.acceptInvite(inviteCode); toast({ title: "Welcome to the Pod", description: `You joined ${result.pod.name}.` }); router.push(`/app/pods/${result.pod.$id}/overview`) }
    catch (err: any) { toast({ title: "Could not accept invite", description: err.message, variant: "destructive" }) }
    finally { setAccepting(false) }
  }
  return <PodsRoot><main className="pods3-page">{loading ? <div className="pods3-shimmer h-72" /> : error || !pod ? <EmptyState icon={Lock} title="Invite unavailable" body={error || "This invite is invalid, expired, or already used."} action={<Button asChild><Link href="/app/pods">Open Pods</Link></Button>} /> : <section className="pods3-preview-hero"><div className="pods3-preview-hero-copy"><span className="pods3-eyebrow">You were invited to learn together</span><h1>{pod.name}</h1><p>{pod.shortOutcome}</p><div className="pods3-workspace-head-meta"><span className="pods3-pill">{invite?.role || "member"}</span><span className="pods3-pill">{pod.difficulty || "beginner"}</span><span className="pods3-pill"><Users />{pod.memberCount || 0}</span></div></div><aside className="pods3-preview-join"><strong>Your place in the circle is ready.</strong><p>Accept the invite to open Today, Path, Room, and Circle.</p><Button disabled={accepting} onClick={accept}>{accepting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}Accept invite</Button><Button asChild variant="outline"><Link href={`/app/pods/${pod.$id}/preview`}>Preview first</Link></Button></aside></section>}</main></PodsRoot>
}
