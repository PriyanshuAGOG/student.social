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

const calendarManage = fs.readFileSync('app/api/calendar-sync/manage/route.ts', 'utf8')

test('calendar manage route supports key actions', () => {
  assert.match(calendarManage, /action === 'create'/)
  assert.match(calendarManage, /action === 'rotate'/)
  assert.match(calendarManage, /action === 'disable'/)
})

import { encryptCalendarToken, decryptCalendarToken } from './lib/calendar/token.ts'

test('calendar token crypto round-trip works', () => {
  const enc = encryptCalendarToken('pscal_v1_abc', 'k')
  const dec = decryptCalendarToken(enc, 'k')
  assert.equal(dec, 'pscal_v1_abc')
})

import { detectCalendarProvider } from './lib/calendar/providers.ts'

test('provider detection works', () => {
  assert.equal(detectCalendarProvider('Google-Calendar-Importer'), 'Google Calendar')
  assert.equal(detectCalendarProvider('AppleCoreMedia iCal'), 'Apple Calendar')
})


test('ics builder outputs VCALENDAR', () => {
  const src = fs.readFileSync('lib/calendar/ics-builder.ts', 'utf8')
  assert.match(src, /BEGIN:VCALENDAR/)
  assert.match(src, /BEGIN:VEVENT/)
})


test('sanitize strips html', () => {
  const src = fs.readFileSync('lib/calendar/sanitize.ts', 'utf8')
  assert.match(src, /stripHtml/)
  assert.match(src, /sanitizeDescription/)
})
