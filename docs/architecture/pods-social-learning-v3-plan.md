# Student.social Pods: Social Learning System V3

Status: product and implementation blueprint  
Scope: Pods, structured courses, creator marketplace, social learning loops, and connected platform services  
Principle: a Pod is not a folder of features. It is a small group of people moving toward the same learning outcome together.

## 1. Product thesis

Student.social should turn abundant educational content into a guided social learning experience.

The core unit is:

> A small, well-matched cohort follows a structured learning track, meets on a shared rhythm, helps one another through blockers, demonstrates mastery, and leaves with proof of work.

The system has two reusable objects:

- **Learning Track:** the curriculum, source material, lessons, notes, assessments, projects, prerequisites, and credential rules.
- **Pod Run:** a time-bound or ongoing social cohort following a version of a Learning Track.

One Learning Track can serve many Pod Runs. A Pod Run owns its members, schedule, conversations, sessions, shared resources, check-ins, submissions, and cohort progress.

This distinction is the foundation of the redesign. It prevents the course, pod, roadmap, and chat systems from competing with each other.

## 2. The Student.social promise

The product promise should be visible in every Pod surface:

1. **Know what to do today.** No learner should need to interpret a large dashboard.
2. **Never learn alone.** Every milestone has a peer, discussion, review, or live-session opportunity.
3. **Prove understanding.** Progress is based on meaningful work and mastery, not passive playback.
4. **Recover when stuck.** A failed quiz or missed day opens a recovery path instead of creating a dead end.
5. **Finish with evidence.** Learners leave with projects, reviewed submissions, reflections, and a verifiable completion record.

## 3. Existing-system audit

### What is already valuable

The current platform already contains most of the required primitives:

- Pod discovery, creation, joining, roles, invites, and matching signals.
- Roadmap items, tasks, submissions, sessions, resources, check-ins, channels, messages, reactions, insights, and notifications.
- LiveKit calling, pod chat integration, shared study rooms, calendar integration, and Resource Vault integration.
- Course, chapter, generated-content, assignment, progress, enrollment, review, statistics, achievement, and certificate collections.
- YouTube URL input, transcript utilities, AI content generation, course-player components, checkout scaffolding, and instructor analytics concepts.

### Current fragmentation to resolve

1. The active Pod workspace has Home, Plan, Room, and Chat, but a course is not a first-class part of that journey.
2. The current Pod create wizard accepts a YouTube URL, but the active Pods2 flow produces a generic starter roadmap rather than a source-grounded course.
3. There are multiple overlapping course-generation routes with different schemas and behaviors.
4. One generator creates generic chapters; another starts background work that is not durable enough for serverless execution; an older course system lives outside the current internal app shell.
5. The active Pod workspace is a 1,300+ line component, while older Pod and course components still coexist.
6. Course progress, Pod progress, task progress, and achievements are not yet governed by one mastery model.
7. Checkout exists, but verified payment fulfillment, refunds, entitlements, creator onboarding, revenue allocation, and payout accounting are incomplete.
8. The existing maximum of 50 members fits a community but weakens the intimacy of a course cohort.
9. Several mentor and insight controls are present visually but do not yet form a complete intervention workflow.

The redesign should consolidate these foundations rather than create another parallel Pod implementation.

## 4. Pod types

The creation flow should begin with the intended learning behavior, not a long configuration form.

### Course Cohort

- Follows one published Learning Track version.
- Recommended size: 4-8 learners; hard default cap: 12.
- Has a start date, target completion date, weekly rhythm, mastery rules, and final outcome.
- Best for the YouTube-to-structured-course vision.

### Project Studio

- Works toward one demonstrable artifact.
- Uses milestones, peer reviews, demos, and a portfolio outcome.
- A Learning Track may be attached as supporting material, but the project is primary.

### Exam Sprint

- Uses topic diagnostics, revision cycles, practice sets, doubt rooms, and mock exams.
- Progress emphasizes mastery by topic and error recovery.

### Study Circle

- Ongoing, lighter-weight community for a subject or skill.
- May attach multiple optional tracks, but only one shared focus can be active at a time.
- Recommended size: 8-20; larger groups should use sub-circles.

