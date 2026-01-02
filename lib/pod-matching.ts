// Lightweight helpers to score pod fit for a user profile
const normalize = (values: any): string[] => {
  if (!values) return []
  if (typeof values === "string") {
    const trimmed = values.trim()
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalize(parsed)
      } catch {
        return [trimmed.toLowerCase()]
      }
    }
    return [trimmed.toLowerCase()]
  }
  if (Array.isArray(values)) return values.map((v) => String(v).toLowerCase())
  return []
}

const overlapScore = (a: any, b: any): number => {
  const setA = new Set(normalize(a))
  const setB = new Set(normalize(b))
  if (setA.size === 0 || setB.size === 0) return 0
  let matches = 0
  setA.forEach((v) => {
    if (setB.has(v)) matches += 1
  })
  return matches / Math.max(setA.size, setB.size)
}

const gapPenalty = (a: any, b: any): number => {
  const setA = new Set(normalize(a))
  const setB = new Set(normalize(b))
  if (setA.size === 0 || setB.size === 0) return 0
  let missing = 0
  setA.forEach((v) => {
    if (!setB.has(v)) missing += 1
  })
  return missing / setA.size
}

const freshnessScore = (input: any): number => {
  if (!input) return 0.4
  const ts = new Date(input).getTime()
  if (Number.isNaN(ts)) return 0.4
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24)
  if (days <= 1) return 1
  if (days <= 7) return 0.8
  if (days <= 30) return 0.6
  return 0.4
}

export const calculatePodFitScore = (profile: any, pod: any) => {
  const interestsScore = overlapScore(profile?.interests, pod?.matchingTags || pod?.tags || pod?.subject)
  const goalsScore = overlapScore(profile?.learningGoals, pod?.idealLearnerType)
  const paceScore = profile?.learningPace && pod?.difficulty
    ? profile.learningPace.toLowerCase().includes("fast") && pod.difficulty === "Advanced"
      ? 1
      : profile.learningPace.toLowerCase().includes("moderate") && pod.difficulty === "Intermediate"
        ? 1
        : profile.learningPace.toLowerCase().includes("slow") && pod.difficulty === "Beginner"
          ? 1
          : 0.4
    : 0.3
  const sessionTypeScore = overlapScore(profile?.preferredSessionTypes, pod?.sessionType)
  const availabilityScore = overlapScore(profile?.availability, pod?.commonAvailability)
  const gapScore = gapPenalty(profile?.interests, pod?.matchingTags || pod?.tags || pod?.subject)
  const recencyScore = freshnessScore(pod?.updatedAt || pod?.createdAt)
  const activityScore = Math.min(1, (pod?.stats?.totalSessions || pod?.memberCount || 0) / 25)

  const baseFit = (interestsScore * 0.35)
    + (goalsScore * 0.25)
    + (paceScore * 0.12)
    + (sessionTypeScore * 0.1)
    + (availabilityScore * 0.08)

  const dynamism = (recencyScore * 0.05) + (activityScore * 0.08)
  const gapAdjustment = Math.max(0, 1 - gapScore * 0.5)

  const score = (baseFit * gapAdjustment) + dynamism

  return Math.round(score * 100)
}

export const rankPodsForUser = (profile: any, pods: any[], limit = 5) => {
  const scored = pods.map((pod) => ({
    pod,
    score: calculatePodFitScore(profile, pod),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
