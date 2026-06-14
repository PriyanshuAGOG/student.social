export type PodRole = "owner" | "mentor" | "moderator" | "member" | "guest"
export type PodDifficulty = "beginner" | "intermediate" | "advanced" | "expert"
export type PodVisibility = "public" | "private" | "invite_only"
export type PodStatus = "draft" | "active" | "paused" | "completed" | "archived"
export type PodType = "sprint_7_day" | "challenge_14_day" | "cohort_30_day" | "ongoing_community" | "project_based" | "exam_prep" | "mentor_led"

export type PodDocument = {
  $id: string
  name: string
  slug?: string
  shortOutcome?: string
  description?: string
  category?: string
  difficulty?: PodDifficulty | string
  language?: string
  coverImageId?: string
  coverImageUrl?: string
  creatorId: string
  mentorId?: string
  type?: PodType | string
  visibility?: PodVisibility | string
  approvalRequired?: boolean
  maxMembers?: number
  status?: PodStatus | string
  currentSprintId?: string
  currentWeek?: number
  totalWeeks?: number
  weeklyRhythm?: string
  defaultSessionDay?: string
  defaultSessionTime?: string
  timezone?: string
  tags?: string[]
  members?: string[]
  memberCount?: number
  activeMemberCount?: number
  completionRate?: number
  weeklyActivityScore?: number
  healthScore?: number
  nextSessionAt?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type PodMembership = {
  $id: string
  podId: string
  userId: string
  role: PodRole
  status: "pending" | "active" | "muted" | "removed" | "banned" | "invited"
  joinedAt?: string
  lastActiveAt?: string
  progressPercent?: number
  currentStreak?: number
  totalPoints?: number
  tasksCompleted?: number
  sessionsAttended?: number
  resourcesShared?: number
  peerReviewsCompleted?: number
  checkInsCount?: number
  contributionScore?: number
  skills?: string[]
  availability?: string
  notificationPreference?: "all" | "mentions_only" | "muted"
  createdAt?: string
  updatedAt?: string
  profile?: { name?: string; avatar?: string; username?: string }
}

export type RoadmapItem = {
  $id: string
  podId: string
  parentId?: string
  phaseId?: string
  title: string
  description?: string
  type: "phase" | "lesson" | "resource" | "task" | "assignment" | "quiz" | "session" | "project" | "milestone" | "reflection"
  week?: number
  day?: number
  order?: number
  status?: "locked" | "available" | "in_progress" | "completed" | "archived"
  estimatedMinutes?: number
  difficulty?: "easy" | "medium" | "hard"
  points?: number
  resourceIds?: string[]
  taskIds?: string[]
  sessionId?: string
  unlockRule?: string
  dueAt?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type PodTask = {
  $id: string
  podId: string
  roadmapItemId?: string
  title: string
  description?: string
  type: "read" | "watch" | "build" | "write" | "submit" | "peer_review" | "attend_session" | "reflection" | "quiz" | "discussion"
  priority?: "low" | "medium" | "high" | "urgent"
  status?: "backlog" | "today" | "this_week" | "submitted" | "reviewed" | "completed" | "archived"
  assignedTo?: string[]
  assignedRole?: string
  createdBy?: string
  dueAt?: string
  points?: number
  difficulty?: "easy" | "medium" | "hard"
  submissionType?: "none" | "text" | "link" | "file" | "github" | "image" | "video"
  relatedResourceIds?: string[]
  required?: boolean
  allowLateSubmission?: boolean
  order?: number
  createdAt?: string
  updatedAt?: string
  submission?: PodTaskSubmission | null
}

export type PodTaskSubmission = {
  $id: string
  podId: string
  taskId: string
  userId: string
  status: "draft" | "submitted" | "reviewed" | "needs_changes" | "accepted" | "rejected"
  text?: string
  link?: string
  fileIds?: string[]
  feedback?: string
  reviewedBy?: string
  reviewedAt?: string
  submittedAt?: string
  pointsAwarded?: number
  late?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PodSession = {
  $id: string
  podId: string
  title: string
  description?: string
  type?: "study_session" | "live_class" | "doubt_session" | "co_working" | "review" | "demo_day" | "social"
  status?: "scheduled" | "live" | "completed" | "cancelled"
  startsAt: string
  endsAt?: string
  timezone?: string
  hostId?: string
  agenda?: string
  meetingProvider?: "internal" | "jitsi" | "livekit" | "daily" | "zoom_link" | "google_meet_link"
  meetingUrl?: string
  recordingUrl?: string
  whiteboardStateId?: string
  notesResourceId?: string
  maxParticipants?: number
  reminderSent?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PodResource = {
  $id: string
  podId: string
  uploaderId: string
  title: string
  description?: string
  type: "note" | "pdf" | "video" | "link" | "image" | "code" | "flashcard" | "template" | "assignment" | "recording"
  storageFileId?: string
  url?: string
  content?: string
  tags?: string[]
  visibility?: "private" | "pod" | "public"
  attachedToType?: "none" | "roadmap_item" | "task" | "session" | "message"
  attachedToId?: string
  views?: number
  downloads?: number
  bookmarks?: number
  usefulCount?: number
  createdAt?: string
  updatedAt?: string
}

export type PodCheckin = {
  $id: string
  podId: string
  userId: string
  date: string
  mood?: "focused" | "okay" | "stuck" | "tired" | "excited"
  status?: "planned" | "completed" | "blocked" | "skipped"
  todayPlan?: string
  yesterdayProgress?: string
  blocker?: string
  helpNeeded?: boolean
  relatedTaskIds?: string[]
  streakCountAfter?: number
  pointsAwarded?: number
  createdAt?: string
  updatedAt?: string
}

export type PodChannel = {
  $id: string
  podId: string
  name: string
  slug: string
  description?: string
  type: "general" | "doubts" | "resources" | "wins" | "announcements" | "session_chat" | "submissions" | "custom"
  order?: number
  locked?: boolean
  postingRole?: "everyone" | "moderators" | "mentors" | "owner"
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type PodMessage = {
  $id: string
  podId: string
  channelId: string
  senderId: string
  senderName?: string
  content?: string
  type?: "text" | "resource" | "task" | "system" | "attachment" | "submission" | "announcement"
  label?: "none" | "question" | "resource" | "update" | "blocker" | "announcement" | "submission"
  replyToMessageId?: string
  threadRootId?: string
  attachmentIds?: string[]
  pinned?: boolean
  important?: boolean
  edited?: boolean
  editedAt?: string
  deleted?: boolean
  deletedAt?: string
  createdAt?: string
  updatedAt?: string
  reactions?: PodMessageReaction[]
}

export type PodMessageReaction = {
  $id: string
  podId: string
  messageId: string
  userId: string
  emoji: string
  createdAt?: string
}

export type PodInsight = {
  $id: string
  podId: string
  scope: "user" | "pod"
  userId?: string
  period?: "daily" | "weekly" | "monthly"
  periodStart?: string
  periodEnd?: string
  progressPercent?: number
  consistencyScore?: number
  attendanceRate?: number
  taskCompletionRate?: number
  activeMembers?: number
  inactiveMembers?: number
  dropOffRisk?: number
  mostAskedTopics?: string[]
  suggestedActions?: string[]
  generatedAt?: string
}

export type PodBundle = {
  pod: PodDocument
  membership: PodMembership | null
  memberships: PodMembership[]
  roadmap: RoadmapItem[]
  tasks: PodTask[]
  submissions: PodTaskSubmission[]
  sessions: PodSession[]
  resources: PodResource[]
  checkins: PodCheckin[]
  channels: PodChannel[]
  messages: PodMessage[]
  reactions: PodMessageReaction[]
  insights: PodInsight[]
}

export type LeaderboardRow = {
  rank: number
  userId: string
  name: string
  role: PodRole
  points: number
  streak: number
  progressPercent: number
  sessionsAttended: number
  resourcesShared: number
  peerReviewsCompleted: number
  badge: string
  trend: "up" | "flat" | "down"
}

export const POD_COLLECTIONS = {
  pods: "pods",
  memberships: "pod_memberships",
  roadmapItems: "pod_roadmap_items",
  tasks: "pod_tasks",
  taskSubmissions: "pod_task_submissions",
  sessions: "pod_sessions",
  sessionAttendance: "pod_session_attendance",
  resources: "pod_resources",
  checkins: "pod_checkins",
  channels: "pod_chat_channels",
  messages: "pod_messages",
  reactions: "pod_message_reactions",
  insights: "pod_insights",
  invites: "pod_invites",
  notificationsQueue: "pod_notifications_queue",
} as const

export const POD_BUCKETS = {
  covers: "pod-covers",
  resources: "pod-resources",
  chatAttachments: "pod-chat-attachments",
  sessionRecordings: "pod-session-recordings",
} as const
