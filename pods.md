# Pods Initiative Tracker - Complete Redesign & Optimization

## Legend
- [ ] not started
- [~] in progress / partial
- [x] done
- [!] blocked / needs attention

---

# 🚨 PHASE 2: COMPLETE PODS OVERHAUL (Current Focus)

## Executive Summary
**Objective:** Transform pods from placeholder/cluttered UI into a production-ready collaborative learning platform with:
- Fully functional Jitsi video conferencing
- Real-time collaborative whiteboard (Tldraw)
- Mobile-first responsive design
- Clean, modern UI with proper visual hierarchy
- Modular component architecture

**Key Files:**
- Main Pods Listing: `app/app/pods/page.tsx` (640 lines)
- Pod Detail Page: `app/app/pods/[podId]/page.tsx` (1692 lines - NEEDS REFACTOR)
- Backend Services: `lib/appwrite.ts` (jitsiService)
- UI Components: `components/ui/`

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Video Calls Not Functional
- **Problem:** Jitsi service exists in `lib/appwrite.ts` but UI only has placeholder
- **Location:** Pod detail page, Classroom tab
- **Impact:** Users cannot make video calls
- **Fix Required:** Embed Jitsi iframe, add permission handling, proper state management

### Issue #2: Whiteboard Not Functional
- **Problem:** Canvas area is placeholder with no drawing library
- **Location:** Pod detail page, Classroom tab whiteboard section
- **Impact:** Whiteboard feature completely non-functional
- **Fix Required:** Integrate Tldraw library, add tool state, persistence, collaboration

### Issue #3: No Tablet Breakpoints
- **Problem:** Grid jumps from `sm` to `lg`, skipping `md` breakpoint
- **Location:** Classroom tab layout `grid gap-6 lg:grid-cols-3`
- **Impact:** Bad UX on tablets (768-1023px)
- **Fix Required:** Add `md:grid-cols-2` breakpoints throughout

### Issue #4: Monolithic Component
- **Problem:** Pod detail page is 1692 lines in single file
- **Location:** `app/app/pods/[podId]/page.tsx`
- **Impact:** Hard to maintain, slow to load, difficult to optimize
- **Fix Required:** Extract 8-10 focused components

### Issue #5: Mobile Responsiveness Poor
- **Problem:** Fixed heights, no responsive text, toolbar wrapping issues
- **Locations:** Whiteboard (h-64 fixed), video player, tool buttons
- **Impact:** Unusable or poor UX on mobile devices
- **Fix Required:** Responsive sizing, mobile-first CSS

---

## 📋 COMPLETE TODO LIST

### PHASE 2.1: Architecture Refactor (Foundation)
**Goal:** Split monolithic page into maintainable components

#### Major Tasks
- [ ] Create `components/pods/` directory structure
- [ ] Extract `VideoConference.tsx` component
- [ ] Extract `WhiteboardCanvas.tsx` component
- [ ] Extract `ClassroomTab.tsx` component
- [ ] Extract `OverviewTab.tsx` component
- [ ] Extract `ActivityTab.tsx` component
- [ ] Extract `ChatTab.tsx` component
- [ ] Extract `VaultTab.tsx` component
- [ ] Extract `MembersTab.tsx` component
- [ ] Extract `CalendarTab.tsx` component
- [ ] Extract `PodSidebar.tsx` component (mentor, participants, leaderboard)
- [ ] Extract `SessionControls.tsx` component
- [ ] Create `PodContext.tsx` for shared pod state
- [ ] Update main pod detail page to use new components
- [ ] Verify all functionality works after refactor

#### Minor Tasks
- [ ] Add TypeScript interfaces for all props
- [ ] Add JSDoc comments to new components
- [ ] Create barrel exports (index.ts) for components/pods

---

### PHASE 2.2: Video Conferencing Implementation
**Goal:** Fully functional Jitsi video calls

