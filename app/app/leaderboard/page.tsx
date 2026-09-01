"use client"

import { useCallback, useEffect, useState } from "react"
import { Award, Check, Clock3, Flame, Loader2, Plus, Target, Trophy, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type Challenge = any

export default function ChallengesPage() {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState("")
  const [form, setForm] = useState({ title: "Seven focused hours", description: "Build a steady learning rhythm together.", metric: "focus_minutes", goalValue: 420, durationDays: 7 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/challenges", { credentials: "include", cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Challenges could not be loaded")
      setChallenges(payload.challenges || [])
    } catch (error: any) {
      toast({ title: "Challenges unavailable", description: error?.message || "Try again.", variant: "destructive" })
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { void load() }, [load])

  const toggleJoin = async (challenge: Challenge) => {
    setBusy(challenge.$id)
    try {
      const response = await fetch("/api/challenges", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.$id, action: challenge.currentParticipant ? "leave" : "join" }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Challenge could not be updated")
      await load()
      toast({ title: payload.joined ? "Challenge joined" : "Challenge left", description: payload.joined ? "Completed focus blocks will now move your progress." : "Your other learning progress stays intact." })
    } catch (error: any) { toast({ title: "Could not update challenge", description: error?.message || "Try again.", variant: "destructive" }) }
    finally { setBusy("") }
  }

  const create = async () => {
    setBusy("create")
    try {
      const response = await fetch("/api/challenges", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, scope: "community" }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Challenge could not be created")
      setDialogOpen(false)
      await load()
      toast({ title: "Challenge is live", description: "You are the first participant. Invite others to learn alongside you." })
    } catch (error: any) { toast({ title: "Challenge not created", description: error?.message || "Check the details and try again.", variant: "destructive" }) }
    finally { setBusy("") }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-24 md:px-8 md:py-9">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#202321] p-6 text-[#f8f2e8] sm:p-9">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_85%_5%,rgba(118,85,109,.45),transparent_32%),radial-gradient(circle_at_5%_90%,rgba(143,189,183,.25),transparent_34%)]" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8fbdb7]">Community challenges</span><h1 className="mt-3 max-w-2xl font-serif text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">Progress people can join.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/55">The platform-wide leaderboard is now challenge-based. Pod rankings remain inside each Pod, where the context belongs.</p></div><Button onClick={() => setDialogOpen(true)} className="rounded-full bg-[#f5ecdf] text-[#282520] hover:bg-white"><Plus />Create challenge</Button></div>
      </section>

      <div className="mt-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#76556d]">Active now</p><h2 className="mt-1 font-serif text-2xl">Choose a rhythm</h2></div><Badge variant="outline">{challenges.length} challenges</Badge></div>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : challenges.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{challenges.map((challenge) => {
        const participant = challenge.currentParticipant
        const percentage = participant ? Math.min(100, (participant.progress / challenge.goalValue) * 100) : 0
        const unit = challenge.metric === "focus_sessions" ? "sessions" : "minutes"
        return <article key={challenge.$id} className="overflow-hidden rounded-[1.6rem] border border-black/8 bg-card shadow-[0_14px_40px_rgba(45,36,27,.07)]"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-[#dcebe7] text-[#315e59]"><Target className="size-5" /></span><Badge variant="secondary"><Users className="mr-1 size-3" />{challenge.participantCount}</Badge></div><h3 className="mt-5 font-serif text-2xl tracking-[-.02em]">{challenge.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{challenge.description}</p><div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{challenge.durationDays} days</span><span className="inline-flex items-center gap-1.5"><Award className="size-3.5" />{challenge.points} points</span></div>{participant ? <div className="mt-5 rounded-xl bg-[#f5efe5] p-4"><div className="flex justify-between text-xs"><strong>Your progress</strong><span>{participant.progress}/{challenge.goalValue} {unit}</span></div><Progress className="mt-2" value={percentage} /></div> : null}<Button onClick={() => void toggleJoin(challenge)} disabled={busy === challenge.$id} variant={participant ? "outline" : "default"} className={`mt-5 w-full rounded-xl ${participant ? "" : "bg-[#76556d] hover:bg-[#62465b]"}`}>{participant ? <Check /> : <Flame />}{participant ? "Joined · leave" : "Join challenge"}</Button></div>{challenge.leaders?.length ? <div className="border-t bg-[#f9f5ee] px-5 py-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Leading learners</p><div className="flex items-center">{challenge.leaders.slice(0, 4).map((leader: any, index: number) => <div key={leader.$id} className="flex items-center gap-2 border-r pr-3 mr-3 last:border-0"><span className="text-xs font-bold text-muted-foreground">{index + 1}</span><Avatar className="size-7"><AvatarImage src={leader.avatar || "/placeholder.svg"} /><AvatarFallback>{leader.name?.[0] || "S"}</AvatarFallback></Avatar></div>)}</div></div> : null}</article>
      })}</div> : <div className="mt-4 grid min-h-72 place-items-center rounded-[1.6rem] border border-dashed border-black/12 bg-card p-8 text-center"><div><Trophy className="mx-auto size-8 text-[#76556d]" /><h3 className="mt-4 font-serif text-2xl">Start the first challenge</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Set a real focus target, choose a duration, and make a space others can join.</p><Button onClick={() => setDialogOpen(true)} className="mt-5 rounded-full bg-[#76556d]"><Plus />Create challenge</Button></div></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-lg rounded-[1.5rem]"><DialogHeader><DialogTitle className="font-serif text-2xl">Create a learning challenge</DialogTitle><DialogDescription>Use a measurable goal. Progress comes from completed focus sessions—not self-reported points.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} maxLength={100} /></div><div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} maxLength={500} /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Measure</Label><Select value={form.metric} onValueChange={(metric) => setForm((value) => ({ ...value, metric }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="focus_minutes">Focused minutes</SelectItem><SelectItem value="focus_sessions">Completed sessions</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Target</Label><Input type="number" min={1} max={20000} value={form.goalValue} onChange={(event) => setForm((value) => ({ ...value, goalValue: Number(event.target.value) }))} /></div></div><div className="grid gap-2"><Label>Duration in days</Label><Input type="number" min={1} max={90} value={form.durationDays} onChange={(event) => setForm((value) => ({ ...value, durationDays: Number(event.target.value) }))} /></div><Button onClick={() => void create()} disabled={busy === "create" || form.title.trim().length < 4} className="bg-[#76556d] hover:bg-[#62465b]">{busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />}Create and join</Button></div></DialogContent></Dialog>
    </div>
  )
}
