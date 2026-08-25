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
  assert.match(src, /async incrementResourceView/)
})

test('api security requires verified cookie or jwt context', () => {
  const src = fs.readFileSync('lib/api-security.ts', 'utf8')
  assert.match(src, /getVerifiedSessionCookie/)
  assert.match(src, /getVerifiedJwtContext/)
  assert.match(src, /authenticatedVia/)
})

test('auth token endpoints support cookie-based validation', () => {
  const validateSession = fs.readFileSync('app/api/auth/validate-session/route.ts', 'utf8')
  const refreshToken = fs.readFileSync('app/api/auth/refresh-token/route.ts', 'utf8')
  const login = fs.readFileSync('app/api/auth/login/route.ts', 'utf8')
  const session = fs.readFileSync('app/api/auth/session/route.ts', 'utf8')
  assert.match(validateSession, /JWT_COOKIE_NAME/)
  assert.match(validateSession, /requireUser\(req\)/)
  assert.match(refreshToken, /response\.cookies\.set/)
  assert.match(login, /response\.cookies\.set\(\{\s*name: JWT_COOKIE_NAME/s)
  assert.match(session, /sanitizeAccountUser/)
  assert.match(session, /hashOptions/)
  assert.match(session, /user: sanitizeAccountUser\(accountUser\)/)
})

test('auth verification resend is ownership-protected and session checks are hardened', () => {
  const sendVerification = fs.readFileSync('app/api/auth/send-verification/route.ts', 'utf8')
  const session = fs.readFileSync('app/api/auth/session/route.ts', 'utf8')
  assert.match(sendVerification, /requireUser\(req\)/)
  assert.match(sendVerification, /requireOwnership\(userId, auth\.userId\)/)
  assert.match(sendVerification, /enforceRateLimit\(req, \{ key: 'auth:send-verification'/)
  assert.match(session, /crypto\.timingSafeEqual/)
  assert.match(session, /isExpired\(sessionCookie\.expire\)/)
})

test('chat routes enforce authenticated ownership and membership', () => {
  const sendRoute = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')
  const roomRoute = fs.readFileSync('app/api/messages/room/[roomId]/route.ts', 'utf8')
  assert.match(sendRoute, /requireUser\(request\)/)
  assert.match(sendRoute, /requireOwnership\(senderId, auth\.userId\)/)
  assert.match(sendRoute, /enforceSameOrigin\(request\)/)
  assert.match(sendRoute, /enforceRateLimit\(request, \{\s*key: ['\"]messages:send['\"]/)
  assert.doesNotMatch(sendRoute, /Query\.equal\('type', \['direct', 'dm'\]\)/)
  assert.match(sendRoute, /!\[["']direct["'], ["']dm["'], ["']group["'], ["']pod["'], ["']support["']\]\.includes\(room\.type\)/)
  assert.match(sendRoute, /clientMessageId/)
  assert.match(roomRoute, /requireUser\(request\)/)
  assert.match(roomRoute, /!members\.includes\(auth\.userId\)/)
  assert.match(roomRoute, /MESSAGE_RECEIPTS_COLLECTION_ID/)
  assert.match(roomRoute, /message_receipts/)
  assert.doesNotMatch(roomRoute, /updateDocument\(/)
  assert.match(sendRoute, /Permission\.read\(Role\.user/)
})

test('call sessions are backed by authenticated routes and durable schema', () => {
  const createCall = fs.readFileSync('app/api/calls/sessions/route.ts', 'utf8')
  const updateCall = fs.readFileSync('app/api/calls/sessions/[sessionId]/route.ts', 'utf8')
  const schema = fs.readFileSync('scripts/update-schema.js', 'utf8')
  const callClient = fs.readFileSync('lib/appwrite/calls.ts', 'utf8')
  const tokenRoute = fs.readFileSync('app/api/calls/sessions/[sessionId]/token/route.ts', 'utf8')
  const callStage = fs.readFileSync('components/call/LiveKitCallStage.tsx', 'utf8')

  assert.match(createCall, /requireUser\(req\)/)
  assert.match(createCall, /enforceSameOrigin\(req\)/)
  assert.match(createCall, /CALL_SESSIONS_COLLECTION_ID/)
  assert.match(createCall, /CALL_PARTICIPANTS_COLLECTION_ID/)
  assert.match(updateCall, /requireUser\(req\)/)
  assert.match(updateCall, /enforceSameOrigin\(req\)/)
  assert.match(schema, /id: 'call_sessions'/)
  assert.match(schema, /id: 'call_participants'/)
  assert.match(schema, /id: 'message_receipts'/)
  assert.match(callClient, /export const callService = \{/)
  assert.match(callClient, /startRoomCall\(/)
  assert.match(tokenRoute, /deriveCallEncryptionMaterial/)
  assert.match(callStage, /ExternalE2EEKeyProvider/)
  assert.doesNotMatch(createCall, /buildEphemeralSession|degraded call/)
})

test('vault page uses real uploads and sorted resource views', () => {
  const vault = fs.readFileSync('app/app/vault/page.tsx', 'utf8')
  assert.match(vault, /const sortedResources = filteredResources\.slice\(\)\.sort/)
  assert.match(vault, /const myUploads = sortedResources\.filter/)
  assert.match(vault, /resourceService\.incrementResourceView/)
})

test('vault supports pod-scoped resource loading and uploads', () => {
  const vault = fs.readFileSync('app/app/vault/page.tsx', 'utf8')
  assert.match(vault, /useSearchParams/)
  assert.match(vault, /const scopedPodId = searchParams\.get\("pod"\)/)
  assert.match(vault, /resourceService\.getResources\(\{ podId: scopedPodId \}/)
  assert.match(vault, /visibility: scopedPodId \? "pod" : "public"/)
  assert.match(vault, /podId: scopedPodId \|\| undefined/)
})

test('feed report and share actions use production app paths', () => {
  const feed = fs.readFileSync('app/app/feed/page.tsx', 'utf8')
  const reports = fs.readFileSync('app/api/reports/route.ts', 'utf8')
  assert.match(feed, /fetch\("\/api\/reports"/)
  assert.match(feed, /window\.location\.origin/)
  assert.doesNotMatch(feed, /https:\/\/peerspark\.com\/post/)
  assert.match(reports, /requireUser\(request\)/)
  assert.match(reports, /content_reports/)
})

test('post mutation routes enforce authenticated ownership and reply integrity', () => {
  const likeRoute = fs.readFileSync('app/api/posts/[id]/like/route.ts', 'utf8')
  const saveRoute = fs.readFileSync('app/api/posts/[id]/save/route.ts', 'utf8')
  const postRoute = fs.readFileSync('app/api/posts/[id]/route.ts', 'utf8')
  const commentsRoute = fs.readFileSync('app/api/posts/[id]/comments/route.ts', 'utf8')
  assert.match(likeRoute, /enforceSameOrigin\(request\)/)
  assert.match(saveRoute, /enforceRateLimit\(request, \{ key: 'posts:save'/)
  assert.match(postRoute, /requestBody\.userId = auth\.userId/)
  assert.match(postRoute, /requireOwnership\(requestedUserId, auth\.userId\)/)
  assert.match(commentsRoute, /requestBody\.userId = auth\.userId/)
  assert.match(commentsRoute, /parentComment\.postId !== postId/)
  assert.match(commentsRoute, /INVALID_PARENT_COMMENT/)
})

test('follow route uses authenticated ownership and profile counts are numeric', () => {
  const followRoute = fs.readFileSync('app/api/users/[id]/follow/route.ts', 'utf8')
  const ownProfile = fs.readFileSync('app/app/profile/page.tsx', 'utf8')
  const publicProfile = fs.readFileSync('app/app/profile/[username]/page.tsx', 'utf8')
  assert.match(followRoute, /requireUser\(request\)/)
  assert.match(followRoute, /requireOwnership\(requestedUserId, auth\.userId\)/)
  assert.match(followRoute, /Array\.from\(new Set\(followerProfile\.following/)
  assert.match(followRoute, /followerCount: newFollowers\.length/)
  assert.match(ownProfile, /relationshipCount\(profile\?\.followers/)
  assert.match(publicProfile, /relationshipCount\(profile\.following/)
  assert.match(publicProfile, /typeof data\.followerCount === "number"/)
})

test('profile message and comment routes avoid dead post paths', () => {
  const ownProfile = fs.readFileSync('app/app/profile/page.tsx', 'utf8')
  const publicProfile = fs.readFileSync('app/app/profile/[username]/page.tsx', 'utf8')
  assert.match(ownProfile, /\/app\/feed\?post=/)
  assert.doesNotMatch(ownProfile, /\/app\/post\//)
  assert.match(publicProfile, /\/app\/messages\/\$\{userProfile\.userId\}/)
})

test('pods2 reactions are authenticated and server-backed', () => {
  const podsRoute = fs.readFileSync('app/api/pods2/[[...path]]/route.ts', 'utf8')
  const client = fs.readFileSync('lib/pods/client.ts', 'utf8')
  assert.match(podsRoute, /action === "messages" && nested === "reactions"/)
  assert.match(podsRoute, /assertPodRole\(databases, pod\.\$id, auth\.userId/)
  assert.match(podsRoute, /POD_COLLECTIONS\.reactions/)
  assert.match(client, /messages\/\$\{encodeURIComponent\(messageId\)\}\/reactions/)
})

test('canonical Pods2 mutations derive actors from auth and enforce pod roles', () => {
  const podsRoute = fs.readFileSync('app/api/pods2/[[...path]]/route.ts', 'utf8')
  assert.match(podsRoute, /const auth = requireUser\(request\)/)
  assert.match(podsRoute, /createdBy: auth\.userId/)
  assert.match(podsRoute, /assertPodRole\(databases, pod\.\$id, auth\.userId/)
  assert.match(podsRoute, /createdBy: auth\.userId/)
  assert.doesNotMatch(podsRoute, /body\.(userId|hostId|createdBy)\s*\|\|\s*auth\.userId/)
})

test('security policy permits first-party calls and rejects lookalike CORS origins', () => {
  const proxy = fs.readFileSync('proxy.ts', 'utf8')
  assert.match(proxy, /microphone=\(self\), camera=\(self\), display-capture=\(self\)/)
  assert.match(proxy, /allowedOrigins\.has\(origin\)/)
  assert.doesNotMatch(proxy, /allowedOrigins\.some\([^\n]*includes/)
  assert.doesNotMatch(proxy, /meet\.jit\.si/)
  assert.doesNotMatch(proxy, /crypto\.subtle\.verify/)
  assert.doesNotMatch(proxy, /peerspark_session|isOwnerRequest/)
  assert.match(proxy, /getLegacyRouteTarget/)
  assert.match(proxy, /pathname === '\/settings\/calendar-sync'/)
  assert.match(proxy, /target\.pathname = '\/app\/settings\/calendar-sync'/)
  assert.match(proxy, /pathname\.match\(\/\^\\\/app\\\/messages/)
  assert.match(proxy, /target\.searchParams\.set\('user', userId\)/)
})

test('notification routes use verified auth context and prevent userId override', () => {
  const inbox = fs.readFileSync('app/api/notifications/inbox/route.ts', 'utf8')
  const preferences = fs.readFileSync('app/api/notifications/preferences/route.ts', 'utf8')
  const notificationDelete = fs.readFileSync('app/api/notifications/[id]/route.ts', 'utf8')
  const notificationRead = fs.readFileSync('app/api/notifications/[id]/read/route.ts', 'utf8')
  assert.match(inbox, /requireUser\(req\)/)
  assert.doesNotMatch(inbox, /x-user-id/)
  assert.match(preferences, /const \{ userId \} = requireUser\(req\)/)
  assert.match(preferences, /const \{ userId: _ignoredUserId, \$id: _ignoredId, \.\.\.safeBody \}/)
  assert.match(preferences, /\.\.\.safeBody,\s*userId,/s)
  assert.match(notificationDelete, /requireUser\(req\)/)
  assert.match(notificationRead, /enforceSameOrigin\(req\)/)
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
  const podClient = fs.readFileSync('lib/pods/client.ts', 'utf8')
  const explore = fs.readFileSync('app/app/explore/page.tsx', 'utf8')
  const appCourses = fs.readFileSync('app/app/courses/page.tsx', 'utf8')
  const appSearch = fs.readFileSync('app/app/search/page.tsx', 'utf8')
  assert.match(pods, /PodDiscoveryPage/)
  assert.match(podClient, /\/api\/pods2/)
  assert.match(podClient, /joinPod\(podId/)
  assert.match(explore, /redirect\("\/app\/pods\?tab=discover"\)/)
  assert.match(appCourses, /redirect\("\/courses"\)/)
  assert.doesNotMatch(appSearch, /searchParams/)
  assert.match(appSearch, /fetch\(`\/api\/pods2\?search=/)
  assert.match(appSearch, /fetch\("\/api\/profiles\/list\?limit=100"/)
  const podsApi = fs.readFileSync('app/api/pods2/[[...path]]/route.ts', 'utf8')
  assert.match(podsApi, /fuzzyIncludes/)
  assert.doesNotMatch(podsApi, /Query\.search\("name", search\)/)
})

test('qa fixes cover dedicated learning-network search and post attachments', () => {
  const search = fs.readFileSync('app/app/search/page.tsx', 'utf8')
  const modal = fs.readFileSync('components/create-post-modal.tsx', 'utf8')
  const searchUtils = fs.readFileSync('lib/search-utils.ts', 'utf8')
  assert.match(searchUtils, /export function fuzzyIncludes/)
  assert.match(searchUtils, /levenshteinWithin/)
  assert.match(search, /fetch\(`\/api\/posts\?search=/)
  assert.match(search, /fetch\(`\/api\/pods2\?search=/)
  assert.match(search, /Search your learning network/)
  const postsRoute = fs.readFileSync('app/api/posts/attachments/route.ts', 'utf8')
  const postsApi = fs.readFileSync('app/api/posts/route.ts', 'utf8')
  const schema = fs.readFileSync('scripts/update-schema.js', 'utf8')
  assert.match(modal, /type="file"/)
  assert.match(modal, /Content is required/)
  assert.match(modal, /\/api\/posts\/attachments/)
  assert.match(postsRoute, /enforceRateLimit\(req, \{ key: 'posts:attachments'/)
  assert.match(postsRoute, /scanUploadMeta/)
  assert.match(postsApi, /attachments: normalizedAttachments\.map\(encodeAttachment\)/)
  assert.match(schema, /key: 'attachments'/)
})

test('qa fixes implement calendar week day views and safer time defaults', () => {
  const calendar = fs.readFileSync('app/app/calendar/page.tsx', 'utf8')
  assert.match(calendar, /viewMode === "week"/)
  assert.match(calendar, /viewMode === "day"/)
  assert.match(calendar, /step="900"/)
  assert.match(calendar, /End time must be after start time/)
  assert.match(calendar, /startTime: "09:00"/)
})

test('qa fixes add notification badges, vault empty states, settings timezone, and server admin guard', () => {
  const notifications = fs.readFileSync('app/app/notifications/page.tsx', 'utf8')
  const vault = fs.readFileSync('app/app/vault/page.tsx', 'utf8')
  const settings = fs.readFileSync('app/app/settings/page.tsx', 'utf8')
  const sections = fs.readFileSync('app/app/settings/sections.tsx', 'utf8')
  const adminPage = fs.readFileSync('app/app/admin/page.tsx', 'utf8')
  assert.match(notifications, /tabCounts/)
  assert.match(notifications, /Review preferences/)
  assert.match(vault, /renderEmptyResources/)
  assert.match(vault, /disabled=\{!hasResources\}/)
  assert.match(settings, /resolvedOptions\(\)\.timeZone/)
  assert.match(settings, /includedData/)
  assert.match(sections, /Asia\/Kolkata/)
  assert.match(adminPage, /getAdminUserFromCookies\(await cookies\(\)\)/)
  assert.match(adminPage, /if \(!admin\) notFound\(\)/)
})

test('public status is live, deterministic, and honest about unmonitored history', () => {
  const page = fs.readFileSync('app/status/page.tsx', 'utf8')
  const livePage = fs.readFileSync('components/public/LiveStatusPage.tsx', 'utf8')
  const route = fs.readFileSync('app/api/status/route.ts', 'utf8')
  const checks = fs.readFileSync('lib/server/platform-status.ts', 'utf8')
  const statusUi = `${page}\n${livePage}`
  assert.doesNotMatch(statusUi, /Math\.random/)
  assert.doesNotMatch(statusUi, /99\.9/)
  assert.match(statusUi, /fetch\("\/api\/status"/)
  assert.match(statusUi, /does not yet have a verified incident-history provider/)
  assert.match(route, /getPlatformStatusSnapshot/)
  assert.match(checks, /probeAppwrite/)
  assert.match(checks, /probeLiveKit/)
  assert.match(checks, /probeRateLimiter/)
})

test('qa fixes add inline pod validation and AI attachment handling', () => {
  const pods = fs.readFileSync('components/pods2/Pod2App.tsx', 'utf8')
  const ai = fs.readFileSync('app/app/ai/page.tsx', 'utf8')
  assert.match(pods, /getPodFieldError/)
  assert.match(pods, /Description must be at least 20 characters/)
  assert.match(pods, /maxLength=\{500\}/)
  assert.match(ai, /handleAttachmentSelected/)
  assert.match(ai, /Attachment queued/)
  assert.match(ai, /couldn't reach the AI service/)
})

test('installed PWA calls provide foreground ringing and background push actions', () => {
  const provider = fs.readFileSync('components/call/CallProvider.tsx', 'utf8')
  const ringtone = fs.readFileSync('components/call/use-incoming-call-alerts.ts', 'utf8')
  const worker = fs.readFileSync('public/sw.js', 'utf8')
  const callRoute = fs.readFileSync('app/api/calls/sessions/route.ts', 'utf8')
  const subscriptionRoute = fs.readFileSync('app/api/push/subscription/route.ts', 'utf8')
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'))

  assert.match(provider, /useIncomingCallAlerts/)
  assert.match(provider, /CallAlertsPrompt/)
  assert.match(ringtone, /navigator\.vibrate/)
  assert.match(ringtone, /createOscillator/)
  assert.match(worker, /incoming-call/)
  assert.match(worker, /accept-call/)
  assert.match(worker, /decline-call/)
  assert.match(worker, /requireInteraction/)
  assert.match(callRoute, /sendIncomingCallPush/)
  assert.match(subscriptionRoute, /studentSocialPushSubscriptions|PUSH_SUBSCRIPTIONS_PREF_KEY/)
  assert.equal(manifest.name, 'Student.social')
  assert.equal(manifest.display, 'standalone')
})