#### Major Tasks
- [ ] Install Jitsi SDK: `@jitsi/react-sdk` or use iframe approach
- [ ] Create `VideoConference.tsx` with Jitsi iframe embed
- [ ] Implement `JitsiMeetExternalAPI` integration
- [ ] Add camera/microphone permission requests (getUserMedia)
- [ ] Implement join meeting flow with loading states
- [ ] Implement leave meeting with proper cleanup
- [ ] Add error handling for connection failures
- [ ] Add fallback UI when Jitsi unavailable
- [ ] Create mobile-optimized video layout

#### Minor Tasks
- [ ] Add mute/unmute audio button with state
- [ ] Add video on/off toggle with state
- [ ] Add screen share button (actual implementation)
- [ ] Add participant count indicator
- [ ] Add connection quality indicator
- [ ] Add fullscreen toggle for video
- [ ] Add picture-in-picture support
- [ ] Style video controls for mobile (larger touch targets)
- [ ] Add "waiting for host" state
- [ ] Add "reconnecting" state with spinner

#### Backend Tasks
- [ ] Verify `jitsiService.createPodMeeting()` works correctly
- [ ] Add meeting state to pod document (active/inactive)
- [ ] Store meeting history for analytics
- [ ] Add participant tracking per meeting

---

### PHASE 2.3: Whiteboard Implementation
**Goal:** Real-time collaborative whiteboard with Tldraw

#### Major Tasks
- [ ] Install Tldraw: `npm install @tldraw/tldraw`
- [ ] Create `WhiteboardCanvas.tsx` with Tldraw integration
- [ ] Configure Tldraw with pod-specific room ID
- [ ] Implement Appwrite sync for real-time collaboration
- [ ] Add whiteboard persistence (save/load state)
- [ ] Create mobile-optimized whiteboard layout
- [ ] Add responsive canvas sizing

#### Minor Tasks
- [ ] Configure default tools (pen, shapes, text, eraser)
- [ ] Add color palette with pod theme colors
- [ ] Implement undo/redo with keyboard shortcuts
- [ ] Add export to image (PNG/SVG)
- [ ] Add share whiteboard link
- [ ] Add clear canvas with confirmation
- [ ] Add zoom controls for mobile
- [ ] Add participant cursors visibility
- [ ] Style toolbar for mobile (collapsible)
- [ ] Add template shapes/diagrams

#### Backend Tasks
- [ ] Create whiteboard document structure in Appwrite
- [ ] Add real-time sync channel for whiteboard changes
- [ ] Store whiteboard snapshots for history
- [ ] Add whiteboard permissions (view/edit)

---

### PHASE 2.4: UI/UX Redesign
**Goal:** Clean, modern, uncluttered interface

#### Major Layout Changes
- [ ] Redesign Classroom tab with cleaner layout
- [ ] Create tabbed sidebar (Controls | Participants | Resources)
- [ ] Implement video/whiteboard toggle view (not both at once)
- [ ] Add floating action button for mobile controls
- [ ] Create minimized participant view for more content space
- [ ] Redesign session header with cleaner status indicators

#### Visual Hierarchy Fixes
- [ ] Reduce nested card depth (max 2 levels)
- [ ] Increase whitespace between sections
- [ ] Add clear section headings with icons
- [ ] Implement consistent spacing scale (4, 8, 16, 24, 32px)
- [ ] Use subtle shadows instead of heavy borders
- [ ] Add visual focus indicators for current activity

#### Typography & Colors
- [ ] Implement responsive text sizes (text-sm md:text-base)
- [ ] Add proper heading hierarchy (h1 > h2 > h3)
- [ ] Use muted text for secondary information
- [ ] Consistent color usage for states (active, pending, completed)
- [ ] Add dark mode optimizations for video/whiteboard