### Mentor Cohort

- A Course Cohort with instructor-led sessions, review queues, office hours, and stronger completion accountability.
- Pricing and mentor capacity are explicit before enrollment.

## 5. End-to-end learner journey

### 5.1 Discover

Each Pod card should answer six questions without opening the Pod:

- What will I be able to do?
- Which track are we following?
- Who is this for?
- How many hours per week?
- When does the cohort meet and start?
- Why is this a good match for me?

Card content:

- Outcome-led title and one-line promise.
- Learning Track and creator attribution.
- Format: cohort, sprint, studio, or circle.
- Start date, duration, weekly commitment, language, level, and cohort occupancy.
- Next live session or cohort start.
- Fit explanation such as “Matches your Java goal and evening availability.”
- Real evidence: completion rate, active cohort count, verified reviews, and sample final projects.
- One primary action: Preview, Join free, or Enroll.

### 5.2 Preview

The Pod preview is a conversion and trust page, not a generic overview.

Sections:

1. Outcome and final proof of work.
2. Course creator, source, and licensing/attribution.
3. Curriculum timeline with locked-state explanation.
4. Weekly social rhythm.
5. Upcoming cohort and meeting schedule.
6. Current members or anonymized cohort composition.
7. Mentor involvement and response expectations.
8. Price, refund policy, and exactly what is paid for.
9. Sample lesson, notes, quiz, and project.
10. Accessibility, language, prerequisites, and device requirements.

### 5.3 Commit

Joining should include a 60-second commitment step:

- Choose a target completion date or cohort run.
- Select available study windows.
- Select weekly time commitment.
- Choose notification quiet hours.
- Pick a goal statement.
- Accept a short community agreement.
- Optionally choose a peer buddy preference.

The system then generates the learner's calendar plan and explains the first three actions.

### 5.4 Learn together

The repeated learning loop is:

> Learn → Recall → Apply → Discuss → Prove → Reflect → Unlock credential progress

Every lesson can include:

- Source video or licensed media with timestamps.
- Concise objectives and prerequisites.
- AI-generated notes that cite source timestamps.
- Key concepts, examples, glossary, flashcards, and downloadable resources.
- A short recall check.
- A practical exercise or code task.
- A timestamped discussion prompt.
- “I am stuck” escalation to peers, AI, or mentor.
- A mastery check and recovery route.

### 5.5 Finish

Completion requires more than reaching the last video:

- Required mastery checks passed.
- Required project or proof of work accepted.
- Required peer review completed where applicable.
- Final reflection submitted.
- Credential rules satisfied.

Completion generates:

- Verifiable certificate or completion record.
- Portfolio-ready project page.
- Skill evidence summary.
- Optional feed celebration.
- Creator/course review prompt.
- Recommendation for the next Track or Pod.

## 6. Pod workspace information architecture

The workspace should use four primary destinations and one contextual utility menu.

### Today

The default and most important screen.

- One primary “Continue learning” action.
- Today's lesson and mastery task.
- Next live session.
- Buddy or peer touchpoint.
- Current blocker, if any.
- Lightweight Pod pulse: active now, group milestone, and recent help activity.
- Quick check-in at the end of the study block.

Avoid generic hero cards and duplicate explanations. The first viewport should be actionable.

### Path

Combines the course, roadmap, milestones, and tasks into one coherent timeline.

- Module rail with progress and estimated time.
- Lesson rows with source, practice, discussion, and mastery state.
- Milestone projects embedded at the correct point.
- Personal schedule overlay and cohort schedule markers.
- Clear states: available, recommended next, completed, recovery needed, and credential requirement.
- Mentors can edit the future path without rewriting completed learner history.

The current separate roadmap board and task board should become views of the same learning units.

### Room

- Upcoming and live sessions.
- One-tap voice/video join.
- Session objective, agenda, materials, and participants.
- Focus timer, shared notes, whiteboard, screen share, and recordings where permitted.
- Session summary becomes a Pod resource and creates assigned follow-up actions.
- Past session archive with attendance and decisions.

### Circle

