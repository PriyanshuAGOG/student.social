# PeerSpark Backend Architecture - Complete Implementation Guide

## 🏗️ System Architecture Overview

Build a comprehensive backend system for PeerSpark, a collaborative learning platform that combines social media features with educational tools. The system should handle real-time interactions, AI-powered features, file management, and scalable user management.

## 📊 Database Schema Design

### Core User Management

\`\`\`sql
-- Users table with comprehensive profile information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    education_level VARCHAR(50), -- 'high_school', 'undergraduate', 'graduate', 'professional'
    institution VARCHAR(255),
    major VARCHAR(255),
    graduation_year INTEGER,
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'en',
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deactivated'
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User authentication sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth provider connections
CREATE TABLE user_oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'discord'
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);
\`\`\`

### Study Pods (Learning Communities)

\`\`\`sql
-- Study pods/groups
CREATE TABLE pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    category VARCHAR(100), -- 'academic', 'professional', 'hobby'
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 50,
    current_member_count INTEGER DEFAULT 0,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    rules TEXT,
    meeting_schedule JSONB, -- recurring meeting times
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'suspended'
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pod memberships with roles
CREATE TABLE pod_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'banned'
    joined_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    contribution_score INTEGER DEFAULT 0,
    UNIQUE(pod_id, user_id)
);

-- Pod invitations
CREATE TABLE pod_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255),
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitation_code VARCHAR(50) UNIQUE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Social Feed System

\`\`\`sql
-- Posts in the social feed
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'general', -- 'general', 'question', 'resource', 'milestone', 'announcement'
    media_urls TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'pod', -- 'public', 'pod', 'private'
    status VARCHAR(20) DEFAULT 'published', -- 'draft', 'published', 'archived', 'deleted'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post interactions (likes, bookmarks, etc.)
CREATE TABLE post_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL, -- 'like', 'bookmark', 'share', 'report'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id, interaction_type)
);

-- Comments on posts
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comment interactions
CREATE TABLE comment_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL, -- 'like', 'report'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comment_id, user_id, interaction_type)
);
\`\`\`

### Resource Management

\`\`\`sql
-- Resource vault for storing study materials
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pod_id UUID REFERENCES pods(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- 'note', 'flashcard', 'document', 'video', 'audio', 'link'
    file_url TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    thumbnail_url TEXT,
    content TEXT, -- for text-based resources
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    subject VARCHAR(100),
    difficulty_level VARCHAR(20),
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Resource sharing and permissions
CREATE TABLE resource_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
    shared_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (shared_with_user_id IS NOT NULL OR shared_with_pod_id IS NOT NULL)
);

-- Resource ratings and reviews
CREATE TABLE resource_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);
\`\`\`

### Study Sessions & Calendar

\`\`\`sql
-- Study sessions (both individual and group)
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(20) NOT NULL, -- 'individual', 'group', 'pod'
    pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    meeting_url TEXT,
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(255),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'cancelled'
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    tags TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '[]',
    notes TEXT,
    recording_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'invited', -- 'invited', 'accepted', 'declined', 'attended', 'missed'
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    attendance_duration INTEGER, -- in minutes
    role VARCHAR(20) DEFAULT 'participant', -- 'organizer', 'presenter', 'participant'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- User calendar events
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'study', -- 'study', 'exam', 'assignment', 'meeting', 'deadline'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'UTC',
    location TEXT,
    is_all_day BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    reminder_settings JSONB DEFAULT '[]',
    related_pod_id UUID REFERENCES pods(id) ON DELETE SET NULL,
    related_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### AI Integration & Analytics

\`\`\`sql
-- AI conversation history
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    conversation_type VARCHAR(50) DEFAULT 'general', -- 'general', 'doubt_solving', 'study_plan', 'explanation'
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual AI messages
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'code', 'math', 'image'
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User study analytics
CREATE TABLE study_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    study_time_minutes INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    focus_score DECIMAL(5,2), -- 0-100 scale
    subjects_studied TEXT[] DEFAULT '{}',
    pods_active TEXT[] DEFAULT '{}',
    resources_accessed INTEGER DEFAULT 0,
    ai_queries_made INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50), -- 'study', 'social', 'milestone', 'special'
    criteria JSONB NOT NULL, -- conditions to unlock
    points INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);
\`\`\`

### Gamification & Leaderboards

\`\`\`sql
-- User points and levels
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    study_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    badges_earned INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Challenges and competitions
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
    category VARCHAR(50), -- 'study_time', 'streak', 'social', 'learning'
    criteria JSONB NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_badge VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_global BOOLEAN DEFAULT TRUE,
    pod_id UUID REFERENCES pods(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge participation
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    progress JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'withdrawn'
    completion_date TIMESTAMP,
    points_earned INTEGER DEFAULT 0,
    rank INTEGER,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);
\`\`\`

### Notifications & Communication

\`\`\`sql
-- Notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'post_like', 'comment', 'pod_invite', 'session_reminder', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Real-time messaging for study sessions
CREATE TABLE session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'screen_share', 'system'
    content TEXT,
    file_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## 🔧 API Endpoints Specification

### Authentication Endpoints

\`\`\`typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  educationLevel?: string;
  institution?: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// DELETE /api/auth/sessions/:sessionId

// GET /api/auth/me
interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  isPremium: boolean;
  // ... other profile fields
}
\`\`\`

### Social Feed Endpoints

\`\`\`typescript
// GET /api/feed
interface FeedQuery {
  type?: 'all' | 'my-pods' | 'bookmarked' | 'trending';
  podId?: string;
  limit?: number;
  cursor?: string;
}

// POST /api/posts
interface CreatePostRequest {
  content: string;
  postType: 'general' | 'question' | 'resource' | 'milestone' | 'announcement';
  podId?: string;
  mediaUrls?: string[];
  tags?: string[];
  isAnonymous?: boolean;
}

// GET /api/posts/:postId
// PUT /api/posts/:postId
// DELETE /api/posts/:postId

// POST /api/posts/:postId/interactions
interface PostInteractionRequest {
  type: 'like' | 'bookmark' | 'share' | 'report';
}

// GET /api/posts/:postId/comments
// POST /api/posts/:postId/comments
interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
  isAnonymous?: boolean;
}
\`\`\`

### Study Pods Endpoints

\`\`\`typescript
// GET /api/pods
interface PodsQuery {
  search?: string;
  subject?: string;
  category?: string;
  difficulty?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

// POST /api/pods
interface CreatePodRequest {
  name: string;
  description: string;
  subject: string;
  category: string;
  difficultyLevel: string;
  isPublic: boolean;
  maxMembers: number;
  tags: string[];
  rules?: string;
}

// GET /api/pods/:podId
// PUT /api/pods/:podId
// DELETE /api/pods/:podId

// GET /api/pods/:podId/members
// POST /api/pods/:podId/join
// DELETE /api/pods/:podId/leave

// POST /api/pods/:podId/invite
interface InvitePodMemberRequest {
  email?: string;
  userId?: string;
  message?: string;
}

// GET /api/pods/:podId/analytics
interface PodAnalytics {
  memberCount: number;
  activeMembers: number;
  totalSessions: number;
  totalResources: number;
  engagementRate: number;
  growthRate: number;
}
\`\`\`

### AI Assistant Endpoints

\`\`\`typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    type: 'general' | 'doubt_solving' | 'study_plan' | 'explanation';
    subject?: string;
    podId?: string;
    resourceId?: string;
  };
}

interface ChatResponse {
  message: string;
  conversationId: string;
  messageId: string;
  tokensUsed: number;
  suggestions?: string[];
}

// GET /api/ai/conversations
// GET /api/ai/conversations/:conversationId
// DELETE /api/ai/conversations/:conversationId

// POST /api/ai/study-plan
interface StudyPlanRequest {
  subject: string;
  goals: string[];
  timeframe: string;
  currentLevel: string;
  availableTime: number; // hours per week
}

// POST /api/ai/explain
interface ExplainRequest {
  topic: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  format: 'text' | 'steps' | 'examples';
}
\`\`\`

### Resource Management Endpoints

\`\`\`typescript
// GET /api/resources
interface ResourcesQuery {
  search?: string;
  type?: string;
  subject?: string;
  podId?: string;
  ownerId?: string;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

// POST /api/resources
interface CreateResourceRequest {
  title: string;
  description?: string;
  resourceType: 'note' | 'flashcard' | 'document' | 'video' | 'audio' | 'link';
  content?: string;
  fileUrl?: string;
  tags?: string[];
  subject?: string;
  difficultyLevel?: string;
  isPublic?: boolean;
  podId?: string;
}

// GET /api/resources/:resourceId
// PUT /api/resources/:resourceId
// DELETE /api/resources/:resourceId

// POST /api/resources/:resourceId/share
interface ShareResourceRequest {
  shareWithUserId?: string;
  shareWithPodId?: string;
  permissionLevel: 'view' | 'edit' | 'admin';
}

// POST /api/resources/:resourceId/rate
interface RateResourceRequest {
  rating: number; // 1-5
  review?: string;
}

// POST /api/upload
interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}
\`\`\`

### Study Sessions & Calendar Endpoints

\`\`\`typescript
// GET /api/sessions
interface SessionsQuery {
  type?: 'individual' | 'group' | 'pod';
  podId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// POST /api/sessions
interface CreateSessionRequest {
  title: string;
  description?: string;
  sessionType: 'individual' | 'group' | 'pod';
  podId?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  maxParticipants?: number;
  isRecurring?: boolean;
  recurrencePattern?: object;
  tags?: string[];
}

// GET /api/sessions/:sessionId
// PUT /api/sessions/:sessionId
// DELETE /api/sessions/:sessionId

// POST /api/sessions/:sessionId/join
// DELETE /api/sessions/:sessionId/leave

// GET /api/calendar/events
interface CalendarQuery {
  startDate: string;
  endDate: string;
  timezone?: string;
  eventTypes?: string[];
}

// POST /api/calendar/events
interface CreateEventRequest {
  title: string;
  description?: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  timezone: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  reminderSettings?: object[];
}
\`\`\`

### Analytics & Gamification Endpoints

\`\`\`typescript
// GET /api/analytics/dashboard
interface DashboardAnalytics {
  studyTime: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  sessions: {
    completed: number;
    scheduled: number;
    averageDuration: number;
  };
  social: {
    postsCreated: number;
    commentsReceived: number;
    likesReceived: number;
  };
  achievements: {
    totalEarned: number;
    recentBadges: Achievement[];
    nextMilestone: Achievement;
  };
}

// GET /api/analytics/study-patterns
interface StudyPatterns {
  dailyHours: Array<{ date: string; hours: number }>;
  subjectDistribution: Array<{ subject: string; hours: number; percentage: number }>;
  focusScores: Array<{ date: string; score: number }>;
  productiveHours: Array<{ hour: number; productivity: number }>;
}

// GET /api/gamification/profile
interface GamificationProfile {
  level: number;
  totalPoints: number;
  experiencePoints: number;
  nextLevelPoints: number;
  studyStreak: number;
  longestStreak: number;
  badgesEarned: number;
  rank: number;
}

// GET /api/leaderboard
interface LeaderboardQuery {
  type: 'global' | 'pod' | 'friends';
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  metric: 'points' | 'study-time' | 'streak';
  podId?: string;
  limit?: number;
}

// GET /api/achievements
// GET /api/achievements/:achievementId
// POST /api/achievements/:achievementId/claim

// GET /api/challenges
// POST /api/challenges/:challengeId/join
// DELETE /api/challenges/:challengeId/leave
\`\`\`

## 🔄 Real-time Features with Socket.io

### Socket Event Handlers

\`\`\`typescript
// Study session events
socket.on('session:join', (sessionId: string) => {
  // Join session room
  // Update participant count
  // Notify other participants
});

socket.on('session:leave', (sessionId: string) => {
  // Leave session room
  // Update participant count
  // Notify other participants
});

socket.on('session:message', (data: {
  sessionId: string;
  message: string;
  type: 'text' | 'file' | 'screen_share';
}) => {
  // Broadcast message to session participants
  // Store message in database
});

socket.on('session:screen_share', (data: {
  sessionId: string;
  isSharing: boolean;
  streamId?: string;
}) => {
  // Handle screen sharing events
  // Notify participants about screen share status
});

// Real-time feed updates
socket.on('feed:new_post', (postData: Post) => {
  // Broadcast new post to relevant users
  // Update feed in real-time
});

socket.on('feed:post_interaction', (data: {
  postId: string;
  type: 'like' | 'comment' | 'share';
  count: number;
}) => {
  // Update interaction counts in real-time
});

// Notification events
socket.on('notification:new', (notification: Notification) => {
  // Send real-time notification to user
  // Update notification badge count
});

// Typing indicators
socket.on('typing:start', (data: { sessionId: string; userId: string }) => {
  // Show typing indicator
});

socket.on('typing:stop', (data: { sessionId: string; userId: string }) => {
  // Hide typing indicator
});
\`\`\`

## 🔐 Authentication & Security Implementation

### JWT Token Management

\`\`\`typescript
// JWT token structure
interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  isPremium: boolean;
  sessionId: string;
  iat: number;
  exp: number;
}

// Token generation
function generateTokens(user: User, sessionId: string) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isPremium: user.isPremium,
      sessionId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Middleware for authentication
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify session is still active
    const session = await db.userSession.findUnique({
      where: { id: decoded.sessionId, userId: decoded.userId }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
\`\`\`

### Rate Limiting & Security

\`\`\`typescript
// Rate limiting configuration
const rateLimitConfig = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  upload: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
  ai: { windowMs: 60 * 60 * 1000, max: 50 }, // 50 AI queries per hour
};

// Input validation middleware
function validateInput(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    next();
  };
}

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
\`\`\`

## 📁 File Storage & Management

### AWS S3 Integration

\`\`\`typescript
// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File upload handler
async function uploadFile(file: Express.Multer.File, userId: string) {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${userId}/${Date.now()}${fileExtension}`;
  
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedBy: userId,
    },
  };

  try {
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    return {
      url: fileUrl,
      key: fileName,
      size: file.size,
      type: file.mimetype,
      originalName: file.originalname,
    };
  } catch (error) {
    throw new Error('File upload failed');
  }
}

