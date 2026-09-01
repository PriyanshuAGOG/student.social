"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Award, BookOpen, CalendarDays, Camera, Check, Clock3, Edit3, Flame,
  Link2, Loader2, MapPin, MessageSquare, MoreHorizontal, Target, UserPlus, Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { profileService } from "@/lib/appwrite"

type Overview = {
  isOwnProfile: boolean
  isPrivate: boolean
  profile: { id: string; name: string; username: string; avatar: string; bio: string; location: string; website: string; joinedAt: string; interests: string[]; focusAreas: string[]; isOnline: boolean }
  stats?: { studyStreak: number; studyHours: number; focusMinutes: number; focusSessions: number; podsJoined: number; resourcesShared: number; postsCreated: number; followers: number; following: number }
  achievements?: Array<{ key: string; title: string; description: string; progress: number; target: number; complete: boolean; tone: string }>
  posts?: any[]
  resources?: any[]
  pods?: any[]
  activity?: Array<{ id: string; type: string; title: string; timestamp: string; href: string }>
  relationship?: { isFollowing: boolean; followerCount: number; followingCount: number }
  connections?: { followers: any[]; following: any[] }
}

function relativeTime(input: string) {
  const time = new Date(input).getTime()
  if (!Number.isFinite(time)) return "Recently"
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S"
}

