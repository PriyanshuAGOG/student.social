"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  ExternalLink,
  FileQuestion,
  Layers3,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Target,
  Trophy,
  Wand2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  allCourseChapters,
  emptyLearnerProgress,
  formatSeconds,
  parseCourseManifest,
  type CourseChapter,
  type LearnerCourseProgress,
} from "@/lib/courses/pod-course"
import type { PodBundle } from "@/lib/pods/types"

type LessonMaterial = {
  summary: string
  detailedNotes: Array<{ heading: string; body: string; timestampSeconds?: number }>
  keyTakeaways: string[]
  glossary: Array<{ term: string; definition: string }>
  practicePrompt: string
  questions: Array<{ id: string; question: string; options: string[] }>
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function youtubeEmbedUrl(chapter: CourseChapter) {
  if (!chapter.sourceVideoId) return ""
  const start = Math.max(0, Math.round(chapter.startSeconds || 0))
  const end = Math.max(start, Math.round(chapter.endSeconds || 0))
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", start: String(start) })
  if (end > start) params.set("end", String(end))
  return `https://www.youtube-nocookie.com/embed/${chapter.sourceVideoId}?${params.toString()}`
}

export function CourseJourney({ bundle }: { bundle: PodBundle }) {
  const { toast } = useToast()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [title, setTitle] = useState(bundle.pod.name || "")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [moduleTarget, setModuleTarget] = useState(8)
  const [estimatedHours, setEstimatedHours] = useState(10)
  const [targetWeeks, setTargetWeeks] = useState(8)
  const [passingScore, setPassingScore] = useState(75)
  const [progress, setProgress] = useState<LearnerCourseProgress & { completionPercentage?: number }>(emptyLearnerProgress())
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [view, setView] = useState<"lesson" | "notes" | "mastery">("lesson")
  const [material, setMaterial] = useState<LessonMaterial | null>(null)
  const [materialLoading, setMaterialLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [attemptResult, setAttemptResult] = useState<any>(null)

  const manifest = useMemo(() => course ? parseCourseManifest(course.chapters, course.courseTitle, course.$id) : null, [course])
  const chapters = useMemo(() => manifest ? allCourseChapters(manifest) : [], [manifest])
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) || null
  const selectedUnlocked = selectedChapter ? unlockedIds.has(selectedChapter.id) : false

  async function loadCourse() {
    try {
      const response = await fetch(`/api/pods/get-course?podId=${encodeURIComponent(bundle.pod.$id)}`, { credentials: "include", cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not load the course")
      setCourse(payload?.course || null)
    } catch (error: any) {
      toast({ title: "Course unavailable", description: error?.message || "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function loadProgress(courseId: string) {
    try {
      const response = await fetch(`/api/pods/course-learning?podId=${encodeURIComponent(bundle.pod.$id)}&courseId=${encodeURIComponent(courseId)}`, { credentials: "include", cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not load progress")
      setProgress(payload.progress || emptyLearnerProgress())
      const nextUnlocked = new Set<string>((payload.unlockedChapterIds || []).map(String))
      setUnlockedIds(nextUnlocked)
      setSelectedChapterId((current) => current || payload.progress?.currentChapterId || payload.unlockedChapterIds?.at(-1) || null)
    } catch (error: any) {
      toast({ title: "Progress needs attention", description: error?.message || "Please retry.", variant: "destructive" })
    }
  }

  useEffect(() => { void loadCourse() }, [bundle.pod.$id])
  useEffect(() => {
    if (!course?.$id) return
    void loadProgress(course.$id)
  }, [course?.$id])
  useEffect(() => {
    if (!selectedChapter || !selectedUnlocked) {
      setMaterial(null)
      return
    }
    let cancelled = false
    setMaterialLoading(true)
    setMaterial(null)
    setAnswers({})
    setAttemptResult(null)
    fetch("/api/pods/course-material", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podId: bundle.pod.$id, courseId: course.$id, chapterId: selectedChapter.id }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not prepare lesson material")
      if (!cancelled) setMaterial(payload.material)
    }).catch((error) => {
      if (!cancelled) toast({ title: "Lesson material unavailable", description: error.message, variant: "destructive" })
    }).finally(() => { if (!cancelled) setMaterialLoading(false) })
    return () => { cancelled = true }
  }, [selectedChapter?.id, selectedUnlocked, course?.$id, bundle.pod.$id])

  async function createCourse() {
    if (title.trim().length < 3 || !/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl.trim())) {
      toast({ title: "Add a course title and YouTube link", description: "A video or playlist link works.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const response = await fetch("/api/pods/generate-course-streaming", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podId: bundle.pod.$id,
          youtubeUrl: youtubeUrl.trim(),
          courseTitle: title.trim(),
          settings: { moduleTarget, estimatedHours, targetWeeks, passingScore, sessionsPerWeek: 4, minutesPerSession: 45, difficulty: "adaptive", unlockPolicy: "mastery" },
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not structure this course")
      setCourse(payload.course)
      toast({ title: "Learning track ready", description: `${payload.source?.itemCount || 1} source item${payload.source?.itemCount === 1 ? "" : "s"} mapped into a mastery journey.` })
    } catch (error: any) {
      toast({ title: "Course creation failed", description: error?.message || "Please retry.", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  function chooseChapter(chapter: CourseChapter) {
    if (!unlockedIds.has(chapter.id)) {
      toast({ title: "Lesson locked", description: "Pass the previous lesson’s mastery check to continue." })
      return
    }
    setSelectedChapterId(chapter.id)
    setView("lesson")
  }

  async function submitQuiz() {
    if (!selectedChapter || !material) return
    if (Object.keys(answers).length !== material.questions.length) {
      toast({ title: "Finish every question", description: "Your mastery result needs a complete attempt." })
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch("/api/pods/course-learning", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podId: bundle.pod.$id, courseId: course.$id, chapterId: selectedChapter.id, answers, timeSpentMinutes: selectedChapter.estimatedMinutes }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not grade this check")
      setAttemptResult(payload)
      setProgress(payload.progress)
      setUnlockedIds(new Set((payload.unlockedChapterIds || []).map(String)))
      toast({
        title: payload.passed ? "Lesson mastered" : "Recovery path ready",
        description: payload.passed ? `You scored ${payload.score}%. The next lesson is unlocked.` : `You scored ${payload.score}%. Review the explanations and try again.`,
      })
    } catch (error: any) {
      toast({ title: "Mastery check unavailable", description: error?.message || "Your answers are still on screen.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="grid min-h-52 place-items-center rounded-[24px] border border-white/10 bg-[#101112]"><div className="flex items-center gap-2 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin" />Opening learning studio…</div></section>
  }

  if (!course) {
    return (
      <section className="overflow-hidden rounded-[26px] border border-white/12 bg-[radial-gradient(circle_at_15%_0%,rgba(88,101,242,.22),transparent_36%),radial-gradient(circle_at_100%_100%,rgba(114,229,207,.12),transparent_38%),#0d0f12]">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1fr_420px] lg:p-9">
          <div className="flex flex-col justify-between">
            <div>
              <Badge className="border-0 bg-[#72e5cf] text-[#07134f] hover:bg-[#72e5cf]">Course Studio · free</Badge>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Turn hours of video into a course people actually finish.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">Paste one video or a full playlist. Student.social maps it into modules, timestamped lessons, notes, practice, and mastery checks—then your Pod learns through it together.</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ icon: Layers3, label: "6–10 modules" }, { icon: Clock3, label: "Adaptive pace" }, { icon: FileQuestion, label: "Quiz gates" }, { icon: MessageCircle, label: "Pod support" }].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/65"><Icon className="mb-2 h-4 w-4 text-[#72e5cf]" />{label}</div>)}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/12 bg-black/30 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between"><div><div className="text-sm font-semibold">Build the track</div><div className="mt-1 text-xs text-white/42">Ready in one focused pass</div></div><Wand2 className="h-5 w-5 text-[#72e5cf]" /></div>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-white/55">Course name<Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-11 rounded-xl border-white/12 bg-white/[0.06] text-white" placeholder="Java from foundations to projects" /></label>
              <label className="block text-xs font-medium text-white/55">YouTube video or playlist<Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} className="mt-1.5 h-11 rounded-xl border-white/12 bg-white/[0.06] text-white" placeholder="https://youtube.com/playlist?list=…" /></label>
              <button type="button" onClick={() => setShowSettings((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs text-white/60"><span className="flex items-center gap-2"><Settings2 className="h-4 w-4" />Learning setup</span><ChevronDown className={cn("h-4 w-4 transition", showSettings && "rotate-180")} /></button>
              {showSettings ? <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/[0.04] p-3">
                <NumberField label="Modules" value={moduleTarget} min={3} max={10} onChange={setModuleTarget} />
                <NumberField label="Approx. hours" value={estimatedHours} min={1} max={200} onChange={setEstimatedHours} />
                <NumberField label="Target weeks" value={targetWeeks} min={1} max={52} onChange={setTargetWeeks} />
                <NumberField label="Pass score %" value={passingScore} min={50} max={100} onChange={setPassingScore} />
              </div> : null}
              <Button onClick={createCourse} disabled={creating} className="h-12 w-full rounded-xl bg-[#72e5cf] font-semibold text-[#07134f] hover:bg-[#8aebd8]">{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{creating ? "Mapping the curriculum…" : "Create mastery track"}</Button>
              <p className="text-center text-[11px] leading-5 text-white/35">Open YouTube playback stays available. Mastery gates apply to Student.social learning activities—not access to the source video.</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!manifest) return null
  const completion = Number(progress.completionPercentage || 0)
  const currentIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === selectedChapter?.id))
  const nextChapter = chapters[currentIndex + 1]

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/12 bg-[#0a0b0d] shadow-[0_32px_80px_rgba(0,0,0,.3)]">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(88,101,242,.2),transparent_38%),#101114] p-5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><Badge className="bg-[#72e5cf] text-[#07134f] hover:bg-[#72e5cf]">Mastery track</Badge><Badge variant="outline" className="border-white/15 text-white/65">{manifest.sourceType === "playlist" ? "Playlist" : "Video course"}</Badge></div>
            <h2 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{course.courseTitle}</h2>
            <p className="mt-2 text-sm text-white/48">{manifest.modules.length} modules · {chapters.length} lessons · {formatMinutes(manifest.totalMinutes)} · {manifest.settings.targetWeeks}-week plan</p>
          </div>
          <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 xl:w-[360px]">
            <div><div className="mb-2 flex justify-between text-[11px] text-white/45"><span>Your progress</span><span>{completion}%</span></div><Progress value={completion} className="h-2 bg-white/10 [&>div]:bg-[#72e5cf]" /></div>
            <div className="grid h-12 w-12 place-items-center rounded-full border border-[#72e5cf]/30 bg-[#72e5cf]/10 text-sm font-semibold text-[#72e5cf]">{completion}%</div>
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0d0e10] p-3 xl:max-h-[850px] xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between px-2 py-2"><span className="text-xs font-semibold uppercase tracking-[.16em] text-white/38">Course map</span><span className="text-xs text-white/35">{progress.completedChapterIds.length}/{chapters.length}</span></div>
          <div className="space-y-2">
            {manifest.modules.map((module) => {
              const completedInModule = module.chapters.filter((chapter) => progress.completedChapterIds.includes(chapter.id)).length
              return <details key={module.id} open={module.chapters.some((chapter) => chapter.id === selectedChapter?.id) || module.order === 1} className="group rounded-2xl border border-white/8 bg-white/[0.025] open:bg-white/[0.04]">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72e5cf]">
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-semibold", completedInModule === module.chapters.length ? "bg-[#72e5cf] text-[#07134f]" : "bg-white/8 text-white/65")}>{completedInModule === module.chapters.length ? <Check className="h-4 w-4" /> : module.order}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{module.title}</span><span className="mt-0.5 block text-[11px] text-white/38">{completedInModule}/{module.chapters.length} · {formatMinutes(module.estimatedMinutes)}</span></span>
                  <ChevronDown className="h-4 w-4 text-white/35 transition group-open:rotate-180" />
                </summary>
                <div className="space-y-1 px-2 pb-2">
                  {module.chapters.map((chapter) => {
                    const isCompleted = progress.completedChapterIds.includes(chapter.id)
                    const isUnlocked = unlockedIds.has(chapter.id)
                    const isSelected = selectedChapter?.id === chapter.id
                    return <button type="button" key={chapter.id} onClick={() => chooseChapter(chapter)} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72e5cf]", isSelected ? "bg-[#5865f2] text-white" : "hover:bg-white/[0.06]", !isUnlocked && "opacity-45")}>
                      <span className="mt-0.5 shrink-0">{isCompleted ? <CheckCircle2 className="h-4 w-4 text-[#72e5cf]" /> : isUnlocked ? <Circle className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}</span>
                      <span className="min-w-0"><span className="line-clamp-2 block text-xs font-medium leading-5">{chapter.title}</span><span className={cn("mt-1 block text-[10px]", isSelected ? "text-white/65" : "text-white/32")}>{formatMinutes(chapter.estimatedMinutes)} · {isCompleted ? `${progress.quizScores[chapter.id]}%` : isUnlocked ? "Ready" : "Locked"}</span></span>
                    </button>
                  })}
                </div>
              </details>
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {!selectedChapter ? <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><BookOpen className="mx-auto h-9 w-9 text-[#72e5cf]" /><h3 className="mt-4 text-xl font-semibold">Choose your first lesson</h3><p className="mt-2 text-sm text-white/50">The course map keeps the next useful step visible.</p></div></div> : (
            <>
              <div className="border-b border-white/10 p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><div className="text-xs uppercase tracking-[.15em] text-[#72e5cf]">Lesson {selectedChapter.order} of {chapters.length}</div><h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{selectedChapter.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">{selectedChapter.description}</p></div>
                  <div className="flex shrink-0 gap-2"><Button asChild size="sm" variant="outline" className="rounded-xl border-white/12 bg-transparent text-white"><Link href={`/app/pods/${bundle.pod.$id}/chat?lesson=${encodeURIComponent(selectedChapter.id)}`}><MessageCircle className="mr-2 h-4 w-4" />Discuss</Link></Button>{selectedChapter.sourceUrl ? <Button asChild size="sm" variant="outline" className="rounded-xl border-white/12 bg-transparent text-white"><a href={selectedChapter.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Source</a></Button> : null}</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">{selectedChapter.objectives.map((objective) => <span key={objective} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/55">{objective}</span>)}</div>
              </div>

              <div className="border-b border-white/10 p-3 sm:px-6"><div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1 sm:w-fit sm:min-w-[420px]">{([['lesson', Play, 'Learn'], ['notes', BookOpen, 'Notes'], ['mastery', Target, 'Mastery']] as const).map(([key, Icon, label]) => <button key={key} type="button" onClick={() => setView(key)} className={cn("flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition", view === key ? "bg-white text-black" : "text-white/50 hover:text-white")}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div></div>

              <div className="p-4 sm:p-6">
                {materialLoading ? <div className="grid min-h-[430px] place-items-center rounded-2xl border border-white/8 bg-white/[0.025]"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#72e5cf]" /><div className="mt-3 text-sm font-medium">Preparing this lesson</div><div className="mt-1 text-xs text-white/40">Grounding notes and questions in the source</div></div></div> : null}
                {!materialLoading && material && view === "lesson" ? <LessonView chapter={selectedChapter} material={material} /> : null}
                {!materialLoading && material && view === "notes" ? <NotesView material={material} onJump={(seconds) => { if (selectedChapter.sourceUrl) window.open(`${selectedChapter.sourceUrl}${selectedChapter.sourceUrl.includes("?") ? "&" : "?"}t=${Math.round(seconds)}s`, "_blank", "noopener,noreferrer") }} /> : null}
                {!materialLoading && material && view === "mastery" ? <MasteryView material={material} answers={answers} setAnswers={setAnswers} result={attemptResult} passingScore={manifest.settings.passingScore} submitting={submitting} onRetry={() => { setAnswers({}); setAttemptResult(null) }} onSubmit={submitQuiz} /> : null}
              </div>

              {attemptResult?.passed && nextChapter ? <div className="border-t border-white/10 bg-[#72e5cf]/[0.06] p-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold text-[#72e5cf]">Next lesson unlocked</div><div className="mt-1 text-xs text-white/45">{nextChapter.title}</div></div><Button onClick={() => chooseChapter(nextChapter)} className="rounded-xl bg-[#72e5cf] text-[#07134f] hover:bg-[#8aebd8]">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div> : null}
            </>
          )}
        </main>
      </div>
    </section>
  )
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-[11px] text-white/45">{label}<Input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} className="mt-1 h-9 rounded-lg border-white/10 bg-black/20 text-white" /></label>
}

function LessonView({ chapter, material }: { chapter: CourseChapter; material: LessonMaterial }) {
  const embedUrl = youtubeEmbedUrl(chapter)
  return <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)]">
    <div>{embedUrl ? <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"><iframe src={embedUrl} title={chapter.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-black text-sm text-white/45">Source preview unavailable</div>}<div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[#72e5cf]" />Lesson brief</div><p className="mt-3 text-sm leading-6 text-white/58">{material.summary}</p></div></div>
    <div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-[#72e5cf]" />What should stick</div><div className="mt-4 space-y-3">{material.keyTakeaways.map((item) => <div key={item} className="flex gap-3 text-xs leading-5 text-white/55"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#72e5cf]" />{item}</div>)}</div></div><div className="rounded-2xl border border-[#5865f2]/30 bg-[#5865f2]/10 p-4"><div className="text-xs font-semibold uppercase tracking-[.14em] text-[#aab1ff]">Pod practice</div><p className="mt-2 text-sm leading-6 text-white/65">{material.practicePrompt}</p></div></div>
  </div>
}

function NotesView({ material, onJump }: { material: LessonMaterial; onJump: (seconds: number) => void }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="space-y-3">{material.detailedNotes.map((note, index) => <article key={`${note.heading}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-start justify-between gap-3"><h4 className="font-semibold">{note.heading}</h4>{Number.isFinite(note.timestampSeconds) ? <button type="button" onClick={() => onJump(note.timestampSeconds || 0)} className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-[#72e5cf] hover:bg-white/10">{formatSeconds(note.timestampSeconds || 0)}</button> : null}</div><p className="mt-3 text-sm leading-6 text-white/58">{note.body}</p></article>)}</div><aside className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-sm font-semibold">Glossary</div>{material.glossary.length ? <div className="mt-4 space-y-4">{material.glossary.map((item) => <div key={item.term}><div className="text-xs font-semibold text-[#72e5cf]">{item.term}</div><p className="mt-1 text-xs leading-5 text-white/48">{item.definition}</p></div>)}</div> : <p className="mt-3 text-xs leading-5 text-white/42">No special vocabulary was needed for this lesson.</p>}</aside></div>
}

function MasteryView({ material, answers, setAnswers, result, passingScore, submitting, onRetry, onSubmit }: { material: LessonMaterial; answers: Record<string, number>; setAnswers: (value: Record<string, number>) => void; result: any; passingScore: number; submitting: boolean; onRetry: () => void; onSubmit: () => void }) {
  return <div className="mx-auto max-w-3xl"><div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4 text-[#72e5cf]" />Mastery check</div><p className="mt-1 text-xs text-white/43">Score {passingScore}% or more to unlock the next lesson.</p></div>{result ? <Badge className={result.passed ? "bg-[#72e5cf] text-[#07134f]" : "bg-[#76556d] text-white"}>{result.score}% · {result.passed ? "mastered" : "review"}</Badge> : null}</div><div className="space-y-4">{material.questions.map((question, questionIndex) => { const itemResult = result?.feedback?.find((item: any) => item.assignmentId === question.id); return <fieldset key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5" disabled={Boolean(result?.passed)}><legend className="sr-only">Question {questionIndex + 1}</legend><div className="text-sm font-semibold leading-6"><span className="mr-2 text-[#72e5cf]">{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</div><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-xs leading-5 transition", answers[question.id] === optionIndex ? "border-[#5865f2] bg-[#5865f2]/15 text-white" : "border-white/8 bg-black/15 text-white/55 hover:border-white/18")}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })} className="mt-1 accent-[#5865f2]" /><span>{option}</span></label>)}</div>{itemResult ? <div className={cn("mt-3 rounded-xl px-3 py-2.5 text-xs leading-5", itemResult.correct ? "bg-[#72e5cf]/10 text-[#9ff1e2]" : "bg-[#76556d]/20 text-[#d9b6d0]")}>{itemResult.correct ? "Correct. " : "Review. "}{itemResult.explanation}</div> : null}</fieldset> })}</div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">{result && !result.passed ? <Button type="button" variant="outline" onClick={onRetry} className="rounded-xl border-white/12 bg-transparent text-white"><RotateCcw className="mr-2 h-4 w-4" />Try a fresh attempt</Button> : null}<Button onClick={onSubmit} disabled={submitting || result?.passed} className="rounded-xl bg-[#72e5cf] text-[#07134f] hover:bg-[#8aebd8]">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{result?.passed ? "Lesson mastered" : "Submit mastery check"}</Button></div></div>
}
