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
  ChatTab 
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

        const res = await resourceService.getResources({ podId }, 6, 0)
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
      const normalized = {
        id: entry.$id || entry.id,
        note: entry.note || checkInNote.trim(),
        at: entry.createdAt || entry.$createdAt || new Date().toISOString(),
        by: entry.userName || user?.name || "You",
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
      type: "session",
      title: ev.title || "Session",
      meta: new Date(ev.startTime).toLocaleString(),
      description: ev.description || "Upcoming session",
    }))
    const resourceItems = (resources || []).map((res) => ({
      id: res.$id || res.id,
      type: "resource",
      title: res.title || "Resource",
      meta: new Date(res.$createdAt || res.createdAt || res.updatedAt || Date.now()).toLocaleString(),
      description: res.description || "New resource added",
    }))
    return [...eventItems, ...resourceItems]
      .sort((a, b) => new Date(b.meta).getTime() - new Date(a.meta).getTime())
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
      raw.forEach((tag) => {
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
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-secondary/50 rounded-lg p-1 max-w-fit overflow-x-auto">
            {[
              { value: "overview", label: "Overview", icon: Home },
              { value: "activity", label: "Activity", icon: Zap },
              { value: "classroom", label: "Classroom", icon: Video },
              { value: "chat", label: "Chat", icon: MessageSquare },
              { value: "vault", label: "Vault", icon: FolderOpen },
              { value: "members", label: "Members", icon: Users },
              { value: "calendar", label: "Calendar", icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
            handleOpenChat={handleOpenChat}
            handleOpenCalendar={handleOpenCalendar}
            handleOpenVault={handleOpenVault}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab
            activityFeed={activityFeed}
            upcomingEvent={upcomingEvent}
            resources={resources}
            cheers={cheers}
            reactionCounts={reactionCounts}
            handleCheer={handleCheer}
            handleJoinUpcoming={handleJoinUpcoming}
            handleOpenCalendar={handleOpenCalendar}
            handleOpenVault={handleOpenVault}
            formatAgo={formatAgo}
          />
        )}

        {activeTab === "classroom" && (
          <ClassroomTab
            podId={podId}
            podName={pod.name}
            members={memberProfiles}
            resources={resources}
            onOpenChat={handleOpenChat}
            onOpenVault={handleOpenVault}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab handleOpenChat={handleOpenChat} />
        )}

        {activeTab === "vault" && (
          <VaultTab
            resources={resources}
            resourceFilter={resourceFilter}
            selectedTag={selectedTag}
            resourceSearch={resourceSearch}
            availableTypes={availableTypes}
            availableTags={availableTags}
            filteredResources={filteredResources}
            setResourceFilter={setResourceFilter}
            setSelectedTag={setSelectedTag}
            setResourceSearch={setResourceSearch}
            handleOpenVault={handleOpenVault}
          />
        )}

        {activeTab === "members" && (
          <MembersTab pod={pod} memberProfiles={memberProfiles} />
        )}

        {activeTab === "calendar" && (
          <CalendarTab handleOpenCalendar={handleOpenCalendar} />
        )}
      </div>
    </div>
  )
}
                  >
                    <FolderOpen className="w-6 h-6" />
                    <span className="text-sm">Resources</span>
                  </Button>
                  <Button
                    onClick={handleOpenCalendar}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">Schedule</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Accountability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> Accountability & Commitments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="p-3 border rounded-lg bg-muted/40">
                      <p className="text-sm text-muted-foreground">Pod streak</p>
                      <p className="text-2xl font-bold">{podStreak} days</p>
                      <p className="text-xs text-muted-foreground">Based on completed sessions</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/40">
                      <p className="text-sm text-muted-foreground">Weekly pledge</p>
                      <p className="text-sm font-semibold line-clamp-2">{pledge || "Add a commitment for this week"}</p>
                      <div className="text-xs text-muted-foreground">Keeps visible to your pod</div>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/40">
                      <p className="text-sm text-muted-foreground">Live RSVPs</p>
                      <p className="text-2xl font-bold">{Object.values(rsvpCounts).reduce((sum, val) => sum + val, 0)}</p>
                      <p className="text-xs text-muted-foreground">Study-with-me RSVPs in this pod</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Set weekly commitment</p>
                      <Textarea
                        placeholder="Example: 3 sessions + 2h review before Friday"
                        value={pledge}
                        onChange={(e) => setPledge(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex items-center justify-between">
                        <Button size="sm" onClick={handleSavePledge}>
                          Save pledge
                        </Button>
                        {pledgeSaved && <Badge variant="secondary" className="text-xs">Saved</Badge>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Peer check-in / standup</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="What did you finish? What's next?"
                          value={checkInNote}
                          onChange={(e) => setCheckInNote(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAddCheckIn}>
                          Post
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {checkIns.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No check-ins yet.</p>
                        ) : (
                          checkIns.map((c) => (
                            <div key={c.id} className="p-2 border rounded-md bg-muted/30">
                              <p className="text-sm font-medium">{c.by}</p>
                              <p className="text-xs text-muted-foreground">{new Date(c.at).toLocaleString()}</p>
                              <p className="text-sm mt-1">{c.note}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Study with me sessions</p>
                    {studyWithMeEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No co-working sessions scheduled yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {studyWithMeEvents.map((ev) => (
                          <div key={ev.$id || ev.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium leading-tight">{ev.title || "Study with me"}</p>
                              <p className="text-xs text-muted-foreground">{new Date(ev.startTime).toLocaleString()}</p>
                              <p className="text-[11px] text-muted-foreground">{rsvpCounts[ev.$id || ev.id] || 0} going</p>
                            </div>
                            <Button size="sm" variant={rsvps[ev.$id || ev.id] ? "secondary" : "outline"} onClick={() => handleToggleRsvp(ev.$id || ev.id)}>
                              {rsvps[ev.$id || ev.id] ? "RSVPed" : "RSVP"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pod Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Pod Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(pod.features || []).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mentor Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Pod Mentor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pod.mentor ? (
                    <>
                      <div className="flex items-center space-x-4">
                        <img
                          src={pod.mentor.avatar || "/placeholder.svg"}
                          alt={pod.mentor.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold">{pod.mentor.name}</h4>
                          <p className="text-sm text-muted-foreground">{pod.mentor.title}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{pod.mentor.bio}</p>
                      <Button className="w-full bg-transparent" variant="outline">
                        Message Mentor
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No mentor assigned yet.</p>
                  )}
                </CardContent>
              </Card>

                {/* Participants */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Participants ({memberProfiles.length || pod.members || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Total members</span>
                      <span className="font-semibold text-foreground">{pod.members?.toLocaleString?.() || 0}</span>
                    </div>
                    {memberProfiles.length === 0 ? (
                      <p className="text-muted-foreground">No roster yet. Use chat to meet your podmates.</p>
                    ) : (
                      <div className="space-y-2">
                        {memberProfiles.slice(0, 6).map((member) => (
                          <div key={member.id} className="flex items-center space-x-3">
                            <div className="relative">
                              <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="w-8 h-8 rounded-full" />
                              {member.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                            </div>
                          </div>
                        ))}
                        {memberProfiles.length > 6 && (
                          <p className="text-xs text-muted-foreground">+{memberProfiles.length - 6} more members</p>
                        )}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleOpenChat}>
                      Open pod chat
                    </Button>
                  </CardContent>
                </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(pod.tags || []).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Pod Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activityFeed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity yet. Add a session or resource to get things moving.</p>
                  ) : (
                    activityFeed.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Badge variant={item.type === "session" ? "secondary" : "outline"} className="text-xs mt-0.5">
                            {item.type === "session" ? "Session" : "Resource"}
                          </Badge>
                          <div>
                            <p className="font-medium leading-tight">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{formatAgo(item.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCheer(item.id, item.type)}
                            aria-label="Cheer"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground w-6 text-center">{reactionCounts[item.id] ?? cheers[item.id] ?? 0}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              item.type === "session"
                                ? handleOpenCalendar()
                                : handleOpenVault()
                            }
                            aria-label="Open"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Upcoming Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvent ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{upcomingEvent.title || "Pod session"}</p>
                      <p className="text-muted-foreground">{new Date(upcomingEvent.startTime).toLocaleString()}</p>
                      <Button size="sm" onClick={handleJoinUpcoming} className="w-full">
                        Join
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Latest Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {resources.slice(0, 3).map((res) => (
                    <div key={res.$id} className="p-2 border rounded-md text-sm">
                      <p className="font-medium truncate">{res.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{res.description || "Resource"}</p>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <p className="text-sm text-muted-foreground">No resources yet. Add some in the vault.</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleOpenVault}>
                    View Vault
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "classroom" && (
          <div className="space-y-6">
            {/* Main Video/Content Area */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {/* Video Player / Screen Share Area */}
                <Card className="bg-black text-white">
                  <CardContent className="p-0 relative aspect-video">
                    {currentVideo ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-16 h-16 mx-auto mb-4 text-white" />
                          <p className="text-lg">Video: Graph Algorithms Explained</p>
                          <p className="text-sm text-gray-400">Duration: 45:30</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                        <div className="text-center">
                          <Video className="w-16 h-16 mx-auto mb-4 text-white" />
                          <p className="text-lg">Virtual Classroom</p>
                          <p className="text-sm text-gray-400">Ready for live session</p>
                        </div>
                      </div>
                    )}

                    {/* Video Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                          className="bg-black/50 hover:bg-black/70"
                        >
                          {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">15:30 / 45:30</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70">
                          <Maximize className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Whiteboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Interactive Whiteboard</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Whiteboard Tools */}
                    <div className="flex items-center space-x-2 mb-4 p-2 bg-secondary/50 rounded-lg">
                      {[
                        { tool: "pen", icon: PenTool, label: "Pen" },
                        { tool: "square", icon: Square, label: "Rectangle" },
                        { tool: "circle", icon: Circle, label: "Circle" },
                        { tool: "text", icon: Type, label: "Text" },
                        { tool: "eraser", icon: Eraser, label: "Eraser" },
                      ].map(({ tool, icon: Icon, label }) => (
                        <Button
                          key={tool}
                          size="sm"
                          variant={selectedTool === tool ? "default" : "ghost"}
                          onClick={() => setSelectedTool(tool)}
                          className="h-8 w-8 p-0"
                        >
                          <Icon className="w-4 h-4" />
                        </Button>
                      ))}
                      <div className="h-6 w-px bg-border mx-2" />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Redo className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Whiteboard Canvas */}
                    <div className="w-full h-64 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <PenTool className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Click and draw on the whiteboard</p>
                        <p className="text-xs">Use tools above to create diagrams and notes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Resources */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Video Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resources.length === 0 && (
                        <p className="text-sm text-muted-foreground">No videos yet. Add resources in the vault.</p>
                      )}
                      {resources.map((resource) => (
                        <div key={resource.$id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-secondary/50">
                          <div className="w-16 h-12 bg-red-600 rounded flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{resource.description || "Pod resource"}</p>
                          </div>
                          <Button size="sm" onClick={() => handlePlayVideo(resource.fileUrl || resource.link || "")}
                            className="bg-primary hover:bg-primary/90">
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Session Controls */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Session Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!isInSession ? (
                      <Button onClick={handleJoinSession} className="w-full bg-green-600 hover:bg-green-700">
                        <Video className="w-4 h-4 mr-2" />
                        Join Live Session
                      </Button>
                    ) : (
                      <Button onClick={handleLeaveSession} variant="destructive" className="w-full">
                        <Video className="w-4 h-4 mr-2" />
                        Leave Session
                      </Button>
                    )}

                    {isInSession && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={isVideoOn ? "default" : "secondary"}
                          onClick={handleVideoToggle}
                          className="flex-1"
                        >
                          {isVideoOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant={isAudioOn ? "default" : "secondary"}
                          onClick={handleAudioToggle}
                          className="flex-1"
                        >
                          {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant={isScreenSharing ? "default" : "outline"}
                          onClick={handleScreenShare}
                          className="col-span-2"
                        >
                          <ScreenShare className="w-4 h-4 mr-2" />
                          {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Participants ({memberProfiles.length || pod.members || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {memberProfiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roster yet. Join to see who’s here.</p>
                    ) : (
                      memberProfiles.slice(0, 10).map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          <div className="relative">
                            <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="w-8 h-8 rounded-full" />
                            {member.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Hand className="w-4 h-4 mr-2" />
                      Raise Hand
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={handleOpenChat}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Chat
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Share File
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Take Notes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-96">
            <Card className="h-full">
              <CardContent className="p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Pod Chat</h3>
                  <p className="text-muted-foreground mb-4">Chat with other pod members</p>
                  <Button onClick={handleOpenChat} className="bg-primary hover:bg-primary/90">
                    Open Full Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "vault" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pod Resources</h3>
                <p className="text-sm text-muted-foreground">Filter by type, tag, or search</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search titles or descriptions"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="h-9 w-56"
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Type:</span>
                  {availableTypes.map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={resourceFilter === f ? "secondary" : "outline"}
                      className="h-8 px-3"
                      onClick={() => setResourceFilter(f)}
                    >
                      {f === "all" ? "All" : f.toUpperCase()}
                    </Button>
                  ))}
                </div>
                {availableTags.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Tags:</span>
                    {availableTags.slice(0, 6).map((tag) => (
                      <Button
                        key={tag}
                        size="sm"
                        variant={selectedTag === tag ? "secondary" : "outline"}
                        className="h-8 px-3"
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag === "all" ? "All" : tag}
                      </Button>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setResourceFilter("all")
                    setSelectedTag("all")
                    setResourceSearch("")
                  }}
                >
                  Clear
                </Button>
                <Button onClick={handleOpenVault} variant="outline" className="bg-transparent">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.length === 0 && <div className="text-sm text-muted-foreground">No resources yet. Add some in the vault.</div>}
              {filteredResources.map((resource) => (
                <Card key={resource.$id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={resource.thumbnail || resource.fileUrl || "/placeholder.svg"}
                        alt={resource.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>By {resource.authorId || ""}</span>
                          <span>{resource.type || resource.category || ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(Array.isArray(resource.tags)
                            ? resource.tags
                            : typeof resource.tags === "string"
                              ? resource.tags.split(",")
                              : []
                          ).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{resource.downloads || 0} downloads</span>
                          <Button size="sm" variant="outline" className="bg-transparent">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pod Members ({pod.members?.toLocaleString?.() || 0})</h3>
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                {memberProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members loaded yet. Join the pod chat to meet others.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {memberProfiles.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name?.slice(0, 2)?.toUpperCase?.() || "M"}</AvatarFallback>
                          </Avatar>
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                          {member.bio && <p className="text-xs text-muted-foreground truncate">{member.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="h-96">
            <Card className="h-full">
              <CardContent className="p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Pod Calendar</h3>
                  <p className="text-muted-foreground mb-4">View upcoming sessions and events</p>
                  <Button onClick={handleOpenCalendar} className="bg-primary hover:bg-primary/90">
                    Open Full Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