export function ProfileExperience({ identifier }: { identifier?: string }) {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()
  const avatarInput = useRef<HTMLInputElement>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [followingBusy, setFollowingBusy] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [edit, setEdit] = useState({ name: "", username: "", bio: "", location: "", website: "" })
  const requestedTab = search.get("tab") === "progress" ? "achievements" : (search.get("tab") || "overview")

  const load = useCallback(async () => {
    const profileIdentifier = identifier || user?.$id
    if (!profileIdentifier) return
    setLoading(true)
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(profileIdentifier)}/overview`, { credentials: "include", cache: "no-store" })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.profile) throw new Error(payload?.error || "Profile could not be loaded")
      setOverview(payload)
      setEdit({
        name: payload.profile.name || "",
        username: payload.profile.username || "",
        bio: payload.profile.bio || "",
        location: payload.profile.location || "",
        website: payload.profile.website || "",
      })
    } catch (error: any) {
      toast({ title: "Profile unavailable", description: error?.message || "Please try again.", variant: "destructive" })
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [identifier, toast, user?.$id])

  useEffect(() => { void load() }, [load])

  const toggleFollow = async () => {
    if (!overview?.profile.id || followingBusy) return
    setFollowingBusy(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(overview.profile.id)}/follow`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: overview.relationship?.isFollowing ? "unfollow" : "follow" }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || "Could not update this connection")
      setOverview((current) => current ? { ...current, relationship: { isFollowing: Boolean(payload.isFollowing), followerCount: payload.followerCount, followingCount: payload.followingCount } } : current)
      toast({ title: payload.isFollowing ? "Following" : "Unfollowed", description: payload.message })
    } catch (error: any) {
      toast({ title: "Connection not updated", description: error?.message || "Try again.", variant: "destructive" })
    } finally {
      setFollowingBusy(false)
    }
  }

  const uploadAvatar = async (file?: File) => {
    if (!file || !user?.$id || !overview?.isOwnProfile) return
    setAvatarBusy(true)
    try {
      await profileService.uploadAvatar(file, user.$id)
      await refreshUser()
      await load()
      toast({ title: "Profile photo updated", description: "The new image now follows you across posts, chat, and your profile." })
    } catch (error: any) {
      toast({ title: "Photo was not updated", description: error?.message || "Use a JPG, PNG, WebP, GIF, or AVIF under 8 MB.", variant: "destructive" })
    } finally {
      setAvatarBusy(false)
      if (avatarInput.current) avatarInput.current.value = ""
    }
  }

  const saveProfile = async () => {
    if (!user?.$id || !overview?.isOwnProfile) return
    const username = edit.username.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase()
    if (edit.name.trim().length < 2 || username.length < 3) {
      toast({ title: "Check your profile", description: "Use a name of at least 2 characters and a username of at least 3.", variant: "destructive" })
      return
    }
    try {
      await profileService.updateProfile(user.$id, { ...edit, name: edit.name.trim(), username })
      await refreshUser()
      setEditOpen(false)
      await load()
      toast({ title: "Profile saved", description: "Your public learning identity is up to date." })
    } catch (error: any) {
      toast({ title: "Profile not saved", description: error?.message || "Try another username.", variant: "destructive" })
    }
  }

  if (loading) return <div className="grid min-h-[60dvh] place-items-center"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Building your learning profile…</div></div>
  if (!overview) return <div className="grid min-h-[60dvh] place-items-center text-center"><div><h1 className="font-serif text-3xl">Profile not found</h1><Button className="mt-5" variant="outline" onClick={() => router.back()}><ArrowLeft />Go back</Button></div></div>

  const { profile } = overview
  const stats = overview.stats || { studyStreak: 0, studyHours: 0, focusMinutes: 0, focusSessions: 0, podsJoined: 0, resourcesShared: 0, postsCreated: 0, followers: 0, following: 0 }
  const joined = profile.joinedAt && !Number.isNaN(new Date(profile.joinedAt).getTime()) ? new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Recently"

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 pb-24 md:px-8 md:py-8 md:pb-12">
      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#f8f1e6] shadow-[0_24px_70px_rgba(53,42,30,.11)]">
        <div className="relative min-h-44 overflow-hidden bg-[#202321] p-6 text-[#fbf5eb] sm:min-h-52 sm:p-8">
          <div className="absolute inset-0 [background:radial-gradient(circle_at_15%_20%,rgba(143,189,183,.3),transparent_32%),radial-gradient(circle_at_86%_14%,rgba(118,85,109,.35),transparent_31%),linear-gradient(115deg,transparent_45%,rgba(199,171,118,.1))]" />
          <button onClick={() => router.back()} className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"><ArrowLeft className="size-4" />Back</button>
          <div className="relative z-10 mt-7 max-w-xl"><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8fbdb7]">Learning profile</span><p className="mt-2 font-serif text-2xl leading-tight text-white/90 sm:text-3xl">A living record of what you learn—and who you learn it with.</p></div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative -mt-20 w-fit sm:-mt-24">
              <Avatar className="size-28 border-[5px] border-[#f8f1e6] bg-[#dfe8df] shadow-xl sm:size-36"><AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} /><AvatarFallback className="text-2xl">{initials(profile.name)}</AvatarFallback></Avatar>
              {overview.isOwnProfile ? <><input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => void uploadAvatar(event.target.files?.[0])} /><button onClick={() => avatarInput.current?.click()} disabled={avatarBusy} aria-label="Update profile photo" className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-full border-4 border-[#f8f1e6] bg-[#3f6f6b] text-white shadow-lg hover:bg-[#315e59]">{avatarBusy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}</button></> : null}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-3xl tracking-[-.035em] text-[#282520] sm:text-4xl">{profile.name}</h1>{profile.isOnline ? <Badge className="bg-[#dcebe7] text-[#315e59] hover:bg-[#dcebe7]">Here now</Badge> : null}</div><p className="mt-1 text-sm text-[#766d61]">@{profile.username}</p></div>
            <div className="flex gap-2">
              {overview.isOwnProfile ? <Button variant="outline" onClick={() => setEditOpen(true)} className="rounded-full bg-white/60"><Edit3 />Edit profile</Button> : <><Button variant="outline" onClick={() => router.push(`/app/messages/${profile.id}`)} className="rounded-full bg-white/60"><MessageSquare />Message</Button><Button onClick={() => void toggleFollow()} disabled={followingBusy} className={`rounded-full ${overview.relationship?.isFollowing ? "bg-[#d9d0c2] text-[#35312c] hover:bg-[#cbc0b1]" : "bg-[#76556d] text-white hover:bg-[#62465b]"}`}>{overview.relationship?.isFollowing ? <Check /> : <UserPlus />}{overview.relationship?.isFollowing ? "Following" : "Follow"}</Button></>}
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#585147]">{profile.bio || (overview.isOwnProfile ? "Tell people what you are learning and what kind of study partners you want to meet." : "This student is building their learning story.")}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#786f63]">{profile.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{profile.location}</span> : null}{profile.website ? <a className="inline-flex items-center gap-1.5 hover:text-[#3f6f6b]" href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer"><Link2 className="size-3.5" />{profile.website}</a> : null}<span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Joined {joined}</span></div>
          <div className="mt-7 grid grid-cols-2 gap-2 border-t border-black/8 pt-5 sm:grid-cols-4"><NetworkStat value={overview.relationship?.followerCount ?? stats.followers} label="Followers" /><NetworkStat value={overview.relationship?.followingCount ?? stats.following} label="Following" /><NetworkStat value={stats.postsCreated} label="Posts" /><NetworkStat value={stats.podsJoined} label="Pods" /></div>
        </div>
      </section>

      {overview.isPrivate ? <section className="mt-5 rounded-[1.5rem] border border-black/10 bg-card p-8 text-center"><Users className="mx-auto size-6 text-muted-foreground" /><h2 className="mt-3 font-serif text-2xl">This profile is private</h2><p className="mt-2 text-sm text-muted-foreground">Follow this student to keep up with their public learning updates.</p></section> : (
        <Tabs defaultValue={requestedTab} className="mt-5">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-black/8 bg-white/55 p-1.5"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="posts">Posts</TabsTrigger><TabsTrigger value="pods">Pods</TabsTrigger><TabsTrigger value="achievements">Milestones</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
          <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <section className="rounded-[1.5rem] border border-black/8 bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#3f6f6b]">Real progress</p><h2 className="mt-1 font-serif text-2xl">Learning rhythm</h2></div>{overview.isOwnProfile ? <Button asChild size="sm" className="rounded-full bg-[#3f6f6b]"><Link href="/app/focus"><Flame />Start focus</Link></Button> : null}</div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={Flame} value={stats.studyStreak} label="day streak" /><Metric icon={Clock3} value={`${stats.studyHours}h`} label="focused" /><Metric icon={Target} value={stats.focusSessions} label="sessions" /><Metric icon={BookOpen} value={stats.resourcesShared} label="resources" /></div><div className="mt-6"><div className="mb-2 flex justify-between text-xs"><span>Next milestone</span><span>{overview.achievements?.find((item) => !item.complete)?.title || "All current milestones complete"}</span></div><Progress value={(() => { const item = overview.achievements?.find((achievement) => !achievement.complete); return item ? (item.progress / item.target) * 100 : 100 })()} /></div></section>
            <section className="rounded-[1.5rem] border border-black/8 bg-[#242725] p-5 text-[#f7f0e5] sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8fbdb7]">Learning circle</p><div className="mt-5 flex -space-x-2">{[...(overview.connections?.followers || []), ...(overview.connections?.following || [])].slice(0, 7).map((person: any) => <Avatar key={person.id} className="size-10 border-2 border-[#242725]"><AvatarImage src={person.avatar || "/placeholder.svg"} /><AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar>)}</div><p className="mt-5 font-serif text-xl leading-tight">Progress is easier to sustain when people notice.</p><p className="mt-3 text-xs leading-5 text-white/45">Connections are now durable, counted once, and reflected across your profile.</p></section>
          </TabsContent>
          <TabsContent value="posts" className="mt-4 space-y-3">{overview.posts?.length ? overview.posts.map((post) => <article key={post.$id} className="rounded-[1.4rem] border border-black/8 bg-card p-5"><div className="flex items-center gap-3"><Avatar className="size-10"><AvatarImage src={profile.avatar || post.authorAvatar || "/placeholder.svg"} /><AvatarFallback>{initials(profile.name)}</AvatarFallback></Avatar><div><p className="text-sm font-semibold">{profile.name}</p><p className="text-xs text-muted-foreground">{relativeTime(post.timestamp)}</p></div><MoreHorizontal className="ml-auto size-4 text-muted-foreground" /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{post.content}</p>{post.imageUrl ? <Image src={post.imageUrl} alt="Post attachment" width={1200} height={800} unoptimized className="mt-4 max-h-[34rem] w-full rounded-2xl object-cover" /> : null}<div className="mt-4 flex gap-5 border-t pt-3 text-xs text-muted-foreground"><span>{post.likes || 0} appreciations</span><span>{post.comments || 0} comments</span></div></article>) : <EmptyState icon={MessageSquare} title="No posts yet" copy="Learning updates will appear here." />}</TabsContent>
          <TabsContent value="pods" className="mt-4 grid gap-3 sm:grid-cols-2">{overview.pods?.length ? overview.pods.map((pod) => <Link key={pod.$id} href={`/app/pods/${pod.$id}`} className="rounded-[1.4rem] border border-black/8 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#dcebe7] text-[#315e59]"><Users className="size-5" /></span><Badge variant="secondary">{pod.memberCount || pod.members?.length || 0} people</Badge></div><h3 className="mt-5 font-serif text-2xl">{pod.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{pod.description || "A place to learn consistently with people."}</p></Link>) : <EmptyState icon={Users} title="No active Pods" copy="Joined Pods will appear here." />}</TabsContent>
          <TabsContent value="achievements" className="mt-4 grid gap-3 sm:grid-cols-2">{overview.achievements?.map((achievement) => <article key={achievement.key} className={`rounded-[1.4rem] border p-5 ${achievement.complete ? "border-[#8fbdb7]/45 bg-[#e8f1ed]" : "border-black/8 bg-card"}`}><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${achievement.complete ? "bg-[#3f6f6b] text-white" : "bg-muted text-muted-foreground"}`}><Award className="size-5" /></span>{achievement.complete ? <Badge className="bg-[#3f6f6b]">Earned</Badge> : <span className="text-xs text-muted-foreground">{achievement.progress}/{achievement.target}</span>}</div><h3 className="mt-4 font-semibold">{achievement.title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{achievement.description}</p><Progress className="mt-4" value={(achievement.progress / achievement.target) * 100} /></article>)}</TabsContent>
          <TabsContent value="activity" className="mt-4 rounded-[1.5rem] border border-black/8 bg-card p-5"><div className="space-y-1">{overview.activity?.length ? overview.activity.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="flex items-center gap-4 rounded-xl p-3 hover:bg-muted/60"><span className="grid size-9 place-items-center rounded-xl bg-[#efe8dc] text-[#76556d]"><Flame className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="text-muted-foreground">{relativeTime(item.timestamp)}</small></span></Link>) : <EmptyState icon={Clock3} title="No activity yet" copy="Posts, resources, and completed focus blocks appear here." />}</div></TabsContent>
        </Tabs>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-w-lg rounded-[1.5rem]"><DialogHeader><DialogTitle className="font-serif text-2xl">Edit learning profile</DialogTitle><DialogDescription>Keep it useful for the people who may learn with you.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label>Name</Label><Input value={edit.name} onChange={(event) => setEdit((value) => ({ ...value, name: event.target.value }))} maxLength={100} /></div><div className="grid gap-2"><Label>Username</Label><Input value={edit.username} onChange={(event) => setEdit((value) => ({ ...value, username: event.target.value }))} maxLength={50} /></div><div className="grid gap-2"><Label>Bio</Label><Textarea value={edit.bio} onChange={(event) => setEdit((value) => ({ ...value, bio: event.target.value }))} maxLength={500} rows={4} /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Location</Label><Input value={edit.location} onChange={(event) => setEdit((value) => ({ ...value, location: event.target.value }))} /></div><div className="grid gap-2"><Label>Website</Label><Input value={edit.website} onChange={(event) => setEdit((value) => ({ ...value, website: event.target.value }))} /></div></div><Button onClick={() => void saveProfile()} className="mt-2 bg-[#76556d] hover:bg-[#62465b]">Save profile</Button></div></DialogContent></Dialog>
    </div>
  )
}

function NetworkStat({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-white/45 px-3 py-3 text-center"><strong className="block text-lg text-[#292620]">{Number(value || 0).toLocaleString()}</strong><span className="text-[11px] text-[#7b7266]">{label}</span></div> }
function Metric({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) { return <div className="rounded-xl bg-[#f4eee4] p-3"><Icon className="size-4 text-[#76556d]" /><strong className="mt-3 block text-xl">{value}</strong><span className="text-[11px] text-muted-foreground">{label}</span></div> }
function EmptyState({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) { return <div className="col-span-full grid min-h-48 place-items-center rounded-[1.4rem] border border-dashed border-black/12 bg-card p-8 text-center"><div><Icon className="mx-auto size-6 text-muted-foreground" /><h3 className="mt-3 font-serif text-xl">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{copy}</p></div></div> }
