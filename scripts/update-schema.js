// Production-ready Appwrite schema updater
// Ensures database, collections, attributes, and buckets exist with required fields
// Usage: APPWRITE_API_KEY must be set; endpoint/project/database are read from .env.local

const fs = require('fs')
const path = require('path')
const https = require('https')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const env = {}
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      env[key] = val
    }
  }
  return env
}

const env = loadEnv()
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing Appwrite configuration. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY.')
  process.exit(1)
}

// Simple REST client for Appwrite management operations
function makeRequest(method, route, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT)
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname.replace(/\/$/, '') + route,
      method,
      headers: {
        'X-Appwrite-Key': API_KEY,
        'X-Appwrite-Project': PROJECT_ID,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {}
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, data: parsed })
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

const collections = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'bio', type: 'string', size: 1000 },
      { key: 'avatar', type: 'string', size: 500 },
      { key: 'avatarFileId', type: 'string', size: 255 },
      { key: 'interests', type: 'string', size: 255, array: true },
      { key: 'identity', type: 'string', size: 100 },
      { key: 'vibes', type: 'string', size: 100, array: true },
      { key: 'learningGoals', type: 'string', size: 2000, array: true },
      { key: 'learningPace', type: 'string', size: 50 },
      { key: 'preferredSessionTypes', type: 'string', size: 500, array: true },
      { key: 'availability', type: 'string', size: 500, array: true },
      { key: 'currentFocusAreas', type: 'string', size: 2000, array: true },
      { key: 'joinedAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'lastSeen', type: 'string', size: 255 },
      { key: 'isOnline', type: 'boolean' },
      { key: 'studyStreak', type: 'integer' },
      { key: 'totalPoints', type: 'integer' },
      { key: 'level', type: 'integer' },
      { key: 'badges', type: 'string', size: 100, array: true },
    ],
  },
  {
    id: 'posts',
    name: 'Posts',
    attrs: [
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'resourceId', type: 'string', size: 255 },
      { key: 'imageUrl', type: 'string', size: 500 },
      { key: 'imageUrls', type: 'string', size: 500, array: true },
      { key: 'imageFileId', type: 'string', size: 255 },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'comments', type: 'integer' },
      { key: 'saves', type: 'integer' },
      { key: 'shares', type: 'integer' },
      { key: 'isEdited', type: 'boolean' },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'likedBy', type: 'string', size: 255, array: true },
      { key: 'savedBy', type: 'string', size: 255, array: true },
      { key: 'visibility', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'mentions', type: 'string', size: 100, array: true },
      { key: 'authorName', type: 'string', size: 255 },
      { key: 'authorAvatar', type: 'string', size: 500 },
      { key: 'authorUsername', type: 'string', size: 255 },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attrs: [
      { key: 'roomId', type: 'string', size: 255, required: true },
      { key: 'senderId', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'senderName', type: 'string', size: 255 },
      { key: 'senderAvatar', type: 'string', size: 500 },
      { key: 'readBy', type: 'string', size: 255, array: true },
      { key: 'isEdited', type: 'boolean' },
      { key: 'replyTo', type: 'string', size: 255 },
      { key: 'fileUrl', type: 'string', size: 500 },
      { key: 'reactions', type: 'string', size: 100, array: true },
      { key: 'editedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'comments',
    name: 'Comments',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'postId', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255 },
      { key: 'content', type: 'string', size: 2000, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'likedBy', type: 'string', size: 255, array: true },
      { key: 'authorName', type: 'string', size: 255 },
      { key: 'authorAvatar', type: 'string', size: 500 },
      { key: 'authorUsername', type: 'string', size: 255 },
      { key: 'isEdited', type: 'boolean' },
      { key: 'editedAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'replyTo', type: 'string', size: 255 },
    ],
  },
  {
    id: 'saved_posts',
    name: 'Saved Posts',
    attrs: [
      { key: 'postId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'savedAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'pods',
    name: 'Study Pods',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'teamId', type: 'string', size: 255 }, // Auto-generated, not required
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 }, // Optional - empty descriptions allowed
      { key: 'creatorId', type: 'string', size: 255, required: true },
      { key: 'members', type: 'string', size: 255, array: true },
      { key: 'subject', type: 'string', size: 100 },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'matchingTags', type: 'string', size: 2000, array: true },
      { key: 'idealLearnerType', type: 'string', size: 500, array: true },
      { key: 'sessionType', type: 'string', size: 500, array: true },
      { key: 'averageSessionLength', type: 'integer' },
      { key: 'commonAvailability', type: 'string', size: 500, array: true },
      { key: 'isActive', type: 'boolean' },
      { key: 'isPublic', type: 'boolean' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'memberCount', type: 'integer' },
      { key: 'maxMembers', type: 'integer' },
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    attrs: [
      { key: 'fileId', type: 'string', size: 255, required: true },
      { key: 'fileName', type: 'string', size: 255, required: true },
      { key: 'fileSize', type: 'integer', required: true },
      { key: 'fileType', type: 'string', size: 100, required: true },
      { key: 'fileUrl', type: 'string', size: 500, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'uploadedAt', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'visibility', type: 'string', size: 50 },
      { key: 'downloads', type: 'integer' },
      { key: 'tags', type: 'string', size: 100, array: true },
      { key: 'category', type: 'string', size: 100 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'likes', type: 'integer' },
      { key: 'views', type: 'integer' },
      { key: 'isApproved', type: 'boolean', defaultValue: true },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
      { key: 'isRead', type: 'boolean' },
      { key: 'actionUrl', type: 'string', size: 500 },
      { key: 'actorId', type: 'string', size: 255 },
      { key: 'actorName', type: 'string', size: 255 },
      { key: 'actorAvatar', type: 'string', size: 500 },
      { key: 'metadata', type: 'string', size: 5000 },
    ],
  },
  {
    id: 'calendar_events',
    name: 'Calendar Events',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'startTime', type: 'string', size: 255, required: true },
      { key: 'endTime', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 50 },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'location', type: 'string', size: 500 },
      { key: 'meetingUrl', type: 'string', size: 500 },
      { key: 'attendees', type: 'string', size: 255, array: true },
      { key: 'isRecurring', type: 'boolean' },
      { key: 'reminders', type: 'integer', array: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'isCompleted', type: 'boolean' },
    ],
  },
  {
    id: 'chat_rooms',
    name: 'Chat Rooms',
    attrs: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'podId', type: 'string', size: 255 },
      { key: 'name', type: 'string', size: 255 },
      { key: 'members', type: 'string', size: 255, array: true },
      { key: 'lastMessage', type: 'string', size: 1000 },
      { key: 'lastMessageTime', type: 'string', size: 255 },
      { key: 'lastMessageSenderId', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'isActive', type: 'boolean' },
    ],
  },
  {
    id: 'match_experiments',
    name: 'Match Experiments',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'variant', type: 'string', size: 100, required: true },
      { key: 'recommended', type: 'string', size: 255, array: true },
      { key: 'joined', type: 'string', size: 255, array: true },
      { key: 'timestamp', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'study_plans',
    name: 'Study Plans',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'date', type: 'string', size: 50, required: true },
      { key: 'items', type: 'string', size: 5000, array: true },
      { key: 'completedIds', type: 'string', size: 255, array: true },
      { key: 'sourceSignals', type: 'string', size: 255, array: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_reactions',
    name: 'Pod Reactions',
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'itemId', type: 'string', size: 255, required: true },
      { key: 'itemType', type: 'string', size: 50, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'count', type: 'integer' },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_commitments',
    name: 'Pod Commitments',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'pledge', type: 'string', size: 2000 },
      { key: 'weekOf', type: 'string', size: 50 },
      { key: 'createdAt', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_check_ins',
    name: 'Pod Check Ins',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'userName', type: 'string', size: 255 },
      { key: 'note', type: 'string', size: 4000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'pod_rsvps',
    name: 'Pod RSVPs',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'eventId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'isGoing', type: 'boolean' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'pod_courses',
    name: 'Pod Courses',
    permissions: {
      read: ['role:users'],
      write: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    },
    attrs: [
      { key: 'podId', type: 'string', size: 255, required: true },
      { key: 'courseTitle', type: 'string', size: 255, required: true },
      { key: 'youtubeUrl', type: 'string', size: 500 },
      { key: 'videoId', type: 'string', size: 100 },
      { key: 'status', type: 'string', size: 50 }, // structuring, generating, completed, error
      { key: 'progress', type: 'integer' },
      { key: 'totalChapters', type: 'integer' },
      { key: 'completedChapters', type: 'integer' },
      { key: 'chapters', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'assignments', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'notes', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'dailyTasks', type: 'string', size: 50000 }, // JSON stringified array
      { key: 'generationStartedAt', type: 'string', size: 255 },
      { key: 'generationCompletedAt', type: 'string', size: 255 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'createdBy', type: 'string', size: 255 },
      { key: 'updatedAt', type: 'string', size: 255 },
      { key: 'correlationId', type: 'string', size: 100 },
      { key: 'errorMessage', type: 'string', size: 1000 },
    ],
  },
  {
    id: 'courses',
    name: 'Courses',
    attrs: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'instructorId', type: 'string', size: 255, required: true },
      { key: 'language', type: 'string', size: 50 },
      { key: 'duration', type: 'integer' },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'tags', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'prerequisites', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'coverImage', type: 'string', size: 255 },
      { key: 'youtubeLink', type: 'string', size: 255 },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'isMonetized', type: 'boolean' },
      { key: 'price', type: 'double' },
      { key: 'enrollmentCount', type: 'integer', defaultValue: 0 },
      { key: 'avgRating', type: 'double' },
      { key: 'totalReviews', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255 },
    ],
  },
  {
    id: 'course_chapters',
    name: 'Course Chapters',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'sequenceNumber', type: 'integer' },
      { key: 'duration', type: 'integer' },
      { key: 'videoStartTime', type: 'integer' },
      { key: 'videoEndTime', type: 'integer' },
      { key: 'learningObjectives', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'contentType', type: 'string', size: 50 },
      { key: 'transcript', type: 'string', size: 5000 },
      { key: 'transcriptCleaned', type: 'string', size: 5000 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'course_content',
    name: 'Course Content',
    attrs: [
      { key: 'chapterId', type: 'string', size: 255, required: true },
      { key: 'summaries', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'keyTakeaways', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'detailedNotes', type: 'string', size: 5000 },
      { key: 'concepts', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'formulas', type: 'string', size: 2000 }, // JSON stringified array
      { key: 'realWorldApplications', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'generatedAt', type: 'string', size: 255, required: true },
      { key: 'llmModel', type: 'string', size: 255 },
      { key: 'promptHash', type: 'string', size: 255 },
    ],
  },
  {
    id: 'course_assignments',
    name: 'Course Assignments',
    attrs: [
      { key: 'chapterId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000 },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'difficulty', type: 'string', size: 50 },
      { key: 'estimatedTime', type: 'integer' },
      { key: 'questionText', type: 'string', size: 4000 },
      { key: 'options', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'rubric', type: 'string', size: 2000 }, // JSON stringified object
      { key: 'gradingCriteria', type: 'string', size: 1500 },
      { key: 'sequenceNumber', type: 'integer' },
      { key: 'variations', type: 'string', size: 1500 }, // JSON stringified array
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'user_course_progress',
    name: 'User Course Progress',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrolledAt', type: 'string', size: 255, required: true },
      { key: 'completionPercentage', type: 'integer' },
      { key: 'chaptersCompleted', type: 'integer' },
      { key: 'totalChapters', type: 'integer' },
      { key: 'averageScore', type: 'double' },
      { key: 'finalScore', type: 'double' },
      { key: 'courseStatus', type: 'string', size: 50 },
      { key: 'certificateEarned', type: 'boolean' },
      { key: 'certificateId', type: 'string', size: 255 },
      { key: 'timeSpent', type: 'integer' },
      { key: 'lastAccessedAt', type: 'string', size: 255 },
      { key: 'bookmarkedChapters', type: 'string', size: 5000 }, // JSON stringified array
      { key: 'attemptedAssignments', type: 'integer' },
      { key: 'completedAssignments', type: 'integer' },
    ],
  },
  {
    id: 'assignment_submissions',
    name: 'Assignment Submissions',
    attrs: [
      { key: 'assignmentId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'submissionText', type: 'string', size: 5000 },
      { key: 'submissionFile', type: 'string', size: 500 },
      { key: 'submittedAt', type: 'string', size: 255, required: true },
      { key: 'score', type: 'double' },
      { key: 'confidence', type: 'double' },
      { key: 'aiGeneratedFeedback', type: 'string', size: 2000 },
      { key: 'isAutoGraded', type: 'boolean' },
      { key: 'flaggedForReview', type: 'boolean' },
      { key: 'reviewedBy', type: 'string', size: 255 },
      { key: 'manualScore', type: 'double' },
      { key: 'revisionCount', type: 'integer' },
      { key: 'status', type: 'string', size: 50 },
    ],
  },
  {
    id: 'course_enrollments',
    name: 'Course Enrollments',
    attrs: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrolledAt', type: 'string', size: 255, required: true },
      { key: 'enrollmentType', type: 'string', size: 50 },
      { key: 'paymentId', type: 'string', size: 255 },
      { key: 'cohortId', type: 'string', size: 255 },
      { key: 'status', type: 'string', size: 50 },
    ],
  },
  {
    id: 'course_stats',
    name: 'Course Stats',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'enrollmentCount', type: 'integer' },
      { key: 'completionCount', type: 'integer' },
      { key: 'avgCompletionTime', type: 'integer' },
      { key: 'avgScore', type: 'double' },
      { key: 'churnRate', type: 'double' },
      { key: 'totalRevenue', type: 'double' },
      { key: 'instructorEarnings', type: 'double' },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'course_reviews',
    name: 'Course Reviews',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'rating', type: 'integer' },
      { key: 'reviewText', type: 'string', size: 5000 },
      { key: 'verifiedCompletion', type: 'boolean' },
      { key: 'helpfulCount', type: 'integer' },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'certificates',
    name: 'Certificates',
    attrs: [
      { key: 'courseId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'certificateId', type: 'string', size: 255, required: true },
      { key: 'score', type: 'double' },
      { key: 'completionDate', type: 'string', size: 255 },
      { key: 'instructorName', type: 'string', size: 255 },
      { key: 'signatureUrl', type: 'string', size: 500 },
      { key: 'qrCodeUrl', type: 'string', size: 500 },
      { key: 'verificationUrl', type: 'string', size: 500 },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
  },
]

