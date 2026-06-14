import test from "node:test"
import assert from "node:assert/strict"

const { calculateUserPodProgress, calculatePodCompletionRate, calculatePodHealthScore, calculateLeaderboard, toggleReactionState, canTransitionTaskStatus } = await import("../lib/pods/calculations.ts")
const { generateStarterRoadmap, extractYouTubeId } = await import("../lib/pods/generator.ts")

test("progress calculation uses real activity weights", () => {
  const progress = calculateUserPodProgress({
    userId: "u1",
    tasks: [{ $id: "t1", required: true }, { $id: "t2", required: true }],
    submissions: [{ userId: "u1", taskId: "t1", status: "submitted" }],
    sessions: [{ $id: "s1" }, { $id: "s2" }],
    attendedSessionIds: ["s1"],
    checkins: Array.from({ length: 7 }, (_, i) => ({ userId: "u1", date: `2026-01-0${i}` })),
    resourcesShared: 1,
    peerReviewsCompleted: 1,
  })
  assert.equal(progress, 55.83)
})

test("pod completion and health are bounded", () => {
  const memberships = [{ status: "active", progressPercent: 50 }, { status: "active", progressPercent: 100 }]
  assert.equal(calculatePodCompletionRate(memberships), 75)
  const health = calculatePodHealthScore({ memberships, checkins: [], tasks: [], submissions: [], sessions: [] })
  assert.ok(health >= 0 && health <= 100)
})

test("leaderboard ranks by points and streak", () => {
  const rows = calculateLeaderboard([
    { userId: "a", status: "active", role: "member", totalPoints: 10, currentStreak: 1, progressPercent: 10 },
    { userId: "b", status: "active", role: "member", totalPoints: 20, currentStreak: 1, progressPercent: 10 },
  ])
  assert.equal(rows[0].userId, "b")
  assert.equal(rows[0].rank, 1)
})

test("reaction toggle is unique per user emoji", () => {
  const reactions = toggleReactionState([], { messageId: "m1", userId: "u1", emoji: "✓" })
  assert.equal(reactions.length, 1)
  assert.equal(toggleReactionState(reactions, { messageId: "m1", userId: "u1", emoji: "✓" }).length, 0)
})

test("member task status transitions are limited", () => {
  assert.equal(canTransitionTaskStatus("today", "submitted", "member"), true)
  assert.equal(canTransitionTaskStatus("today", "archived", "member"), false)
  assert.equal(canTransitionTaskStatus("today", "archived", "mentor"), true)
})

test("starter roadmap creates phases and tasks", () => {
  const generated = generateStarterRoadmap({ podId: "p1", topic: "Appwrite", durationDays: 14 })
  assert.equal(generated.roadmap.filter((item) => item.type === "phase").length, 2)
  assert.equal(generated.tasks.length, 2)
})

test("youtube id extraction supports common urls", () => {
  assert.equal(extractYouTubeId("https://youtu.be/abcdef12345"), "abcdef12345")
})
