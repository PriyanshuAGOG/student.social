# Student.social Pods V3 UI/UX System

Status: implementation design contract  
Branch: `feat/pods-v3-billion-ui`  
Product model source: `docs/architecture/pods-social-learning-v3-plan.md`

## 1. Experience thesis

Pods V3 should not feel like a learning management system with social features attached. It should feel like a small group of people moving through one learning outcome with unusually low coordination cost.

The interface has three jobs:

1. Make the next meaningful learning action obvious.
2. Keep the learner socially connected to the right people and context.
3. Turn effort into evidence of understanding rather than passive consumption metrics.

The product therefore treats **Learning Track** and **Pod Run** as separate first-class objects.

- A Learning Track owns reusable curriculum, source evidence, versions, learning units, assessments, projects, credentials, creator attribution, and offers.
- A Pod Run owns the cohort, schedule, sessions, conversations, shared resources, check-ins, social rhythm, and cohort progress around one Track version.

## 2. Visual identity

Pods V3 is native to the existing Student.social product identity. It should not introduce another blue-white SaaS system or a generic dark glassmorphism dashboard.

### Core palette

- Paper: `#F2ECE2`
- Card: `#FFFAF2`
- Ink: `#282520`
- Charcoal: `#292724`
- Teal: `#3F6F6B`
- Plum: `#76556D`
- Olive: `#78815F`
- Rust: `#B86249`
- Amber: `#C79043`

The dark mode keeps the warm hierarchy and material feeling. It does not invert the UI into pure black.

### Typography

- Product UI: existing Student.social sans token.
- Editorial transformation moments: existing serif token.
- Large headings use tight tracking and restrained line height.
- Dense utility metadata remains small but never below the product accessibility floor.

### Shape language

- Primary cards: 20-28 px radius.
- Utility pills: fully rounded.
- Avatars and state indicators: circles.
- Actions: rounded, compact, tactile.
- Avoid nested cards unless the child represents a distinct object or action.

### Motion

- Motion communicates hierarchy and state change, not decoration.
- Card lift is 1-2 px maximum.
- Mobile tap states scale to roughly 0.975.
- Focus transitions should feel immediate.
- `prefers-reduced-motion` disables nonessential motion.

## 3. Mobile-first navigation contract

### Global layer

Outside a Pod, Student.social keeps the normal app navigation.

### Inside a Pod

The global mobile navigation is replaced with exactly four Pod destinations:

1. Today
2. Path
3. Room
4. Circle

Library, Calendar, Progress, People, and Manage are contextual utilities and do not consume the primary mobile navigation.

### Inside a focused lesson

Global navigation and Pod navigation disappear. The learner gets:

- Back to Path
- Current lesson identity
- Main source stage
- Learning objective
- Context sheet for Notes, Discuss, Ask AI, Resources
- One sticky next meaningful action

The focused lesson must preserve state when the learner returns.

## 4. Discovery

A discovery card must answer these questions before opening:

- What will I be able to do?
- What kind of Pod is this?
- What level and language?
- How long is the commitment?
- How many people are learning together?
- When is the next shared moment?
- What is the primary next action?

Cards must not fabricate recommendation reasons, completion data, reviews, pricing, or creator verification. Those signals appear only when backed by data.

The discovery page uses two primary states:

- My Pods: learning already in motion.
- Discover: available social learning opportunities.

Discovery filters are lightweight and horizontal on mobile.

## 5. Pod creation

The creation flow starts with intended learning behavior rather than configuration fields.

### Step 1: Format

- Course Cohort
- Project Studio
- Exam Sprint
- Study Circle
- Mentor Cohort

### Step 2: Outcome

- Name
- Demonstrable outcome
- Experience description
- Topic
- Difficulty

### Step 3: Source

- Topic + AI draft
- Creator-authorized YouTube source
- Manual Track

Source intake must never imply a right to commercially transform or gate content.

### Step 4: Social rhythm

- Duration
- Cohort size
- Default live day/time
- Language
- Timezone
- Ideal learner
- Prerequisites
- Visibility
- Join approval

### Step 5: Review

The review page explains the learner-facing result instead of replaying a long settings form.

Recommended default course cohort size is 8, with a hard product cap aligned to the canonical V3 product rules once the backend model is migrated.