// File deletion
async function deleteFile(fileKey: string) {
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
  };

  await s3Client.send(new DeleteObjectCommand(deleteParams));
}

// Generate presigned URLs for secure access
async function generatePresignedUrl(fileKey: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
\`\`\`

## 🤖 AI Integration Implementation

### OpenAI API Integration

\`\`\`typescript
// OpenAI client setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// AI chat handler
async function handleAIChat(
  message: string,
  context: ChatContext,
  conversationHistory: AIMessage[]
) {
  const systemPrompt = generateSystemPrompt(context);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return {
      response,
      tokensUsed,
      messageId: completion.id,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

// System prompt generation based on context
function generateSystemPrompt(context: ChatContext): string {
  const basePrompt = `You are an AI study assistant for PeerSpark, a collaborative learning platform. 
  You help students with their studies, answer questions, explain concepts, and provide study guidance.`;

  switch (context.type) {
    case 'doubt_solving':
      return `${basePrompt} Focus on solving the student's specific doubt with clear, step-by-step explanations.`;
    
    case 'study_plan':
      return `${basePrompt} Create personalized study plans based on the student's goals, timeline, and current level.`;
    
    case 'explanation':
      return `${basePrompt} Provide clear, comprehensive explanations of concepts with examples and analogies.`;
    
    default:
      return `${basePrompt} Be helpful, encouraging, and educational in your responses.`;
  }
}