Combines people and conversation around learning context.

- General, Doubts, Projects, Wins, and Announcements channels.
- Lesson-level timestamped threads appear in the same Pod conversation system.
- Members grouped by active now, similar pace, can help, and needs help.
- Buddy check-ins and peer-review requests.
- `@AI` acts as a course-grounded facilitator, not a generic chatbot.

### Utility menu

- Library
- Calendar
- Progress
- Members and roles
- Pod management

These remain discoverable without consuming the mobile primary navigation.

## 7. Course-player UX

### Desktop

- Main media/lesson stage.
- Compact module rail.
- Context panel with Notes, Discuss, Ask AI, and Resources.
- Sticky bottom action showing the next meaningful step.

### Mobile

- Full-width source stage.
- Current objective and progress immediately below it.
- Bottom-sheet tabs for Notes, Discuss, Ask AI, and Resources.
- Fixed action for quiz, exercise, or next lesson.
- No global app navigation while inside a focused lesson; use a clear back action and preserve state.

### Mastery behavior

- Watching a video never equals mastery.
- A first attempt gives immediate formative feedback.
- Failure opens targeted remediation: replay a cited segment, review a concept note, ask the Pod, or try a different question variation.
- Two unsuccessful attempts offer a peer/mentor help path rather than an endless lock.
- The learner can inspect the future curriculum even when credential progress is gated.

## 8. Social learning mechanics

### Small-cohort formation

Course cohorts should normally contain 4-8 active learners. Large communities can contain many learners but should create smaller working circles.

### Weekly rhythm

A default course cohort rhythm:

- Monday: plan and personal commitment.
- Tuesday-Thursday: lessons, exercises, and asynchronous discussion.
- Midweek: doubt room or co-working session.
- Friday: project progress and peer review.
- Weekend: live build/review, reflection, and next-week planning.

Learners can choose another rhythm, but every Pod should communicate its rhythm before joining.

### Buddy system

- Match two compatible learners within a Pod.
- Weekly low-pressure check-in.
- Easy reassignment and opt-out.
- No exposure of private progress without consent.

### Help loop

“I am stuck” creates a structured help request containing:

- Lesson and timestamp.
- What the learner tried.
- Specific question.
- Desired help type: hint, explanation, pair session, or mentor review.

The system routes it to available peers, `@AI`, and eventually a mentor based on urgency and age.

### Peer review

- Rubric-driven, anonymized when useful.
- Reviewer guidance and example feedback.
- Review quality signal, not just review count.
- Creator/mentor escalation for disputed grading.

### Healthy motivation

Replace a single competitive leaderboard with multiple contribution recognitions:

- Consistency
- Most helpful explanation
- Best peer feedback
- Biggest improvement
- Reliable session partner
- Project milestone

Private progress remains primary. Public recognition is opt-in and cannot expose poor performance.

## 9. Matching and scheduling algorithms

### Pod fit score

Initial explainable weights:

- 30% shared learning outcome and topic.
- 20% level and prerequisite fit.
- 18% availability and timezone overlap.
- 12% learning pace.
- 10% weekly commitment.
- 5% language.
- 5% preferred collaboration style.

Apply penalties for:

- Cohort capacity.
- Start-date mismatch.
- Schedule overlap below the minimum session window.
- Course prerequisite gaps.
- Inactive or unhealthy Pod state.

Never use protected or sensitive characteristics to rank learners. Show the top reasons behind every recommendation.

### Cohort assembler

The assembler should optimize the group, not independently pick the highest Pod score for every learner.

Objectives:

- Strong shared availability.
- Compatible pace and target date.
- Sufficient topic fit.
- Balanced participation preferences.
- Minimum viable cohort size before launch.

Re-run only before the cohort starts. Do not silently move learners after social bonds form.

### Personal schedule generator

Inputs:

- Track duration and learning-unit estimates.
- Target completion date.
- Available days and time windows.
- Existing calendar conflicts.
- Pod sessions and deadlines.
- Learner pace and recovery buffer.

Outputs:

- Daily study blocks.
- Milestone and assessment dates.
- Pod sessions.
- Catch-up buffer.
- Automatic reflow when a learner misses work.