## 6. Today

Today is the default Pod surface and the most important screen.

First viewport order:

1. Continue learning
2. Current learning/mastery work
3. Next Room
4. Peer/help signal

Secondary context:

- Pod pulse
- Private progress
- Quick check-in
- Current blocker

The learner should not scan charts before learning.

A check-in can create a structured help signal when mood/status indicates the learner is stuck.

## 7. Path

Path replaces the conceptual separation between course, roadmap, milestone board, and task board.

A Path row can represent:

- Source lesson
- Practice
- Discussion
- Quiz/mastery check
- Assignment
- Project
- Reflection
- Live session
- Milestone

State system:

- Completed
- Recommended next
- Available
- Recovery needed
- Locked for credential progress
- Archived

Tasks and submissions remain attached to the relevant learning unit. They do not become a second competing navigation model.

Mentor editing changes future Path state without rewriting completed learner history.

## 8. Room

Room is a learning session surface, not a generic call page.

Before join:

- Session title
- Objective
- Date/time
- Agenda
- Participants
- Required preparation

During session:

- One-tap video/audio
- Shared focus timer
- Notes
- Screen share and collaboration tools through existing call infrastructure

After session:

- Summary becomes a Pod resource
- Follow-up work is attached to the Path
- Attendance remains available for progress and mentor context

## 9. Circle

Circle is the contextual social layer for the Pod.

Default channels:

- General
- Doubts
- Projects
- Wins
- Announcements

Lesson-level threads and help requests share this system instead of being routed into a separate messenger product.

Message intent can be labeled:

- Message
- Question
- Blocker
- Resource
- Update

A blocker should evolve toward the V3 structured help contract:

- Learning unit + timestamp
- What the learner tried
- Specific question
- Desired help type
- Escalation age/urgency

`@AI` is course-grounded and should never behave as an unrelated generic assistant inside the Circle.

## 10. Learning Track hub

`/app/courses` becomes the internal Learning Track surface instead of redirecting to the legacy external course shell.

The Track hub separates:

- Discover
- Creator Studio

Each Track can later expose multiple offers:

- Open Track
- Structured Edition
- Social Sprint
- Mentor Cohort

The UI must make the paid value independent from embedded YouTube playback where required by platform and licensing policy.

## 11. Track preview and player

Track preview shows:

- Outcome
- Difficulty
- Duration
- Curriculum
- Current evidence/review signals when available
- Independent enrollment action
- Social learning action through a Pod Run

Focused Track learning uses the same mental model as Pod lesson mode, but without pretending social context exists when the learner is not inside a Pod.

Watching content never equals mastery.

## 12. Creator Studio

The Creator Studio should evolve through these product stages:

1. Source intake
2. Rights basis
3. Durable generation job
4. Evidence-grounded draft
5. Creator/editor review
6. Immutable Track publication
7. Offer configuration
8. Pod Run activation
9. Analytics and blocker feedback
10. Revenue, refund, reserve, and payout ledger

The first V3 UI intentionally labels legacy course data as a migration surface. It does not present the current generic synchronous/background generator as the final production pipeline.

### Draft Studio layout

Desktop:

- Left: version/module rail
- Center: source + curriculum editor
- Right: evidence, confidence, assessment verification
- Bottom: save draft / preview / publish gate

Mobile:

- Source header
- Unit editor
- Bottom sheets for evidence, assessment, settings
- Persistent draft state

No paid Track can move to Published without the authorized creator/editor review gate.

## 13. Mastery and recovery

The mastery UX must communicate formative learning rather than punishment.

Attempt 1:

- Immediate feedback
- Explain why
- Preserve learner answer

Failed attempt:

- Replay cited source segment
- Open concept note
- Ask Pod
- Try a different question variation

Two unsuccessful attempts:

- Offer peer or mentor help
- Never create an endless hard lock

Credential gating can remain strict while curriculum visibility remains open.

## 14. Progress and healthy motivation

A single competitive leaderboard is not a primary learning surface.

Private progress remains primary.

Opt-in recognition can highlight:

- Consistency
- Helpful explanation
- Peer feedback quality
- Biggest improvement
- Reliable session partnership
- Project milestone

Public UI must not expose poor performance or sensitive learner analytics.

