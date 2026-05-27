# Student.social Feature Inventory

Generated on 2026-05-27 from static code inspection.

## Scope
This inventory is a code-surface map of pages, buttons, handlers, dialogs, tabs, route handlers, and shared service methods so we can fix bugs systematically feature by feature.

## Totals
- App Router pages found: 48
- Feature components scanned: 40
- API route files found: 62
- Shared service domains in lib/appwrite.ts: 15

## Page Inventory
### app/about/page.tsx
- Visible headings/cards: Built by a Student, | From Personal Struggle to a Platform for Students | Priyanshu Agarwal | No Student Should Have to Learn Alone | {feature.title} | Principles That Guide Us | {value.title} | Where We're Headed | {item.title} | What Makes Us Different
- Interactive button count in file: 5
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/accessibility/page.tsx
- Visible headings/cards: Accessibility Statement | Our Commitment to Accessibility | {commitment.title} | Conformance Standards | Accessibility Features | {category.category} Accessibility | Keyboard Navigation | Assistive Technology Compatibility | How to Customize Your Experience | Theme Settings
- Interactive button count in file: 1
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/app/admin/page.tsx
- Visible headings/cards: Platform control center
- Interactive button count in file: 0
- Imported feature dependencies: @/components/ui/card, @/components/ui/badge, @/components/ui/separator, @/lib/auth-context, @/lib/admin-access, @/components/notifications/AdminBroadcast

### app/app/ai/page.tsx
- Visible headings/cards: AI Study Assistant | AI Study Assistant
- Interactive button count in file: 6
- Explicit page handlers: handleSendMessage, handleSuggestionClick, handleKeyPress
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/avatar, @/components/ui/badge, @/components/ui/scroll-area, @/components/ui/separator, @/components/ui/textarea, @/components/ui/dropdown-menu

### app/app/analytics/page.tsx
- Visible headings/cards: Analytics | Weekly Study Pattern | Topic Distribution | Focus and Sessions | {goal.title}
- Interactive button count in file: 2
- Tabs: Overview, Goals, Achievements
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/sidebar, @/components/ui/tabs, @/components/ui/progress, @/lib/auth-context, @/lib/appwrite, @/lib/engagement-scoring

### app/app/calendar/page.tsx
- Visible headings/cards: {currentDate.toLocaleDateString([], { month: "short", year: "numeric" })} | Calendar | {currentDate.toLocaleDateString([], { month: "long", year: "numeric" })} | Today&apos;s Events | Upcoming Events | Event Details | {selectedEvent ? "Event Details" : formatDate(selectedDate)}
- Interactive button count in file: 20
- Tabs: Month, Week, Day
- Dialogs: Create New Event, Edit Event
- Explicit page handlers: handleCreateEvent, handleEditEvent, handleDeleteEvent
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/ui/avatar, @/components/ui/input, @/components/ui/label, @/components/ui/textarea, @/components/ui/dialog, @/components/ui/select, @/components/ui/dropdown-menu, @/components/ui/tabs, @/lib/appwrite, @/lib/auth-context

### app/app/chat/page.tsx
- Visible headings/cards: Messages | Messages | {selectedRoom.name} | {selectedRoom.name} | Loading conversations... | No conversations yet | Select a conversation
- Interactive button count in file: 19
- Tabs: All, Pods, Direct
- Explicit page handlers: handleSendMessage, handleKeyPress, handleFileUpload, handleRoomSelect
- Imported feature dependencies: @/components/ui/button, @/components/ui/input, @/components/ui/card, @/components/ui/avatar, @/components/ui/badge, @/components/ui/scroll-area, @/components/ui/textarea, @/components/ui/dropdown-menu, @/components/ui/tabs, @/lib/appwrite, @/lib/auth-context, @/lib/accessibility-utils

### app/app/dashboard/page.tsx
- Interactive button count in file: 0

### app/app/explore/page.tsx
- Interactive button count in file: 0

### app/app/feed/page.tsx
- Visible headings/cards: Feed | No posts found | {post.title} | Pod Achievements | Who&apos;s Studying Now | Celebrate a Milestone
- Interactive button count in file: 6
- Tabs: All Posts, Following, My Pods, All, Pods
- Select/filter values seen: public
- Explicit page handlers: handleLike, handleBookmark, handleShare, handleCommentCountChange, handlePostClick, handleReportPost, handlePostCreated, handleCelebrate
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/input, @/components/ui/tabs, @/components/ui/avatar, @/components/ui/dropdown-menu, @/components/create-post-modal, @/components/comments-section, @/components/mobile-header, @/components/floating-action-button, @/lib/auth-context, @/lib/appwrite, @/components/ui/textarea, @/components/ui/select

### app/app/home/page.tsx
- Visible headings/cards: Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
- Interactive button count in file: 13
- Explicit page handlers: handleScheduleSession, handleNewSession, handleContinueChallenge, handleViewCalendar, handleJoinPod, handlePlanAction
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/ui/progress, @/components/ai-assistant, @/lib/auth-context, @/lib/appwrite

### app/app/leaderboard/page.tsx
- Visible headings/cards: Leaderboard | {pod.podName}
- Interactive button count in file: 1
- Tabs: Global, My Pods, Achievements
- Explicit page handlers: handleViewProfile
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/avatar, @/components/ui/sidebar, @/components/ui/tabs, @/lib/auth-context, @/lib/appwrite, @/lib/engagement-scoring

