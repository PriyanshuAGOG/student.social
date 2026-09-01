import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAchievements, calculateStudyStreak } from '../lib/profile/achievements.ts'

test('study streak counts consecutive days and tolerates a missing current day', () => {
  const now = new Date('2026-08-31T12:00:00.000Z')
  assert.equal(calculateStudyStreak(['2026-08-31T08:00:00.000Z', '2026-08-30T08:00:00.000Z', '2026-08-29T08:00:00.000Z'], now), 3)
  assert.equal(calculateStudyStreak(['2026-08-30T08:00:00.000Z', '2026-08-29T08:00:00.000Z'], now), 2)
  assert.equal(calculateStudyStreak(['2026-08-28T08:00:00.000Z'], now), 0)
})

test('achievement progress is bounded and completion comes from real metrics', () => {
  const achievements = buildAchievements({ focusMinutes: 900, focusSessions: 4, studyDays: 7, studyStreak: 3, podsJoined: 1, resourcesShared: 2, postsCreated: 5, followers: 4, following: 6 })
  const fiveHours = achievements.find((item) => item.key === 'five_hours')
  const social = achievements.find((item) => item.key === 'social_learner')
  assert.equal(fiveHours.progress, fiveHours.target)
  assert.equal(fiveHours.complete, true)
  assert.equal(social.complete, true)
  assert.equal(achievements.find((item) => item.key === 'streak_seven')?.complete, false)
})
