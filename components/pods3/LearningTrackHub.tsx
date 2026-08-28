// @ts-nocheck
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Check, ChevronRight, Clock, Compass, FileText, Loader2, Play, Search, Sparkles, Star, Target, Users, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

function ratingOf(course: any) { return Number(course.avgRating ?? course.rating ?? 0) }
function reviewCountOf(course: any) { return Number(course.totalReviews ?? course.reviewCount ?? 0) }
function courseDuration(course: any) {
  const raw = Number(course.duration || 0)
  const minutes = raw > 1000 ? Math.round(raw / 60) : raw
  if (!minutes) return "Flexible"
  if (minutes < 60) return `${minutes} min`
  return `${Math.round(minutes / 60)} hr`
}

function TrackCard({ course, creator = false }: { course: any; creator?: boolean }) {
  const rating = ratingOf(course)
  return <article className="pods3-card pods3-card-hover pods3-pod-card">
    <div className="pods3-pod-card-accent" />
    <div className="pods3-pod-card-body">
      <div className="pods3-pod-card-top"><span className="pods3-icon-tile"><BookOpen /></span><span className={creator ? "pods3-pill is-plum" : "pods3-pill is-teal"}>{creator ? (course.status || (course.isPublished ? "Published" : "Draft")) : "Learning Track"}</span></div>
      <h3>{course.title}</h3>
      <p className="pods3-pod-card-outcome">{course.description || "A structured learning track built from source material, practice, assessment, and proof of work."}</p>
      <div className="pods3-pod-card-meta"><span className="pods3-pill">{course.difficulty || course.level || "Beginner"}</span><span className="pods3-pill"><Clock />{courseDuration(course)}</span>{course.language ? <span className="pods3-pill">{course.language}</span> : null}</div>
      <div className="pods3-pod-card-evidence"><span><strong>{course.enrollmentCount || 0}</strong><small>learners</small></span><span><strong>{rating ? rating.toFixed(1) : "New"}</strong><small>{reviewCountOf(course) ? `${reviewCountOf(course)} reviews` : "rating"}</small></span><span><strong>{Number(course.price || 0) > 0 ? `$${course.price}` : "Open"}</strong><small>offer</small></span></div>
      <div className="pods3-pod-card-footer"><div><div className="pods3-progress-copy"><span>{creator ? "Creator workspace" : "Preview curriculum + outcomes"}</span></div><div className="pods3-progress-track"><i style={{ width: creator ? (course.isPublished || course.status === "Published" ? "100%" : "58%") : "72%" }} /></div></div><Button asChild size="sm" variant={creator ? "outline" : "default"}><Link href={`/app/courses/${course.$id}`}>{creator ? "Review" : "Preview"}<ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button></div>
    </div>
  </article>
}

