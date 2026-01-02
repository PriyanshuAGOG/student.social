/** Pod component TypeScript interfaces and type definitions */

/**
 * Represents a pod member with presence and performance metrics
 */
export interface PodMember {
  id: string
  name: string
  role: string
  avatar: string
  isOnline: boolean
  bio?: string
  streak: number
  points: number
  lastSeen?: string
}

/**
 * Represents a pod event (session, meeting, etc.)
 */
export interface PodEvent {
  $id?: string
  id?: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  type?: string
  isCompleted?: boolean
  podId?: string
}

/**
 * Represents a learning resource (video, document, link, etc.)
 */
export interface PodResource {
  $id?: string
  id?: string
  title: string
  description?: string
  type?: string
  category?: string
  tags?: string | string[]
  fileUrl?: string
  link?: string
  thumbnail?: string
  authorId?: string
  downloads?: number
  podId?: string
  $createdAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface PodMentor {
  name: string
  title: string
  avatar: string
  bio: string
}

export interface PodStats {
  totalSessions: number
  completionRate: number
  averageRating: number
  studyHours: number
}

export interface Pod {
  $id?: string
  id?: string
  name: string
  description: string
  members: number | string[]
  rating: number
  difficulty: string
  tags: string[]
  mentor: PodMentor | null
  cover: string
  streak: number
  progress: number
  nextSession: string
  weeklyHours: string
  features: string[]
  stats: PodStats
  role?: string
  matchingTags?: string[]
}

export interface CheckIn {
  id: string
  note: string
  at: string
  by: string
}

export interface ActivityItem {
  id: string
  type: "session" | "resource"
  title: string
  description: string
  timestamp: number
  meta?: string
}

export interface LeaderboardStats {
  avgStreak: number
  avgPoints: number
  topName: string
}

export interface YourRank {
  rank: number
  streak: number
  points: number
}

// Video conferencing types
export interface VideoState {
  isInSession: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  isScreenSharing: boolean
  isConnecting: boolean
  error: string | null
}

// Whiteboard types
export interface WhiteboardState {
  selectedTool: "pen" | "square" | "circle" | "text" | "eraser" | "select"
  isCollaborating: boolean
  canUndo: boolean
  canRedo: boolean
}

// Component Props
export interface VideoConferenceProps {
  podId: string
  podName: string
  onJoin?: () => void
  onLeave?: () => void
}

export interface WhiteboardCanvasProps {
  podId: string
  readOnly?: boolean
  onSave?: (data: unknown) => void
}

export interface SessionControlsProps {
  isInSession: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  isScreenSharing: boolean
  onJoinSession: () => void
  onLeaveSession: () => void
  onVideoToggle: () => void
  onAudioToggle: () => void
  onScreenShare: () => void
}

export interface ParticipantsListProps {
  members: PodMember[]
  maxDisplay?: number
  compact?: boolean
}

export interface ClassroomTabProps {
  podId: string
  podName: string
  members: PodMember[]
  resources: PodResource[]
  onOpenChat: () => void
  onOpenVault: () => void
}

export interface OverviewTabProps {
  pod: Pod
  memberProfiles: PodMember[]
  computedStats: { studyHours: number; totalSessions: number; completionRate: number }
  upcomingEvent: PodEvent | null
  podStreak: number
  pledge: string
  pledgeSaved: boolean
  checkIns: CheckIn[]
  checkInNote: string
  rsvps: Record<string, boolean>
  rsvpCounts: Record<string, number>
  leaderboard: PodMember[]
  leaderboardStats: LeaderboardStats
  yourRank: YourRank | null
  studyWithMeEvents: PodEvent[]
  activityItems: ActivityItem[]
  setPledge: (value: string) => void
  setCheckInNote: (value: string) => void
  handleSavePledge: () => void
  handleAddCheckIn: () => void
  handleToggleRsvp: (eventId: string) => void
  handleJoinUpcoming: () => void
  handleOpenChat: () => void
  handleOpenCalendar: () => void
  handleOpenVault: () => void
  onTabChange: (tab: string) => void
}

export interface ActivityTabProps {
  activityFeed: ActivityItem[]
  upcomingEvent: PodEvent | null
  resources: PodResource[]
  cheers: Record<string, number>
  reactionCounts: Record<string, number>
  handleCheer: (itemId: string, itemType: string) => void
  handleJoinUpcoming: () => void
  handleOpenCalendar: () => void
  handleOpenVault: () => void
  formatAgo: (timestamp: number) => string
}

export interface VaultTabProps {
  resources: PodResource[]
  resourceFilter: string
  selectedTag: string
  resourceSearch: string
  availableTypes: string[]
  availableTags: string[]
  filteredResources: PodResource[]
  setResourceFilter: (filter: string) => void
  setSelectedTag: (tag: string) => void
  setResourceSearch: (search: string) => void
  handleOpenVault: () => void
}

export interface MembersTabProps {
  pod: Pod
  memberProfiles: PodMember[]
}

export interface CalendarTabProps {
  handleOpenCalendar: () => void
}

export interface ChatTabProps {
  handleOpenChat: () => void
}

export interface PodSidebarProps {
  pod: Pod
  memberProfiles: PodMember[]
  leaderboard: PodMember[]
  leaderboardStats: LeaderboardStats
  yourRank: YourRank | null
  handleOpenChat: () => void
}
