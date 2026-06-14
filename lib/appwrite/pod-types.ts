export const POD_COLLECTION_IDS = {
  pods: "pods",
  memberships: "pod_memberships",
  roadmapItems: "pod_roadmap_items",
  tasks: "pod_tasks",
  taskSubmissions: "pod_task_submissions",
  sessions: "pod_sessions",
  sessionAttendance: "pod_session_attendance",
  resources: "pod_resources",
  checkins: "pod_checkins",
  chatChannels: "pod_chat_channels",
  messages: "pod_messages",
  messageReactions: "pod_message_reactions",
  insights: "pod_insights",
  invites: "pod_invites",
  notificationsQueue: "pod_notifications_queue",
} as const

export const POD_BUCKET_IDS = {
  covers: "pod-covers",
  resources: "pod-resources",
  chatAttachments: "pod-chat-attachments",
  sessionRecordings: "pod-session-recordings",
} as const

export type PodRole = "owner" | "mentor" | "moderator" | "member" | "guest"
export type PodDifficulty = "beginner" | "intermediate" | "advanced" | "expert"
export type PodVisibility = "public" | "private" | "invite_only"
export type PodStatus = "draft" | "active" | "paused" | "completed" | "archived"
export type PodTaskStatus = "backlog" | "today" | "this_week" | "submitted" | "reviewed" | "completed" | "archived"

export interface PodDocument {
  $id: string
  name: string
  slug?: string
  shortOutcome?: string
  description?: string
  category?: string
  difficulty?: PodDifficulty | string
  visibility?: PodVisibility | string
  status?: PodStatus | string
  creatorId?: string
  mentorId?: string
  memberCount?: number
  activeMemberCount?: number
  completionRate?: number
  weeklyActivityScore?: number
  healthScore?: number
  currentSprintId?: string
  currentWeek?: number
  totalWeeks?: number
  weeklyRhythm?: string
  nextSessionAt?: string
  tags?: string[] | string
  members?: string[] | string
  coverImageUrl?: string
  cover?: string
  createdAt?: string
  updatedAt?: string
  $createdAt?: string
  $updatedAt?: string
}

export interface PodMembershipDocument {
  $id?: string
  podId: string
  userId: string
  role: PodRole
  status: "pending" | "active" | "muted" | "removed" | "banned" | "invited"
  progressPercent?: number
  currentStreak?: number
  totalPoints?: number
  tasksCompleted?: number
  sessionsAttended?: number
  resourcesShared?: number
  peerReviewsCompleted?: number
  checkInsCount?: number
  contributionScore?: number
  lastActiveAt?: string
}

export interface PodRoadmapItemDocument {
  $id: string
  podId: string
  title: string
  description?: string
  type: "phase" | "lesson" | "resource" | "task" | "assignment" | "quiz" | "session" | "project" | "milestone" | "reflection"
  week?: number
  day?: number
  order?: number
  status?: "locked" | "available" | "in_progress" | "completed" | "archived"
  estimatedMinutes?: number
  points?: number
  dueAt?: string
}

export interface PodTaskDocument {
  $id: string
  podId: string
  roadmapItemId?: string
  title: string
  description?: string
  type?: "read" | "watch" | "build" | "write" | "submit" | "peer_review" | "attend_session" | "reflection" | "quiz" | "discussion"
  priority?: "low" | "medium" | "high" | "urgent"
  status?: PodTaskStatus
  assignedTo?: string[]
  dueAt?: string
  points?: number
  required?: boolean
}

export interface PodTaskSubmissionDocument {
  $id?: string
  podId: string
  taskId: string
  userId: string
  status: "draft" | "submitted" | "reviewed" | "needs_changes" | "accepted" | "rejected"
  submittedAt?: string
  pointsAwarded?: number
}

export interface PodSessionDocument {
  $id: string
  podId: string
  title: string
  description?: string
  type?: "study_session" | "live_class" | "doubt_session" | "co_working" | "review" | "demo_day" | "social"
  status?: "scheduled" | "live" | "completed" | "cancelled"
  startsAt?: string
  startTime?: string
  endsAt?: string
  meetingUrl?: string
  hostId?: string
}

export interface PodResourceDocument {
  $id: string
  podId: string
  uploaderId?: string
  authorId?: string
  title: string
  description?: string
  type?: "note" | "pdf" | "video" | "link" | "image" | "code" | "flashcard" | "template" | "assignment" | "recording"
  url?: string
  tags?: string[] | string
  visibility?: "private" | "pod" | "public"
  views?: number
  downloads?: number
  bookmarks?: number
  usefulCount?: number
  createdAt?: string
  $createdAt?: string
}