export function LearningTrackHub() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"discover" | "creator">("discover")

  useEffect(() => {
    let cancelled = false
    fetch("/api/courses/list").then((res) => res.ok ? res.json() : Promise.reject(new Error("Could not load learning tracks"))).then((data) => { if (!cancelled) setCourses(data.courses || []) }).catch(() => { if (!cancelled) setCourses([]) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = mode === "creator" ? courses.filter((course) => course.instructorId === user?.$id) : courses
    const needle = query.trim().toLowerCase()
    if (needle) list = list.filter((course) => `${course.title || ""} ${course.description || ""} ${(course.tags || []).join(" ")}`.toLowerCase().includes(needle))
    return list
  }, [courses, mode, query, user?.$id])

  return <div className="pods3-root"><main className="pods3-page">
    <header className="pods3-discovery-head"><div><span className="pods3-eyebrow">Tracks + creator editions</span><h1 className="pods3-title">Learning</h1><p>A Learning Track is the reusable curriculum. A Pod is the small social cohort that follows one version of it.</p></div><Button asChild><Link href="/app/pods/create"><Sparkles className="mr-1.5 h-4 w-4" />Start a cohort</Link></Button></header>

    <section className="pods3-discovery-hero"><div className="pods3-discovery-hero-copy"><span className="pods3-eyebrow">One learning domain, two clear objects</span><h2>Choose the <em>track.</em> Then choose how you learn it.</h2><p>Browse structured source-grounded learning. Learn independently when the offer supports it, or join a small Pod Run for schedule, peers, sessions, review, and accountability.</p></div><div className="pods3-discovery-pulse"><div><span><BookOpen /></span><div><strong>{courses.length}</strong><small>current tracks</small></div></div><div><span><Users /></span><div><strong>{courses.reduce((sum, course) => sum + Number(course.enrollmentCount || 0), 0)}</strong><small>enrollments</small></div></div><div><span><Star /></span><div><strong>{courses.length ? (courses.reduce((sum, course) => sum + ratingOf(course), 0) / courses.length).toFixed(1) : "New"}</strong><small>avg rating</small></div></div></div></section>

    <div className="pods3-segmented" role="tablist"><button className={mode === "discover" ? "is-active" : ""} onClick={() => setMode("discover")}>Discover</button><button className={mode === "creator" ? "is-active" : ""} onClick={() => setMode("creator")}>Creator Studio <small>{courses.filter((course) => course.instructorId === user?.$id).length}</small></button></div>
    <div className="pods3-discovery-tools"><div className="pods3-search"><Search /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === "creator" ? "Search your tracks" : "Search an outcome, skill, or creator"} /></div><Button variant="outline" onClick={() => setQuery("")}>Clear</Button></div>

    {mode === "creator" ? <section className="pods3-card pods3-now-card mt-3"><div className="pods3-now-copy"><span className="pods3-eyebrow"><Wand2 className="h-3 w-3" />Creator Studio V3</span><h2>Create once. Run many cohorts.</h2><p>The V3 creator workflow separates source intake, generation, evidence review, immutable publication, offers, cohorts, and payouts. Current legacy course documents are shown here as the migration surface rather than pretending the durable Track pipeline already exists.</p><div className="pods3-now-actions"><Button variant="outline" disabled>Import source · pipeline migration</Button><Button asChild><Link href="/app/pods/create">Create a Pod Run</Link></Button></div></div></section> : null}

    <div className="pods3-section-head"><div><h2>{mode === "creator" ? "Your creator tracks" : "Structured learning tracks"}</h2><p>{mode === "creator" ? "Review legacy content here as it moves into the versioned Track model." : "Preview the curriculum before choosing an independent or social learning mode."}</p></div><span>{filtered.length} tracks</span></div>
    {loading ? <div className="pods3-grid">{[1,2,3].map((item) => <div key={item} className="pods3-shimmer h-72" />)}</div> : filtered.length ? <div className="pods3-grid">{filtered.map((course) => <TrackCard key={course.$id} course={course} creator={mode === "creator"} />)}</div> : <div className="pods3-empty"><span><Compass /></span><h3>{mode === "creator" ? "No creator tracks yet" : "No tracks match"}</h3><p>{mode === "creator" ? "The V3 import pipeline will create reviewed, versioned Tracks here. Until then, existing course data remains untouched." : "Try a broader search or start a Pod around the outcome you want to learn."}</p></div>}
  </main></div>
}

