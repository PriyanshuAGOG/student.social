# Course Testing Locations in PeerSpark Platform

## Overview
The course system is now fully integrated into the platform. Here's where you can test each feature:

---

## 1. **📚 Browse & Explore Courses**

**Location**: `/courses`

**What to do**:
- Browse all available courses
- Filter by difficulty, price, rating
- Search by course name
- See course details (chapters, duration, instructor)

**Test this with**:
```bash
curl http://localhost:3000/courses
```

---

## 2. **🎓 Enroll & Learn Individual Course**

**Location**: `/courses/[courseId]`

**What to do**:
1. Click "Enroll Now" on any course from `/courses`
2. Access the course player
3. Watch chapters, take notes
4. Submit assignments
5. Track your progress

**Test this with**:
```bash
# After enrolling, visit:
http://localhost:3000/courses/YOUR_COURSE_ID
```

---

## 3. **👥 Assign Course to Pod** (Instructor/Mentor)

**Location**: Instructor API endpoint

**What to do**:
```bash
curl -X POST http://localhost:3000/api/pods/assign-course \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "podId": "pod-456",
    "cohortName": "Learning Squad",
    "cohortPace": "Weekly"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "podCourseId": "pod-course-789",
  "message": "Course assigned to pod with X members auto-enrolled"
}
```

---

## 4. **🎯 Pod Courses Tab** (NEW - Members only)

**Location**: `/pods/[podId]` → **Courses Tab**

**What you'll see**:
- ✅ All courses assigned to your pod
- ✅ Group progress percentage
- ✅ Which members completed chapters
- ✅ Chapter completion status
- ✅ Quick links to course player

**Features**:
- **Overview Tab**: See all courses with progress bars
- **Progress Tab**: Detailed chapter-by-chapter breakdown
- **Access Course Button**: Jump to course player
- **Dashboard Button**: View full pod analytics

**The UI includes**:
```
┌─────────────────────────────────────┐
│ Course Name                    45%  │
│ By Instructor • Started Jan 15      │
├─────────────────────────────────────┤
│ Group Progress: 9/20 completed      │
│ [████░░░░░░░░░░░░░░░░░░░░░░░░░░]   │
│                                     │
│ Chapters:                           │
│ ✓ Chapter 1 Intro      20/20 ✓      │
│ ○ Chapter 2 Basics     15/20        │
│ ○ Chapter 3 Advanced    8/20        │
│                                     │
│ [Access Course]  [Dashboard]        │
└─────────────────────────────────────┘
```

---

## 5. **📊 Pod Course Dashboard** (Analytics)

**Location**: `/pods/course-dashboard?podCourseId=COURSE_ID`

**What to do**:
1. From the Courses tab, click "Dashboard"
2. OR navigate directly with podCourseId

**You'll see**:
- 📈 Group completion metrics
- 👥 Member progress breakdown
- 🚀 Accelerators (fastest members)
- ⚠️ Members needing support
- 💬 Discussion board
- 🎥 Study sessions

---

## 6. **👨‍🏫 Instructor Dashboard**

**Location**: `/instructor/dashboard`

**Features**:
- View all your courses
- Monitor student progress
- Grade assignments
- See trending courses
- Analytics & revenue

**Test API**:
```bash
curl http://localhost:3000/api/instructor/dashboard?instructorId=instructor-123
```

---

## 📋 Complete Testing Workflow

### For Students/Pod Members:

1. **Start here**: `/app/explore` → Find a pod
2. **Join a pod** → Member is auto-added to assigned courses
3. **Go to pod**: `/pods/[podId]`
4. **Click "Courses" tab** → See all pod courses (NEW!)
5. **Click "Access Course"** → Take course with pod
6. **Click "Dashboard"** → See pod progress metrics

### For Instructors:

1. **Create course**: Process a YouTube video via API
2. **Assign to pod**: Use `/api/pods/assign-course` endpoint
3. **Monitor class**: Visit `/instructor/dashboard`
4. **Grade work**: Review `/api/instructor/grading-queue`
5. **Check analytics**: View course performance metrics

---

## 🔧 API Endpoints

### Course Management
```
GET   /api/courses/list              - All courses
GET   /api/courses/[courseId]        - Single course details
POST  /api/courses/process-video     - Create course from YouTube
POST  /api/courses/generate-content  - Generate notes & assignments
```

### Pod Courses (NEW)
```
GET   /api/pods/pod-courses?podId=X  - All courses in pod
POST  /api/pods/assign-course        - Assign course to pod
GET   /api/pods/course-progress?podCourseId=X
POST  /api/pods/course-chat          - Pod discussion
POST  /api/pods/study-sessions       - Schedule group sessions
```

### Student Progress
```
GET   /api/courses/user-progress?userId=X&courseId=Y
POST  /api/assignments/submit        - Submit assignment
GET   /api/assignments/submit?submissionId=X - Check grade
```

### Instructor
```
GET   /api/instructor/dashboard?instructorId=X
GET   /api/instructor/grading-queue?instructorId=X
POST  /api/instructor/grading-queue  - Submit grade
```

---

## 💡 Quick Start Testing

### 1. Create a Course
```bash
curl -X POST http://localhost:3000/api/courses/process-video \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeLink": "https://www.youtube.com/watch?v=VIDEO_ID",
    "courseTitle": "My Test Course",
    "instructorId": "instructor-123"
  }'
```

### 2. Create/Join a Pod
Visit: `http://localhost:3000/app/explore` → Create a pod

### 3. Assign Course to Pod
```bash
curl -X POST http://localhost:3000/api/pods/assign-course \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "COURSE_ID_FROM_STEP_1",
    "podId": "POD_ID_FROM_STEP_2",
    "cohortName": "My Learning Squad",
    "cohortPace": "Weekly"
  }'
```

### 4. View in Pod
1. Go to `http://localhost:3000/pods/[POD_ID]`
2. Click **"Courses"** tab
3. Click **"Access Course"** to start learning
4. Click **"Dashboard"** to see group analytics

---

## ✅ Features Implemented

### Backend
- ✅ Course database collections (10 types)
- ✅ Pod course assignment endpoint
- ✅ Progress tracking API
- ✅ Pod course dashboard API
- ✅ Discussion boards for pods
- ✅ Study session scheduling
- ✅ Instructor grading queue

### Frontend
- ✅ Course listing page (`/courses`)
- ✅ Course player (`/courses/[id]`)
- ✅ Instructor dashboard (`/instructor/dashboard`)
- ✅ Pod course dashboard (`/pods/course-dashboard`)
- ✅ **NEW: Courses Tab in Pods** (`/pods/[id]` → Courses)
- ✅ Assignment submission & grading
- ✅ Progress tracking components

---

## 🚀 Next Steps

1. **Test the Courses Tab**
   - Create a pod
   - Assign a course to it
   - Visit `/pods/[podId]` and check the new "Courses" tab

2. **Try Group Learning**
   - Multiple members in pod
   - Assign same course
   - See real-time progress synchronization

3. **Use Instructor Features**
   - Create course from YouTube
   - Assign to multiple pods
   - Grade assignments
   - Track student performance

4. **Deploy to Production**
   - All APIs ready for Vercel
   - Database collections auto-create on first use
   - Fully scalable architecture

---

## 📞 Support

For issues or questions about:
- **Course API**: See `COURSE_TESTING_GUIDE.md`
- **Pod Features**: See `COURSE_SYSTEM_IMPLEMENTATION.md`
- **Deployment**: See `QUICK_START_DEPLOYMENT.md`
