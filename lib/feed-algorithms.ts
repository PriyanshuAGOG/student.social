export type CourseTrendSignal = {
  enrollmentCount: number
  completionCount: number
  feedPostCount: number
  averageRating: number
  createdAtMs?: number
}

export function computeCourseTrendScore(signal: CourseTrendSignal, nowMs = Date.now()): number {
  const enroll = Math.log1p(signal.enrollmentCount) * 0.35
  const complete = Math.log1p(signal.completionCount) * 0.3
  const social = Math.log1p(signal.feedPostCount) * 0.2
  const quality = Math.max(0, Math.min(5, signal.averageRating)) / 5 * 0.1
  const recency = signal.createdAtMs ? Math.max(0.02, 1 / Math.max(1, (nowMs - signal.createdAtMs) / 86_400_000)) * 0.05 : 0.03
  return Number((enroll + complete + social + quality + recency).toFixed(6))
}

export function stableRankByScore<T extends { trendScore: number; $id?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.trendScore - a.trendScore) || String(a.$id || '').localeCompare(String(b.$id || '')))
}