export function LearningTrackPage({ courseId }: { courseId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [course, setCourse] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [selected, setSelected] = useState(0)

  async function load() {
    setLoading(true)
    try {
      const [courseRes, chaptersRes] = await Promise.all([fetch(`/api/courses/${courseId}`), fetch(`/api/courses/${courseId}/chapters`)])
      if (courseRes.ok) setCourse((await courseRes.json()).course)
      if (chaptersRes.ok) setChapters((await chaptersRes.json()).chapters || [])
      if (user?.$id) {
        const enrollmentRes = await fetch(`/api/courses/enroll?userId=${encodeURIComponent(user.$id)}&courseId=${encodeURIComponent(courseId)}`)
        if (enrollmentRes.ok) setEnrolled(Boolean((await enrollmentRes.json()).enrolled))
      }
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [courseId, user?.$id])

  async function enroll() {
    if (!user?.$id) return router.push("/login")
    setEnrolling(true)
    try {
      const response = await fetch("/api/courses/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.$id, courseId, enrollmentType: "individual" }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Enrollment failed")
      setEnrolled(true)
      toast({ title: "Learning access ready", description: "You can now open the structured track." })
    } catch (error: any) { toast({ title: "Could not enroll", description: error.message, variant: "destructive" }) }
    finally { setEnrolling(false) }
  }

  if (loading) return <div className="pods3-root"><div className="pods3-skeleton"><div className="pods3-shimmer h-64" /></div></div>
  if (!course) return <div className="pods3-root"><main className="pods3-page"><div className="pods3-empty"><span><BookOpen /></span><h3>Track not found</h3><p>This course document may have been removed or is not available to your account.</p><Button asChild><Link href="/app/courses">Back to Learning</Link></Button></div></main></div>

  const current = chapters[selected] || chapters[0]
  const rating = ratingOf(course)
  if (!enrolled) return <div className="pods3-root"><main className="pods3-page">
    <section className="pods3-preview-hero"><div className="pods3-preview-hero-copy"><Link className="pods3-back-circle" href="/app/courses"><ArrowLeft /></Link><span className="pods3-eyebrow mt-4">Learning Track · {course.difficulty || course.level || "Beginner"}</span><h1>{course.title}</h1><p>{course.description}</p><div className="pods3-workspace-head-meta"><span className="pods3-pill"><Clock />{courseDuration(course)}</span><span className="pods3-pill"><BookOpen />{chapters.length} units</span><span className="pods3-pill"><Users />{course.enrollmentCount || 0}</span><span className="pods3-pill"><Star />{rating ? rating.toFixed(1) : "New"}</span></div></div><aside className="pods3-preview-join"><strong>Choose how you want to learn it.</strong><p>Independent enrollment uses the existing course entitlement. For the V3 social experience, start or join a Pod Run following the Track.</p><Button disabled={enrolling} onClick={enroll}>{enrolling ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}Learn independently</Button><Button asChild variant="outline"><Link href="/app/pods/create"><Users className="mr-1.5 h-4 w-4" />Learn with a Pod</Link></Button></aside></section>
    <div className="pods3-preview-sections"><main className="pods3-stack"><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>Curriculum preview</h3><p>Inspect the learning sequence before enrolling.</p></div><span className="pods3-pill is-teal">{chapters.length} units</span></div><div className="mt-3">{chapters.map((chapter, index) => <div className="pods3-learning-row" key={chapter.$id}><span className="pods3-learning-state"><span>{index + 1}</span></span><div className="pods3-learning-copy"><span>Lesson · {chapter.duration ? `${chapter.duration} min` : "source segment"}</span><strong>{chapter.title}</strong><p>{chapter.description}</p></div>{index === 0 ? <span className="pods3-pill is-plum">Sample</span> : <span className="pods3-pill"><Target />Practice</span>}</div>)}</div></section></main><aside className="pods3-stack"><section className="pods3-card pods3-panel"><div className="pods3-panel-head"><div><h3>What the V3 edition adds</h3><p>The reusable Track can power multiple social runs.</p></div><span className="pods3-icon-tile is-plum"><Sparkles /></span></div><div className="pods3-review-list mt-3"><div className="pods3-review-row"><span className="pods3-icon-tile"><Check /></span><div><strong>Source-grounded notes</strong><p>Evidence-linked material and remediation paths.</p></div></div><div className="pods3-review-row"><span className="pods3-icon-tile is-olive"><Users /></span><div><strong>Small cohorts</strong><p>Schedule, rooms, peer help, and review through Pod Runs.</p></div></div><div className="pods3-review-row"><span className="pods3-icon-tile is-plum"><Target /></span><div><strong>Mastery + proof</strong><p>Watching alone does not equal completion.</p></div></div></div></section></aside></div>
  </main></div>

  return <div className="pods3-root pods3-focus-mode"><header className="pods3-focus-top"><Link href="/app/courses"><ArrowLeft /></Link><div className="pods3-focus-title"><strong>{current?.title || course.title}</strong><small>{course.title} · {selected + 1}/{Math.max(1, chapters.length)}</small></div><Button asChild variant="outline" size="sm"><Link href="/app/pods">Find a Pod</Link></Button></header><div className="pods3-focus-shell"><aside className="pods3-focus-rail"><span>Track</span>{chapters.map((chapter, index) => <button key={chapter.$id} className={index === selected ? "is-active" : ""} onClick={() => setSelected(index)} style={{ display: "grid", width: "100%", gridTemplateColumns: "2rem minmax(0,1fr)", alignItems: "center", gap: ".5rem", marginTop: ".32rem", borderRadius: "12px", padding: ".45rem", textAlign: "left" }}><i>{index + 1}</i><div><strong>{chapter.title}</strong><small>{chapter.duration ? `${chapter.duration} min` : "lesson"}</small></div></button>)}</aside><main className="pods3-focus-main"><section className="pods3-media-stage"><div className="pods3-media-play"><span><Play /></span><strong>{current?.title || course.title}</strong><small>{course.youtubeUrl || course.youtubeLink ? "Source media attached" : "Structured lesson source"}</small>{(course.youtubeUrl || course.youtubeLink) ? <Button asChild variant="outline"><a href={course.youtubeUrl || course.youtubeLink} target="_blank" rel="noreferrer">Open source</a></Button> : null}</div></section><div className="pods3-lesson-copy"><span className="pods3-eyebrow">Lesson {selected + 1}</span><h1>{current?.title || course.title}</h1><p>{current?.description || course.description}</p></div></main><aside className="pods3-focus-context"><div className="pods3-context-tabs"><button className="is-active">Notes</button><button>Recall</button><button>Apply</button><button>Resources</button></div><div className="pods3-context-body"><h3>Learning objective</h3><p>{current?.learningObjectives?.join(" · ") || current?.objectives?.join(" · ") || "Understand the concept well enough to explain and apply it."}</p><div className="pods3-note"><strong>V3 mastery rule</strong><p>Media progress is not mastery. Assessments, applied work, and evidence determine completion once the canonical mastery service is wired.</p></div></div></aside></div><footer className="pods3-focus-action"><div><div><span>Next</span><strong>{chapters[selected + 1]?.title || "Finish this learning block"}</strong></div><Button disabled={selected >= chapters.length - 1} onClick={() => setSelected((value) => Math.min(chapters.length - 1, value + 1))}>Next lesson<ChevronRight className="ml-1 h-4 w-4" /></Button></div></footer></div>
}