const buckets = [
  { id: 'avatars', name: 'User Avatars' },
  { id: 'resources', name: 'Study Resources' },
  { id: 'attachments', name: 'Message Attachments' },
  { id: 'post_images', name: 'Post Images' },
]

async function ensureDatabase() {
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}`)
    console.log(`Database exists: ${DATABASE_ID}`)
  } catch (e) {
    console.log(`Creating database: ${DATABASE_ID}`)
    await makeRequest('POST', '/databases', {
      databaseId: DATABASE_ID,
      name: 'PeerSpark Main Database',
    })
  }
}

async function ensureCollection(col) {
  let exists = false
  try {
    await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`)
    console.log(`Collection exists: ${col.id}`)
    exists = true
  } catch (e) {
    console.log(`Creating collection: ${col.id}`)
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
      collectionId: col.id,
      name: col.name,
      documentSecurity: true,
    })
  }
  
  // Always update permissions if defined (for both new and existing collections)
  if (col.permissions) {
    try {
      // Appwrite expects flat arrays for permissions
      const perms = []
      if (col.permissions.read) perms.push(...col.permissions.read.map(r => `read("${r.replace('role:', '')}")`))
      if (col.permissions.write) perms.push(...col.permissions.write.map(r => `create("${r.replace('role:', '')}")`))
      if (col.permissions.update) perms.push(...col.permissions.update.map(r => `update("${r.replace('role:', '')}")`))
      if (col.permissions.delete) perms.push(...col.permissions.delete.map(r => `delete("${r.replace('role:', '')}")`))
      
      await makeRequest('PUT', `/databases/${DATABASE_ID}/collections/${col.id}`, {
        name: col.name,
        permissions: perms,
        documentSecurity: false, // Use collection-level permissions
        enabled: true,
      })
      console.log(`  Permissions updated for ${col.id}`)
    } catch (permErr) {
      console.warn(`Could not set permissions for ${col.id}:`, permErr.data || permErr)
    }
  }
}