#### Button & Control Redesign
- [ ] Create icon-only buttons for mobile with tooltips
- [ ] Add proper button grouping with dividers
- [ ] Increase touch target sizes (min 44x44px)
- [ ] Add hover/active states for all interactive elements
- [ ] Create consistent button variants (primary, secondary, ghost)

---

### PHASE 2.5: Mobile Responsiveness
**Goal:** Flawless experience on all screen sizes

#### Breakpoint Implementation
- [ ] Add `sm:` breakpoint (640px) - single column, stacked layout
- [ ] Add `md:` breakpoint (768px) - two column grid
- [ ] Add `lg:` breakpoint (1024px) - three column grid
- [ ] Add `xl:` breakpoint (1280px) - enhanced desktop view
- [ ] Test on actual devices: iPhone SE, iPhone 14, iPad, Desktop

#### Specific Component Fixes

**Video Player:**
- [ ] Change from `aspect-video` to responsive height
- [ ] Add fullscreen mode on mobile
- [ ] Hide unnecessary controls on small screens
- [ ] Add swipe gestures for controls reveal

**Whiteboard:**
- [ ] Change `h-64` to `h-40 sm:h-64 lg:h-96`
- [ ] Make toolbar collapsible on mobile
- [ ] Add pinch-to-zoom support
- [ ] Ensure drawing works with touch

**Tool Buttons:**
- [ ] Add `flex-wrap` for small screens
- [ ] Create dropdown menu for overflow tools
- [ ] Use icon-only on mobile, icon+text on desktop

**Create Pod Dialog:**
- [ ] Change grid to `grid-cols-1 sm:grid-cols-2`
- [ ] Stack form fields on mobile
- [ ] Add proper input sizing

**Tab Navigation:**
- [ ] Add horizontal scroll indicators
- [ ] Consider bottom tabs on mobile
- [ ] Add swipe between tabs gesture

**Participants List:**
- [ ] Horizontal scroll on mobile
- [ ] Collapsible on small screens
- [ ] Avatar-only view option

---

### PHASE 2.6: Feature Enhancements
**Goal:** Complete feature set for pods

#### Video Features
- [ ] Add recording capability (Jitsi built-in)
- [ ] Add virtual backgrounds
- [ ] Add noise suppression
- [ ] Add breakout rooms for larger pods
- [ ] Add hand raise feature
- [ ] Add reactions during call (thumbs up, clap)
- [ ] Add in-call chat panel

#### Whiteboard Features
- [ ] Add laser pointer mode for presentations
- [ ] Add sticky notes
- [ ] Add voting/poll stamps
- [ ] Add timer widget on canvas
- [ ] Add image import
- [ ] Add PDF annotation mode

#### Session Features
- [ ] Add session timer with Pomodoro option
- [ ] Add break reminders
- [ ] Add session goals checklist
- [ ] Add focus mode (hide distractions)
- [ ] Add background music/ambience option

#### Collaboration Features
- [ ] Add co-cursor visibility
- [ ] Add "follow presenter" mode
- [ ] Add annotation on shared screen
- [ ] Add quick polls
- [ ] Add shared notes editor

---

### PHASE 2.7: Backend Optimizations
**Goal:** Robust backend for new features

#### API Enhancements
- [ ] Create meeting state endpoint (active/ended)
- [ ] Add participant presence API
- [ ] Create whiteboard state sync API
- [ ] Add session analytics endpoint
- [ ] Optimize member roster query

#### Real-time Features
- [ ] Add meeting participant updates channel
- [ ] Add whiteboard sync channel
- [ ] Add typing indicators for chat
- [ ] Add presence heartbeat system

#### Data Persistence
- [ ] Store meeting recordings metadata
- [ ] Save whiteboard snapshots on session end
- [ ] Track session attendance
- [ ] Log feature usage for analytics

#### Performance
- [ ] Add pagination for large pods (50+ members)
- [ ] Implement lazy loading for resources
- [ ] Add caching for pod metadata
- [ ] Optimize real-time subscription cleanup