The calendar is a projection of the Path, not a separately maintained copy.

### Pod health score

Use:

- Meaningful weekly active members.
- Task/mastery completion.
- Session attendance.
- Unanswered help requests.
- Peer-response time.
- Check-in continuity.
- Member churn.

Show confidence and contributing factors. Do not treat silent reading or missed check-ins alone as failure.

## 10. YouTube-to-course production pipeline

The current generic or non-durable generators should be replaced by one versioned job pipeline.

### Stage 1: source intake

- Validate URL, video ID, creator/channel, playability, embedding availability, language, duration, and content status.
- Record the source and immutable source metadata.
- Require a rights basis: creator-authorized, licensed, or platform-approved open source.
- For creator partnerships, verify channel ownership or execute a content license before commercial publication.

### Stage 2: transcript and source evidence

- Prefer creator-uploaded transcripts/captions or an officially authorized caption source.
- Preserve timestamps and language variants.
- Do not depend on scraping public transcripts as the production foundation.
- Normalize transcript segments and store a source hash.

### Stage 3: curriculum analysis

- Detect prerequisites and assumed knowledge.
- Segment the source into coherent lessons and modules.
- Map each lesson to measurable learning objectives.
- Identify concepts, examples, demonstrations, and missing explanations.
- Mark low-confidence or unsupported sections for human review.

### Stage 4: learning-material generation

Generate source-grounded:

- Lesson summaries and timestamped notes.
- Glossary and flashcards.
- Recall questions.
- Applied exercises.
- Quiz pools with answer explanations.
- Projects and rubrics.
- Discussion prompts.
- Remediation paths.
- Estimated effort and suggested schedule.

Every generated factual claim should link to a timestamp or be explicitly labeled as supplemental material.

### Stage 5: quality validation

Automated checks:

- All timestamps fall within source duration.
- Every answer exists in evidence or approved supplemental material.
- No duplicate or contradictory questions.
- Difficulty progression is sensible.
- Passing criteria and rubrics are complete.
- Safety, plagiarism, and prompt-injection screening.
- Accessibility: captions, readable notes, keyboard behavior, and contrast.

### Stage 6: creator/editor review

The creator sees a draft studio with:

- Source video beside generated modules.
- Inline edit, regenerate, merge, split, and reorder.
- Evidence and confidence display.
- Assessment preview and answer verification.
- Pricing, license, attribution, and credential settings.
- Mobile learner preview.

No paid Track is published without creator or authorized editor approval.

### Stage 7: immutable publication

- Publish a versioned Track.
- Existing cohorts remain on their selected version unless explicitly upgraded.
- Source removal pauses new enrollments and activates a replacement/recovery workflow.
- Course edits create a draft version; they do not mutate completed learner records.

### Stage 8: cohort activation

- Select Track version.
- Choose dates, capacity, schedule, mentor, and price offer.
- Generate the Pod Path and calendar from the Track.
- Open enrollment and matching.

## 11. YouTube and creator-rights guardrails

YouTube's current developer policies state that an API client must not charge users to watch content in an embedded YouTube player and must not gate embedded playback behind YouTube-specific actions. The product must therefore support two clearly separated modes.

### Open Track mode

- Embedded YouTube playback remains available without a course paywall.
- Student.social may charge only for clearly independent value where legally and contractually permitted: structured learning services, cohort facilitation, assessments, projects, review, mentorship, and credentials.
- Do not award money, points, or access merely for watching or engaging with YouTube.
- Preserve YouTube branding, player controls, attribution, referer/origin behavior, and embed restrictions.

### Licensed Learning Edition

- Creator signs a license covering use of the source, transcript, derivative notes, assessments, marketing assets, and commercial distribution.
- Prefer creator-supplied media or a separately licensed hosted version when gated lesson access is required.
- The contract defines territories, duration, takedown, updates, revenue share, refunds, warranties, and permitted AI transformations.

Policy references:

- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://support.google.com/youtube/answer/171780

Legal counsel should review the creator license, consumer terms, refund policy, tax treatment, and credential claims before paid launch.

## 12. Creator experience