async function ensureAttribute(colId, attr) {
  let existing = null
  try {
    const res = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/attributes`)
    if (Array.isArray(res.attributes)) {
      existing = res.attributes.find((a) => a.key === attr.key) || null
    }
  } catch (e) {
    console.warn(`Could not list attributes for ${colId}:`, e.data || e)
  }
  if (existing) {
    const typeMismatch = existing.type !== attr.type
    const arrayMismatch = !!existing.array !== !!attr.array
    const sizeMismatch = attr.type === 'string' && attr.size && existing.size !== attr.size
    if (!typeMismatch && !arrayMismatch && !sizeMismatch) return

    console.log(`  ~ replacing ${colId}.${attr.key} (schema mismatch)`)
    try {
      await makeRequest('DELETE', `/databases/${DATABASE_ID}/collections/${colId}/attributes/${attr.key}`)
      // Wait for attribute removal to propagate to avoid attribute_limit_exceeded on re-create
      for (let i = 0; i < 8; i++) {
        try {
          const check = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${colId}/attributes`)
          const stillThere = Array.isArray(check.attributes) && check.attributes.some((a) => a.key === attr.key)
          if (!stillThere) break
        } catch (_) {
          break
        }
        await sleep(500)
      }
    } catch (e) {
      console.warn(`    could not delete old attribute ${colId}.${attr.key}:`, e.data || e)
    }
  }

  const payload = {
    key: attr.key,
    required: !!attr.required,
    array: !!attr.array,
  }

  try {
    if (attr.type === 'string') {
      payload.size = attr.size || 255
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/string`, payload)
    } else if (attr.type === 'integer') {
      if (attr.min !== undefined) payload.min = attr.min
      if (attr.max !== undefined) payload.max = attr.max
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/integer`, payload)
    } else if (attr.type === 'double' || attr.type === 'float') {
      if (attr.min !== undefined) payload.min = attr.min
      if (attr.max !== undefined) payload.max = attr.max
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/float`, payload)
    } else if (attr.type === 'boolean') {
      if (attr.defaultValue !== undefined) payload.default = attr.defaultValue
      await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${colId}/attributes/boolean`, payload)
    } else {
      throw new Error(`Unsupported attribute type: ${attr.type}`)
    }
    console.log(`  + ${colId}.${attr.key}`)
  } catch (e) {
    if (e.status === 409) return
    console.error(`Failed to create attribute ${colId}.${attr.key}:`, e.data || e)
    throw e
  }
}