### app/app/messages/[userId]/page.tsx
- Interactive button count in file: 2
- Explicit page handlers: handleSend, handleKeyPress
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/input, @/components/ui/avatar, @/components/ui/badge, @/components/ui/scroll-area, @/lib/auth-context, @/lib/appwrite

### app/app/notifications/page.tsx
- Visible headings/cards: Notifications
              {unreadCount > 0 && ( | Notifications
                {unreadCount > 0 && ( | No notifications | Notification Preferences
- Interactive button count in file: 12
- Explicit page handlers: handleMarkAsRead, handleMarkAllAsRead, handleAcceptInvite, handleDeclineInvite, handleJoinSession, handleSavePreferences
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/lib/appwrite, @/lib/auth-context

### app/app/page.tsx
- Interactive button count in file: 0

### app/app/pods/[podId]/page.tsx
- Visible headings/cards: {pod.name} | {pod.name}
- Interactive button count in file: 5
- Explicit page handlers: handleJoinSession, handleLeaveSession, handleVideoToggle, handleAudioToggle, handleScreenShare, handlePlayVideo, handleOpenChat, handleOpenCalendar, handleSavePledge, handleAddCheckIn, handleToggleRsvp, handleOpenVault, handleJoinUpcoming, handleJoinPod, handleCheer, handleLeavePod
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/lib/auth-context, @/lib/appwrite, @/lib/websocket-manager, @/components/ui/avatar, @/components/ui/progress, @/components/pods/tabs

### app/app/pods/join/page.tsx
- Visible headings/cards: Join Pod
- Interactive button count in file: 4
- Explicit page handlers: handleGoToLogin
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/alert, @/lib/auth-context, @/lib/appwrite

### app/app/pods/page.tsx
- Visible headings/cards: {pod.name} | Pods | Recommended for you | Current pod operations
- Interactive button count in file: 11
- Tabs: Overview, My pods, Discover
- Dialogs: Create a pod
- Select/filter values seen: Programming, Design, Medical, Languages, Business, Science, Beginner, Intermediate, Advanced, live, async, hybrid, beginner, interview-prep, exam-prep, skill-growth, career-switch
- Explicit page handlers: handleJoinPod, handleCreatePod
- Imported feature dependencies: @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/dialog, @/components/ui/input, @/components/ui/label, @/components/ui/progress, @/components/ui/select, @/components/ui/tabs, @/components/ui/textarea, @/lib/auth-context, @/lib/appwrite, @/lib/pod-matching

### app/app/profile/[username]/page.tsx
- Visible headings/cards: User Not Found | {userProfile.name} | {userProfile.name} | {userProfile.name} | {post.title} | No public achievements | No recent activity
- Interactive button count in file: 10
- Explicit page handlers: handleFollow, handleMessage, handleLike, handleShare
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/avatar, @/components/ui/progress, @/components/ui/tabs, @/lib/appwrite, @/lib/auth-context

### app/app/profile/page.tsx
- Visible headings/cards: Profile | {userProfile.name} | {userProfile.name} | {post.title}
- Interactive button count in file: 22
- Dialogs: Edit Profile, Settings & Preferences
- Explicit page handlers: handleFollow, handleMessage, handleEditProfile, handleSaveProfile, handleSettings, handleLike, handleComment, handleBookmark, handleShare, handlePostClick
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/avatar, @/components/ui/progress, @/components/ui/tabs, @/components/ui/input, @/components/ui/label, @/components/ui/textarea, @/components/ui/switch, @/components/ui/dialog, @/lib/auth-context, @/lib/appwrite

### app/app/saved/page.tsx
- Visible headings/cards: Saved Posts | Saved Posts | No saved posts | {post.title}
- Interactive button count in file: 7
- Tabs: All Saved, Posts, Resources
- Explicit page handlers: handleUnsave, handleLike, handleShare
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/input, @/components/ui/avatar, @/components/ui/tabs, @/lib/auth-context, @/lib/appwrite

### app/app/settings/page.tsx
- Visible headings/cards: Settings | Settings | {section.title} | {section.title}
- Interactive button count in file: 4
- Explicit page handlers: handleSettingChange, handleLogout
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/input, @/components/ui/label, @/components/ui/switch, @/components/ui/select, @/components/ui/slider, @/components/ui/separator, @/components/ui/badge, @/lib/auth-context, @/lib/appwrite

### app/app/vault/page.tsx
- Visible headings/cards: handleView(resource.$id)}>
                  {resource.title} | handleView(resource.$id)}>
                      {resource.title} | Resource Vault | Resource Vault | Quick Access | Resource Types | Storage | No uploads yet | Recently Viewed
- Interactive button count in file: 24
- Tabs: All, Uploads, Bookmarks, Recent
- Select/filter values seen: recent, popular, downloads, alphabetical
- Explicit page handlers: handleUpload, handleDownload, handleLike, handleBookmark, handleView, handleShare
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/input, @/components/ui/avatar, @/components/ui/tabs, @/components/ui/select, @/lib/appwrite, @/lib/auth-context

### app/community-guidelines/page.tsx
- Visible headings/cards: Community Guidelines | Table of Contents | Do | Don't | 1. Introduction | 2. Core Principles | Direct Harassment | Cyberbullying | Sexual Harassment | Prohibited Content Includes:
- Interactive button count in file: 3
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/contact/page.tsx
- Visible headings/cards: Get in Touch | Contact Departments | {method.title} | Message Sent!
- Interactive button count in file: 4
- Explicit page handlers: handleSubmit
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/input, @/components/ui/label, @/components/ui/textarea, @/components/ui/select, @/components/theme-toggle

### app/cookies/page.tsx
- Visible headings/cards: Cookie Policy | Table of Contents | Manage Your Cookie Preferences | 1. Introduction | 2. What Are Cookies? | Similar Technologies We Use: | 3. Types of Cookies We Use | {index + 4}. {type.name} | Specific Cookies Used: | 9. Third-Party Cookies
- Interactive button count in file: 4
- Explicit page handlers: handleSavePreferences
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle, @/components/ui/switch, @/components/ui/label

### app/courses/[id]/page.tsx
- Visible headings/cards: {course.title} | Chapter {index + 1}: {chapter.title} | About This Course
- Interactive button count in file: 3
- Tabs: Curriculum, About, Reviews
- Explicit page handlers: handleEnroll
- Imported feature dependencies: @/components/courses/CoursePlayer, @/components/ui/button, @/components/ui/tabs, @/components/ui/badge, @/lib/auth-context

### app/courses/page.tsx
- Visible headings/cards: Explore Courses | {courses.length} | {courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
- Interactive button count in file: 1
- Select/filter values seen: all, Beginner, Intermediate, Advanced, trending, rating, newest, price-low, price-high
- Imported feature dependencies: @/components/courses/CourseCard, @/components/ui/button, @/components/ui/input, @/components/ui/select

### app/demo/page.tsx
- Visible headings/cards: See PeerSpark in | Everything You Need to Study Better | Powerful Tools for Modern Students | {feature.title} | Built by a Student Who Understands Your Struggles | Priyanshu Agarwal | Current Status | Ready to Transform Your Learning?
- Interactive button count in file: 7
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/dmca/page.tsx
- Visible headings/cards: DMCA Policy | Table of Contents | Report Infringement | How to Submit a DMCA Notice: | 5. Counter-Notification Requirements | 6. Repeat Infringers Policy | 7. Good Faith Requirements | Related Policies
- Interactive button count in file: 2
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/feed/page.tsx
- Interactive button count in file: 0

### app/forgot-password/page.tsx
- Visible headings/cards: Reset password
- Interactive button count in file: 4
- Explicit page handlers: handleSubmit
- Imported feature dependencies: @/components/ui/button, @/components/ui/input, @/components/ui/label, @/components/ui/card, @/lib/appwrite

### app/help/page.tsx
- Visible headings/cards: How can we help you? | Popular Articles | {article.title} | Browse by Category | No results found | {category.title} | Quick Links | {link.title} | Video Tutorials | {video.title}
- Interactive button count in file: 5
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/ui/input, @/components/theme-toggle

### app/instructor/dashboard/page.tsx
- Visible headings/cards: Instructor Dashboard | Total Courses | Total Students | Total Revenue | Average Rating | {course.title} | Submissions Requiring Review | Top Performers | Engagement Metrics | Performance Overview
- Interactive button count in file: 1
- Tabs: My Courses, Grading Queue, Students, Analytics
- Imported feature dependencies: @/components/ui/card, @/components/ui/tabs, @/components/ui/button, @/components/ui/badge, @/lib/auth-context

### app/instructor/grading/page.tsx
- Visible headings/cards: Grading Queue | Pending | Graded Today | Total Graded | {submission.courseName} | Grade Submission | {submission.courseName}
- Interactive button count in file: 2
- Tabs: Pending ({pendingSubmissions.length}), Graded ({gradedSubmissions.length})
- Explicit page handlers: handleGradeSubmission
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/textarea, @/components/ui/input, @/components/ui/tabs

### app/login/page.tsx
- Visible headings/cards: Welcome back
- Interactive button count in file: 4
- Explicit page handlers: handleLogin
- Imported feature dependencies: @/components/ui/button, @/components/ui/input, @/components/ui/label, @/components/ui/card, @/components/ui/separator, @/lib/auth-context, @/lib/appwrite, @/lib/server/oauth

### app/onboarding/page.tsx
- Visible headings/cards: Choose your learning identity | {identity.label} | Select your interests | {interest.label} | What&apos;s your learning vibe? | {vibe.label} | How do you like to study? | Your goals | Learning pace | Session type
- Interactive button count in file: 10
- Explicit page handlers: handleNext, handleBack, handleComplete
- Imported feature dependencies: @/lib/auth-context, @/lib/appwrite, @/lib/pod-matching, @/components/ui/button, @/components/ui/card, @/components/ui/progress, @/components/ui/badge, @/components/ui/input, @/components/ui/label, @/components/ui/textarea, @/components/ui/avatar

### app/page.tsx
- Visible headings/cards: Learn Together, Achieve More with | Everything You Need to Excel | {feature.title} | What Students Say | Ready to Transform Your Learning? | Stay Updated
- Interactive button count in file: 16
- Explicit page handlers: handleNewsletterSignup
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/input, @/components/ui/badge, @/components/theme-toggle, @/lib/auth-context

### app/pods/course-dashboard/page.tsx
- Visible headings/cards: {progress.cohortName} | Total Members | Group Progress | Average Score | Community Score | 🚀 Accelerators | All Members | ⚠️ Members Who Need Support | Group Milestones | Pod Discussion Board
- Interactive button count in file: 3
- Tabs: Members, Milestones, Discussion, Study Sessions
- Imported feature dependencies: @/components/ui/card, @/components/ui/button, @/components/ui/badge, @/components/ui/progress, @/components/ui/tabs

### app/privacy/page.tsx
- Visible headings/cards: Privacy Policy | Table of Contents | 2.1 Information You Provide Directly | 2.2 Information Collected Automatically | 2.3 Information from Third Parties | Brazil (LGPD) | India (DPDP Act) | Other Jurisdictions | Version History
- Interactive button count in file: 1
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/theme-toggle

### app/register/page.tsx
- Visible headings/cards: Create your account
- Interactive button count in file: 5
- Explicit page handlers: handleRegister
- Imported feature dependencies: @/components/ui/button, @/components/ui/input, @/components/ui/label, @/components/ui/card, @/components/ui/separator, @/components/ui/progress, @/lib/auth-context, @/lib/appwrite, @/lib/password-security, @/lib/server/oauth

### app/reset-password/page.tsx
- Visible headings/cards: Reset Password
- Interactive button count in file: 2
- Explicit page handlers: handleSubmit
- Imported feature dependencies: @/components/ui/button, @/components/ui/input, @/components/ui/label, @/components/ui/card, @/lib/appwrite

### app/settings/calendar-sync/page.tsx
- Interactive button count in file: 0
- Imported feature dependencies: @/components/calendar-sync/CalendarSyncPage

### app/status/page.tsx
- Visible headings/cards: {service.name} | 90-Day Uptime | Historical Uptime | {maintenance.title} | No Recent Incidents | {incident.title} | Stay Updated
- Interactive button count in file: 5
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/student/profile/page.tsx
- Visible headings/cards: {profile.name} | Active Courses | Total Points | Average Score | Study Time | Active Courses | Completed Courses | Achievements | Certificates | Learning Statistics
- Interactive button count in file: 0
- Tabs: My Courses, Achievements, Certificates, Statistics
- Imported feature dependencies: @/components/ui/card, @/components/ui/badge, @/components/ui/progress, @/components/ui/tabs

### app/support/page.tsx
- Visible headings/cards: Help Us Build the Future of | From Procrastination to Purpose | Priyanshu Agarwal | Your Impact Matters | {reason.title} | Where Your Support Goes | {need.title} | Our Journey | {milestone.title} | Ways to Support
- Interactive button count in file: 5
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/theme-toggle

### app/terms/page.tsx
- Visible headings/cards: Terms of Service | Table of Contents | 2.1 Age Requirements | 2.2 Additional Requirements | 3.1 Account Creation | 3.2 Account Security | 3.3 Account Types | 6.1 Your Ownership | 6.2 License Grant to PeerSpark | 6.3 License to Other Users
- Interactive button count in file: 1
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/theme-toggle

### app/verify-email/page.tsx
- Visible headings/cards: {heading}
- Interactive button count in file: 3
- Explicit page handlers: handleResend, handleUseDifferentAccount
- Imported feature dependencies: @/components/ui/button, @/components/ui/card, @/components/ui/alert, @/lib/appwrite, @/lib/auth-context

## Feature Component Inventory
### components/ai-assistant.tsx
- Exports: AIAssistant
- Interactive button count in file: 3
- Dialogs: AI Assistant
- Explicit handlers: handleSendMessage

### components/app-sidebar.tsx
- Exports: AppSidebar
- Interactive button count in file: 0
- Explicit handlers: handleLogout, handleProfile

### components/calendar-sync/CalendarPreview.tsx
- Exports: CalendarPreview
- Visible headings/cards: Calendar Preview
- Interactive button count in file: 0

### components/calendar-sync/CalendarSyncPage.tsx
- Exports: CalendarSyncPage
- Visible headings/cards: Calendar Sync
- Interactive button count in file: 1

### components/calendar-sync/FeedSettingsPanel.tsx
- Exports: FeedSettingsPanel
- Visible headings/cards: Feed Settings
- Interactive button count in file: 0

### components/calendar-sync/ProviderCards.tsx
- Exports: ProviderCards
- Visible headings/cards: {p.name}
- Interactive button count in file: 1

### components/calendar-sync/SecurityPanel.tsx
- Exports: SecurityPanel
- Visible headings/cards: Security
- Interactive button count in file: 2

### components/comments-section.tsx
- Exports: CommentsSection
- Interactive button count in file: 8
- Explicit handlers: handleSaveEdit, handleSubmit, handleLike, handleDelete, handleEdit, handleReply

### components/courses/AssignmentPanel.tsx
- Exports: AssignmentPanel
- Interactive button count in file: 2
- Explicit handlers: handleSubmit

### components/courses/ChapterNav.tsx
- Exports: ChapterNav
- Visible headings/cards: Chapters
- Interactive button count in file: 1

### components/courses/CourseCard.tsx
- Exports: CourseCard
- Visible headings/cards: {course.title}
- Interactive button count in file: 2

### components/courses/CoursePlayer.tsx
- Exports: CoursePlayer
- Visible headings/cards: {course.title} | {currentChapter.title} | Lecture Content | Learning Objectives
- Interactive button count in file: 3
- Explicit handlers: handlePrevChapter, handleNextChapter

### components/courses/NotesPanel.tsx
- Exports: NotesPanel
- Interactive button count in file: 3
- Tabs: Summary, Concepts, Formulas, Applications

### components/create-post-modal-fixed.tsx
- Exports: CreatePostModal
- Interactive button count in file: 8
- Dialogs: Create New Post
- Explicit handlers: handleImageSelect, handleAddTag, handleSubmit

### components/create-post-modal.tsx
- Exports: CreatePostModal
- Interactive button count in file: 8
- Dialogs: Create Post
- Explicit handlers: handleAddTag, handleRemoveTag, handleSubmit

### components/floating-action-button.tsx
- Exports: FloatingActionButton
- Interactive button count in file: 2

### components/mobile-header.tsx
- Exports: MobileHeader
- Interactive button count in file: 2
- Explicit handlers: handleProfileClick, handleChatClick, handleLogout

### components/notifications/AdminBroadcast.tsx
- Exports: AdminBroadcast
- Visible headings/cards: Create Admin Broadcast | {formData.title || 'Title Preview'} | Broadcast Guidelines
- Interactive button count in file: 3
- Explicit handlers: handleInputChange, handleSelectChange, handleChannelToggle, handleSubmit

### components/notifications/NotificationInbox.tsx
- Exports: NotificationInbox
- Visible headings/cards: Notifications
- Interactive button count in file: 4
- Tabs: All, Unread ({unreadCount})
- Explicit handlers: handleMarkAsRead, handleDelete

### components/notifications/NotificationPreferences.tsx
- Exports: NotificationPreferences
- Visible headings/cards: Notification Preferences
- Interactive button count in file: 1
- Tabs: Channels, Categories, Quiet Hours, Digests
- Explicit handlers: handleChannelToggle, handleCategoryChannelToggle, handleSave

### components/pods/classroom/AdvancedVideoFeatures.tsx
- Exports: useVideoFeatures, AdvancedVideoControls, SESSION_REACTIONS, SessionReactionsBar
- Interactive button count in file: 2

### components/pods/classroom/MobileActionButton.tsx
- Exports: MobileActionButton
- Interactive button count in file: 2

### components/pods/classroom/SessionControls.tsx
- Exports: SessionControls
- Interactive button count in file: 5

### components/pods/classroom/SessionManager.tsx
- Exports: useSessionTimer, SessionTimerWidget, SessionGoalsTracker
- Interactive button count in file: 5

### components/pods/classroom/VideoConference.tsx
- Exports: VideoConference
- Visible headings/cards: {podName} Classroom | Connection Error
- Interactive button count in file: 7
- Explicit handlers: handleLeave

### components/pods/classroom/WhiteboardCanvas.tsx
- Exports: WhiteboardCanvas
- Interactive button count in file: 19
- Explicit handlers: handlePointerDown, handlePointerMove, handlePointerUp, handleUndo, handleRedo, handleClear, handleZoomIn, handleZoomOut, handleResetView, handleSave, handleExport, handleShare

### components/pods/shared/PodSidebar.tsx
- Exports: PodSidebar
- Visible headings/cards: Pod Mentor
- Interactive button count in file: 2

### components/pods/tabs/ActivityTab.tsx
- Exports: ActivityTab
- Interactive button count in file: 4

### components/pods/tabs/CalendarTab.tsx
- Exports: CalendarTab
- Visible headings/cards: Pod Calendar
- Interactive button count in file: 1

### components/pods/tabs/ChatTab.tsx
- Exports: ChatTab
- Visible headings/cards: Pod Chat
- Interactive button count in file: 1

### components/pods/tabs/ClassroomTab.tsx
- Exports: ClassroomTab
- Visible headings/cards: {podName}
- Interactive button count in file: 8
- Explicit handlers: handlePlayVideo

### components/pods/tabs/CoursesTab.tsx
- Exports: CoursesTab
- Visible headings/cards: {course.courseTitle} | Course Overview | {assignment.title} | Day {task.dayNumber}: {task.title}
- Interactive button count in file: 1
- Explicit handlers: handleGenerateCourse

### components/pods/tabs/EnhancedMembersTab.tsx
- Exports: EnhancedMembersTab
- Interactive button count in file: 4
- Dialogs: Invite Members to {pod.name}
- Explicit handlers: handleCopyLink, handleInviteByEmail, handleMessage

### components/pods/tabs/MembersTab.tsx
- Exports: MembersTab
- Visible headings/cards: Pod Members ({pod.members?.toLocaleString?.() || 0})
- Interactive button count in file: 0

### components/pods/tabs/OverviewTab.tsx
- Exports: OverviewTab
- Visible headings/cards: Quick Actions | Pod Features
- Interactive button count in file: 9

### components/pods/tabs/PodChatTab.tsx
- Exports: PodChatTab
- Visible headings/cards: {podName} Chat
- Interactive button count in file: 3
- Explicit handlers: handleSend, handleKeyPress

### components/pods/tabs/VaultTab.tsx
- Exports: VaultTab
- Visible headings/cards: Pod Resources
- Interactive button count in file: 5

### components/pwa-install-prompt.tsx
- Exports: PWAInstallPrompt
- Visible headings/cards: Install PeerSpark
- Interactive button count in file: 3
- Explicit handlers: handler, handleInstall, handleDismiss

### components/settings-modal.tsx
- Exports: SettingsModal
- Visible headings/cards: Profile Information | Privacy Settings | Profile Visibility | Communication | Notification Preferences | General Notifications | Activity Notifications | Email Preferences | Security Settings | Change Password
- Interactive button count in file: 9
- Dialogs: Settings
- Explicit handlers: handleSaveProfile, handleSavePrivacy, handleSaveNotifications, handleChangePassword, handleAvatarUpload, handleAvatarFileChange, handleExportData, handleDeleteAccount

### components/theme-toggle.tsx
- Exports: ThemeToggle
- Interactive button count in file: 1

## API Surface Inventory
### app/api/admin/broadcasts/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/ai/chat/route.ts
- HTTP methods: POST

### app/api/assignments/grade/route.ts
- HTTP methods: POST
- Integration domains detected: zod validation

### app/api/assignments/submit/route.ts
- HTTP methods: POST, GET, PUT

### app/api/auth/2fa/setup/route.ts
- HTTP methods: POST, PUT
- Integration domains detected: Appwrite, zod validation

### app/api/auth/2fa/verify/route.ts
- HTTP methods: POST, DELETE
- Integration domains detected: zod validation

### app/api/auth/confirm-password-reset/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/auth/login/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/auth/logout/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/auth/refresh-token/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/auth/register/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/auth/request-password-reset/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/auth/send-verification/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/auth/session/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/auth/validate-session/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/auth/verify-email/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/calendar-sync/feed/route.ts
- HTTP methods: GET

### app/api/calendar-sync/maintenance/route.ts
- HTTP methods: POST

### app/api/calendar-sync/manage/route.ts
- HTTP methods: GET, POST, PATCH
- Integration domains detected: zod validation

### app/api/calendar/events/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite, zod validation

### app/api/certificates/download/route.ts
- HTTP methods: GET, POST, PUT
- Integration domains detected: Appwrite

### app/api/comments/[id]/route.ts
- HTTP methods: DELETE
- Integration domains detected: Appwrite

### app/api/courses/[courseId]/chapters/route.ts
- HTTP methods: GET

### app/api/courses/[courseId]/route.ts
- HTTP methods: GET

### app/api/courses/enroll/route.ts
- HTTP methods: POST, GET

### app/api/courses/generate-content/route.ts
- HTTP methods: POST

### app/api/courses/generate-from-youtube/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/courses/list/route.ts
- HTTP methods: GET

### app/api/courses/process-video/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/feed/course-achievements/route.ts
- HTTP methods: POST, GET, PUT
- Integration domains detected: Appwrite

### app/api/feed/trending-courses/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite, zod validation

### app/api/instructor/dashboard/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/instructor/grading-queue/route.ts
- HTTP methods: GET, POST
- Integration domains detected: Appwrite

### app/api/messages/room/[roomId]/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/messages/send/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/notifications/[id]/read/route.ts
- HTTP methods: PATCH
- Integration domains detected: Appwrite

### app/api/notifications/[id]/route.ts
- HTTP methods: DELETE
- Integration domains detected: Appwrite

### app/api/notifications/inbox/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/notifications/preferences/route.ts
- HTTP methods: GET, POST
- Integration domains detected: Appwrite

### app/api/payments/create-checkout/route.ts
- HTTP methods: POST, PUT, GET
- Integration domains detected: Stripe, zod validation

### app/api/pods/[id]/join/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/pods/[id]/leave/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/pods/[id]/route.ts
- HTTP methods: GET, PUT, DELETE
- Integration domains detected: Appwrite

### app/api/pods/assign-course/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/pods/course-chat/route.ts
- HTTP methods: POST, GET, PUT
- Integration domains detected: Appwrite

### app/api/pods/course-commitment/route.ts
- HTTP methods: POST, GET, PUT
- Integration domains detected: Appwrite

### app/api/pods/course-progress/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/pods/generate-course-streaming/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/pods/generate-course/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/pods/get-course/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/pods/pod-courses/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/pods/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/pods/study-sessions/route.ts
- HTTP methods: POST, GET, PUT
- Integration domains detected: Appwrite

### app/api/posts/[id]/comments/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/posts/[id]/like/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/posts/[id]/route.ts
- HTTP methods: GET, PUT, DELETE
- Integration domains detected: Appwrite

### app/api/posts/[id]/save/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite, zod validation

### app/api/posts/route.ts
- HTTP methods: POST, GET
- Integration domains detected: Appwrite

### app/api/profiles/ensure/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/profiles/list/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

### app/api/users/[id]/follow/route.ts
- HTTP methods: POST
- Integration domains detected: Appwrite

### app/api/users/course-profile/route.ts
- HTTP methods: GET
- Integration domains detected: Appwrite

## Shared Service Inventory (lib/appwrite.ts)
### COLLECTIONS
- Methods: None parsed

### BUCKETS
- Methods: None parsed

### authService
- Methods: register, login, loginWithOAuth, getCurrentUser, getCurrentUserProfile, logout, updateName, updatePassword, changePassword, requestPasswordReset, confirmPasswordReset, confirmEmailVerification, resendVerification

### profileService
- Methods: ensureProfileExists, getProfile, getProfileByUsername, updateProfile, uploadAvatar, getAllProfiles, followUser, unfollowUser, isFollowing

### podService
- Methods: createPod, joinPod, generateInviteLink, parseInviteLink, addMemberByEmail, leavePod, getUserPods, getAllPods, getPodDetails, updatePod, deletePod, getMemberCount, getPodMembers, joinWithInviteCode, makeAdmin, removeAdmin, removeMember, recommendPodsForUser, assignMatchVariant, logMatchExperiment, autoMatchAndJoin, getReactions, incrementReaction, getPledge, savePledge, listCheckIns, addCheckIn, listRsvps, toggleRsvp

### studyPlanService
- Methods: getPlan, upsertPlan

### chatService
- Methods: getOrCreatePodRoom, getOrCreateDirectRoom, sendMessage, getMessages, getMessage, subscribeToMessages, uploadAttachment, getUserChatRooms, markMessageAsRead, createDirectChat

### challengeService
- Methods: listChallenges, createChallenge, completeChallenge

### resourceService
- Methods: uploadResource, getResources, getBookmarkedResources, toggleBookmarkResource, toggleLikeResource, downloadResource, deleteResource

### feedService
- Methods: createPost, getUserPosts, getFeedPosts, getSavedPosts, updatePost, deletePost, toggleLike, getPostLikes, toggleSavePost, isPostSaved

### commentService
- Methods: createComment, getComments, getReplies, toggleLike, updateComment, deleteComment, getCommentLikes

### calendarService
- Methods: createEvent, getUserEvents, getPodEvents, updateEvent, deleteEvent

### notificationService
- Methods: createNotification, getUserNotifications, markAsRead, markAllAsRead, subscribeToNotifications

### analyticsService
- Methods: trackStudyTime, trackActivity, getStudyStats, getActivityLog, getPodStats, getResourceStats, getAchievementProgress, generateReport, exportAnalytics, updateLearningGoals, trackGoalProgress

### jitsiService
- Methods: generateMeetingUrl, createPodMeeting, createDirectMeeting

## High-Level Feature Map
- Marketing/info surfaces: landing page, about, demo, support, help, contact, legal, accessibility, status.
- Authentication/account recovery: login, register, OAuth start/return, forgot password, reset password, email verification, session validation, 2FA setup/verify, onboarding.
- Social feed: feed tabs, search, post creation, pod/public targeting, tags, comments, replies, likes, saves, share/report actions, achievements, studying-now rail, celebration composer.
- Profiles: self profile, public profile, follow/unfollow, message, edit profile, settings/preferences, achievements, activity, post interactions.
- Pods: browse, filter, create pod, join/leave, invite link, members, pledge, check-ins, RSVP, courses, chat, calendar, classroom, vault, leaderboard-like stats.
- Classroom stack: session controls, video toggles, audio toggles, screen share, fullscreen, timer, preset durations, goal tracker, whiteboard tools, templates, export/share, mobile actions, advanced reactions/features.
- Messaging/chat: room tabs, room selection, direct messages, pod rooms, send text, upload attachments, mark read, accessibility utilities.
- Notifications: inbox, unread filter, mark read, delete, invitation accept/decline, preferences, quiet hours, digests, admin broadcasts.
- Courses/learning: course discovery, filtering, sorting, course detail, enrollment, chapter navigation, player, notes tabs, assignments, grading, instructor dashboard, certificates, analytics.
- Resource vault: browse, filter by type, sort, upload, view mode switch, like, bookmark, download, view, share, recent/resources tabs.
- Calendar: month/week/day tabs, create/edit/delete event flows, pod events, meeting link handling, calendar sync feed/settings/security/provider cards.
- AI features: AI assistant modal and dedicated AI page with prompts, suggestions, voice input, copy/regenerate actions, AI route handlers.
- Platform systems: PWA install prompt, theme toggle, admin controls, payment checkout, notification worker, middleware, security/auth utilities.

## Deep Hierarchy By Product Area

### Feed and Social Graph
- Feed shell:
  `/app/feed` redirect surface and `/app/app/feed/page.tsx` authenticated feed surface.
- Feed filtering and discovery:
  search query, feed tabs (`All Posts`, `Following`, `My Pods`), secondary tabs (`All`, `Following`, `Pods`), public vs pod visibility.
- Post creation:
  floating create action, create-post modal dialog, title input, body textarea, pod selection, tag add/remove, suggested tags, cancel, submit, attachment placeholders.
- Post card interactions:
  open post, author avatar/profile click path, like, bookmark/save, share, comment expansion, post menu, report post.
- Comment system:
  expand/collapse comments, create comment, reply to comment, cancel reply, like comment, edit comment, save edit, cancel edit, delete comment, nested reply tree, comment count syncing.
- Feed side features:
  pod achievements rail, studying-now rail, celebration composer, celebrate button, selected pod for celebration.
- Social graph dependencies:
  follow relationships, saved posts, profile lookup, post author formatting, avatar hydration.

### Profile Surfaces
- Self profile:
  profile header, follower/following counts, streak/stats summary, tabs, user posts list, like/comment/bookmark/share from profile-owned posts.
- Self profile editing:
  edit profile dialog, name, bio, location, website, avatar, save profile, cancel edit.
- Self profile settings:
  settings dialog, privacy toggles, notification toggles, account-preference controls, export/delete affordances in `components/settings-modal.tsx`.
- Public profile:
  lookup by username, follow/unfollow, direct message, achievements section, recent activity section, post interactions.

### Pods
- Pod listing page:
  overview tab, my pods tab, discover tab, recommended pods, filter fields, create pod dialog, join pod action.
- Pod creation:
  pod name, description, subject/category, level, format, goal presets, submit create flow.
- Pod join and membership:
  join page, invite-link parsing path, join by pod id, leave pod, join with invite code, member count, member list, admin promotion/removal, member removal.
- Pod detail hub:
  open chat, open calendar, open vault, join session, leave pod, cheer/reaction action, save pledge, add check-in, RSVP toggle, join upcoming session.
- Pod tabs package (`components/pods/tabs`):
  `OverviewTab`, `MembersTab`, `EnhancedMembersTab`, `ActivityTab`, `CalendarTab`, `ChatTab`, `PodChatTab`, `CoursesTab`, `ClassroomTab`, `VaultTab`.
- Pod member management:
  invite members dialog, copy invite link, invite by email, message member.
- Pod accountability:
  pledges, check-ins, reaction counts, RSVP state, pod stats, recommendations and auto-match logic.

### Classroom and Live Collaboration
- Session controls:
  join session, leave session, toggle camera, toggle microphone, toggle screen share.
- Video conference:
  join meeting, retry connection, leave, fullscreen, audio/video state, screen-share state.
- Advanced video features:
  reactions menu, raise hand, spotlight, noise suppression, virtual background placeholder, recording placeholder, quick emoji reactions bar.
- Session manager:
  timer start/pause, reset timer, preset duration selection, break reminder dismissal, session goals tracking and goal completion.
- Whiteboard:
  pointer draw pipeline, tool selection, undo, redo, zoom in, zoom out, reset view, clear whiteboard, confirm clear dialog, save, export, share, templates (`grid`, `flowchart`, `mindmap`), mobile toolbar collapse/expand.
- Mobile classroom actions:
  floating mobile action button, expand/collapse action tray, action shortcuts.

### Messaging and Chat
- Global chat page:
  room list, room filter tabs (`All`, `Pods`, `Direct`), room selection, message thread, composer textarea, send message, file upload, more-menu actions.
- Direct message page:
  user-to-user thread, message send, enter-key send shortcut.
- Shared chat service:
  create/find pod room, create/find direct room, send message, fetch messages, get message, subscribe to realtime messages, upload attachment, list user chat rooms, mark message read.

### Notifications
- Notifications page:
  list notifications, unread count, mark single read, mark all read, delete notification, invitation accept, invitation decline, join session from notification, save notification preferences.
- Notification inbox component:
  all tab, unread tab, refresh, mark read, delete.
- Notification preferences:
  channel switches, category-channel matrix, quiet-hours toggle, start/end/timezone inputs, digest toggles, digest time input, save preferences.
- Admin broadcasts:
  title, message, category, target segment, per-channel checkboxes, schedule now/later, preview toggle, submit broadcast, reset to template.

### Calendar and Calendar Sync
- Calendar page:
  month/week/day tabs, previous/next period navigation, date selection, today events, upcoming events, event detail surface.
- Event CRUD:
  create event dialog, edit event dialog, title, description, date/time, pod association, meeting link handling, save, delete.
- Calendar sync:
  feed URL copy, Apple Calendar open link, provider cards, security panel, regenerate link button, disable feed button, preview panel, sync-management API.

### Courses, Assignments, and Instructor Tools
- Course listing:
  keyword search, difficulty filter, sort filter, course card open, enrollment CTA/status.
- Course detail:
  enroll action, curriculum tab, about tab, reviews tab, chapter selection, player gating by enrollment state.
- Course player:
  previous chapter, next chapter, notes drawer toggle, video tab, assignment tab, chapter navigation.
- Notes panel:
  summary tab, concepts tab, formulas tab, applications tab, copy concept, copy formula, reload content.
- Assignments:
  assignment panel, file submission, server grading response, fetch/update submission state.
- Instructor dashboard:
  course overview, grading queue tab, students tab, analytics tab.
- Instructor grading:
  pending submissions tab, graded tab, grade input, feedback textarea, submit grade.
- Certificates and learning analytics:
  download certificate endpoints, study stats, achievement progress, goal tracking, analytics export.

### Resource Vault
- Vault page shell:
  search, resource-type filter, sort order, grid/list view mode, tabs (`All`, `Uploads`, `Bookmarks`, `Recent`).
- Resource upload:
  file picker, upload button, metadata capture through service layer, my-upload counts.
- Resource interactions:
  view/open, download, like, bookmark, share, recent resources, storage summary.
- Resource formats:
  notes, images, videos, code, flashcards, generic files.

### AI
- Home-page AI assistant modal:
  open dialog, prompt textarea, send message, close.
- Dedicated AI page:
  suggestions, prompt input, send message, voice input, message menu, copy response, regenerate response, back navigation.
- AI backend:
  `/app/api/ai/chat/route.ts`, course generation, pod course generation, YouTube-to-course generation, streaming course generation.

### Authentication and Account Recovery
- Login:
  email/password input, submit login, OAuth login path, forgot-password link.
- Register:
  name/email/password, password strength/progress, submit register, OAuth registration path.
- Recovery and verification:
  request password reset, confirm password reset, verify email, resend verification, validate session, refresh token, logout.
- Two-factor auth:
  setup route, verify route, disable route behavior through `DELETE` in verify endpoint.
- Onboarding:
  identity selection, interests, vibe, study style, goals, pace, session type, next, back, complete.

### Settings, Navigation, and Shell Systems
- App shell:
  sidebar navigation, mobile navigation, mobile header shortcuts, logout, profile shortcut, analytics shortcut.
- Global settings page:
  section rendering, setting change handler, switches, sliders, select controls, logout.
- Theme and PWA:
  theme toggle, install prompt, install action, dismiss action, service worker registration path.
- Admin and operational systems:
  admin page, broadcasts, payment checkout route, middleware protections, notification worker, security and audit utility modules under `lib/`.
