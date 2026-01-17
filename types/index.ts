export interface User {
    $id: string;
    name: string;
    email: string;
    phone?: string;
    detail?: string;
    status: boolean | string | number;
    emailVerification: boolean;
    prefs: Record<string, any>;
    registration: string;
    accessedAt?: string;
    labels?: string[];
    passwordUpdate?: string;
}

export interface Profile {
    $id: string; // userId
    userId: string;
    name: string;
    email: string;
    bio?: string;
    interests?: string[];
    avatar?: string;
    joinedAt: string;
    isOnline: boolean;
    lastSeen?: string;
    studyStreak: number;
    totalPoints: number;
    level: number;
    badges: string[];
    learningGoals: string[];
    learningPace?: string;
    preferredSessionTypes?: string[];
    availability?: string[];
    currentFocusAreas?: string[];
    followers?: string[];
    following?: string[];
    username?: string;
}

export interface Post {
    $id: string;
    authorId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'link' | 'poll';
    podId?: string | null;
    imageUrls: string[];
    timestamp: string;
    updatedAt: string;
    likes: number;
    comments: number;
    saves: number;
    likedBy: string[];
    savedBy: string[];
    visibility: 'public' | 'pod' | 'private';
    tags: string[];
    authorName: string;
    authorAvatar: string;
    authorUsername: string;
    pollOptions?: string[]; // JSON string or array depending on impl
    pollVotes?: Record<string, number>; // JSON string
}

export interface Comment {
    $id: string;
    postId: string;
    authorId: string;
    userId: string; // redundancy in schema?
    content: string;
    timestamp: string;
    likes: number;
    likedBy: string[];
    authorName: string;
    authorAvatar: string;
    authorUsername: string;
    replyTo?: string | null;
}

export interface Notification {
    $id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'pod_join' | 'message' | 'resource' | 'event' | 'like' | 'comment' | 'save' | 'pod_post' | 'call' | 'meeting';
    isRead: boolean;
    timestamp: string;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    readAt?: string;
    // Metadata fields
    postId?: string;
    commentId?: string;
    podId?: string;
    eventId?: string;
    actor?: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    callerId?: string;
}

export interface Pod {
    $id: string;
    name: string;
    description: string;
    imageUrl?: string;
    category: string;
    privacy: 'public' | 'private' | 'invite_only';
    members: string[]; // user IDs
    admins: string[]; // user IDs
    tags: string[];
    maxMembers: number;
    createdAt: string;
    createdBy: string;
    rules?: string;
    isVerified?: boolean;
}

export interface CalendarEvent {
    $id: string;
    userId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: 'study' | 'meeting' | 'assignment' | 'exam' | 'reminder';
    podId?: string | null;
    location?: string;
    meetingUrl?: string;
    attendees: string[];
    isRecurring: boolean;
    reminders: string[];
    createdAt: string;
    isCompleted: boolean;
}

export interface Course {
    $id: string;
    podId: string;
    courseTitle: string;
    youtubeUrl: string;
    videoId: string;
    status: 'planning' | 'structuring' | 'generating' | 'completed' | 'error';
    progress: number;
    totalChapters: number;
    completedChapters: number;
    chapters: string | Chapter[]; // Parsed or JSON string
    assignments: string | Assignment[];
    notes: string | string[];
    dailyTasks: string | any[];
    generationStartedAt: string;
    generationCompletedAt?: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    error?: string;
}

export interface Chapter {
    chapterNumber: number;
    title: string;
    description: string;
    estimatedMinutes: number;
    objectives: string[];
    locked: boolean;
    contentGenerated: boolean;
    content?: string;
    keyPoints?: string[];
    assignments?: Assignment[];
    notes?: string[];
    resources?: string[];
    error?: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    dueInDays: number;
    status?: 'pending' | 'completed';
}