### Creator onboarding

- Identity and payout onboarding.
- Channel ownership verification.
- Creator profile and expertise.
- Content rights agreement.
- Tax and payout information.

### Creator Studio

- Import source.
- Track generation job status.
- Curriculum editor.
- Assessment and rubric review.
- Learner preview.
- Cohort creation and mentor assignment.
- Version and release management.
- Reviews, questions, completion, and drop-off analytics.
- Revenue, refunds, reserves, and payout ledger.

### Creator feedback loop

Show actionable signals:

- Lessons with highest replay or remediation demand.
- Most common blockers.
- Questions with poor discrimination.
- Project-review bottlenecks.
- Cohorts needing a live session.
- Completion and satisfaction by version.

Do not expose private learner conversations or personal performance outside the permissions required for teaching.

## 13. Monetization design

### Offers

- **Open Pod:** free access to an open Track and community.
- **Structured Edition:** low-cost notes, practice, assessments, projects, and completion record.
- **Social Sprint:** Structured Edition plus a scheduled small cohort and live peer sessions.
- **Mentor Cohort:** mentor reviews, office hours, and final evaluation.

The proposed ₹99-₹199 range is suitable for an introductory, primarily automated edition. Mentor-heavy cohorts need separate pricing because support cost scales with enrollment.

### Revenue accounting

Do not calculate creator earnings as 50% of the checkout amount. Define:

> Net course revenue = collected amount - tax - payment fee - refund - chargeback - approved discounts.

Recommended initial split:

- 50% of net course revenue to the creator.
- 50% of net course revenue to Student.social.

Store every financial event in an append-only ledger. A refund creates reversing entries; it never edits prior transactions.

### Payout rollout

The current checkout route is not a complete marketplace payment system. Build:

1. Signed payment webhooks and idempotent order fulfillment.
2. Entitlements independent of the browser redirect.
3. Refunds, disputes, tax fields, receipts, and reconciliation.
4. Creator balance ledger and payout statements.
5. KYC/payout provider onboarding.

Stripe Connect supports marketplace accounts and payout scheduling, but India availability and self-serve capabilities require account-specific approval. Build the provider-neutral ledger first, then enable automated payouts only after approval. Until then, approved manual monthly payouts can be reconciled against the same ledger.

## 14. AI facilitator

The Pod AI should be grounded in the active Track version, Pod resources, approved session summaries, and the learner's own progress.

Capabilities:

- Answer with citations to lesson timestamps and notes.
- Generate a simpler explanation or another example.
- Quiz the learner without revealing answers prematurely.
- Turn a blocker into a well-formed Pod question.
- Summarize a discussion and identify unresolved points.
- Suggest a recovery plan after missed work.
- Draft session agendas from cohort blockers.
- Help mentors group related questions.

Boundaries:

- Do not complete graded submissions for the learner.
- Mark generated supplemental knowledge clearly.
- Preserve source and creator attribution.
- Keep private DMs out of Pod-wide grounding.
- Log model version, prompt version, source version, and citations for generated course assets.

## 15. Data architecture

### Preserve and evolve

Keep the current Pod collections as the collaboration layer:

- `pods`
- `pod_memberships`
- `pod_roadmap_items`
- `pod_tasks`
- `pod_task_submissions`
- `pod_sessions`
- `pod_session_attendance`
- `pod_resources`
- `pod_checkins`
- `pod_chat_channels`
- `pod_messages`
- `pod_message_reactions`
- `pod_insights`
- `pod_invites`
- `pod_notifications_queue`

### Add or consolidate the learning domain

