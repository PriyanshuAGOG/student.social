const DAY_MS = 24 * 60 * 60 * 1000

export type ScorePeriod = "weekly" | "monthly" | "all-time"

type ScoreInput = {
  profile?: any
  posts?: any[]
  pods?: any[]
  resources?: any[]
  events?: any[]
  now?: Date
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toDate(value?: string | Date | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function hoursBetween(start?: string, end?: string) {
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (!startDate || !endDate) return 0
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
}

function getPeriodStart(period: ScorePeriod, now = new Date()) {
  if (period === "weekly") return new Date(now.getTime() - 7 * DAY_MS)
  if (period === "monthly") return new Date(now.getTime() - 30 * DAY_MS)
  return new Date(0)
}

function isWithinPeriod(value: any, period: ScorePeriod, now = new Date()) {
  const date = toDate(value)
  if (!date) return period === "all-time"
  return date.getTime() >= getPeriodStart(period, now).getTime()
}

function recencyFactor(value: any, period: ScorePeriod, now = new Date()) {
  const date = toDate(value)
  if (!date) return period === "all-time" ? 0.82 : 0.6
  const ageDays = Math.max(0, (now.getTime() - date.getTime()) / DAY_MS)
  if (period === "weekly") return clamp(1 - ageDays / 14, 0.45, 1.15)
  if (period === "monthly") return clamp(1 - ageDays / 45, 0.55, 1.1)
  return clamp(1 - ageDays / 365, 0.7, 1.05)
}

function pushTopic(topics: Map<string, number>, raw: any, weight: number) {
  if (!raw) return
  const values = Array.isArray(raw) ? raw : [raw]
  values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => {
      topics.set(value, (topics.get(value) || 0) + weight)
    })
}

export function buildAnalyticsSnapshot(input: ScoreInput) {
  const profile = input.profile || {}
  const posts = input.posts || []
  const pods = input.pods || []
  const resources = input.resources || []
  const events = input.events || []

  const completedEvents = events.filter((event) => Boolean(event?.isCompleted))
  const totalEventHours = events.reduce((sum, event) => sum + hoursBetween(event?.startTime, event?.endTime), 0)
  const completedEventHours = completedEvents.reduce((sum, event) => sum + hoursBetween(event?.startTime, event?.endTime), 0)
  const totalHours = Number(profile.totalHours || 0)
  const effectiveStudyHours = totalEventHours > 0 ? totalEventHours : totalHours
  const completionRate = events.length > 0 ? Math.round((completedEvents.length / events.length) * 100) : 0
  const studyStreak = Number(profile.studyStreak || 0)
  const weeklyPattern = WEEKDAY_LABELS.map((name) => ({ name, hours: 0, sessions: 0, focus: 0 }))

  events.forEach((event) => {
    const start = toDate(event?.startTime)
    if (!start) return
    const bucket = weeklyPattern[start.getDay()]
    bucket.hours += hoursBetween(event?.startTime, event?.endTime)
    bucket.sessions += 1
    if (event?.isCompleted) bucket.focus += 18
  })

  if (!events.length && effectiveStudyHours > 0) {
    const baseline = effectiveStudyHours / 7
    weeklyPattern.forEach((bucket, index) => {
      const weekendBoost = index === 0 || index === 6 ? 1.15 : 1
      bucket.hours = Number((baseline * weekendBoost).toFixed(1))
      bucket.sessions = Math.max(1, Math.round(bucket.hours / 1.5))
    })
  }

  weeklyPattern.forEach((bucket) => {
    bucket.hours = Number(bucket.hours.toFixed(1))
    const completionSignal = bucket.sessions > 0 ? bucket.focus / bucket.sessions : completionRate * 0.4
    const consistencySignal = studyStreak > 0 ? Math.min(20, studyStreak) : 5
    bucket.focus = clamp(Math.round(45 + completionSignal + consistencySignal + bucket.hours * 4), 42, 100)
  })

  const topics = new Map<string, number>()
  posts.forEach((post) => pushTopic(topics, post?.tags, 3))
  resources.forEach((resource) => {
    pushTopic(topics, resource?.tags, 3)
    pushTopic(topics, resource?.subject || resource?.category, 2)
  })
  pods.forEach((pod) => {
    pushTopic(topics, pod?.tags, 2)
    pushTopic(topics, pod?.subject || pod?.category, 4)
  })
  events.forEach((event) => pushTopic(topics, event?.subject, 2))

  const topicDistribution = Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, weight]) => ({ name, hours: weight, percentage: 0 }))

  const topicTotal = topicDistribution.reduce((sum, item) => sum + item.hours, 0) || 1
  topicDistribution.forEach((item) => {
    item.percentage = Math.round((item.hours / topicTotal) * 100)
  })

  const focusScore = clamp(
    Math.round(
      40
        + completionRate * 0.32
        + Math.min(20, studyStreak * 1.3)
        + Math.min(12, completedEventHours * 1.4)
        + Math.min(8, posts.length)
        + Math.min(8, resources.length)
    ),
    48,
    100,
  )

  const collaborationScore = clamp(
    Math.round(
      30
        + Math.min(30, pods.length * 8)
        + Math.min(20, posts.length * 2)
        + Math.min(20, resources.length * 3)
        + Math.min(15, asArray(profile.following).length * 1.2)
    ),
    25,
    100,
  )

  return {
    totalHours: Number(effectiveStudyHours.toFixed(1)),
    completionRate,
    focusScore,
    collaborationScore,
    studyStreak,
    sessionsCompleted: completedEvents.length || posts.length + resources.length,
    weeklyPattern,
    topicDistribution: topicDistribution.length > 0 ? topicDistribution : [{ name: "General", hours: 1, percentage: 100 }],
    goals: [
      { id: "hours", title: "Study 50 hours", current: Number(effectiveStudyHours.toFixed(1)), target: 50, deadline: "Monthly target" },
      { id: "sessions", title: "Complete 12 sessions", current: completedEvents.length, target: 12, deadline: "Execution target" },
      { id: "collaboration", title: "Contribute to 3 pods", current: pods.length, target: 3, deadline: "Community target" },
    ],
    achievements: [
      { id: "streak", title: "Consistency", description: `Current study streak: ${studyStreak} days`, earned: studyStreak >= 7 },
      { id: "delivery", title: "Session Finisher", description: `${completedEvents.length} sessions completed`, earned: completedEvents.length >= 5 },
      { id: "sharing", title: "Knowledge Sharer", description: `${resources.length + posts.length} public contributions`, earned: resources.length + posts.length >= 8 },
    ],
    metrics: [
      { title: "Study Streak", value: `${studyStreak} days`, change: `${pods.length} active pods` },
      { title: "Study Hours", value: `${Number(effectiveStudyHours).toFixed(1)}h`, change: `${completionRate}% session completion` },
      { title: "Sessions Completed", value: `${completedEvents.length || posts.length + resources.length}`, change: `${completedEventHours.toFixed(1)}h completed time` },
      { title: "Focus Score", value: `${focusScore}%`, change: `${collaborationScore}% collaboration strength` },
    ],
  }
}