## 15. Mentor workspace

The mentor sees queues, not chart overload.

Priority queues:

- Unanswered blockers
- Assessments requiring review
- Peer reviews overdue/disputed
- Learners behind their own plan
- Sessions without agenda
- Repeated curriculum issues

Every queue item must have a working intervention:

- Message
- Schedule doubt room
- Assign remediation
- Extend deadline
- Adjust future Path
- Resolve report

The interface must not classify quiet learners as failing solely because they post less.

## 16. Commerce UX

Commerce remains provider-neutral in UI language until the canonical ledger and entitlement model is complete.

Learner checkout surfaces must show:

- Exact offer inclusions
- Currency and taxes where applicable
- Refund terms
- What is paid for
- Whether source playback is independently available
- Cohort/mentor capacity

Creator finance surfaces must show:

- Gross collection
- Tax
- Payment fee
- Refund/chargeback
- Net course revenue
- Creator share
- Reserve
- Payout status

Never display creator earnings as a simple percentage of checkout value when financial events can modify net revenue.

## 17. Matching and commitment UX

A recommendation should explain why it fits.

Allowed reasons include:

- Shared learning outcome
- Level/prerequisite fit
- Availability/timezone overlap
- Learning pace
- Weekly commitment
- Language
- Collaboration preference

Sensitive or protected characteristics must never be used as ranking signals.

Commitment flow should take roughly 60 seconds:

- Target date / cohort run
- Study windows
- Weekly commitment
- Quiet hours
- Goal statement
- Community agreement
- Optional buddy preference

The generated calendar is a projection of Path, not an independently maintained curriculum.

## 18. Accessibility

Required experience matrix:

- Small Android phone
- Large Android phone
- iPhone Safari/PWA
- Tablet portrait/landscape
- Laptop/desktop
- Keyboard only
- Screen reader
- Slow network
- Interrupted upload/generation

All critical state must be represented by text or semantics, not color alone.

Tap targets should remain comfortable on mobile.

Focus mode must have a clear escape path.

## 19. Data truthfulness rules

The interface may only show a metric when the current backend actually supports it.

Do not fake:

- Course fit percentages
- Verified reviews
- Completion rates
- Pricing
- Creator verification
- Rights/license state
- Mastery state
- AI evidence citations
- Payout values

When the canonical V3 service is not implemented, the UI should expose the intended state as a migration/pending capability, not as operational fact.

## 20. Implementation map in this branch

### Implemented now

- `components/pods3/Pod3App.tsx`
  - Discovery
  - Create
  - Today
  - Path
  - Room
  - Circle
  - Library
  - People
  - Progress
  - Mentor queue
  - Manage
  - Pod preview
  - Focus lesson
  - Invite accept
- `components/pods3/LearningTrackHub.tsx`
  - Track discovery
  - Creator migration surface
  - Internal Track preview
  - Existing-course entitlement bridge
  - Focus Track player
- `components/pods3/pods-v3.css`
  - Complete visual tokens and responsive behavior
- `app/app/pods/[podId]/learn/page.tsx`
  - Dedicated focus route
- `/app/courses`
  - No longer redirects outside the signed-in app shell

### Compatibility layer

`components/pods2/Pod2App.tsx` is now a small re-export so all current routes continue working without a route migration.

### Not falsely implemented

The following need the backend phases already defined in the V3 architecture plan before the UI can claim production behavior:

- Canonical Track/Version/Unit persistence
- Durable generation jobs
- Evidence-grounded assessment generation
- Canonical mastery attempts and recovery state
- Creator licensing workflow
- Marketplace offers and entitlements
- Append-only commerce ledger
- Refunds and payout accounting
- Explainable cohort assembler at scale

## 21. Product acceptance criteria

A learner should be able to open a Pod and answer, within seconds:

- What am I learning?
- What should I do now?
- How do I prove I understand it?
- When are we meeting?
- Who can help me?
- Where do I ask?
- What happens if I get stuck?
- What evidence will I leave with?

A creator should understand the distinction between reusable Track and social Pod Run without product training.

A mentor should be able to find actionable problems without scanning a dashboard of vanity charts.

On a small phone, Today, Path, Room, Circle, and focused lesson mode must remain fully operable with one hand and without horizontal page scrolling.
