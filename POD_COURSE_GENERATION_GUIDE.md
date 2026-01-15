# Pod Course Generation Feature - Testing Guide

## Overview

Students can now collaboratively generate a comprehensive course from a YouTube video within their pod. Each pod can have only ONE course. When a course is generated, it includes:

- **Chapters**: Video transcript broken into chapters with learning objectives
- **Assignments**: Multiple difficulty levels (easy, medium, hard)
- **Daily Tasks**: Structured learning schedule with resources
- **Notes**: Detailed study materials and concepts

---

## Access the Feature

### Step 1: Enter a Pod

1. Go to **Pods** → Select or join a pod
2. Click **"Courses"** tab (now visible in pod navigation)

### Step 2: Generate a Course

**Requirements:**
- YouTube video with available captions/transcript
- Course title
- All pod members will have access

**Steps:**
1. Enter a **Course Title** (e.g., "Web Development Fundamentals")
2. Paste **YouTube URL** (full URL: `https://www.youtube.com/watch?v=VIDEO_ID`)
3. Click **"Generate Course"**
4. Wait 2-5 minutes for generation to complete

**Example YouTube Links to Test:**
- https://www.youtube.com/watch?v=pQiT2Kj9pVU (JavaScript Tutorial)
- https://www.youtube.com/watch?v=3EUAcxhuoU4 (Python Course)
- https://www.youtube.com/watch?v=CwaiEwNvC2E (Data Science)

---

## Course Content Tabs

Once generated, your course displays:

### 1. **Overview Tab**
- Total chapters, assignments, daily tasks, notes
- Generation status and progress
- Real-time updates while generating

### 2. **Chapters Tab**
- Chapter titles and descriptions
- Learning objectives for each chapter
- Video duration per chapter
- Expandable to view full content

### 3. **Assignments Tab**
- Difficulty levels: Easy 🟢 | Medium 🟡 | Hard 🔴
- Assignment descriptions
- Submission count and average scores
- Click to submit or view submissions

### 4. **Schedule Tab (Daily Tasks)**
- Day-by-day learning plan
- Estimated time per task
- Associated resources
- Recommended completion order

---

## API Endpoints

### Generate Course
```bash
POST /api/pods/generate-course
Content-Type: application/json

{
  "podId": "pod-123",
  "youtubeUrl": "https://www.youtube.com/watch?v=ABC123",
  "courseTitle": "My Course Title"
}

Response:
{
  "course": {
    "$id": "course-doc-id",
    "podId": "pod-123",
    "courseTitle": "My Course Title",
    "youtubeUrl": "...",
    "status": "generating",
    "progress": 0,
    "chapters": [],
    "assignments": [],
    "dailyTasks": [],
    "notes": [],
    "createdAt": "2026-01-15T...",
    "createdBy": "user-id"
  }
}
```

### Get Pod Course
```bash
GET /api/pods/get-course?podId=pod-123

Response:
{
  "course": {
    "$id": "...",
    "podId": "pod-123",
    "courseTitle": "...",
    "status": "completed",
    "progress": 100,
    "chapters": [...],
    "assignments": [...],
    "dailyTasks": [...]
  }
}
```

---

## Feature Restrictions

✅ **Allowed:**
- One course per pod (enforced at API level)
- All members see the same course
- Members can view all course materials
- Assignments can be submitted by members

❌ **Not Allowed:**
- Multiple courses per pod (returns error)
- Creating course if one already exists
- Deleting or replacing existing course

---

## UI Components

### CoursesTab Component
**Location:** `components/pods/tabs/CoursesTab.tsx`

**States:**
1. **Loading State** → Shows spinner while fetching existing course
2. **No Course State** → Form to create new course
3. **Generating State** → Progress bar, live updates
4. **Completed State** → Tabs with course content
5. **Error State** → Error badge with message

**Key Features:**
- Auto-refreshes course status
- Inline form validation
- Progress tracking during generation
- Toast notifications for success/error

---

## Testing Checklist

