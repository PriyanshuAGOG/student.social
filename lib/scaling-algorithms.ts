export type UserSignal = {
  userId: string
  interests: string[]
  skillLevel: number
  consistency: number
  responseLatencyMs: number
  completionRate: number
}

export type PodSignal = {
  podId: string
  topics: string[]
  avgSkillLevel: number
  activityScore: number
  churnRisk: number
  capacityLeft: number
}

const overlap = (a: string[], b: string[]) => {
  const sb = new Set(b.map((x) => x.toLowerCase()))
  return a.reduce((acc, cur) => acc + (sb.has(cur.toLowerCase()) ? 1 : 0), 0)
}

/**
 * Custom fit score for matching users to pods, tuned for retention and learning outcomes.
 */
export function computePodFitScore(user: UserSignal, pod: PodSignal): number {
  const topicAffinity = overlap(user.interests, pod.topics) / Math.max(1, pod.topics.length)
  const skillDistance = Math.abs(user.skillLevel - pod.avgSkillLevel)
  const skillScore = Math.max(0, 1 - skillDistance / 10)
  const reliability = Math.min(1, user.consistency * 0.6 + user.completionRate * 0.4)
  const podHealth = Math.max(0, 1 - pod.churnRisk) * 0.7 + Math.min(1, pod.activityScore) * 0.3
  const capacityScore = pod.capacityLeft > 0 ? 1 : 0

  return Number((topicAffinity * 0.35 + skillScore * 0.2 + reliability * 0.2 + podHealth * 0.2 + capacityScore * 0.05).toFixed(4))
}

/**
 * Prioritizes feed items by recency + quality + social proof with graceful tie-breaking.
 */
export function rankFeedItems<T extends { id: string; quality: number; engagement: number; createdAtMs: number }>(
  items: T[],
  nowMs = Date.now(),
): T[] {
  return [...items].sort((a, b) => {
    const ageA = Math.max(1, (nowMs - a.createdAtMs) / 3_600_000)
    const ageB = Math.max(1, (nowMs - b.createdAtMs) / 3_600_000)
    const scoreA = a.quality * 0.5 + Math.log1p(a.engagement) * 0.3 + 1 / ageA * 0.2
    const scoreB = b.quality * 0.5 + Math.log1p(b.engagement) * 0.3 + 1 / ageB * 0.2
    return scoreB - scoreA
  })
}

/**
 * Adaptive retry budget allocator for critical workflows.
 */
export function computeRetryBudget(errorRate: number, p95LatencyMs: number): { maxRetries: number; backoffMs: number } {
  if (errorRate > 0.2) return { maxRetries: 1, backoffMs: 1500 }
  if (p95LatencyMs > 1800) return { maxRetries: 2, backoffMs: 1200 }
  if (errorRate > 0.08 || p95LatencyMs > 1200) return { maxRetries: 3, backoffMs: 700 }
  return { maxRetries: 4, backoffMs: 350 }
}
