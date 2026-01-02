// Pod component TypeScript interfaces

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
  events: PodEvent[]
  resources: PodResource[]
  computedStats: { studyHours: number; totalSessions: number; completionRate: number }
  upcomingEvent: PodEvent | null
  podStreak: number
  pledge: string
  pledgeSaved: boolean
  checkIns: CheckIn[]
  rsvps: Record<string, boolean>
  rsvpCounts: Record<string, number>
  leaderboard: PodMember[]
  leaderboardStats: LeaderboardStats
  yourRank: YourRank | null
  studyWithMeEvents: PodEvent[]
  onSavePledge: () => void
  onAddCheckIn: () => void
  onToggleRsvp: (eventId: string) => void
  onSetActiveTab: (tab: string) => void
  onOpenChat: () => void
  onOpenCalendar: () => void
  onOpenVault: () => void
  onJoinUpcoming: () => void
  setPledge: (value: string) => void
  checkInNote: string
  setCheckInNote: (value: string) => void
  activityItems: ActivityItem[]
}

export interface ActivityTabProps {
  activityFeed: ActivityItem[]
  upcomingEvent: PodEvent | null
  resources: PodResource[]
  cheers: Record<string, number>
  reactionCounts: Record<string, number>
  onCheer: (itemId: string, itemType: string) => void
  onJoinUpcoming: () => void
  onOpenCalendar: () => void
  onOpenVault: () => void
  formatAgo: (date: string | number | Date) => string
}

export interface VaultTabProps {
  resources: PodResource[]
  resourceFilter: string
  selectedTag: string
  resourceSearch: string
  availableTypes: string[]
  availableTags: string[]
  filteredResources: PodResource[]
  onFilterChange: (filter: string) => void
  onTagChange: (tag: string) => void
  onSearchChange: (search: string) => void
  onClearFilters: () => void
  onOpenVault: () => void
}

export interface MembersTabProps {
  members: PodMember[]
  totalCount: number
}

export interface PodSidebarProps {
  pod: Pod
  memberProfiles: PodMember[]
  leaderboard: PodMember[]
  leaderboardStats: LeaderboardStats
  yourRank: YourRank | null
  onOpenChat: () => void
}