- `learning_tracks`: stable product identity and creator.
- `learning_sources`: YouTube/licensed/uploaded source, rights basis, hashes, and availability.
- `track_versions`: immutable published curriculum versions.
- `learning_units`: modules, lessons, exercises, projects, and reflections.
- `unit_assets`: notes, transcripts, flashcards, files, and supplemental links.
- `assessments`: rules, passing score, attempt policy, and credential relevance.
- `assessment_items`: versioned question pools and evidence citations.
- `mastery_attempts`: append-only answers, score, feedback, and review state.
- `learner_unit_progress`: per-user state, mastery, time, and last position.
- `track_enrollments`: entitlement and completion state.
- `pod_tracks`: binds a Pod Run to one Track version, dates, pace, and unlock policy.
- `discussion_anchors`: links messages to lesson, timestamp, assessment, or project.
- `peer_reviews`: assignment, rubric response, moderation, and quality signal.
- `course_generation_jobs`: durable step state, retry count, correlation ID, and failure reason.
- `creator_accounts`: creator identity, verification, and payout state.
- `content_licenses`: rights scope, status, territory, dates, and takedown rules.
- `course_offers`: price, currency, inclusions, cohort, and sale status.
- `orders`: payment and entitlement state.
- `financial_ledger`: append-only platform, creator, tax, fee, refund, and reserve entries.
- `payouts`: creator payout batches and provider status.
- `domain_events`: durable outbox for notifications, analytics, and automation.

### Relationship rules

- A Track has many versions.
- A Pod Run references exactly one active Track version in Course Cohort mode.
- A Track version is immutable after publication.
- An enrollment grants access to an offer; a Pod membership grants social access.
- Mastery belongs to learner + Track version + learning unit.
- Pod tasks may reference learning units but cannot replace canonical mastery records.
- Calendar events reference Pod sessions or learner study blocks.

## 16. Service architecture

Break the current all-in-one Pods2 route into domain services while preserving URLs during migration:

- Pod service: identity, membership, invites, roles, and visibility.
- Track service: sources, versions, units, and publication.
- Cohort service: Pod-to-Track binding, enrollment, pacing, and cohort state.
- Mastery service: assessments, attempts, progress, unlocks, and credentials.
- Collaboration service: channels, messages, anchored discussions, reactions, and peer review.
- Session service: scheduling, attendance, calls, summaries, and recordings.
- Resource service: Pod and Track libraries, attachment rules, and access.
- Notification service: real-time events, push/email, quiet hours, retries, and preferences.
- Commerce service: offers, checkout, webhooks, entitlements, refunds, ledger, and payouts.
- Course-generation worker: durable, idempotent, resumable pipeline.
- Insight service: cohort health, learner intervention, and creator analytics.

Long-running generation must run in a durable worker or job system. A request should create a job and return immediately. Every stage must be resumable and idempotent.

## 17. Event model

Important events include:

- `track.source.accepted`
- `track.generation.started`
- `track.version.published`
- `cohort.enrollment.created`
- `pod.member.joined`
- `unit.started`
- `mastery.attempted`
- `unit.mastered`
- `help.requested`
- `help.resolved`
- `peer_review.assigned`
- `session.starting`
- `session.completed`
- `milestone.completed`
- `course.completed`
- `order.paid`
- `order.refunded`
- `creator.earning.recorded`
- `payout.completed`

These events drive notifications, calendar updates, progress recomputation, analytics, feed celebrations, and creator statements. Consumers must be idempotent.

## 18. Notifications

Notifications should be relevant, actionable, and grouped.

Priority examples:

- Immediate: direct help response, session live, review requested, payment issue.
- Scheduled: session reminder, task due, buddy check-in.
- Digest: weekly progress, missed activity, creator analytics.

Rules:

- Respect quiet hours and per-Pod settings.
- Avoid duplicate web/push/email delivery.
- Deep-link to the exact lesson, message, review, or session.
- Escalate unanswered help requests rather than repeatedly notifying the same audience.
- Let users pause a Pod without leaving it.

## 19. Mentor and moderator workspace

Mentors need a queue, not more charts.

Primary queues:

- Unanswered blockers.
- Assessments requiring review.
- Peer reviews overdue or disputed.
- Learners falling behind their own plan.
- Upcoming sessions without an agenda.
- Curriculum issues reported by multiple learners.

Each insight must have a working action: message, schedule a doubt room, assign remediation, extend a deadline, change a question, or resolve a report.

## 20. Safety, privacy, and academic integrity

