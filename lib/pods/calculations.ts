import type { LeaderboardRow, PodCheckin, PodMembership, PodSession, PodTask, PodTaskSubmission } from "./types"

export const POD_POINTS = {
  dailyCheckin: 5,
  taskCompleted: 10,
  taskSubmitted: 20,
  sessionAttended: 15,
  resourceUploaded: 10,
  helpfulReaction: 2,
  peerReviewCompleted: 15,
  finalProjectSubmitted: 50,
} as const

export function calculateUserPodProgress(input: {
  tasks: PodTask[]
  submissions: PodTaskSubmission[]
  sessions: PodSession[]
  attendedSessionIds: string[]
  checkins: PodCheckin[]
  resourcesShared: number
  peerReviewsCompleted: number
  userId: string
}) {
  const userSubmissions = input.submissions.filter((submission) => submission.userId === input.userId)
  const completedTaskIds = new Set(
    userSubmissions
      .filter((submission) => ["submitted", "reviewed", "accepted"].includes(submission.status))
      .map((submission) => submission.taskId),
  )
  const requiredTasks = input.tasks.filter((task) => task.required !== false && task.status !== "archived")
  const taskScore = requiredTasks.length ? completedTaskIds.size / requiredTasks.length : 0
  const sessionScore = input.sessions.length ? input.attendedSessionIds.length / input.sessions.length : 0
  const checkinScore = Math.min(input.checkins.filter((checkin) => checkin.userId === input.userId).length / 7, 1)
  const resourceScore = Math.min(input.resourcesShared / 3, 1)
  const reviewScore = Math.min(input.peerReviewsCompleted / 2, 1)

  return Math.round((taskScore * 50 + sessionScore * 20 + checkinScore * 15 + resourceScore * 10 + reviewScore * 5) * 100) / 100
}

export function calculatePodCompletionRate(memberships: PodMembership[]) {
  const active = memberships.filter((membership) => membership.status === "active")
  if (!active.length) return 0
  const total = active.reduce((sum, membership) => sum + Number(membership.progressPercent || 0), 0)
  return Math.round(total / active.length)
}

export function calculatePodHealthScore(input: {
  memberships: PodMembership[]
  checkins: PodCheckin[]
  tasks: PodTask[]
  submissions: PodTaskSubmission[]
  sessions: PodSession[]
}) {
  const active = input.memberships.filter((membership) => membership.status === "active")
  if (!active.length) return 0
  const now = Date.now()
  const activeThisWeek = active.filter((membership) => {
    const lastActive = membership.lastActiveAt ? new Date(membership.lastActiveAt).getTime() : 0
    return now - lastActive < 1000 * 60 * 60 * 24 * 7
  }).length
  const activityScore = activeThisWeek / active.length
  const checkinScore = Math.min(input.checkins.length / Math.max(active.length * 3, 1), 1)
  const requiredTasks = input.tasks.filter((task) => task.required !== false && task.status !== "archived")
  const taskScore = requiredTasks.length
    ? new Set(input.submissions.filter((submission) => ["submitted", "reviewed", "accepted"].includes(submission.status)).map((submission) => `${submission.userId}:${submission.taskId}`)).size /
      Math.max(requiredTasks.length * active.length, 1)
    : 0.5
  const sessionScore = input.sessions.some((session) => session.status === "scheduled" || session.status === "live") ? 1 : 0.55
  return Math.round((activityScore * 35 + checkinScore * 20 + taskScore * 30 + sessionScore * 15) * 100) / 100
}

export function calculateLeaderboard(memberships: PodMembership[]): LeaderboardRow[] {
  return memberships
    .filter((membership) => membership.status === "active")
    .map((membership) => {
      const points = Number(membership.totalPoints || 0)
      const streak = Number(membership.currentStreak || 0)
      const progressPercent = Number(membership.progressPercent || 0)
      const badge =
        streak >= 7 ? "Consistency Machine" :
        Number(membership.sessionsAttended || 0) >= 4 ? "Deep Work Leader" :
        Number(membership.resourcesShared || 0) >= 3 ? "Resource Hero" :
        Number(membership.peerReviewsCompleted || 0) >= 2 ? "Best Reviewer" :
        progressPercent >= 80 ? "Sprint Finisher" :
        "Most Improved"

      return {
        rank: 0,
        userId: membership.userId,
        name: membership.profile?.name || membership.profile?.username || `Member ${membership.userId.slice(0, 5)}`,
        username: membership.profile?.username || "",
        avatar: membership.profile?.avatar || "",
        role: membership.role,
        points,
        streak,
        progressPercent,
        sessionsAttended: Number(membership.sessionsAttended || 0),
        resourcesShared: Number(membership.resourcesShared || 0),
        peerReviewsCompleted: Number(membership.peerReviewsCompleted || 0),
        badge,
        trend: progressPercent > 70 ? "up" : progressPercent < 20 ? "down" : "flat",
      } satisfies LeaderboardRow
    })
    .sort((a, b) => b.points - a.points || b.streak - a.streak || b.progressPercent - a.progressPercent)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

export function toggleReactionState<T extends { messageId: string; userId: string; emoji: string }>(
  reactions: T[],
  next: T,
) {
  const exists = reactions.some(
    (reaction) => reaction.messageId === next.messageId && reaction.userId === next.userId && reaction.emoji === next.emoji,
  )
  return exists
    ? reactions.filter((reaction) => !(reaction.messageId === next.messageId && reaction.userId === next.userId && reaction.emoji === next.emoji))
    : [...reactions, next]
}

export function canTransitionTaskStatus(from: string, to: string, role: string) {
  const mentorStatuses = new Set(["backlog", "today", "this_week", "submitted", "reviewed", "completed", "archived"])
  if (["owner", "mentor", "moderator"].includes(role)) return mentorStatuses.has(to)
  const memberTransitions: Record<string, string[]> = {
    backlog: ["today"],
    today: ["submitted", "completed"],
    this_week: ["submitted", "completed"],
    submitted: [],
    reviewed: ["completed"],
    completed: [],
  }
  return (memberTransitions[from] || []).includes(to)
}