// AI-powered study plan generation
async function generateStudyPlan(request: StudyPlanRequest) {
  const prompt = `Create a detailed study plan for:
  Subject: ${request.subject}
  Goals: ${request.goals.join(', ')}
  Timeframe: ${request.timeframe}
  Current Level: ${request.currentLevel}
  Available Time: ${request.availableTime} hours per week
  
  Provide a structured plan with daily/weekly tasks, milestones, and resource recommendations.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content;
}
\`\`\`

## 📊 Analytics & Monitoring

### Performance Monitoring

\`\`\`typescript
// Database query performance monitoring
function monitorQuery(queryName: string) {
  return async function<T>(queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      // Send metrics to monitoring service
      await sendMetric('database.query.duration', duration, {
        query: queryName,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await sendMetric('database.query.duration', duration, {
        query: queryName,
        status: 'error',
      });
      
      throw error;
    }
  };
}

// API endpoint monitoring
function monitorEndpoint(endpoint: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      await sendMetric('api.request.duration', duration, {
        endpoint,
        method: req.method,
        status_code: statusCode.toString(),
      });
      
      // Log errors
      if (statusCode >= 400) {
        console.error(`API Error: ${req.method} ${endpoint} - ${statusCode} (${duration}ms)`);
      }
    });
    
    next();
  };
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      s3: await checkS3Health(),
      openai: await checkOpenAIHealth(),
    },
  };
  
  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
\`\`\`

## 🚀 Deployment & Scaling

### Docker Configuration

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
\`\`\`

### Kubernetes Deployment

\`\`\`yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peerspark-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: peerspark-backend
  template:
    metadata:
      labels:
        app: peerspark-backend
    spec:
      containers:
      - name: backend
        image: peerspark/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: peerspark-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: peerspark-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
\`\`\`

### Environment Configuration

\`\`\`bash
# Production environment variables
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/peerspark
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_POOL_SIZE=10

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://api.peerspark.com

# File Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=peerspark-files

# AI Services
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@peerspark.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://redis-host:6379

# CORS
ALLOWED_ORIGINS=https://peerspark.com,https://app.peerspark.com

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_VIDEO_CALLS=true
ENABLE_PREMIUM_FEATURES=true
\`\`\`

## 🧪 Testing Strategy

### Unit Tests

\`\`\`typescript
// tests/services/auth.test.ts
describe('Authentication Service', () => {
  describe('registerUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'securepassword',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await authService.registerUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'testuser2',
        password: 'securepassword',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(authService.registerUser(userData)).rejects.toThrow('Email already exists');
    });
  });
});

// tests/api/posts.test.ts
describe('Posts API', () => {
  let authToken: string;

  beforeEach(async () => {
    const user = await createTestUser();
    authToken = generateTestToken(user);
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const postData = {
        content: 'This is a test post',
        postType: 'general',
        podId: 'test-pod-id',
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.content).toBe(postData.content);
      expect(response.body.postType).toBe(postData.postType);
    });
  });
});
\`\`\`

### Integration Tests

\`\`\`typescript
// tests/integration/study-session.test.ts
describe('Study Session Integration', () => {
  it('should handle complete session lifecycle', async () => {
    // Create users
    const organizer = await createTestUser({ role: 'premium' });
    const participant = await createTestUser();

    // Create pod
    const pod = await createTestPod({ creatorId: organizer.id });

    // Create session
    const sessionData = {
      title: 'Test Study Session',
      sessionType: 'pod',
      podId: pod.id,
      startTime: new Date(Date.now() + 3600000), // 1 hour from now
      endTime: new Date(Date.now() + 7200000), // 2 hours from now
    };

    const session = await sessionService.createSession(organizer.id, sessionData);

    // Join session
    await sessionService.joinSession(session.id, participant.id);

    // Verify participants
    const participants = await sessionService.getParticipants(session.id);
    expect(participants).toHaveLength(2);

    // Start session
    await sessionService.startSession(session.id, organizer.id);

    // Send message
    await sessionService.sendMessage(session.id, participant.id, {
      content: 'Hello everyone!',
      type: 'text',
    });

    // End session
    await sessionService.endSession(session.id, organizer.id);

    // Verify session completion
    const completedSession = await sessionService.getSession(session.id);
    expect(completedSession.status).toBe('completed');
  });
});
\`\`\`

## 📈 Performance Optimization

### Database Optimization

\`\`\`sql
-- Indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_pod_created ON posts(pod_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_type_created ON posts(post_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_search ON posts USING gin(to_tsvector('english', content));

CREATE INDEX CONCURRENTLY idx_pod_memberships_user ON pod_memberships(user_id, status);
CREATE INDEX CONCURRENTLY idx_pod_memberships_pod ON pod_memberships(pod_id, status);

CREATE INDEX CONCURRENTLY idx_resources_owner_created ON resources(owner_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_resources_pod_created ON resources(pod_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_resources_search ON resources USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY idx_study_sessions_organizer ON study_sessions(organizer_id, start_time);
CREATE INDEX CONCURRENTLY idx_study_sessions_pod ON study_sessions(pod_id, start_time);

CREATE INDEX CONCURRENTLY idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_notifications_unread ON notifications(recipient_id, is_read, created_at DESC);

-- Partitioning for large tables
CREATE TABLE study_analytics_2024 PARTITION OF study_analytics
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE ai_messages_2024 PARTITION OF ai_messages
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
\`\`\`

### Caching Strategy

\`\`\`typescript
// Redis caching implementation
class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Cache implementation for frequently accessed data
async function getCachedUserProfile(userId: string): Promise<UserProfile> {
  const cacheKey = `user:profile:${userId}`;
  
  let profile = await cache.get<UserProfile>(cacheKey);
  
  if (!profile) {
    profile = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        isPremium: true,
        // ... other profile fields
      },
    });
    
    if (profile) {
      await cache.set(cacheKey, profile, 1800); // 30 minutes
    }
  }
  
  return profile;
}

// Cache invalidation on profile updates
async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const updatedProfile = await db.user.update({
    where: { id: userId },
    data: updates,
  });
  
  // Invalidate related caches
  await cache.del(`user:profile:${userId}`);
  await cache.invalidatePattern(`feed:user:${userId}:*`);
  await cache.invalidatePattern(`pods:user:${userId}:*`);
  
  return updatedProfile;
}
\`\`\`

### Background Job Processing

\`\`\`typescript
// Bull queue setup for background jobs
import Bull from 'bull';

const emailQueue = new Bull('email processing', process.env.REDIS_URL!);
const analyticsQueue = new Bull('analytics processing', process.env.REDIS_URL!);
const aiQueue = new Bull('ai processing', process.env.REDIS_URL!);

// Email job processor
emailQueue.process('send-notification', async (job) => {
  const { userId, type, data } = job.data;
  
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  
  const emailTemplate = await getEmailTemplate(type, data);
  await sendEmail(user.email, emailTemplate.subject, emailTemplate.html);
  
  // Update notification as sent
  await db.notification.update({
    where: { id: data.notificationId },
    data: { isEmailSent: true },
  });
});

// Analytics job processor
analyticsQueue.process('calculate-daily-stats', async (job) => {
  const { userId, date } = job.data;
  
  const stats = await calculateDailyStudyStats(userId, date);
  
  await db.studyAnalytics.upsert({
    where: { userId_date: { userId, date } },
    update: stats,
    create: { userId, date, ...stats },
  });
});

// AI processing job
aiQueue.process('generate-study-plan', async (job) => {
  const { userId, request } = job.data;
  
  const studyPlan = await generateStudyPlan(request);
  
  await db.aiConversation.create({
    data: {
      userId,
      conversationType: 'study_plan',
      context: request,
      messages: {
        create: [
          {
            role: 'user',
            content: `Generate study plan: ${JSON.stringify(request)}`,
          },
          {
            role: 'assistant',
            content: studyPlan,
            messageType: 'study_plan',
          },
        ],
      },
    },
  });
  
  // Send notification to user
  await emailQueue.add('send-notification', {
    userId,
    type: 'study_plan_ready',
    data: { studyPlan },
  });
});
\`\`\`

## 🔍 Search Implementation

### Elasticsearch Integration

\`\`\`typescript
// Elasticsearch client setup
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL!,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME!,
    password: process.env.ELASTICSEARCH_PASSWORD!,
  },
});

// Index mappings
const resourceMapping = {
  properties: {
    id: { type: 'keyword' },
    title: { 
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' },
        suggest: { type: 'completion' },
      },
    },
    description: { type: 'text', analyzer: 'standard' },
    content: { type: 'text', analyzer: 'standard' },
    resourceType: { type: 'keyword' },
    subject: { type: 'keyword' },
    tags: { type: 'keyword' },
    difficultyLevel: { type: 'keyword' },
    ownerId: { type: 'keyword' },
    podId: { type: 'keyword' },
    isPublic: { type: 'boolean' },
    rating: { type: 'float' },
    downloadCount: { type: 'integer' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
};

// Search function with advanced filtering
async function searchResources(query: {
  search?: string;
  filters?: {
    resourceType?: string[];
    subject?: string[];
    tags?: string[];
    difficultyLevel?: string[];
    rating?: { min?: number; max?: number };
  };
  sort?: 'relevance' | 'date' | 'rating' | 'downloads';
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const must: any[] = [];
  const filter: any[] = [];
  
  // Text search
  if (query.search) {
    must.push({
      multi_match: {
        query: query.search,
        fields: ['title^3', 'description^2', 'content', 'tags^2'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }
  
  // Filters
  if (query.filters) {
    const { resourceType, subject, tags, difficultyLevel, rating } = query.filters;
    
    if (resourceType?.length) {
      filter.push({ terms: { resourceType } });
    }
    
    if (subject?.length) {
      filter.push({ terms: { subject } });
    }
    
    if (tags?.length) {
      filter.push({ terms: { tags } });
    }
    
    if (difficultyLevel?.length) {
      filter.push({ terms: { difficultyLevel } });
    }
    
    if (rating) {
      const rangeQuery: any = {};
      if (rating.min !== undefined) rangeQuery.gte = rating.min;
      if (rating.max !== undefined) rangeQuery.lte = rating.max;
      filter.push({ range: { rating: rangeQuery } });
    }
  }
  
  // Visibility filter
  const should = [
    { term: { isPublic: true } },
  ];
  
  if (query.userId) {
    should.push({ term: { ownerId: query.userId } });
    // Add pod-based visibility logic here
  }
  
  filter.push({ bool: { should, minimum_should_match: 1 } });
  
  // Sort configuration
  let sort: any[] = [];
  switch (query.sort) {
    case 'date':
      sort = [{ createdAt: { order: 'desc' } }];
      break;
    case 'rating':
      sort = [{ rating: { order: 'desc' } }, { ratingCount: { order: 'desc' } }];
      break;
    case 'downloads':
      sort = [{ downloadCount: { order: 'desc' } }];
      break;
    default:
      sort = ['_score', { createdAt: { order: 'desc' } }];
  }
  
  const searchBody = {
    query: {
      bool: {
        must: must.length ? must : [{ match_all: {} }],
        filter,
      },
    },
    sort,
    from: query.offset || 0,
    size: query.limit || 20,
    highlight: {
      fields: {
        title: {},
        description: {},
        content: { fragment_size: 150, number_of_fragments: 3 },
      },
    },
    aggs: {
      resourceTypes: { terms: { field: 'resourceType' } },
      subjects: { terms: { field: 'subject' } },
      tags: { terms: { field: 'tags', size: 20 } },
      difficultyLevels: { terms: { field: 'difficultyLevel' } },
    },
  };
  
  const response = await esClient.search({
    index: 'resources',
    body: searchBody,
  });
  
  return {
    hits: response.body.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
      highlights: hit.highlight,
    })),
    total: response.body.hits.total.value,
    aggregations: response.body.aggregations,
  };
}

// Auto-complete suggestions
async function getSearchSuggestions(query: string, limit: number = 10) {
  const response = await esClient.search({
    index: 'resources',
    body: {
      suggest: {
        title_suggest: {
          prefix: query,
          completion: {
            field: 'title.suggest',
            size: limit,
          },
        },
      },
    },
  });
  
  return response.body.suggest.title_suggest[0].options.map((option: any) => ({
    text: option.text,
    score: option._score,
  }));
}
\`\`\`

## 📱 Mobile API Considerations

### Mobile-Optimized Endpoints

\`\`\`typescript
// Mobile-specific API endpoints with optimized payloads
app.get('/api/mobile/feed', authenticateToken, async (req, res) => {
  const { cursor, limit = 10 } = req.query;
  const userId = req.user.userId;
  
  // Optimized query for mobile with minimal data
  const posts = await db.post.findMany({
    where: {
      // Feed visibility logic
    },
    select: {
      id: true,
      content: true,
      postType: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      pod: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          interactions: {
            where: { interactionType: 'like' },
          },
          comments: true,
        },
      },
      interactions: {
        where: {
          userId,
          interactionType: { in: ['like', 'bookmark'] },
        },
        select: {
          interactionType: true,
        },
      },
      mediaUrls: true,
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    cursor: cursor ? { id: cursor as string } : undefined,
    skip: cursor ? 1 : 0,
  });
  
  // Transform for mobile consumption
  const mobilePosts = posts.map(post => ({
    id: post.id,
    content: post.content,
    type: post.postType,
    createdAt: post.createdAt,
    author: {
      id: post.author.id,
      name: `${post.author.firstName} ${post.author.lastName}`,
      username: post.author.username,
      avatar: post.author.avatarUrl,
      verified: post.author.isVerified,
    },
    pod: post.pod?.name,
    stats: {
      likes: post._count.interactions,
      comments: post._count.comments,
    },
    userInteractions: {
      liked: post.interactions.some(i => i.interactionType === 'like'),
      bookmarked: post.interactions.some(i => i.interactionType === 'bookmark'),
    },
    media: post.mediaUrls,
    tags: post.tags,
  }));
  
  res.json({
    posts: mobilePosts,
    nextCursor: posts.length === parseInt(limit as string) ? posts[posts.length - 1].id : null,
  });
});

// Offline sync endpoint
app.post('/api/mobile/sync', authenticateToken, async (req, res) => {
  const { lastSyncTimestamp, pendingActions } = req.body;
  const userId = req.user.userId;
  
  // Process pending actions from mobile
  const results = await Promise.allSettled(
    pendingActions.map(async (action: any) => {
      switch (action.type) {
        case 'create_post':
          return await createPost(userId, action.data);
        case 'like_post':
          return await togglePostLike(userId, action.data.postId);
        case 'bookmark_resource':
          return await toggleResourceBookmark(userId, action.data.resourceId);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    })
  );
  
  // Get updates since last sync
  const updates = await getUpdatesSinceTimestamp(userId, lastSyncTimestamp);
  
  res.json({
    syncResults: results,
    updates,
    syncTimestamp: new Date().toISOString(),
  });
});
\`\`\`

## 🔐 Advanced Security Features

### Content Moderation

\`\`\`typescript
// AI-powered content moderation
async function moderateContent(content: string, type: 'post' | 'comment' | 'message') {
  // Check against OpenAI moderation API
  const moderationResponse = await openai.moderations.create({
    input: content,
  });
  
  const flagged = moderationResponse.results[0].flagged;
  const categories = moderationResponse.results[0].categories;
  
  if (flagged) {
    return {
      approved: false,
      reason: 'Content violates community guidelines',
      categories: Object.keys(categories).filter(key => categories[key]),
    };
  }
  
  // Additional custom checks
  const customChecks = await runCustomModerationChecks(content, type);
  
  return {
    approved: !customChecks.flagged,
    reason: customChecks.reason,
    confidence: customChecks.confidence,
  };
}

// Spam detection
async function detectSpam(userId: string, content: string, type: string) {
  const recentPosts = await db.post.count({
    where: {
      authorId: userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });
  
  // Rate limiting check
  if (recentPosts > 10) {
    return { isSpam: true, reason: 'Rate limit exceeded' };
  }
  
  // Content similarity check
  const similarContent = await checkContentSimilarity(userId, content);
  if (similarContent.similarity > 0.9) {
    return { isSpam: true, reason: 'Duplicate content detected' };
  }
  
  return { isSpam: false };
}

// Report handling system
async function handleContentReport(reportData: {
  reporterId: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'resource';
  reason: string;
  description?: string;
}) {
  // Create report record
  const report = await db.contentReport.create({
    data: {
      reporterId: reportData.reporterId,
      contentId: reportData.contentId,
      contentType: reportData.contentType,
      reason: reportData.reason,
      description: reportData.description,
      status: 'pending',
    },
  });
  
  // Auto-moderate based on report count
  const reportCount = await db.contentReport.count({
    where: {
      contentId: reportData.contentId,
      status: 'pending',
    },
  });
  
  if (reportCount >= 3) {
    // Auto-hide content pending review
    await hideContentPendingReview(reportData.contentId, reportData.contentType);
    
    // Notify moderators
    await notifyModerators(report);
  }
  
  return report;
}
\`\`\`

## 📊 Advanced Analytics Implementation

### Real-time Analytics Dashboard

\`\`\`typescript
// Real-time analytics using WebSockets
class AnalyticsService {
  private io: Server;
  
  constructor(io: Server) {
    this.io = io;
  }
  
  async trackEvent(userId: string, event: string, properties: any = {}) {
    // Store event in database
    await db.analyticsEvent.create({
      data: {
        userId,
        event,
        properties,
        timestamp: new Date(),
      },
    });
    
    // Update real-time metrics
    await this.updateRealTimeMetrics(event, properties);
    
    // Send to analytics dashboard if admin is connected
    this.io.to('admin-dashboard').emit('analytics:event', {
      userId,
      event,
      properties,
      timestamp: new Date(),
    });
  }
  
  async updateRealTimeMetrics(event: string, properties: any) {
    const today = new Date().toISOString().split('T')[0];
    
    // Update Redis counters
    await redis.hincrby(`metrics:${today}`, event, 1);
    await redis.hincrby(`metrics:${today}`, 'total_events', 1);
    
    // Update specific metrics based on event type
    switch (event) {
      case 'study_session_completed':
        await redis.hincrby(`metrics:${today}`, 'study_minutes', properties.duration || 0);
        break;
      case 'post_created':
        await redis.hincrby(`metrics:${today}`, 'posts_created', 1);
        break;
      case 'user_registered':
        await redis.hincrby(`metrics:${today}`, 'new_users', 1);
        break;
    }
  }
  
  async getDashboardMetrics(timeframe: 'today' | 'week' | 'month') {
    const dates = this.getDateRange(timeframe);
    const metrics = {};
    
    for (const date of dates) {
      const dayMetrics = await redis.hgetall(`metrics:${date}`);
      metrics[date] = dayMetrics;
    }
    
    return this.aggregateMetrics(metrics);
  }
  
  private getDateRange(timeframe: string): string[] {
    const dates = [];
    const today = new Date();
    
    let days = 1;
    if (timeframe === 'week') days = 7;
    if (timeframe === 'month') days = 30;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates.reverse();
  }
  
  private aggregateMetrics(metrics: any) {
    const aggregated = {
      totalUsers: 0,
      activeUsers: 0,
      studyHours: 0,
      postsCreated: 0,
      sessionsCompleted: 0,
      dailyBreakdown: [],
    };
    
    for (const [date, dayMetrics] of Object.entries(metrics)) {
      aggregated.totalUsers += parseInt(dayMetrics.new_users || '0');
      aggregated.studyHours += parseInt(dayMetrics.study_minutes || '0') / 60;
      aggregated.postsCreated += parseInt(dayMetrics.posts_created || '0');
      aggregated.sessionsCompleted += parseInt(dayMetrics.study_session_completed || '0');
      
      aggregated.dailyBreakdown.push({
        date,
        metrics: dayMetrics,
      });
    }
    
    return aggregated;
  }
}

// Usage tracking middleware
function trackAPIUsage(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const userId = req.user?.userId;
      
      if (userId) {
        await analyticsService.trackEvent(userId, 'api_request', {
          endpoint,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      }
    });
    
    next();
  };
}
\`\`\`

This comprehensive backend architecture provides a solid foundation for building PeerSpark as a scalable, secure, and feature-rich collaborative learning platform. The implementation covers all major aspects from database design to real-time features, AI integration, security, and performance optimization.

Key highlights of this architecture:

1. **Scalable Database Design**: Comprehensive schema with proper indexing and partitioning
2. **Real-time Features**: Socket.io integration for live study sessions and chat
3. **AI Integration**: OpenAI API integration with conversation management
4. **Security**: JWT authentication, rate limiting, content moderation
5. **Performance**: Caching strategies, background job processing, search optimization
6. **Mobile Support**: Optimized endpoints and offline sync capabilities
7. **Analytics**: Real-time tracking and dashboard metrics
8. **Testing**: Comprehensive unit and integration test examples
9. **Deployment**: Docker and Kubernetes configuration for production

This architecture can handle millions of users while maintaining performance and providing a rich, interactive learning experience.
