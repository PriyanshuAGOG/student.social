"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react"
import type { Pod, PodMember, PodEvent, PodResource, CheckIn, VideoState, WhiteboardState } from "./types"

interface PodContextValue {
  // Pod Data
  pod: Pod | null
  setPod: (pod: Pod | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  isMember: boolean
  setIsMember: (isMember: boolean) => void

  // Members
  memberProfiles: PodMember[]
  setMemberProfiles: (members: PodMember[]) => void

  // Events & Resources
  events: PodEvent[]
  setEvents: (events: PodEvent[]) => void
  resources: PodResource[]
  setResources: (resources: PodResource[]) => void

  // Video State
  videoState: VideoState
  setVideoState: (state: Partial<VideoState>) => void
  joinSession: () => void
  leaveSession: () => void
  toggleVideo: () => void
  toggleAudio: () => void
  toggleScreenShare: () => void

  // Whiteboard State
  whiteboardState: WhiteboardState
  setWhiteboardState: (state: Partial<WhiteboardState>) => void
  selectTool: (tool: WhiteboardState["selectedTool"]) => void

  // Accountability
  pledge: string
  setPledge: (pledge: string) => void
  pledgeSaved: boolean
  setPledgeSaved: (saved: boolean) => void
  checkIns: CheckIn[]
  setCheckIns: (checkIns: CheckIn[]) => void
  checkInNote: string
  setCheckInNote: (note: string) => void

  // RSVPs
  rsvps: Record<string, boolean>
  setRsvps: (rsvps: Record<string, boolean>) => void
  rsvpCounts: Record<string, number>
  setRsvpCounts: (counts: Record<string, number>) => void

  // Reactions
  cheers: Record<string, number>
  setCheers: (cheers: Record<string, number>) => void
  reactionCounts: Record<string, number>
  setReactionCounts: (counts: Record<string, number>) => void

  // UI State
  activeTab: string
  setActiveTab: (tab: string) => void

  // Resource Filters
  resourceFilter: string
  setResourceFilter: (filter: string) => void
  selectedTag: string
  setSelectedTag: (tag: string) => void
  resourceSearch: string
  setResourceSearch: (search: string) => void
}

const PodContext = createContext<PodContextValue | null>(null)

const FALLBACK_POD: Pod = {
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

const DEFAULT_VIDEO_STATE: VideoState = {
  isInSession: false,
  isVideoOn: true,
  isAudioOn: true,
  isScreenSharing: false,
  isConnecting: false,
  error: null,
}

const DEFAULT_WHITEBOARD_STATE: WhiteboardState = {
  selectedTool: "pen",
  isCollaborating: false,
  canUndo: false,
  canRedo: false,
}

interface PodProviderProps {
  children: ReactNode
  podId: string
}

export function PodProvider({ children, podId }: PodProviderProps) {
  // Pod Data
  const [pod, setPod] = useState<Pod | null>(FALLBACK_POD)
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  // Members
  const [memberProfiles, setMemberProfiles] = useState<PodMember[]>([])

  // Events & Resources
  const [events, setEvents] = useState<PodEvent[]>([])
  const [resources, setResources] = useState<PodResource[]>([])

  // Video State
  const [videoState, setVideoStateInternal] = useState<VideoState>(DEFAULT_VIDEO_STATE)

  // Whiteboard State
  const [whiteboardState, setWhiteboardStateInternal] = useState<WhiteboardState>(DEFAULT_WHITEBOARD_STATE)

  // Accountability
  const [pledge, setPledge] = useState("")
  const [pledgeSaved, setPledgeSaved] = useState(false)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [checkInNote, setCheckInNote] = useState("")

  // RSVPs
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({})
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({})

  // Reactions
  const [cheers, setCheers] = useState<Record<string, number>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})

  // UI State
  const [activeTab, setActiveTab] = useState("overview")

  // Resource Filters
  const [resourceFilter, setResourceFilter] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [resourceSearch, setResourceSearch] = useState("")

  // Video Actions
  const setVideoState = useCallback((partial: Partial<VideoState>) => {
    setVideoStateInternal((prev) => ({ ...prev, ...partial }))
  }, [])

  const joinSession = useCallback(() => {
    setVideoState({ isInSession: true, isConnecting: false, error: null })
  }, [setVideoState])

  const leaveSession = useCallback(() => {
    setVideoState({ isInSession: false, isScreenSharing: false })
  }, [setVideoState])

  const toggleVideo = useCallback(() => {
    setVideoStateInternal((prev) => ({ ...prev, isVideoOn: !prev.isVideoOn }))
  }, [])

  const toggleAudio = useCallback(() => {
    setVideoStateInternal((prev) => ({ ...prev, isAudioOn: !prev.isAudioOn }))
  }, [])

  const toggleScreenShare = useCallback(() => {
    setVideoStateInternal((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }))
  }, [])

  // Whiteboard Actions
  const setWhiteboardState = useCallback((partial: Partial<WhiteboardState>) => {
    setWhiteboardStateInternal((prev) => ({ ...prev, ...partial }))
  }, [])

  const selectTool = useCallback((tool: WhiteboardState["selectedTool"]) => {
    setWhiteboardStateInternal((prev) => ({ ...prev, selectedTool: tool }))
  }, [])

  const value = useMemo<PodContextValue>(
    () => ({
      pod,
      setPod,
      isLoading,
      setIsLoading,
      isMember,
      setIsMember,
      memberProfiles,
      setMemberProfiles,
      events,
      setEvents,
      resources,
      setResources,
      videoState,
      setVideoState,
      joinSession,
      leaveSession,
      toggleVideo,
      toggleAudio,
      toggleScreenShare,
      whiteboardState,
      setWhiteboardState,
      selectTool,
      pledge,
      setPledge,
      pledgeSaved,
      setPledgeSaved,
      checkIns,
      setCheckIns,
      checkInNote,
      setCheckInNote,
      rsvps,
      setRsvps,
      rsvpCounts,
      setRsvpCounts,
      cheers,
      setCheers,
      reactionCounts,
      setReactionCounts,
      activeTab,
      setActiveTab,
      resourceFilter,
      setResourceFilter,
      selectedTag,
      setSelectedTag,
      resourceSearch,
      setResourceSearch,
    }),
    [
      pod,
      isLoading,
      isMember,
      memberProfiles,
      events,
      resources,
      videoState,
      setVideoState,
      joinSession,
      leaveSession,
      toggleVideo,
      toggleAudio,
      toggleScreenShare,
      whiteboardState,
      setWhiteboardState,
      selectTool,
      pledge,
      pledgeSaved,
      checkIns,
      checkInNote,
      rsvps,
      rsvpCounts,
      cheers,
      reactionCounts,
      activeTab,
      resourceFilter,
      selectedTag,
      resourceSearch,
    ]
  )

  return <PodContext.Provider value={value}>{children}</PodContext.Provider>
}

export function usePodContext() {
  const context = useContext(PodContext)
  if (!context) {
    throw new Error("usePodContext must be used within a PodProvider")
  }
  return context
}

export { FALLBACK_POD }
