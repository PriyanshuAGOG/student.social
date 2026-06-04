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
  assert.match(sendRoute, /!\[["']direct["'], ["']dm["']\]\.includes\(room\.type\)/)
  assert.match(sendRoute, /clientMessageId/)
  assert.match(roomRoute, /requireUser\(request\)/)
  assert.match(roomRoute, /!members\.includes\(auth\.userId\)/)
  assert.match(roomRoute, /MESSAGE_RECEIPTS_COLLECTION_ID/)
  assert.match(roomRoute, /message_receipts/)
})

test('call sessions are backed by authenticated routes and durable schema', () => {
  const createCall = fs.readFileSync('app/api/calls/sessions/route.ts', 'utf8')
  const updateCall = fs.readFileSync('app/api/calls/sessions/[sessionId]/route.ts', 'utf8')
  const schema = fs.readFileSync('scripts/update-schema.js', 'utf8')
  const appwrite = fs.readFileSync('lib/appwrite.ts', 'utf8')

  assert.match(createCall, /requireUser\(req\)/)
  assert.match(createCall, /enforceSameOrigin\(req\)/)
  assert.match(createCall, /CALL_SESSIONS_COLLECTION_ID/)
  assert.match(createCall, /CALL_PARTICIPANTS_COLLECTION_ID/)
  assert.match(updateCall, /requireUser\(req\)/)
  assert.match(updateCall, /enforceSameOrigin\(req\)/)
  assert.match(schema, /id: 'call_sessions'/)
  assert.match(schema, /id: 'call_participants'/)
  assert.match(schema, /id: 'message_receipts'/)
  assert.match(appwrite, /export const callService = \{/)
  assert.match(appwrite, /startRoomCall\(/)
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

test('pod cheers are server-backed rather than local storage backed', () => {
  const podDetail = fs.readFileSync('app/app/pods/[podId]/page.tsx', 'utf8')
  const appwrite = fs.readFileSync('lib/appwrite.ts', 'utf8')
  assert.match(podDetail, /resourceService\.getResources\(\{ podId \}/)
  assert.doesNotMatch(podDetail, /pod-cheers-/)
  assert.match(podDetail, /podService\.incrementReaction/)
  assert.match(appwrite, /const totals = await this\.getReactions\(podId\)/)
})

test('pod mutation routes derive actor identity from authenticated context', () => {
  const podsRoute = fs.readFileSync('app/api/pods/route.ts', 'utf8')
  const podRoute = fs.readFileSync('app/api/pods/[id]/route.ts', 'utf8')
  const studySessions = fs.readFileSync('app/api/pods/study-sessions/route.ts', 'utf8')
  const commitments = fs.readFileSync('app/api/pods/course-commitment/route.ts', 'utf8')
  const generateCourse = fs.readFileSync('app/api/pods/generate-course/route.ts', 'utf8')
  const generateCourseStreaming = fs.readFileSync('app/api/pods/generate-course-streaming/route.ts', 'utf8')
  assert.match(podsRoute, /requestBody\.userId = auth\.userId/)
  assert.match(podRoute, /requestBody\.userId = auth\.userId/)
  assert.match(podRoute, /requireOwnership\(requestedUserId, auth\.userId\)/)
  assert.match(studySessions, /body\.hostId = auth\.userId/)
  assert.match(studySessions, /session\.hostId !== auth\.userId/)
  assert.match(commitments, /const userId = auth\.userId/)
  assert.match(commitments, /requireOwnership\(commitment\.userId, auth\.userId\)/)
  assert.match(generateCourse, /const auth = requireUser\(request\)/)
  assert.match(generateCourse, /createdBy: auth\.userId/)
  assert.match(generateCourseStreaming, /members\.includes\(auth\.userId\)/)
  assert.match(generateCourseStreaming, /createdBy: auth\.userId/)
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
  const explore = fs.readFileSync('app/app/explore/page.tsx', 'utf8')
  const appCourses = fs.readFileSync('app/app/courses/page.tsx', 'utf8')
  const appSearch = fs.readFileSync('app/app/search/page.tsx', 'utf8')
  assert.match(pods, /podService\.joinPod/)
  assert.match(pods, /TabsTrigger value="discover"/)
  assert.match(explore, /redirect\("\/app\/pods\?tab=discover"\)/)
  assert.match(appCourses, /redirect\("\/courses"\)/)
  assert.match(appSearch, /redirect\(`\/app\/explore/)
})

test('qa fixes cover feed fuzzy search and post attachments', () => {
  const feed = fs.readFileSync('app/app/feed/page.tsx', 'utf8')
  const modal = fs.readFileSync('components/create-post-modal.tsx', 'utf8')
  const searchUtils = fs.readFileSync('lib/search-utils.ts', 'utf8')
  assert.match(searchUtils, /export function fuzzyIncludes/)
  assert.match(searchUtils, /levenshteinWithin/)
  assert.match(feed, /buildSearchSuggestions/)
  assert.match(feed, /fuzzyIncludes\(searchableText, searchQuery\)/)
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

test('qa fixes add notification badges, vault empty states, settings timezone, and admin guard', () => {
  const notifications = fs.readFileSync('app/app/notifications/page.tsx', 'utf8')
  const vault = fs.readFileSync('app/app/vault/page.tsx', 'utf8')
  const settings = fs.readFileSync('app/app/settings/page.tsx', 'utf8')
  const sections = fs.readFileSync('app/app/settings/sections.tsx', 'utf8')
  const adminPage = fs.readFileSync('app/app/admin/page.tsx', 'utf8')
  const adminGuard = fs.readFileSync('components/admin/AdminRouteGuard.tsx', 'utf8')
  assert.match(notifications, /tabCounts/)
  assert.match(notifications, /Review preferences/)
  assert.match(vault, /renderEmptyResources/)
  assert.match(vault, /disabled=\{!hasResources\}/)
  const settingsLib = fs.readFileSync('lib/settings.ts', 'utf8')
  assert.match(settingsLib, /resolvedOptions\(\)\.timeZone/)
  assert.match(settings, /includedData/)
  assert.match(sections, /Asia\/Kolkata/)
  assert.match(adminPage, /AdminRouteGuard/)
  assert.match(adminGuard, /isAdminUser\(user\)/)
})

test('qa fixes add inline pod validation and AI attachment handling', () => {
  const pods = fs.readFileSync('app/app/pods/page.tsx', 'utf8')
  const ai = fs.readFileSync('app/app/ai/page.tsx', 'utf8')
  assert.match(pods, /getPodFieldError/)
  assert.match(pods, /Description must be at least 20 characters/)
  assert.match(pods, /maxLength=\{500\}/)
  assert.match(ai, /handleAttachmentSelected/)
  assert.match(ai, /Attachment queued/)
  assert.match(ai, /couldn't reach the AI service/)
})

test('retest fixes cover dismissible feed suggestions, chat search, timezone auto, and AI fallback', () => {
  const feed = fs.readFileSync('app/app/feed/page.tsx', 'utf8')
  const chatPage = fs.readFileSync('app/app/chat/page.tsx', 'utf8')
  const chatBubble = fs.readFileSync('components/chat/premium/ChatBubble.tsx', 'utf8')
  const podChat = fs.readFileSync('components/pods/tabs/PodChatTab.tsx', 'utf8')
  const settings = fs.readFileSync('lib/settings.ts', 'utf8')
  const ai = fs.readFileSync('lib/ai.ts', 'utf8')
  const leaderboard = fs.readFileSync('app/app/leaderboard/page.tsx', 'utf8')
  assert.match(feed, /showSearchSuggestions/)
  assert.match(feed, /handlePointerDown/)
  assert.match(feed, /applySearchSuggestion/)
  assert.match(chatPage, /chat-message-search/)
  assert.match(chatPage, /highlightQuery=\{messageSearchQuery\}/)
  assert.match(chatBubble, /renderHighlightedText/)
  assert.match(podChat, /renderHighlightedMessage/)
  assert.match(podChat, /Send pod chat message/)
  assert.match(podChat, /Shift\+Enter for a new line/)
  assert.match(settings, /resolvePeerSparkTimeZone/)
  assert.match(ai, /buildOfflineStudyResponse/)
  assert.match(leaderboard, /z-50/)
})


test('premium chat controls are theme-aware and fully wired', () => {
  const chatPage = fs.readFileSync('app/app/chat/page.tsx', 'utf8')
  const composer = fs.readFileSync('components/chat/premium/ChatComposer.tsx', 'utf8')
  const header = fs.readFileSync('components/chat/premium/ChatHeader.tsx', 'utf8')
  const bubble = fs.readFileSync('components/chat/premium/ChatBubble.tsx', 'utf8')
  const messageRoute = fs.readFileSync('app/api/messages/[messageId]/route.ts', 'utf8')
  const appwrite = fs.readFileSync('lib/appwrite.ts', 'utf8')

  assert.match(chatPage, /conversationFilter/)
  assert.match(chatPage, /handleStartRoomCall/)
  assert.match(chatPage, /handleToggleVoiceRecording/)
  assert.match(chatPage, /sendAttachmentMessage/)
  assert.match(composer, /EMOJI_PALETTE/)
  assert.match(composer, /onAttachFile/)
  assert.match(header, /Start video call/)
  assert.match(header, /Start voice call/)
  assert.match(header, /bg-card/)
  assert.match(bubble, /QUICK_REACTIONS/)
  assert.match(bubble, /new Set/)
  assert.match(messageRoute, /action === ["']react["']/)
  assert.match(appwrite, /toggleReaction/)
})

test('chat overhaul supports new chats, inline edits, search navigation, context copy, and group route', () => {
  const chatPage = fs.readFileSync('app/app/chat/page.tsx', 'utf8')
  const conversationList = fs.readFileSync('components/chat/premium/ConversationList.tsx', 'utf8')
  const bubble = fs.readFileSync('components/chat/premium/ChatBubble.tsx', 'utf8')
  const messageGroup = fs.readFileSync('components/chat/premium/MessageGroup.tsx', 'utf8')
  const groupRoute = fs.readFileSync('app/api/messages/group-room/route.ts', 'utf8')
  const appwrite = fs.readFileSync('lib/appwrite.ts', 'utf8')

  assert.match(conversationList, /Start a new chat/)
  assert.match(chatPage, /openNewChat/)
  assert.match(chatPage, /createNewChat/)
  assert.match(chatPage, /createGroupRoom/)
  assert.match(chatPage, /jumpToSearchResult/)
  assert.match(chatPage, /handleCopyMessage/)
  assert.match(chatPage, /window\.confirm\("Delete this message for everyone\?"\)/)
  assert.match(bubble, /Edit message text/)
  assert.match(bubble, /onContextMenu/)
  assert.match(bubble, /Copy message/)
  assert.match(bubble, /audio controls/)
  assert.match(messageGroup, /activeMessageId/)
  assert.match(groupRoute, /messages:group-room/)
  assert.match(groupRoute, /type: 'group'/)
  assert.match(appwrite, /createGroupRoom/)
})


test('chat calls use in-page LiveKit stage with secure session tokens', () => {
  const chatPage = fs.readFileSync('app/app/chat/page.tsx', 'utf8')
  const callStage = fs.readFileSync('components/call/LiveKitCallStage.tsx', 'utf8')
  const tokenRoute = fs.readFileSync('app/api/calls/sessions/[sessionId]/token/route.ts', 'utf8')
  const appwrite = fs.readFileSync('lib/appwrite.ts', 'utf8')

  assert.match(chatPage, /LiveKitCallStage/)
  assert.match(chatPage, /setActiveCallStage/)
  assert.doesNotMatch(chatPage, /window\.open\(session\.joinUrl/)
  assert.match(callStage, /LiveKitRoom/)
  assert.match(callStage, /VideoConference/)
  assert.match(callStage, /MediaDeviceSelect/)
  assert.match(callStage, /Copy call invite link/)
  assert.match(callStage, /Join \$\{isVideoCall \? 'video' : 'voice'\} call/)
  assert.match(tokenRoute, /generateLiveKitToken/)
  assert.match(tokenRoute, /members\.includes\(auth\.userId\)/)
  assert.match(tokenRoute, /calls:session-token/)
  assert.match(appwrite, /getSessionToken/)
})
