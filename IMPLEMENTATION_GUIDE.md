# Implementation Guide: Streaming Course Generation & AI Chat

## Quick Start

### Using the New Course Generation Endpoint

```javascript
// Frontend
const response = await fetch("/api/pods/generate-course-streaming", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    podId: "pod-123",
    youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    courseTitle: "Learn React Hooks"
  })
})

const { course } = await response.json()
console.log(course.status) // "structuring"
console.log(course.chapters[0].locked) // false (first chapter always unlocked)
console.log(course.progress) // 0
```

### Polling for Updates

```javascript
// In React component
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const res = await fetch(`/api/pods/get-course?podId=${podId}`)
    const data = await res.json()
    
    if (data.course) {
      setCourse(data.course) // Automatically updates UI
      
      // Stop polling when done
      if (data.course.status === "completed" || data.course.status === "error") {
        clearInterval(pollInterval)
      }
    }
  }, 5000) // Poll every 5 seconds

  return () => clearInterval(pollInterval)
}, [podId])
```

---

## Architecture

### Phase 1: Chapter Stub Generation (2-5 seconds)
```
┌─────────────────────────────────────────┐
│ POST /api/pods/generate-course-streaming│
├─────────────────────────────────────────┤
│ 1. Validate input                       │
│ 2. Extract video ID (5s timeout)        │
│ 3. Generate chapter stubs (15s timeout) │
│ 4. Save to database                     │
│ 5. Start background job                 │
│ 6. Return immediately                   │
└─────────────────────────────────────────┘
         ↓
    Response: {
      status: "structuring",
      chapters: [...stubs...],
      progress: 0
    }
```

### Phase 2: Background Content Generation (continuous)
```
┌─────────────────────────────────────────────┐
│ generateChapterContentAsync()                │
├─────────────────────────────────────────────┤
│ For each chapter (no timeout limit):         │
│  1. Generate detailed content (20s timeout) │
│  2. Extract key points & assignments        │
│  3. Update chapter in database              │
│  4. Unlock next chapter                     │
│  5. Update progress percentage              │
└─────────────────────────────────────────────┘
         ↓
    Continuous updates to database
    Frontend polls and gets updates
```

---

## Data Model

### Course Document Structure
```typescript
interface PodCourse {
  $id: string
  podId: string
  courseTitle: string
  youtubeUrl: string
  videoId: string
  status: "structuring" | "generating" | "completed" | "error"
  progress: number // 0-100
  totalChapters: number
  completedChapters: number
  chapters: string // JSON stringified array
  assignments: string // JSON stringified array
  notes: string // JSON stringified array
  dailyTasks: string // JSON stringified array
  generationStartedAt: string // ISO timestamp
  generationCompletedAt?: string // ISO timestamp
  error?: string // Error message if failed
  createdAt: string
  createdBy: string
  updatedAt: string
}

interface Chapter {
  chapterNumber: number
  title: string
  description: string
  objectives: string[]
  estimatedMinutes: number
  locked: boolean
  contentGenerated: boolean
  content?: string // Detailed chapter content
  keyPoints?: string[] // Important points
  assignments?: Assignment[]
  notes?: string[] // Additional notes
  resources?: string[] // Links
  error?: string // If generation failed
  createdAt: string
}
```

---

## Error Handling

### Request-Level Errors

```javascript
// Validation Error (400)
{
  error: "Missing required fields: podId, youtubeUrl, courseTitle"
}

// Invalid URL (400)
{
  error: "Invalid YouTube URL: Could not extract video ID from URL"
}

// Already exists (400)
{
  error: "This pod already has a course. Each pod can only have one course."
}

// Server Error (500)
{
  error: "Chapter stub generation failed: OpenRouter API timeout",
  details: "... full error for dev mode ..."
}
```

### Chapter-Level Error Handling

```typescript
// If a single chapter fails during generation:
chapters[2] = {
  ...chapters[2],
  contentGenerated: false,
  error: "Failed to generate chapter content: API timeout"
  // But chapters[3] continues generating
}

// Update sent to database:
{
  status: "generating", // Still generating other chapters
  chapters: "...", // Includes error for chapter 2
  progress: 50 // Still counting what succeeded
}
```

---

## AI Chat Error Handling

### Automatic Retry Logic

```javascript
handleSendMessage(retryCount = 0) {
  try {
    const response = await fetch("/api/ai/chat", { ... })
    
    if (response.status >= 500 && retryCount < 2) {
      // Server error - retry
      await delay(1000 * (retryCount + 1)) // Exponential backoff
      return handleSendMessage(retryCount + 1)
    }
    
    if (!response.ok) {
      // Client error - don't retry
      throw new Error(data.error)
    }
    
  } catch (error) {
    // Remove user message, show error, add error message to chat
    setMessages(prev => prev.slice(0, -1))
    
    const errorMsg = mapErrorMessage(error)
    // Show toast with errorMsg
  }
}
```

### Error Message Mapping

```javascript
function mapErrorMessage(error) {
  if (error.includes("timeout")) 
    return "Taking too long, try a shorter message"
  
  if (error.includes("429"))
    return "Too many requests, wait a moment"
  
  if (error.includes("401"))
    return "AI service configuration issue, contact support"
  
  if (error.includes("rate"))
    return "Service busy, try again soon"
  
  return "Couldn't get response, please try again"
}
```

