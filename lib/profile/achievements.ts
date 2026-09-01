export type LearningStats = {
  focusMinutes: number
  focusSessions: number
  studyDays: number
  studyStreak: number
  podsJoined: number
  resourcesShared: number
  postsCreated: number
  followers: number
  following: number
}

export type AchievementProgress = {
  key: string
  title: string
  description: string
  progress: number
  target: number
  complete: boolean
  tone: 'teal' | 'plum' | 'olive' | 'gold'
}

const definitions: Array<{
  key: string
  title: string
  description: string
  target: number
  tone: AchievementProgress['tone']
  value: (stats: LearningStats) => number
}> = [
  { key: 'first_focus', title: 'First deep-work block', description: 'Complete one focused study session.', target: 1, tone: 'teal', value: (s) => s.focusSessions },
  { key: 'five_hours', title: 'Five focused hours', description: 'Record 300 minutes of distraction-free learning.', target: 300, tone: 'plum', value: (s) => s.focusMinutes },
  { key: 'week_rhythm', title: 'A week in rhythm', description: 'Study on seven different days.', target: 7, tone: 'olive', value: (s) => s.studyDays },
  { key: 'streak_seven', title: 'Seven-day streak', description: 'Keep a continuous seven-day learning streak.', target: 7, tone: 'gold', value: (s) => s.studyStreak },
  { key: 'pod_person', title: 'Learn with people', description: 'Join your first active study Pod.', target: 1, tone: 'teal', value: (s) => s.podsJoined },
  { key: 'knowledge_sharer', title: 'Knowledge sharer', description: 'Add five useful resources to the Vault.', target: 5, tone: 'olive', value: (s) => s.resourcesShared },
  { key: 'conversation_starter', title: 'Conversation starter', description: 'Publish five learning posts.', target: 5, tone: 'plum', value: (s) => s.postsCreated },
  { key: 'social_learner', title: 'Social learner', description: 'Build ten learning connections.', target: 10, tone: 'gold', value: (s) => s.followers + s.following },
]

export function calculateStudyStreak(isoDates: string[], now = new Date()): number {
  const uniqueDays = new Set(
    isoDates
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .map((value) => value.toISOString().slice(0, 10)),
  )
  if (!uniqueDays.size) return 0

  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const today = cursor.toISOString().slice(0, 10)
  if (!uniqueDays.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1)

  let streak = 0
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

export function buildAchievements(stats: LearningStats): AchievementProgress[] {
  return definitions.map((definition) => {
    const raw = Math.max(0, Math.round(definition.value(stats)))
    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      progress: Math.min(raw, definition.target),
      target: definition.target,
      complete: raw >= definition.target,
      tone: definition.tone,
    }
  })
}
