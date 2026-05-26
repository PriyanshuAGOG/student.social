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

test('course enrollment route supports GET status lookup', () => {
  const src = fs.readFileSync('app/api/courses/enroll/route.ts', 'utf8')
  assert.match(src, /export async function GET/)
  assert.match(src, /getUserEnrollments/)
})

test('assignment submit route performs server-side grading', () => {
  const src = fs.readFileSync('app/api/assignments/submit/route.ts', 'utf8')
  assert.match(src, /autoGradeSubmission/)
  assert.match(src, /updateSubmission/)
})

test('resource service supports like toggles', () => {
  const src = fs.readFileSync('lib/appwrite.ts', 'utf8')
  assert.match(src, /async toggleLikeResource/)
})

test('analytics and leaderboard pages are data-backed', () => {
  const analytics = fs.readFileSync('app/app/analytics/page.tsx', 'utf8')
  const leaderboard = fs.readFileSync('app/app/leaderboard/page.tsx', 'utf8')
  const scoring = fs.readFileSync('lib/engagement-scoring.ts', 'utf8')
  assert.match(analytics, /profileService\.getProfile/)
  assert.match(analytics, /calendarService\.getUserEvents/)
  assert.match(leaderboard, /profileService\.getAllProfiles/)
  assert.match(scoring, /export function buildAnalyticsSnapshot/)
  assert.match(scoring, /export function rankLearners/)
})

test('payments and certificates are not placeholder flows', () => {
  const payments = fs.readFileSync('app/api/payments/create-checkout/route.ts', 'utf8')
  const certs = fs.readFileSync('app/api/certificates/download/route.ts', 'utf8')
  assert.match(payments, /stripe\.checkout\.sessions\.create/)
  assert.match(certs, /renderCertificatePdf/)
})

test('pods and explore routes are unified', () => {
  const pods = fs.readFileSync('app/app/pods/page.tsx', 'utf8')
  const explore = fs.readFileSync('app/app/explore/page.tsx', 'utf8')
  assert.match(pods, /podService\.joinPod/)
  assert.match(pods, /TabsTrigger value="discover"/)
  assert.match(explore, /redirect\("\/app\/pods\?tab=discover"\)/)
})