- [ ] Enter a pod and see "Courses" tab
- [ ] Click "Courses" and see course creation form
- [ ] Enter course title and YouTube URL
- [ ] Click "Generate Course" button
- [ ] See loading state with spinner
- [ ] See generation progress update (0% → 100%)
- [ ] After completion, see course content in Overview tab
- [ ] View chapters with learning objectives
- [ ] View assignments with difficulty levels
- [ ] View daily schedule with time estimates
- [ ] Try to create second course (should be blocked)
- [ ] Check error message for duplicate course
- [ ] Test with invalid YouTube URL
- [ ] Test with video that has no captions

---

## Database Structure

### POD_COURSES Collection

```typescript
{
  // Document metadata
  $id: string,
  podId: string,
  courseTitle: string,
  youtubeUrl: string,
  
  // Status and Progress
  status: "generating" | "completed" | "error",
  progress: number, // 0-100
  
  // Generated Content
  chapters: Chapter[],
  assignments: Assignment[],
  dailyTasks: DailyTask[],
  notes: string[],
  
  // Metadata
  createdAt: ISO string,
  createdBy: user ID
}
```

---

## Common Issues & Solutions

### Issue: "Each pod can only have one course"
**Solution:** Pod already has a course. Check if course exists with `GET /api/pods/get-course?podId=X`

### Issue: "Failed to extract transcript"
**Solution:** 
- YouTube video must have captions/auto-generated subtitles enabled
- Try a different video
- Some videos have captions disabled by creator

### Issue: "Invalid YouTube URL"
**Solution:**
- Use full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Not: `youtube.com/watch?v=...` or shortened URLs
- Copy directly from YouTube address bar

### Issue: Generation takes too long
**Solution:**
- Longer videos (60+ min) take 3-5 minutes
- Check browser console for errors
- Try refreshing the page (progress persists in database)

### Issue: Course shows "Error" status
**Solution:**
- Check API endpoint logs
- Verify YouTube transcript extraction
- Try with different video

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Course Generation | 2-5 min | Depends on video length |
| Extract Transcript | 30-60 sec | YouTube API call |
| Generate Chapters | 60-120 sec | AI processing |
| Generate Assignments | 60-120 sec | AI processing |
| Generate Daily Tasks | 30-60 sec | Schedule creation |
| Load Course | <500ms | Database fetch |

---

## Next Steps

Once a course is generated:

1. **Submit Assignments** (coming soon)
   - Students can submit answers
   - AI auto-grading
   - Progress tracking

2. **Track Progress** (coming soon)
   - Individual completion percentage
   - Pod-wide progress dashboard
   - Achievements and badges

3. **Collaborative Learning** (coming soon)
   - Discussion threads per chapter
   - Live study sessions
   - Peer feedback

4. **Certificates** (coming soon)
   - Automatic issuance on completion
   - Shareable certificates
   - Blockchain verification

---

## Advanced: Course Generation Flow

```
User clicks "Generate Course"
↓
Validate YouTube URL & Pod ID
↓
Check if pod already has course
↓
Create course document (status: "generating")
↓
[BACKGROUND PROCESS]
├─ Extract YouTube transcript
├─ Chunk transcript (300-800 tokens)
├─ Generate chapter titles & objectives
├─ Generate assignments (easy, medium, hard)
├─ Generate daily learning schedule
├─ Generate study notes
└─ Update course document (status: "completed")
↓
User sees course content in UI
```

---

## Troubleshooting

**Check Course Status:**
```bash
# In browser console
fetch('/api/pods/get-course?podId=YOUR_POD_ID')
  .then(r => r.json())
  .then(d => console.log(d.course))
```

**Check API Logs:**
- Browser DevTools → Network tab
- Check `/api/pods/generate-course` requests
- Check `/api/pods/get-course` responses

**Database Verification:**
- Go to Appwrite Console
- Check `pod_courses` collection
- Verify document exists with correct `podId`

---

## Feedback & Support

Found an issue? Here's what to check:

1. ✅ YouTube link is valid and has captions
2. ✅ Pod exists and you're a member
3. ✅ No existing course in pod
4. ✅ Network connection is stable
5. ✅ Browser is up to date

If still having issues:
- Check browser console for errors
- Try a different YouTube video
- Clear browser cache and reload
- Contact support with course generation logs
