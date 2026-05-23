import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const src = fs.readFileSync('lib/scaling-algorithms.ts', 'utf8')

test('scaling algorithms file defines required exports', () => {
  assert.match(src, /export function computePodFitScore/)
  assert.match(src, /export function rankFeedItems/)
  assert.match(src, /export function computeRetryBudget/)
})

const feedSrc = fs.readFileSync('lib/feed-algorithms.ts', 'utf8')

test('feed algorithms define trend score and stable rank', () => {
  assert.match(feedSrc, /export function computeCourseTrendScore/)
  assert.match(feedSrc, /export function stableRankByScore/)
})