---

### PHASE 2.8: Testing & Polish
**Goal:** Production-ready quality

#### Functional Testing
- [ ] Test video call on Chrome, Firefox, Safari
- [ ] Test whiteboard on touch devices
- [ ] Test all responsive breakpoints
- [ ] Test real-time sync with multiple users
- [ ] Test error states and recovery

#### Performance Testing
- [ ] Measure initial load time
- [ ] Test with 10+ concurrent users
- [ ] Profile memory usage during calls
- [ ] Optimize bundle size

#### Accessibility
- [ ] Add ARIA labels to all controls
- [ ] Test keyboard navigation
- [ ] Add screen reader support
- [ ] Ensure color contrast compliance

#### Polish
- [ ] Add loading skeletons
- [ ] Add smooth transitions/animations
- [ ] Add success/error toasts
- [ ] Add empty states with CTAs
- [ ] Add onboarding tooltips for new features

---

## 📁 NEW FILE STRUCTURE (Target)

```
components/
└── pods/
    ├── index.ts                    # Barrel exports
    ├── PodContext.tsx              # Shared pod state context
    ├── PodDetailPage.tsx           # Main wrapper component
    │
    ├── tabs/
    │   ├── OverviewTab.tsx         # Overview content
    │   ├── ActivityTab.tsx         # Activity feed
    │   ├── ClassroomTab.tsx        # Video + Whiteboard container
    │   ├── ChatTab.tsx             # Chat interface
    │   ├── VaultTab.tsx            # Resources vault
    │   ├── MembersTab.tsx          # Member management
    │   └── CalendarTab.tsx         # Schedule/calendar
    │
    ├── classroom/
    │   ├── VideoConference.tsx     # Jitsi video component
    │   ├── VideoControls.tsx       # Mute, camera, share controls
    │   ├── WhiteboardCanvas.tsx    # Tldraw whiteboard
    │   ├── WhiteboardToolbar.tsx   # Drawing tools
    │   ├── SessionControls.tsx     # Join, leave, timer
    │   ├── ParticipantsList.tsx    # In-session participants
    │   └── ClassroomSidebar.tsx    # Tabbed sidebar
    │
    ├── shared/
    │   ├── PodHeader.tsx           # Pod title, badges, actions
    │   ├── PodSidebar.tsx          # Mentor, tags, quick actions
    │   ├── MemberCard.tsx          # Individual member display
    │   ├── LeaderboardCard.tsx     # Ranking display
    │   └── ProgressCard.tsx        # Stats display
    │
    └── modals/
        ├── CreatePodModal.tsx      # New pod creation
        ├── InviteMembersModal.tsx  # Invite flow
        └── SessionSettingsModal.tsx # Session config
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### Dependencies to Add
```json
{
  "@tldraw/tldraw": "^2.x",
  "@jitsi/react-sdk": "^1.x"
}
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Color Tokens (for consistency)
```
--pod-primary: blue-600
--pod-success: green-500
--pod-warning: amber-500
--pod-error: red-500
--pod-muted: gray-500
--pod-surface: gray-50/gray-900 (light/dark)
```

### Touch Target Sizes
- Minimum: 44x44px
- Preferred: 48x48px
- Spacing between targets: 8px minimum

---

## 📊 PROGRESS TRACKER

### Phase 2.1: Architecture ░░░░░░░░░░ 0%
### Phase 2.2: Video ░░░░░░░░░░ 0%
### Phase 2.3: Whiteboard ░░░░░░░░░░ 0%
### Phase 2.4: UI/UX ░░░░░░░░░░ 0%
### Phase 2.5: Mobile ░░░░░░░░░░ 0%
### Phase 2.6: Features ░░░░░░░░░░ 0%
### Phase 2.7: Backend ░░░░░░░░░░ 0%
### Phase 2.8: Testing ░░░░░░░░░░ 0%

**Overall Progress: 0%**

---