- Server-side membership and role checks for every Pod resource.
- Private learner analytics visible only to the learner and authorized teaching roles.
- Clear reporting, muting, removal, and appeal paths.
- Youth-safety review if minors are allowed.
- File scanning and scoped media access.
- Plagiarism indicators are review aids, not automatic guilt decisions.
- AI-assistance disclosure on graded submissions.
- Assessment variation without opaque or discriminatory scoring.
- Data retention and source-removal procedures.
- Audit logs for mentor changes, grading overrides, rights changes, and financial events.

## 21. Migration strategy

Avoid a big-bang rewrite.

### Step 1: establish one canonical model

- Freeze creation of additional course schemas.
- Choose the new Track/Version/Unit model.
- Build adapters for existing `courses`, `course_chapters`, `pod_courses`, roadmap items, and tasks.

### Step 2: build one vertical slice

- One creator-approved Java Track.
- One source video or playlist.
- Five to ten learning units.
- One 5-person Pod Run.
- Today, Path, Room, and Circle.
- Notes, one quiz per module, one project, calendar plan, chat, and a live session.
- Free enrollment initially.

### Step 3: migrate UI before removing APIs

- Split the active Pod workspace into focused components.
- Keep existing route URLs and calls/chat/resource integrations.
- Replace old course UI with the internal app design system.
- Redirect legacy course dashboards after feature parity.

### Step 4: migrate data safely

- Backfill legacy courses into draft Tracks.
- Bind existing Pod courses through `pod_tracks`.
- Preserve IDs through mapping documents.
- Run dual-read comparison before switching canonical reads.
- Do not delete legacy collections until reconciliation and rollback windows close.

## 22. Delivery phases and acceptance criteria

### Phase 0: product and policy foundation

Deliver:

- Approved object model and UX map.
- Creator-rights workflow.
- Open Track versus Licensed Learning Edition rules.
- One reference Java course and target cohort definition.
- Analytics event dictionary.

Exit criteria:

- No ambiguity about what users pay for.
- No new course schema is created outside the canonical model.

### Phase 1: Pod shell and learner activation

Deliver:

- Redesigned discovery, preview, commitment, Today, Path, Room, and Circle.
- Small-cohort limits and explainable matching.
- Calendar-generated study plan.
- Mobile-first focus behavior.

Exit criteria:

- A new learner can join, understand the outcome, schedule the course, and complete the first social learning action without guidance.

### Phase 2: durable course pipeline

Deliver:

- Source and rights intake.
- Durable generation jobs.
- Transcript segmentation and evidence model.
- Versioned modules, lessons, notes, quizzes, and projects.
- Creator review studio.

Exit criteria:

- A failed generation resumes safely.
- Every generated assessment answer has source evidence or an approved supplemental label.
- Publishing creates an immutable version.

### Phase 3: mastery and social loop

Deliver:

- Lesson player.
- Mastery attempts and recovery paths.
- Anchored discussion and structured help requests.
- Peer review and milestone projects.
- Grounded `@AI` facilitator.

Exit criteria:

- Learners can complete an entire reference Track with no manual database repair.
- A blocker can move from request to resolution with traceable ownership.

### Phase 4: mentor and cohort intelligence

Deliver:

- Mentor work queue.
- Cohort health and intervention actions.
- Session summaries and follow-up tasks.
- Fair contribution recognition.

Exit criteria:

- Every mentor insight has a real action and outcome state.
- Quiet learners are not misclassified solely for low message volume.

### Phase 5: commerce and creator marketplace

Deliver:

- Offers, orders, signed webhooks, entitlements, refunds, and receipts.
- Creator onboarding and licensing.
- Append-only revenue ledger.
- Creator statements and approved payout flow.

Exit criteria:

- Payment success grants entitlement exactly once.
- Refunds reverse access and ledger entries correctly.
- Creator earnings reconcile to order, fee, tax, and refund events.

### Phase 6: scale and marketplace discovery

Deliver:

- Cohort assembler at scale.
- Track and Pod recommendations.
- Course reviews and verified outcomes.
- Creator quality scores and version analytics.
- Operational dashboards and automated incident signals.

Exit criteria:

- Matching improves activation without degrading schedule fit or cohort health.
- Marketplace ranking is explainable and resistant to simple gaming.

