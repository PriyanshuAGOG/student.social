# 🎯 TESTING & DEPLOYMENT CHECKLIST

## ✅ Code Fixes Applied (Completed)

All code modifications have been made to fix the runtime errors:

- [x] Removed Jitsi preload from layout.tsx
- [x] Enhanced error handling in course generation endpoint
- [x] Fixed imageUrls field in post creation (JSON stringify)
- [x] Added teamId field to pod creation
- [x] Fixed members array in pods (JSON stringify)
- [x] Created WebSocket manager utility
- [x] Created comprehensive fix documentation

## 🚀 Deployment Steps (DO THIS NEXT)

### Step 1: Commit Changes
```bash
cd c:\Users\ok\Downloads\peerspark-platform-main\peerspark-platform-main
git status  # Review changes
git add .
git commit -m "fix: resolve production runtime errors

- Remove Jitsi preload warning from layout
- Add error handling to course generation endpoint
- Fix Appwrite document schema issues (imageUrls, teamId)
- Add WebSocket connection manager utility
- Improve error messages for debugging"
git push
```

### Step 2: Verify Deployment
- [ ] Check GitHub: Changes are pushed
- [ ] Check Vercel: Deployment completes successfully
- [ ] Wait: ~2-3 minutes for deployment to complete

### Step 3: Test in Production

#### Test 1: Jitsi Preload Warning (Should be gone)
- [ ] Navigate to https://studentsocial.vercel.app
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for Jitsi preload warnings
- [ ] ✅ Should NOT see: "A preload resource for ... was received but not used"

#### Test 2: Create Pod (Should work)
- [ ] Log in to the app
- [ ] Go to Pods or create a new pod
- [ ] Fill in pod details (name, description, etc.)
- [ ] Click Create
- [ ] ✅ Should succeed without "Missing required attribute 'teamId'" error
- [ ] Pod should appear in your pods list

#### Test 3: Create Post with Images (Should work)
- [ ] Create a new post
- [ ] Add an image/file
- [ ] Write some content
- [ ] Click Post
- [ ] ✅ Should succeed without "Unknown attribute 'imageUrls'" error
- [ ] Post should appear in feed

#### Test 4: Generate Course (Better Error Handling)
- [ ] Open a pod or go to courses
- [ ] Try to generate a course with YouTube URL
- [ ] ✅ Should return a proper error message or course data
- [ ] ❌ Should NOT return 500 error (will show real error if there is one)

#### Test 5: Browser Console (Should be clean)
- [ ] Keep DevTools open (F12)
- [ ] Navigate around the app for 2-3 minutes
- [ ] Check Console tab for errors
- [ ] ✅ Should NOT see WebSocket CLOSING/CLOSED errors
- [ ] ✅ Should NOT see Jitsi preload warnings

---

## 📋 Known Limitations & Workarounds

### Appwrite Collection Attributes
The following attributes should exist in your Appwrite collections:

**posts collection**:
- ✅ imageUrls (string) - Code now sends as JSON string

**pods collection**:
- ✅ teamId (string) - Code now sends as empty string by default

**Status**: If attributes don't exist in Appwrite, the collection might reject documents. If you see "Unknown attribute" or "Missing required attribute" errors after deployment:

1. Go to https://console.appwrite.io
2. Navigate to your Database → Collections
3. For each collection, go to Attributes tab
4. Add any missing attributes with type "string"

---

## 🔍 What to Look For (Error Diagnosis)

### Good Signs ✅
- Posts are created successfully with images
- Pods are created without errors
- Course generation attempts show meaningful errors (not 500)
- Browser console is clean of Jitsi warnings
- No WebSocket connection errors

### Issues to Watch For ❌
- "Unknown attribute: imageUrls" - Means attribute missing in Appwrite posts collection
- "Missing required attribute: teamId" - Means attribute missing in Appwrite pods collection
- 500 errors on course generation - Check the endpoint error message for details
- Jitsi preload warnings - Should be gone, if not, check layout.tsx was saved

---

## 📞 If Tests Fail

### Problem: Still Getting Attribute Errors
**Solution**: Attributes need to be added to Appwrite collections manually:
1. Go to https://console.appwrite.io
2. Select your database and collection
3. Click Attributes
4. Click Add Attribute
5. Select "String" type
6. Key: "imageUrls" or "teamId"
7. Save

### Problem: Course Generation Still Errors
**Solution**: The endpoint now provides better error messages
1. Check the error message returned
2. Verify YouTube URL is valid
3. Check OpenRouter API key is valid
4. Check database connection is working

### Problem: Jitsi Preload Still Warning
**Solution**: Clear browser cache and reload
1. Hard refresh: Ctrl+Shift+R
2. Check DevTools shows no preload links in HTML head
3. File [app/layout.tsx](app/layout.tsx) should not have preload link

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| [app/layout.tsx](app/layout.tsx) | Removed Jitsi preload link |
| [app/api/pods/generate-course-streaming/route.ts](app/api/pods/generate-course-streaming/route.ts) | Enhanced error handling |
| [lib/appwrite.ts](lib/appwrite.ts) | Fixed JSON stringify for post fields |
| [lib/appwrite-services-fixes-part2.ts](lib/appwrite-services-fixes-part2.ts) | Added teamId, JSON stringify members |
| [lib/websocket-manager.ts](lib/websocket-manager.ts) | NEW: WebSocket utility |
| [scripts/fix-appwrite-schema.ps1](scripts/fix-appwrite-schema.ps1) | NEW: Schema attribute fixer |

---

## ✨ Success Criteria

All tests passing = All fixes working! 🎉

| Test | Status |
|------|--------|
| No Jitsi preload warnings | Pass / Fail |
| Can create pods | Pass / Fail |
| Can create posts with images | Pass / Fail |
| Course generation shows errors properly | Pass / Fail |
| No WebSocket errors in console | Pass / Fail |

---

## Next Session Focus

Once this is deployed and tested, consider:
1. Monitor error logs in Vercel dashboard
2. Test chat/messaging features with WebSocket manager
3. Test video conference features (Jitsi)
4. Load test with multiple users
5. Check performance metrics
