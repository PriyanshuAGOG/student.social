import assert from "node:assert/strict"
import test from "node:test"

const calculateUserPodProgress = ({ tasks = [], submissions = [], sessions = [], attendedSessionIds = [], checkInsCount = 0, resourcesShared = 0, peerReviewsCompleted = 0 }) => {
  const requiredTasks = tasks.filter((task) => task.required !== false)
  const completedTaskIds = new Set(submissions.filter((submission) => ["submitted", "reviewed", "accepted"].includes(submission.status)).map((submission) => submission.taskId))
  const taskScore = requiredTasks.length ? completedTaskIds.size / requiredTasks.length : 0
  const scheduledSessions = sessions.filter((session) => session.status !== "cancelled")
  const sessionScore = scheduledSessions.length ? new Set(attendedSessionIds).size / scheduledSessions.length : 0
  const checkInScore = Math.min(checkInsCount / 7, 1)
  const resourceScore = Math.min(resourcesShared / 3, 1)
  const peerReviewScore = Math.min(peerReviewsCompleted / 2, 1)
  return Math.round((taskScore * 0.5 + sessionScore * 0.2 + checkInScore * 0.15 + resourceScore * 0.1 + peerReviewScore * 0.05) * 100)
}

const calculateLeaderboard = (memberships) => memberships
  .filter((membership) => membership.status === "active")
  .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0) || (b.currentStreak || 0) - (a.currentStreak || 0))
  .map((membership, index) => ({ ...membership, rank: index + 1 }))

const toggleUniqueReaction = (reactions, reaction) => {
  const exists = reactions.some((item) => item.userId === reaction.userId && item.emoji === reaction.emoji)
  return exists ? reactions.filter((item) => !(item.userId === reaction.userId && item.emoji === reaction.emoji)) : [...reactions, reaction]
}

const nextTaskStatus = (current, action) => ({
  backlog: { start: "today", archive: "archived" },
  today: { submit: "submitted", complete: "completed", archive: "archived" },
  submitted: { review: "reviewed", complete: "completed", archive: "archived" },
  reviewed: { complete: "completed", archive: "archived" },
}[current]?.[action] || current)

const generateFallbackRoadmap = (topic) => [
  `Foundations of ${topic.trim() || "the topic"}`,
  "Guided practice",
  "Applied project",
  "Review and ship",
]

test("calculates weighted user pod progress from real activity", () => {
  const progress = calculateUserPodProgress({
    tasks: [{ $id: "t1" }, { $id: "t2" }],
    submissions: [{ taskId: "t1", status: "submitted" }],
    sessions: [{ $id: "s1", status: "completed" }],
    attendedSessionIds: ["s1"],
    checkInsCount: 7,
    resourcesShared: 3,
    peerReviewsCompleted: 2,
  })
  assert.equal(progress, 75)
})

test("leaderboard ranks points before streaks", () => {
  const [first, second] = calculateLeaderboard([
    { userId: "a", status: "active", totalPoints: 20, currentStreak: 10 },
    { userId: "b", status: "active", totalPoints: 30, currentStreak: 1 },
  ])
  assert.equal(first.userId, "b")
  assert.equal(second.rank, 2)
})

test("reaction toggle is unique per message, user, and emoji", () => {
  const added = toggleUniqueReaction([], { userId: "u1", emoji: "plus-one" })
  assert.equal(added.length, 1)
  const removed = toggleUniqueReaction(added, { userId: "u1", emoji: "plus-one" })
  assert.equal(removed.length, 0)
})

test("task transitions avoid invalid jumps", () => {
  assert.equal(nextTaskStatus("backlog", "start"), "today")
  assert.equal(nextTaskStatus("backlog", "review"), "backlog")
  assert.equal(nextTaskStatus("submitted", "review"), "reviewed")
})

test("fallback roadmap creates deterministic phase titles", () => {
  assert.deepEqual(generateFallbackRoadmap("Appwrite"), [
    "Foundations of Appwrite",
    "Guided practice",
    "Applied project",
    "Review and ship",
  ])
})