---

## Performance Tuning

### Message History Limiting
```javascript
// Keep only last 15 messages to reduce context size
const recentMessages = messages.slice(-15)

// Truncate individual messages to 2000 chars
const truncated = msg.content.substring(0, 2000)
```

### Timeout Configuration
```typescript
// Phase 1: Video ID extraction
const VIDEO_ID_TIMEOUT = 5000 // 5 seconds

// Phase 1: Chapter stub generation
const STUB_GENERATION_TIMEOUT = 15000 // 15 seconds

// Phase 2: Per-chapter content generation
const CHAPTER_GENERATION_TIMEOUT = 20000 // 20 seconds

// AI Chat: Single request
const AI_REQUEST_TIMEOUT = 45000 // 45 seconds
```

### Polling Configuration
```javascript
// Poll every 5 seconds
const POLL_INTERVAL = 5000

// Stop after 5 minutes (60 attempts)
const MAX_POLL_ATTEMPTS = 60
```

---

## Testing the Implementation

### Test 1: Fast Stub Generation
```bash
curl -X POST http://localhost:3000/api/pods/generate-course-streaming \
  -H "Content-Type: application/json" \
  -d '{
    "podId": "test-pod-123",
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "courseTitle": "Test Course"
  }'

# Should return within 5 seconds with status: "structuring"
```

### Test 2: Polling for Progress
```javascript
// Immediately after generation, poll every second
for (let i = 0; i < 20; i++) {
  const res = await fetch('/api/pods/get-course?podId=test-pod-123')
  const data = await res.json()
  console.log(`${i}: progress=${data.course.progress}%, status=${data.course.status}`)
  
  // Should see progress: 0→25→50→75→100
  // status: structuring→generating→completed
  
  await new Promise(r => setTimeout(r, 1000))
}
```

### Test 3: Chapter Locking
```javascript
const res = await fetch('/api/pods/get-course?podId=test-pod-123')
const { course } = await res.json()

console.log(course.chapters.map((ch, i) => ({
  chapter: i + 1,
  locked: ch.locked,
  generated: ch.contentGenerated
})))

// Should show:
// { chapter: 1, locked: false, generated: true/false }
// { chapter: 2, locked: true, generated: false }
// { chapter: 3, locked: true, generated: false }
// ... etc
```

### Test 4: Error Recovery
```javascript
// With invalid URL
fetch('/api/pods/generate-course-streaming', {
  body: JSON.stringify({
    podId: "test",
    youtubeUrl: "not-a-url",
    courseTitle: "Test"
  })
})
// Should get 400 error immediately

// With timeout
fetch('/api/ai/chat', {
  body: JSON.stringify({
    messages: [{ role: "user", content: "test" }]
  })
})
// If > 45s: should see timeout error
// Retry logic should retry automatically
```

---

## Monitoring & Debugging

### Database Queries
```javascript
// Check course status
const course = await databases.getDocument(
  DATABASE_ID,
  'pod_courses',
  courseId
)
console.log({
  status: course.status,
  progress: course.progress,
  completedChapters: course.completedChapters
})

// List all courses being generated
const generating = await databases.listDocuments(
  DATABASE_ID,
  'pod_courses',
  [Query.equal('status', 'generating')]
)
```

### Browser Console Logs
```javascript
// When development, should see:
// [generateCourseStreaming] Validating input...
// [generateChapterContent] Generating chapter 1...
// [generateChapterContent] Failed to generate chapter 2: timeout
// [generateChapterContent] Chapter 3 unlocked
// [pollCourseProgress] Update: progress=75%, chapters ready=3/4
```

### Error Tracking
```javascript
// AI chat errors are logged with timestamp
console.error(`/api/ai/chat error (${elapsed}ms): ${error.message}`)

// Background job errors don't fail the request but are logged
console.error(`[generateChapterContentAsync] Failed to generate chapter 1: ${error.message}`)
```

---

## Common Issues & Solutions

### Issue: Course stays in "generating" state forever
**Cause**: Background job crashed and error wasn't saved
**Fix**: Check server logs, restart background job, manually update status to "error"

### Issue: Chapter content not appearing after 5 minutes
**Cause**: 
1. Generation is slow (check API rate limits)
2. Polling stopped too early
3. Content generation failed
**Fix**: 
1. Check database for error message
2. Increase MAX_POLL_ATTEMPTS
3. Check AI API logs

### Issue: AI chat keeps timing out
**Cause**: 
1. API is rate limited
2. User messages too long
3. Message history too large
**Fix**:
1. Implement rate limiting on frontend
2. Truncate messages to 2000 chars
3. Limit history to 10 messages

### Issue: First chapter is locked
**Cause**: Data corruption or bug
**Fix**: 
```javascript
// Manually fix:
chapters[0].locked = false
await databases.updateDocument(..., { chapters: JSON.stringify(chapters) })
```

---

## Best Practices

1. **Always validate input** before sending to API
2. **Use timeouts** for all external API calls
3. **Limit message history** to prevent memory leaks
4. **Implement retry logic** for transient failures
5. **Provide specific error messages** to users
6. **Log detailed errors** for debugging
7. **Test with real YouTube videos** before deploying
8. **Monitor API rate limits** and adjust timeouts accordingly
9. **Use polling** instead of WebSockets for simplicity
10. **Store progress** frequently to avoid data loss