async function ensureBucket(bucket) {
  try {
    await makeRequest('GET', `/storage/buckets/${bucket.id}`)
    console.log(`Bucket exists: ${bucket.id}`)
  } catch (e) {
    console.log(`Creating bucket: ${bucket.id}`)
    await makeRequest('POST', '/storage/buckets', {
      bucketId: bucket.id,
      name: bucket.name,
      fileSecurity: true,
    })
  }
}

async function main() {
  console.log('Starting Appwrite schema update...')
  console.log(`Endpoint: ${ENDPOINT}`)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Database: ${DATABASE_ID}`)
  
  await ensureDatabase()

  for (const col of collections) {
    try {
      await ensureCollection(col)
      for (const attr of col.attrs) {
        try {
          await ensureAttribute(col.id, attr)
        } catch (attrErr) {
          console.error(`Error creating attribute ${col.id}.${attr.key}:`, attrErr.message || attrErr)
        }
      }
    } catch (colErr) {
      console.error(`Error with collection ${col.id}:`, colErr.message || colErr)
    }
  }

  for (const bucket of buckets) {
    try {
      await ensureBucket(bucket)
    } catch (bucketErr) {
      console.error(`Error with bucket ${bucket.id}:`, bucketErr.message || bucketErr)
    }
  }

  console.log('Schema update complete.')
}

main().catch((err) => {
  console.error('Schema update failed:', err.message || err)
  process.exit(1)
})