## 23. Verification strategy

### Contract and domain tests

- Role and membership access.
- Learning-unit state transitions.
- Mastery and credential rules.
- Job idempotency and retry behavior.
- Track-version immutability.
- Payment webhook replay.
- Refund and revenue-ledger balancing.
- Rights expiry and source takedown.

### End-to-end journeys

- Free learner joins and completes first unit.
- Paid learner purchases and receives entitlement.
- Creator imports, reviews, and publishes a Track.
- Pod forms, schedules, studies, meets, and completes.
- Learner misses work and receives a recovery plan.
- Learner asks for help and gets peer/mentor resolution.
- Creator removes a source and enrolled learners receive a safe outcome.

### Device and experience matrix

- Small Android phone.
- Large Android phone.
- iPhone Safari/PWA.
- Tablet portrait and landscape.
- Laptop and desktop.
- Keyboard-only and screen reader.
- Slow network and interrupted generation/upload.

### Load and reliability

- Large discovery catalog.
- Concurrent Pod chat and presence.
- Cohort start notification bursts.
- Live session joins.
- Generation queue backpressure.
- Payment webhook duplicates and out-of-order events.

## 24. Product metrics

### North-star metric

**Weekly Social Learning Completions:** learners who complete at least one mastery or project action and one meaningful peer action in the same week.

This measures learning and social value together.

### Activation funnel

- Preview → enrollment.
- Enrollment → commitment completed.
- Commitment → first unit started.
- First unit → first mastery action.
- First mastery action → first peer interaction.
- First week → second-week return.

### Learning quality

- Mastery rate by learning unit.
- Recovery success after failed attempts.
- Project acceptance and revision rate.
- Completion time versus learner plan.
- Credential completion.

### Social health

- Help-request response and resolution time.
- Learners with at least one trusted Pod connection.
- Session attendance and return rate.
- Peer-review completion and quality.
- Cohort survival through the halfway point.

### Creator and commerce

- Time from source intake to publishable draft.
- Creator approval/edit rate for AI material.
- Paid conversion, refund, and dispute rate.
- Net revenue per completed learner.
- Creator earnings and payout success.
- Completion and satisfaction by creator and Track version.

### Guardrails

- Notification opt-out and mute rate.
- Abuse and moderation incidents.
- AI citation failures.
- Incorrect assessment reports.
- Source takedowns.
- Payment reconciliation failures.
- Drop-off after failed mastery attempts.

## 25. Recommended first build slice

Build one excellent reference journey before expanding the marketplace:

1. A creator-approved Java fundamentals Track.
2. Ten lessons grouped into three modules.
3. Timestamped notes and one short assessment per module.
4. One final console application project with peer review.
5. A 14-day, five-person Course Cohort.
6. A generated calendar plan with two live sessions.
7. Today, Path, Room, and Circle fully connected.
8. Grounded `@AI` help with source citations.
9. Free enrollment for the first validation cohort.
10. Measure activation, blocker resolution, mastery, social participation, and completion.

Only after this journey works end to end should paid enrollment and creator payouts be enabled.

## 26. Immediate engineering sequence

1. Add feature flags for `podsV3`, `tracksV3`, and `creatorCommerce`.
2. Define canonical Track, Version, Unit, Enrollment, Mastery, PodTrack, and Job schemas.
3. Extract Pod domain services from the catch-all route without changing current behavior.
4. Split the active Pod workspace into Today, Path, Room, Circle, and utilities.
5. Build the Java reference Track as seeded, reviewed content.
6. Bind it to one test Pod Run and drive roadmap/calendar/tasks from the Track.
7. Implement mastery attempts and the learner recovery path.
8. Add anchored discussion and grounded AI context.
9. Implement the durable creator import pipeline.
10. Run a real five-person cohort and use evidence from that cohort to finalize commerce.

## 27. Definition of success

Pods V3 is successful when a learner can say:

> “I knew exactly what to learn, I had people to learn it with, I could get unstuck quickly, and I finished with proof that I can use the skill.”

That outcome—not the number of tabs, cards, or generated lessons—is the product's defensible USP.
