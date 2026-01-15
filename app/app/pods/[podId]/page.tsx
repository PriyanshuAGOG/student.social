"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Settings, Crown, Video, MessageSquare, FolderOpen, Share2, Star, Calendar, Home, ArrowLeft, Zap, Trophy, ChevronRight } from 'lucide-react'
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { podService, resourceService, calendarService, profileService, client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  ClassroomTab, 
  OverviewTab, 
  ActivityTab, 
  VaultTab, 
  MembersTab, 
  CalendarTab, 
  ChatTab,
  PodChatTab,
  EnhancedMembersTab,
  CoursesTab
} from "@/components/pods/tabs"

const FALLBACK_POD = {
  name: "Loading pod...",
  description: "",
  members: 0,
  rating: 0,
  difficulty: "",
  tags: [],
  mentor: null,
  cover: "/placeholder.svg",
  streak: 0,
  progress: 0,
  nextSession: "",
  weeklyHours: "",
  features: [],
  stats: { totalSessions: 0, completionRate: 0, averageRating: 0, studyHours: 0 },
}

export default function PodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const podId = params.podId as string

  const [activeTab, setActiveTab] = useState("overview")
  const [isInSession, setIsInSession] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [selectedTool, setSelectedTool] = useState("pen")
  const [currentVideo, setCurrentVideo] = useState("")
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [pod, setPod] = useState<any>(FALLBACK_POD)
  const [isLoading, setIsLoading] = useState(true)
  const [resources, setResources] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isMember, setIsMember] = useState(false)
  const [memberProfiles, setMemberProfiles] = useState<any[]>([])
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [resourceSearch, setResourceSearch] = useState("")
  const [cheers, setCheers] = useState<Record<string, number>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
  const [pledge, setPledge] = useState("")
  const [pledgeSaved, setPledgeSaved] = useState(false)
  const [checkIns, setCheckIns] = useState<{ id: string; note: string; at: string; by: string }[]>([])
  const [checkInNote, setCheckInNote] = useState("")
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({})
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const podDoc = await podService.getPodDetails(podId)
        const parsedMembers = typeof podDoc.members === "string" ? JSON.parse(podDoc.members) : podDoc.members || []
        const parsedTags = (() => {
          if (Array.isArray(podDoc.tags)) return podDoc.tags
          if (typeof podDoc.tags === "string") {
            try {
              return JSON.parse(podDoc.tags)
            } catch {
              return [podDoc.tags]
            }
          }
          if (Array.isArray(podDoc.matchingTags)) return podDoc.matchingTags
          return []
        })()
        setPod({
          ...FALLBACK_POD,
          ...podDoc,
          members: parsedMembers.length,
          tags: parsedTags,
        })
        setIsMember(parsedMembers.includes(user?.$id))

        if (parsedMembers.length) {
          const profiles = await Promise.all(
            parsedMembers.slice(0, 50).map(async (id: string) => {
              try {
                const profile = await profileService.getProfile(id)
                if (!profile) return null
                return {
                  id,
                  name: profile.name || "Member",
                  role: profile.role || "Member",
                  avatar: profile.avatar || profile.avatarFileId || "/placeholder.svg",
                  isOnline: !!profile.isOnline,
                  bio: profile.bio || "",
                  streak: profile.studyStreak || 0,
                  points: profile.totalPoints || 0,
                }
              } catch (err) {
                console.warn("profile fetch failed", id, err)
                return null
              }
            })
          )
          setMemberProfiles(profiles.filter(Boolean))
        } else {
          setMemberProfiles([])
        }

        const res = await resourceService.getResources(podId, 6, 0)
        setResources(res.documents || [])

        if (calendarService.getPodEvents) {
          const ev = await calendarService.getPodEvents(podId)
          setEvents(ev.documents || [])
        }
      } catch (e: any) {
        toast({ title: "Pod not found", description: e?.message || "", variant: "destructive" })
        router.push("/app/pods")
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podId, user?.$id])

  useEffect(() => {
    if (!client?.subscribe || !podId) return
    const channels = [
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.RESOURCES}.documents`,
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.CALENDAR_EVENTS}.documents`,
    ]
    const unsubscribe = client.subscribe(channels as any, (event: any) => {
      const payload = event?.payload || {}
      if (payload.podId && payload.podId !== podId) return

      const isResource = (event?.events || []).some((e: string) => e.includes(COLLECTIONS.RESOURCES))
      const isCalendar = (event?.events || []).some((e: string) => e.includes(COLLECTIONS.CALENDAR_EVENTS))
      const isDelete = (event?.events || []).some((e: string) => e.endsWith(".delete"))

      if (isResource) {
        setResources((prev) => {
          if (isDelete) return prev.filter((r) => (r.$id || r.id) !== (payload.$id || payload.id))
          const idx = prev.findIndex((r) => (r.$id || r.id) === (payload.$id || payload.id))
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { ...next[idx], ...payload }
            return next
          }
          return [payload, ...prev].slice(0, 20)
        })
      }

      if (isCalendar) {
        setEvents((prev) => {
          if (isDelete) return prev.filter((r) => (r.$id || r.id) !== (payload.$id || payload.id))
          const idx = prev.findIndex((r) => (r.$id || r.id) === (payload.$id || payload.id))
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { ...next[idx], ...payload }
            return next
          }
          return [payload, ...prev].slice(0, 20)
        })
      }
    })

    return () => {
      try {
        if (typeof unsubscribe === "function") unsubscribe()
      } catch (err) {
        console.warn("realtime cleanup failed", err)
      }
    }
  }, [podId])

  useEffect(() => {
    if (!podId || !user?.$id) return
    let cancelled = false

    const loadAccountability = async () => {
      try {
        const [pledgeDoc, checkInsRes, rsvpsRes] = await Promise.all([
          podService.getPledge?.(podId, user.$id),
          podService.listCheckIns?.(podId, 20, 0),
          podService.listRsvps?.(podId),
        ])

        if (cancelled) return

        if (pledgeDoc?.pledge) {
          setPledge(pledgeDoc.pledge)
          setPledgeSaved(true)
        }

        if (checkInsRes?.documents) {
          const normalized = (checkInsRes.documents || []).map((doc: any) => ({
            id: doc.$id || doc.id,
            note: doc.note || "",
            at: doc.createdAt || doc.$createdAt || new Date().toISOString(),
            by: doc.userName || doc.userId || "Member",
          }))
          setCheckIns(normalized)
        }

        if (rsvpsRes?.documents) {
          const userMap: Record<string, boolean> = {}
          const counts: Record<string, number> = {}
          ;(rsvpsRes.documents || []).forEach((doc: any) => {
            const id = doc.eventId
            if (!id) return
            if (doc.isGoing) {
              counts[id] = (counts[id] || 0) + 1
            }
            if (doc.userId === user.$id) {
              userMap[id] = Boolean(doc.isGoing)
            }
          })
          setRsvps(userMap)
          setRsvpCounts(counts)
        }
      } catch (err) {
        console.warn("accountability load failed", err)
      }
    }

    loadAccountability()
    return () => {
      cancelled = true
    }
  }, [podId, user?.$id])

  const handleJoinSession = () => {
    setIsInSession(true)
    toast({
      title: "Joining Session",
      description: `Welcome to ${pod.name} virtual classroom!`,
    })
  }

  const handleLeaveSession = () => {
    setIsInSession(false)
    toast({
      title: "Left Session",
      description: "You've left the virtual classroom",
    })
  }

  const handleVideoToggle = () => {
    setIsVideoOn(!isVideoOn)
    toast({
      title: isVideoOn ? "Camera Off" : "Camera On",
      description: `Your camera is now ${isVideoOn ? "disabled" : "enabled"}`,
    })
  }

  const handleAudioToggle = () => {
    setIsAudioOn(!isAudioOn)
    toast({
      title: isAudioOn ? "Microphone Off" : "Microphone On",
      description: `Your microphone is now ${isAudioOn ? "muted" : "unmuted"}`,
    })
  }

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    toast({
      title: isScreenSharing ? "Screen Share Stopped" : "Screen Share Started",
      description: isScreenSharing ? "You stopped sharing your screen" : "You're now sharing your screen",
    })
  }

  const handlePlayVideo = (videoUrl: string) => {
    setCurrentVideo(videoUrl)
    setIsVideoPlaying(true)
    toast({
      title: "Playing Video",
      description: "Video content loaded successfully",
    })
  }

  const handleOpenChat = () => {
    router.push(`/app/chat?room=${podId}`)
  }

  const handleOpenCalendar = () => {
    router.push(`/app/calendar?pod=${podId}`)
  }

  const handleSavePledge = async () => {
    if (!user?.$id) {
      toast({ title: "Please sign in", variant: "destructive" })
      return
    }
    try {
      await podService.savePledge(podId, user.$id, pledge)
      setPledgeSaved(true)
      toast({ title: "Commitment saved", description: "Stored for your pod to keep you accountable." })
    } catch (err: any) {
      toast({ title: "Could not save pledge", description: err?.message || "Try again", variant: "destructive" })
    }
  }

  const handleAddCheckIn = async () => {
    if (!checkInNote.trim()) return
    if (!user?.$id) {
      toast({ title: "Please sign in", variant: "destructive" })
      return
    }
    try {
      const entry = await podService.addCheckIn(podId, user.$id, checkInNote.trim(), user?.name || "You")
      const entryData = entry as Record<string, any> | null
      const normalized = {
        id: entryData?.$id ?? Date.now().toString(),
        note: entryData?.note ?? checkInNote.trim(),
        at: entryData?.createdAt ?? new Date().toISOString(),
        by: entryData?.userName ?? user?.name ?? "You",
      }
      setCheckIns((prev) => [normalized, ...prev].slice(0, 20))
      setCheckInNote("")
    } catch (err: any) {
      toast({ title: "Check-in failed", description: err?.message || "Try again", variant: "destructive" })
    }
  }

  const handleToggleRsvp = async (eventId: string) => {
    if (!user?.$id) {
      toast({ title: "Please sign in", variant: "destructive" })
      return
    }

    const nextState = !rsvps[eventId]
    setRsvps((prev) => ({ ...prev, [eventId]: nextState }))
    setRsvpCounts((prev) => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] || 0) + (nextState ? 1 : -1)) }))

    try {
      const result = await podService.toggleRsvp(podId, eventId, user.$id, nextState)
      setRsvps((prev) => ({ ...prev, [eventId]: result?.isGoing ?? nextState }))
      if (typeof result?.count === "number") {
        setRsvpCounts((prev) => ({ ...prev, [eventId]: result.count }))
      }
    } catch (err: any) {
      setRsvps((prev) => ({ ...prev, [eventId]: !nextState }))
      setRsvpCounts((prev) => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] || 0) + (nextState ? -1 : 1)) }))
      toast({ title: "RSVP failed", description: err?.message || "Try again", variant: "destructive" })
    }
  }

  const handleOpenVault = () => {
    router.push(`/app/vault?pod=${podId}`)
  }

  const handleJoinUpcoming = () => {
    if (!upcomingEvent) return
    router.push(`/app/calendar?event=${upcomingEvent.$id || upcomingEvent.id}`)
  }

  const handleJoinPod = async () => {
    if (!user?.$id) {
      toast({ title: "Please sign in", variant: "destructive" })
      return
    }
    try {
      await podService.joinPod(podId, user.$id)
      setIsMember(true)
      toast({ title: "Joined pod", description: `Welcome to ${pod.name}` })
    } catch (e: any) {
      toast({ title: "Couldn't join pod", description: e?.message, variant: "destructive" })
    }
  }

  const handleCheer = async (itemId: string, itemType: string) => {
    if (!user?.$id) {
      toast({ title: "Please sign in", variant: "destructive" })
      return
    }
    try {
      const next = await podService.incrementReaction(podId, itemId, itemType, user.$id, 1)
      setReactionCounts((prev) => ({ ...prev, [itemId]: next }))
      setCheers((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }))
    } catch (err: any) {
      toast({ title: "Could not cheer", description: err?.message || "Try again", variant: "destructive" })
    }
  }

  const handleLeavePod = async () => {
    if (!user?.$id) return
    try {
      await podService.leavePod(podId, user.$id)
      setIsMember(false)
      toast({ title: "Left pod", description: `You left ${pod.name}` })
    } catch (e: any) {
      toast({ title: "Couldn't leave pod", description: e?.message, variant: "destructive" })
    }
  }

  const upcomingEvent = useMemo(() => {
    if (!events?.length) return null
    const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const now = Date.now()
    return sorted.find((ev) => new Date(ev.startTime).getTime() >= now) || sorted[0]
  }, [events])

  const computedStats = {
    studyHours: pod?.stats?.studyHours || 0,
    totalSessions: pod?.stats?.totalSessions || events.length,
    completionRate: pod?.stats?.completionRate || 0,
  }

  const activityItems = useMemo(() => {
    const eventItems = (events || []).map((ev) => ({
      id: ev.$id || ev.id,
      type: "session" as const,
      title: ev.title || "Session",
      meta: new Date(ev.startTime).toLocaleString(),
      description: ev.description || "Upcoming session",
      timestamp: new Date(ev.startTime).getTime(),
    }))
    const resourceItems = (resources || []).map((res) => ({
      id: res.$id || res.id,
      type: "resource" as const,
      title: res.title || "Resource",
      meta: new Date(res.$createdAt || res.createdAt || res.updatedAt || Date.now()).toLocaleString(),
      description: res.description || "New resource added",
      timestamp: new Date(res.$createdAt || res.createdAt || res.updatedAt || Date.now()).getTime(),
    }))
    return [...eventItems, ...resourceItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
  }, [events, resources])

  useEffect(() => {
    if (!podId) return
    try {
      const stored = localStorage.getItem(`pod-cheers-${podId}`)
      if (stored) setCheers(JSON.parse(stored))
    } catch (err) {
      console.warn("cheers load failed", err)
    }
  }, [podId])

  useEffect(() => {
    if (!podId) return
    try {
      localStorage.setItem(`pod-cheers-${podId}`, JSON.stringify(cheers))
    } catch (err) {
      console.warn("cheers save failed", err)
    }
  }, [cheers, podId])

  useEffect(() => {
    let cancelled = false
    const loadReactions = async () => {
      try {
        const counts = await podService.getReactions(podId)
        if (!cancelled) setReactionCounts(counts)
      } catch (err) {
        console.warn("load reactions failed", err)
      }
    }
    loadReactions()

    if (client?.subscribe) {
      const unsubscribe = client.subscribe(
        [`databases.${DATABASE_ID}.collections.pod_reactions.documents`],
        () => loadReactions()
      )

      return () => {
        cancelled = true
        try {
          if (typeof unsubscribe === "function") unsubscribe()
        } catch (err) {
          console.warn("reactions unsubscribe failed", err)
        }
      }
    }

    return () => {
      cancelled = true
    }
  }, [podId])

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    ;(resources || []).forEach((res) => {
      const t = (res.type || res.category || "").toString().toLowerCase()
      if (t) types.add(t)
    })
    return ["all", ...Array.from(types)]
  }, [resources])

  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    ;(resources || []).forEach((res) => {
      const raw = Array.isArray(res.tags)
        ? res.tags
        : typeof res.tags === "string"
          ? res.tags.split(",")
          : []
      raw.forEach((tag: string) => {
        const trimmed = tag.trim().toLowerCase()
        if (trimmed) tags.add(trimmed)
      })
    })
    return ["all", ...Array.from(tags)]
  }, [resources])

  const filteredResources = useMemo(() => {
    return (resources || []).filter((res) => {
      const type = (res.type || res.category || "").toString().toLowerCase()
      const tagList = Array.isArray(res.tags)
        ? res.tags
        : typeof res.tags === "string"
          ? res.tags.split(",")
          : []
      const normalizedTags = tagList.map((t: string) => t.trim().toLowerCase())
      const matchesType = resourceFilter === "all" || type === resourceFilter
      const matchesTag = selectedTag === "all" || normalizedTags.includes(selectedTag)
      const text = `${res.title || ""} ${res.description || ""} ${res.category || ""}`.toLowerCase()
      const matchesSearch = !resourceSearch.trim() || text.includes(resourceSearch.trim().toLowerCase())
      return matchesType && matchesTag && matchesSearch
    })
  }, [resources, resourceFilter, selectedTag, resourceSearch])

  useEffect(() => {
    if (!client?.subscribe) return
    const memberSet = new Set(
      Array.isArray(pod.members)
        ? pod.members
        : typeof pod.members === "string"
          ? (() => { try { return JSON.parse(pod.members) } catch { return [] } })()
          : []
    )
    if (memberSet.size === 0) return

    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.${COLLECTIONS.PROFILES}.documents`],
      (event: any) => {
        const payload = event?.payload || {}
        const id = payload.$id || payload.userId
        if (!id || !memberSet.has(id)) return
        setMemberProfiles((prev) => {
          const idx = prev.findIndex((m) => m.id === id)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = {
            ...next[idx],
            isOnline: payload.isOnline ?? next[idx].isOnline,
            bio: payload.bio ?? next[idx].bio,
            lastSeen: payload.lastSeen ?? next[idx].lastSeen,
          }
          return next
        })
      }
    )

    return () => {
      try {
        if (typeof unsubscribe === "function") unsubscribe()
      } catch (err) {
        console.warn("presence unsubscribe failed", err)
      }
    }
  }, [pod.members])

  const leaderboard = useMemo(() => {
    return [...memberProfiles]
      .sort((a, b) => (b.streak || 0) - (a.streak || 0) || (b.points || 0) - (a.points || 0))
      .slice(0, 5)
  }, [memberProfiles])

  const leaderboardStats = useMemo(() => {
    if (!memberProfiles.length) return { avgStreak: 0, avgPoints: 0, topName: "" }
    const totalStreak = memberProfiles.reduce((sum, m) => sum + (m.streak || 0), 0)
    const totalPoints = memberProfiles.reduce((sum, m) => sum + (m.points || 0), 0)
    return {
      avgStreak: Math.round(totalStreak / memberProfiles.length),
      avgPoints: Math.round(totalPoints / memberProfiles.length),
      topName: leaderboard[0]?.name || "",
    }
  }, [memberProfiles, leaderboard])

  const yourRank = useMemo(() => {
    if (!user?.$id || !memberProfiles.length) return null
    const sorted = [...memberProfiles].sort((a, b) => (b.streak || 0) - (a.streak || 0) || (b.points || 0) - (a.points || 0))
    const idx = sorted.findIndex((m) => m.id === user.$id)
    if (idx === -1) return null
    return { rank: idx + 1, streak: sorted[idx].streak || 0, points: sorted[idx].points || 0 }
  }, [memberProfiles, user?.$id])

  const podStreak = useMemo(() => {
    const completed = (events || [])
      .filter((ev) => ev.isCompleted && ev.startTime)
      .map((ev) => new Date(ev.startTime).toISOString().slice(0, 10))
    const uniqueDays = Array.from(new Set(completed)).sort((a, b) => b.localeCompare(a))
    let streak = 0
    let cursor = new Date()
    for (const day of uniqueDays) {
      const cursorStr = cursor.toISOString().slice(0, 10)
      if (day === cursorStr) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [events])

  const studyWithMeEvents = useMemo(() => {
    return (events || []).filter((ev) => (ev.type || ev.title || "").toLowerCase().includes("study"))
  }, [events])

  const formatAgo = (dateInput: string | number | Date) => {
    const ts = new Date(dateInput).getTime()
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const activityFeed = useMemo(() => {
    const items = [] as Array<{ id: string; type: "session" | "resource"; title: string; description: string; timestamp: number }>
    ;(events || []).forEach((ev) => {
      items.push({
        id: ev.$id || ev.id,
        type: "session",
        title: ev.title || "Session",
        description: ev.description || "Session update",
        timestamp: new Date(ev.startTime || ev.$createdAt || Date.now()).getTime(),
      })
    })
    ;(resources || []).forEach((res) => {
      items.push({
        id: res.$id || res.id,
        type: "resource",
        title: res.title || "Resource",
        description: res.description || "Resource added",
        timestamp: new Date(res.$createdAt || res.createdAt || Date.now()).getTime(),
      })
    })
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
  }, [events, resources])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{pod.name}</h1>
            <p className="text-sm text-muted-foreground">{pod.members?.toLocaleString?.() || 0} members</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block relative mb-8">
        <img
          src={pod.cover || "/placeholder.svg"}
          alt={`${pod.name} cover`}
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold">{pod.name}</h1>
              <p className="text-lg opacity-90">{pod.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-white/20 text-white border-white/30">
              <Users className="w-3 h-3 mr-1" />
              {pod.members?.toLocaleString?.() || 0} members
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <Star className="w-3 h-3 mr-1" />
              {pod.rating || "New"} rating
            </Badge>
            {pod.difficulty && <Badge className="bg-white/20 text-white border-white/30">{pod.difficulty}</Badge>}
            {pod.role === "Leader" && (
              <Badge className="bg-yellow-500/80 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            )}
          </div>
        </div>
        <div className="absolute top-6 right-6">
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {isMember && (
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={handleLeavePod}>
                <Settings className="w-4 h-4 mr-1" />
                Leave
              </Button>
            )}
            {!isMember && (
              <Button variant="default" className="bg-primary" onClick={handleJoinPod}>
                Join
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        {/* Navigation Tabs - Consolidated to 4 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-secondary/50 rounded-lg p-1 max-w-fit overflow-x-auto">
            {[
              { value: "overview", label: "Overview", icon: Home },
              { value: "courses", label: "Courses", icon: FolderOpen },
              { value: "chat", label: "Chat", icon: MessageSquare },
              { value: "members", label: "Members", icon: Users },
              { value: "classroom", label: "Study Room", icon: Video },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab
            pod={pod}
            memberProfiles={memberProfiles}
            computedStats={computedStats}
            upcomingEvent={upcomingEvent}
            podStreak={podStreak}
            pledge={pledge}
            setPledge={setPledge}
            pledgeSaved={pledgeSaved}
            checkIns={checkIns}
            checkInNote={checkInNote}
            setCheckInNote={setCheckInNote}
            studyWithMeEvents={studyWithMeEvents}
            rsvps={rsvps}
            rsvpCounts={rsvpCounts}
            leaderboard={leaderboard}
            leaderboardStats={leaderboardStats}
            yourRank={yourRank}
            activityItems={activityItems}
            handleSavePledge={handleSavePledge}
            handleAddCheckIn={handleAddCheckIn}
            handleToggleRsvp={handleToggleRsvp}
            handleJoinUpcoming={handleJoinUpcoming}
            handleOpenChat={() => setActiveTab("chat")}
            handleOpenCalendar={handleOpenCalendar}
            handleOpenVault={handleOpenVault}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === "chat" && (
          <PodChatTab
            podId={podId}
            podName={pod.name}
            members={memberProfiles}
          />
        )}

        {activeTab === "courses" && (
          <CoursesTab
            podId={podId}
            podName={pod.name}
          />
        )}

        {activeTab === "members" && (
          <EnhancedMembersTab
            podId={podId}
            pod={pod}
            memberProfiles={memberProfiles}
            isCreator={pod.creatorId === user?.$id}
            onMemberInvited={() => {
              // Refresh pod data
              podService.getPodDetails(podId).then((podDoc) => {
                const parsedMembers = typeof podDoc.members === "string" ? JSON.parse(podDoc.members) : podDoc.members || []
                setPod((prev: typeof pod | null) => ({
                  ...prev,
                  ...podDoc,
                  members: parsedMembers.length,
                }))
              }).catch(console.error)
            }}
          />
        )}

        {activeTab === "classroom" && (
          <ClassroomTab
            podId={podId}
            podName={pod.name}
            members={memberProfiles}
            resources={resources}
            onOpenChat={() => setActiveTab("chat")}
            onOpenVault={handleOpenVault}
          />
        )}
      </div>
    </div>
  )
}
