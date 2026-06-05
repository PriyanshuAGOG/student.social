import type {
  PodMembershipDocument,
  PodSessionDocument,
  PodTaskDocument,
  PodTaskSubmissionDocument,
} from "./pod-types"

export const POD_POINTS = {
  dailyCheckIn: 5,
  taskCompleted: 10,
  taskSubmitted: 20,
  sessionAttended: 15,
  resourceUploaded: 10,
  helpfulReactionReceived: 2,
  peerReviewCompleted: 15,
  finalProjectSubmitted: 50,
} as const

export function calculateUserPodProgress(input: {
  tasks?: PodTaskDocument[]
  submissions?: PodTaskSubmissionDocument[]
  sessions?: PodSessionDocument[]
  attendedSessionIds?: string[]
  checkInsCount?: number
  resourcesShared?: number
  peerReviewsCompleted?: number
}) {
  const tasks = input.tasks || []
  const requiredTasks = tasks.filter((task) => task.required !== false)
  const completedTaskIds = new Set(
    (input.submissions || [])
      .filter((submission) => ["submitted", "reviewed", "accepted"].includes(submission.status))
      .map((submission) => submission.taskId),
  )
  const taskScore = requiredTasks.length ? completedTaskIds.size / requiredTasks.length : 0
  const scheduledSessions = (input.sessions || []).filter((session) => session.status !== "cancelled")
  const attended = new Set(input.attendedSessionIds || [])
  const sessionScore = scheduledSessions.length ? attended.size / scheduledSessions.length : 0
  const checkInScore = Math.min((input.checkInsCount || 0) / 7, 1)
  const resourceScore = Math.min((input.resourcesShared || 0) / 3, 1)
  const peerReviewScore = Math.min((input.peerReviewsCompleted || 0) / 2, 1)

  return Math.round(
    (taskScore * 0.5 + sessionScore * 0.2 + checkInScore * 0.15 + resourceScore * 0.1 + peerReviewScore * 0.05) * 100,
  )
}

export function calculatePodCompletionRate(memberships: PodMembershipDocument[]) {
  const active = memberships.filter((membership) => membership.status === "active")
  if (!active.length) return 0
  const total = active.reduce((sum, membership) => sum + (membership.progressPercent || 0), 0)
  return Math.round(total / active.length)
}

export function calculatePodHealthScore(input: {
  memberships?: PodMembershipDocument[]
  sessions?: PodSessionDocument[]
  tasks?: PodTaskDocument[]
  submissions?: PodTaskSubmissionDocument[]
}) {
  const memberships = input.memberships || []
  const active = memberships.filter((membership) => membership.status === "active")
  const recentlyActive = active.filter((membership) => {
    if (!membership.lastActiveAt) return false
    return Date.now() - new Date(membership.lastActiveAt).getTime() < 1000 * 60 * 60 * 24 * 7
  })
  const activeRatio = active.length ? recentlyActive.length / active.length : 0
  const completionRate = calculatePodCompletionRate(active)
  const tasks = input.tasks || []
  const submissions = input.submissions || []
  const taskVelocity = tasks.length ? Math.min(submissions.length / tasks.length, 1) : 0
  const liveSessions = (input.sessions || []).filter((session) => session.status === "live" || session.status === "completed")
  const sessionSignal = Math.min(liveSessions.length / 4, 1)

  return Math.round(activeRatio * 35 + completionRate * 0.35 + taskVelocity * 20 + sessionSignal * 10)
}

export function calculateLeaderboard(memberships: PodMembershipDocument[]) {
  return [...memberships]
    .filter((membership) => membership.status === "active")
    .sort((a, b) => {
      const scoreA = a.totalPoints || 0
      const scoreB = b.totalPoints || 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return (b.currentStreak || 0) - (a.currentStreak || 0)
    })
    .map((membership, index) => ({
      ...membership,
      rank: index + 1,
      badge:
        (membership.currentStreak || 0) >= 7
          ? "Consistency Machine"
          : (membership.resourcesShared || 0) >= 3
            ? "Resource Hero"
            : (membership.peerReviewsCompleted || 0) >= 2
              ? "Best Reviewer"
              : "Sprint Finisher",
    }))
}

export function nextTaskStatus(current: string, action: "start" | "submit" | "review" | "complete" | "archive") {
  const transitions: Record<string, Record<string, string>> = {
    backlog: { start: "today", archive: "archived" },
    today: { submit: "submitted", complete: "completed", archive: "archived" },
    this_week: { submit: "submitted", complete: "completed", archive: "archived" },
    submitted: { review: "reviewed", complete: "completed", archive: "archived" },
    reviewed: { complete: "completed", archive: "archived" },
    completed: { archive: "archived" },
  }
  return transitions[current]?.[action] || current
}

export function toggleUniqueReaction<T extends { userId: string; emoji: string }>(reactions: T[], reaction: T) {
  const exists = reactions.some((item) => item.userId === reaction.userId && item.emoji === reaction.emoji)
  if (exists) return reactions.filter((item) => !(item.userId === reaction.userId && item.emoji === reaction.emoji))
  return [...reactions, reaction]
}

export function generateFallbackRoadmap(topic: string) {
  const cleanTopic = topic.trim() || "the topic"
  return [
    { type: "phase", week: 1, title: `Foundations of ${cleanTopic}`, description: "Set up vocabulary, tools, and the first repeatable learning habit." },
    { type: "task", week: 1, title: `Map what you already know about ${cleanTopic}`, points: 10 },
    { type: "phase", week: 2, title: `Guided practice`, description: "Turn concepts into small exercises and peer discussion." },
    { type: "task", week: 2, title: "Complete one practical exercise and post a blocker", points: 20 },
    { type: "phase", week: 3, title: `Applied project`, description: "Build something small enough to finish and concrete enough to review." },
    { type: "task", week: 3, title: "Submit a project checkpoint", points: 20 },
    { type: "phase", week: 4, title: `Review and ship`, description: "Review peer work, close gaps, and publish a final outcome." },
    { type: "task", week: 4, title: "Submit final reflection and next-step plan", points: 50 },
  ]
}