## 📝 IMPLEMENTATION NOTES

### Current Session Context
- Working on: Not started
- Last completed: Initial planning
- Blockers: None
- Next action: Start Phase 2.1 - Create component directory structure

### Key Decisions Made
1. **Whiteboard Library:** Tldraw (best balance of features and ease)
2. **Video Approach:** Jitsi iframe with External API
3. **Design Approach:** Mobile-first responsive
4. **State Management:** React Context for pod-level state
5. **Component Strategy:** Extract from monolith incrementally

### Files Modified This Session
- `pods.md` - Updated with complete redesign plan

### Commands Reference
```bash
# Install dependencies
npm install @tldraw/tldraw @jitsi/react-sdk

# Run dev server
npm run dev

# Check for errors
npm run lint
```

---

## 🎯 SUCCESS CRITERIA

### Must Have (MVP)
- [ ] Video calls work on desktop and mobile
- [ ] Whiteboard allows drawing and is saved
- [ ] Mobile layout is usable on iPhone SE
- [ ] Page loads in under 3 seconds
- [ ] No console errors in production

### Should Have
- [ ] Real-time whiteboard sync between users
- [ ] Screen sharing works
- [ ] Tablet layout optimized
- [ ] All features accessible via keyboard

### Nice to Have
- [ ] Recording capability
- [ ] Virtual backgrounds
- [ ] Breakout rooms
- [ ] PDF annotation

---

## 📚 REFERENCE: Previous Phase 1 Work (Completed)

### 1) Smart Pod Matching & Intake ✅
- [x] Extend schemas for matching fields (interests, goals, learning style, availability)
- [x] Capture preferences in onboarding flow
- [x] Compute pod match scores client-side (rankPodsForUser) and show in Explore
- [x] Serve recommendations on onboarding/home (top 3 pods)
- [x] Add real-time signals (gaps/fit score) and auto-match 3-5 pods at signup
- [x] Add backend-side match API + caching for scale (client-side cached recommender)
- [x] A/B test match acceptance + retention uplift (variant assignment + logging hook)

### 2) Pod-as-Classroom Experience ✅
- [x] Convert pod detail page to live data (members, resources, events) with join/leave
- [x] Member roster and presence indicators on pod page
- [x] Activity section on pod page (sessions/resources highlights)
- [x] Pod-specific leaderboard and progress visualization
- [x] Resource organization by type/tag with filters
- [x] Dedicated "Study with pod" quick-join from upcoming events

### 3) Today's Study Plan ✅
- [x] Add widget on home that auto-builds actionable daily plan
- [x] Persist plan state per user and mark items done from real signals
- [x] Pull weak areas/resources into plan suggestions
- [x] Optional reminders/notifications for plan items

### 4) Pod Activity Feeds ✅
- [x] Pod-level feed: session created/starting, resources shared, joins, streaks
- [x] Real-time updates (listen on events/resources/members)
- [x] Lightweight reactions/cheers to reduce empty-chat feeling

### 5) Pod-Social Bridges ✅
- [x] Surface pod achievements/rank-ups into main feed
- [x] Sidebar "who's studying now" across pods
- [x] Celebrations: easy share/celebrate milestones with podmates

### 6) Accountability Mechanics ✅
- [x] Pod-level streaks and weekly commitment pledges
- [x] Peer check-ins and mini standups
- [x] "Study with me" co-working sessions and RSVP/attendance tracking

---

## 🔄 SESSION LOG

### Session 1: January 2, 2026 - Planning
- [x] Deep scan of current pods implementation
- [x] Identified 5 critical issues
- [x] Created comprehensive todo list
- [x] Defined target file structure
- [x] Set technical specifications
- Next: Begin Phase 2.1 Architecture Refactor

---

*Last Updated: January 2, 2026*
*Session: Initial Planning Complete*
*Next Session Start Point: Phase 2.1 - Create components/pods directory*
