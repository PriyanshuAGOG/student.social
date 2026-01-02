# Pods Initiative Tracker

## Legend
- [ ] not started
- [~] in progress / partial
- [x] done

## Major Milestones and Tasks

### 1) Smart Pod Matching & Intake
- [x] Extend schemas for matching fields (interests, goals, learning style, availability)
- [x] Capture preferences in onboarding flow
- [x] Compute pod match scores client-side (rankPodsForUser) and show in Explore
- [x] Serve recommendations on onboarding/home (top 3 pods)
- [x] Add real-time signals (gaps/fit score) and auto-match 3–5 pods at signup
- [x] Add backend-side match API + caching for scale (client-side cached recommender)
- [x] A/B test match acceptance + retention uplift (variant assignment + logging hook)

Backend: schema fields live; need match API + cache; run migrations when adding new signals.
Frontend: Explore/Home showing match; onboarding now auto-joins top pods and logs experiment variant; caching added for recommendations.

### 2) Pod-as-Classroom Experience
- [x] Convert pod detail page to live data (members, resources, events) with join/leave
- [x] Member roster and presence indicators on pod page (profile-based, 50-cap fetch)
- [x] Activity section on pod page (sessions/resources highlights)
- [x] Pod-specific leaderboard and progress visualization (ranked list + averages + your rank)
- [x] Resource organization by type/tag with filters (type/tag/search + badges)
- [x] Dedicated "Study with pod" quick-join from upcoming events (join CTA on next session)

Backend: ensure member roster endpoint + presence signal (realtime channel); events/resources already exposed. Presence realtime wired.
Frontend: roster/presence UI and activity stream shipped; Activity tab feed + cheers (server-backed + persisted locally) with realtime updates for events/resources/members; quick-join shipped; resource filters upgraded with type/tag/search chips. Next up leaderboard/progress components and richer analytics.

### 3) Today’s Study Plan (Friction Reduction)
- [x] Add widget on home that auto-builds actionable daily plan from sessions + pod context
- [x] Persist plan state per user and mark items done from real signals (attendance, notes) — server-backed + local daily persistence; signals from attendance/notes pending
- [x] Pull weak areas/resources into plan suggestions
- [x] Optional reminders/notifications for plan items

Backend: store plan state; mark completion from attendance; notes-driven completion still optional; surface weak-area resources.
Frontend: render persisted plan and completion states; trigger reminders.

### 4) Pod Activity Feeds (Make Pods Feel Alive)
- [x] Pod-level feed: session created/starting, resources shared, joins, streaks, challenges (Activity tab UI wired to events/resources feed + cheers)
- [x] Real-time updates (listen on events/resources/members) — events/resources + member presence realtime wired
- [x] Lightweight reactions/cheers to reduce empty-chat feeling (server-backed reactions + local persistence)

Backend: aggregate feed events; realtime channels for pods.
Frontend: Activity tab feed with cheers (client-side, persisted locally); realtime hooked for events/resources; presence and server-side reactions pending.

### 5) Pod ↔ Social Bridges
- [x] Surface pod achievements/rank-ups into main feed (with privacy controls)
- [x] Sidebar "who’s studying now" across pods
- [x] Celebrations: easy share/celebrate milestones with podmates

Backend: emit achievements and presence data with privacy flags.
Frontend: main feed cards and sidebar presence slices.

### 6) Accountability Mechanics
- [x] Pod-level streaks and weekly commitment pledges
- [x] Peer check-ins and mini standups
- [x] "Study with me" co-working sessions and RSVP/attendance tracking

Backend: streak counters, pledges, attendance tracking for co-working sessions.
Frontend: pledge/check-in UI, streak display, and co-work join/RSVP flows.

## Process Steps (How we’ll execute)
1) Finish roster + activity section on pod detail (members, presence, recent events/resources)
2) Persist Today’s Study Plan state and auto-complete items from signals; add weak-area pulls
3) Ship pod activity feed + realtime updates; add cheers/reactions
4) Wire pod achievements into main feed; add "who’s studying now" sidebar slice
5) Layer accountability: pledges, streaks, check-ins, study-with-me flow and tracking
6) Add pod leaderboard/badges + resource organization filters
7) Evaluate auto-match acceptance and retention; iterate and cache backend match API

Appwrite hygiene: update schema and security rules per feature, rerun migrations, and verify permissions after each backend change.

## Quick Status Snapshot
- Matching: auto-match/auto-join + A/B variant logging shipped; server-side logging function hookup pending
- Classroom UX: live data plus roster/presence preview and activity highlights shipped; leaderboard/filters next
- Friction reduction: Today’s Study Plan live with attendance-driven completion, weak-area pulls, reminders; notes completion still optional
- Activity feeds: Activity tab feed + cheers in UI; realtime events/resources/members live; backend aggregation not required for UI
- Social bridges & accountability: achievements/celebrations/studying-now shipped; streaks/pledges/check-ins/co-work RSVPs live

## Notes
- Keep changes non-destructive to existing pods; guard against empty data
- Favor server-side match caching to avoid costly client recompute
- Prioritize visible momentum (activity feed + roster) before deeper analytics
