"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bot, BookOpen, Check, Expand, Flame, GraduationCap, Loader2, Pause, Play, Send, ShieldCheck, Users, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageResponse } from "@/components/ai-elements/message"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type Session = { $id: string; title: string; plannedMinutes: number; startedAt: string; status: string }

const presets = [25, 45, 60, 90]
const focusSources: Array<{ href: string; icon: LucideIcon; label: string; detail: string }> = [
  { href: "/app/courses", icon: GraduationCap, label: "Continue a course", detail: "Pick up a structured lesson" },
  { href: "/app/pods", icon: Users, label: "Work on a Pod task", detail: "Make progress with your circle" },
  { href: "/app/vault", icon: BookOpen, label: "Review a resource", detail: "Open notes from your Vault" },
]

function clock(seconds: number) {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0")
  const remainder = (safe % 60).toString().padStart(2, "0")
  return `${minutes}:${remainder}`
}

export default function FocusPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("Deep study")
  const [minutes, setMinutes] = useState(25)
  const [session, setSession] = useState<Session | null>(null)
  const [remaining, setRemaining] = useState(25 * 60)
  const [paused, setPaused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiBusy, setAiBusy] = useState(false)
  const wakeLock = useRef<any>(null)

  const releaseWakeLock = useCallback(async () => {
    await wakeLock.current?.release?.().catch(() => undefined)
    wakeLock.current = null
  }, [])

  const requestFocusCapabilities = useCallback(async () => {
    await document.documentElement.requestFullscreen?.().catch(() => undefined)
    const api = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<any> } }
    wakeLock.current = await api.wakeLock?.request("screen").catch(() => null)
  }, [])

  const finish = useCallback(async (action: "complete" | "cancel") => {
    if (!session || busy) return
    setBusy(true)
    try {
      const response = await fetch("/api/focus", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.$id, action }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not save this session")
      await releaseWakeLock()
      await document.exitFullscreen?.().catch(() => undefined)
      setSession(null)
      setPaused(false)
      setRemaining(minutes * 60)
      toast({
        title: action === "complete" ? "Focus block complete" : "Focus block ended",
        description: action === "complete" ? "Your real focused time is now part of your profile progress." : "Only completed focus time contributes to milestones.",
      })
    } catch (error: any) {
      toast({ title: "Could not save progress", description: error?.message || "Try again.", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }, [busy, minutes, releaseWakeLock, session, toast])

  useEffect(() => {
    if (!session || paused) return
    const timer = window.setInterval(() => setRemaining((value) => {
      if (value <= 1) {
        window.clearInterval(timer)
        window.setTimeout(() => void finish("complete"), 0)
        return 0
      }
      return value - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [finish, paused, session])

  useEffect(() => {
    const preventExit = (event: BeforeUnloadEvent) => {
      if (!session) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", preventExit)
    return () => window.removeEventListener("beforeunload", preventExit)
  }, [session])

  useEffect(() => () => { void releaseWakeLock() }, [releaseWakeLock])

  const progress = useMemo(() => session ? 1 - remaining / (session.plannedMinutes * 60) : 0, [remaining, session])

  const start = async () => {
    if (title.trim().length < 2 || busy) return
    setBusy(true)
    void requestFocusCapabilities()
    try {
      const response = await fetch("/api/focus", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), plannedMinutes: minutes }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.session) throw new Error(payload?.error || "Could not begin focus mode")
      setSession(payload.session)
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(payload.session.startedAt).getTime()) / 1000))
      setRemaining(Math.max(0, Number(payload.session.plannedMinutes) * 60 - elapsed))
    } catch (error: any) {
      await releaseWakeLock()
      toast({ title: "Focus mode did not start", description: error?.message || "Try again.", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const askFocusAI = async () => {
    const question = aiQuestion.trim()
    if (!question || aiBusy) return
    setAiBusy(true)
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          system: `You are helping during an active focus session titled "${session?.title || title}". Give a concise explanation or next step that helps the student return to focused work quickly.`,
          context: { resources: true, calendar: true },
          maxTokens: 900,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "AI could not respond")
      setAiAnswer(payload?.message || "I could not form an answer. Try rephrasing the question.")
    } catch (error: any) {
      toast({ title: "AI is unavailable", description: error?.message || "Try again in a moment.", variant: "destructive" })
    } finally {
      setAiBusy(false)
    }
  }

  if (session) {
    return (
      <div className="fixed inset-0 z-[100] grid min-h-dvh overflow-hidden bg-[#181a19] text-[#f8f2e8]">
        <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_20%_10%,rgba(83,137,131,.24),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(118,85,109,.25),transparent_35%)]" />
        <main className="relative z-10 m-auto flex w-full max-w-xl flex-col items-center px-6 text-center">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-[#a9d0cb]"><ShieldCheck className="size-4" />Focus space</span>
          <p className="mb-3 text-sm text-white/50">{paused ? "Paused" : session.title}</p>
          <div className="relative grid size-64 place-items-center sm:size-80">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="53" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
              <circle cx="60" cy="60" r="53" fill="none" stroke="#8fbdb7" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
            </svg>
            <div><strong className="font-serif text-6xl font-normal tracking-[-.06em] sm:text-7xl">{clock(remaining)}</strong><p className="mt-3 text-xs uppercase tracking-[.2em] text-white/35">remaining</p></div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" size="lg" onClick={() => setPaused((value) => !value)} className="rounded-full px-6">{paused ? <Play /> : <Pause />}{paused ? "Resume" : "Pause"}</Button>
            <Button variant="outline" size="lg" onClick={() => setAiOpen(true)} className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"><Bot />Ask AI</Button>
            <Button size="lg" onClick={() => void finish("complete")} disabled={busy} className="rounded-full bg-[#8fbdb7] px-6 text-[#18201e] hover:bg-[#a9d0cb]"><Check />Finish</Button>
            <Button variant="ghost" size="lg" onClick={() => void finish("cancel")} disabled={busy} className="rounded-full text-white/55 hover:bg-white/10 hover:text-white"><X />End early</Button>
          </div>
          <p className="mt-8 max-w-md text-xs leading-5 text-white/35">Student.social can request fullscreen and keep the screen awake. Your device’s operating-system controls remain available.</p>
        </main>
        {aiOpen ? (
          <aside className="absolute inset-x-3 bottom-3 z-20 max-h-[72dvh] overflow-y-auto rounded-[1.5rem] border border-white/12 bg-[#252725]/95 p-4 text-left shadow-2xl backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[390px] sm:max-h-none sm:p-5" aria-label="Focus AI help">
            <div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#a9d0cb]"><Bot className="size-4" />Focus AI</span><h2 className="mt-2 font-serif text-2xl">Unblock the next step.</h2><p className="mt-1 text-xs leading-5 text-white/45">Short answers, grounded in your learning space, so you can return to the session.</p></div><button type="button" onClick={() => setAiOpen(false)} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close Focus AI"><X className="size-4" /></button></div>
            <div className="mt-5 grid gap-3">
              <Textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askFocusAI() } }} placeholder="What are you stuck on?" rows={3} className="resize-none border-white/10 bg-white/5 text-white placeholder:text-white/30" />
              <Button type="button" onClick={() => void askFocusAI()} disabled={!aiQuestion.trim() || aiBusy} className="rounded-xl bg-[#8fbdb7] text-[#18201e] hover:bg-[#a9d0cb]">{aiBusy ? <Loader2 className="animate-spin" /> : <Send />}{aiBusy ? "Thinking…" : "Get a focused answer"}</Button>
            </div>
            {aiAnswer ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/80"><MessageResponse>{aiAnswer}</MessageResponse></div> : null}
          </aside>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <button onClick={() => router.back()} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back</button>
      <div className="grid overflow-hidden rounded-[2rem] border border-black/10 bg-[#f7f0e4] shadow-[0_28px_80px_rgba(46,37,28,.12)] md:grid-cols-[1.05fr_.95fr]">
        <section className="p-6 sm:p-10 md:p-12">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#dcebe7] px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#315e59]"><Flame className="size-4" />Deep work</span>
          <h1 className="max-w-lg font-serif text-4xl leading-[.98] tracking-[-.045em] text-[#282520] sm:text-5xl">Give one thing your full attention.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#665f54]">Start a protected learning block. Completed time feeds your streak, study hours, challenge progress, and Pod contribution.</p>
          <div className="mt-9 space-y-5">
            <label className="grid gap-2 text-sm font-semibold text-[#3d3933]">What are you working on?<Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="h-12 rounded-xl border-black/10 bg-white/70" /></label>
            <div><p className="mb-2 text-sm font-semibold text-[#3d3933]">Session length</p><div className="grid grid-cols-4 gap-2">{presets.map((value) => <button key={value} onClick={() => { setMinutes(value); setRemaining(value * 60) }} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${minutes === value ? "border-[#3f6f6b] bg-[#3f6f6b] text-white" : "border-black/10 bg-white/55 text-[#5c554b] hover:bg-white"}`}>{value}m</button>)}</div></div>
            <Button onClick={() => void start()} disabled={busy || title.trim().length < 2} className="h-12 w-full rounded-xl bg-[#76556d] text-white hover:bg-[#62465b]"><Expand />{busy ? "Preparing your space…" : "Begin focus session"}</Button>
          </div>
        </section>
        <aside className="grid content-between bg-[#222523] p-7 text-[#f7f0e4] sm:p-10">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8fbdb7]">Bring work into focus</p><div className="mt-6 grid gap-2">{focusSources.map(({ href, icon: Icon, label, detail }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-3 transition hover:border-[#8fbdb7]/30 hover:bg-white/[.07]"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#8fbdb7]/10 text-[#a9d0cb]"><Icon className="size-4" /></span><span><strong className="block text-sm font-semibold text-white/85">{label}</strong><small className="mt-0.5 block text-xs text-white/35">{detail}</small></span></Link>)}</div></div>
          <p className="mt-10 font-serif text-2xl leading-tight text-white/85">Small blocks become a learning rhythm.</p>
        </aside>
      </div>
    </div>
  )
}