export function computeLearnerScore(profile: any, pods: any[], period: ScorePeriod, now = new Date()) {
  const memberPods = (pods || []).filter((pod) => asArray(pod?.members).includes(profile?.$id))
  const recentPods = memberPods.filter((pod) => isWithinPeriod(pod?.updatedAt || pod?.createdAt, period, now))
  const totalPoints = Number(profile?.totalPoints || 0)
  const totalHours = Number(profile?.totalHours || 0)
  const streak = Number(profile?.studyStreak || 0)
  const level = Number(profile?.level || 1)
  const badgeCount = asArray(profile?.badges).length
  const followers = asArray(profile?.followers).length
  const following = asArray(profile?.following).length
  const recency = recencyFactor(profile?.updatedAt || profile?.$updatedAt || profile?.createdAt, period, now)

  const normalizedPoints = period === "weekly" ? Math.min(totalPoints, 600) : period === "monthly" ? Math.min(totalPoints, 1800) : totalPoints
  const normalizedHours = period === "weekly" ? Math.min(totalHours, 20) : period === "monthly" ? Math.min(totalHours, 80) : totalHours

  const momentum = normalizedPoints * 0.42 + normalizedHours * 14 + streak * 18
  const community = memberPods.length * 40 + recentPods.length * 30 + followers * 8 + following * 3
  const mastery = level * 35 + badgeCount * 25
  const rawScore = (momentum + community + mastery) * recency

  return {
    score: Math.round(rawScore),
    streak,
    studyHours: Number(totalHours.toFixed(1)),
    points: totalPoints,
    activePods: memberPods.length,
    recentPods: recentPods.length,
    level,
    badgeCount,
    recency,
  }
}

export function rankLearners(profiles: any[], pods: any[], period: ScorePeriod, currentUserId?: string) {
  return (profiles || [])
    .map((profile) => {
      const score = computeLearnerScore(profile, pods, period)
      return {
        rank: 0,
        id: profile.$id,
        name: profile.name || "Learner",
        username: `@${String(profile.username || profile.name || "learner").toLowerCase().replace(/\s+/g, "_")}`,
        avatar: profile.avatar || "/placeholder.svg",
        isCurrentUser: profile.$id === currentUserId,
        badge:
          score.streak >= 30
            ? "Streak Master"
            : score.activePods >= 4
              ? "Pod Leader"
              : score.points >= 1000
                ? "Top Performer"
                : "Rising Learner",
        ...score,
      }
    })
    .sort((a, b) => b.score - a.score || b.points - a.points || b.studyHours - a.studyHours)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
