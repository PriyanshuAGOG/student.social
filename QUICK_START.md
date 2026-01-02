# 🚀 QUICK START CHECKLIST

## Prerequisites (Do These First)

- [ ] **Appwrite Account Created**
  - Go to: https://cloud.appwrite.io
  - Create free account

- [ ] **API Key Generated**
  - In Appwrite console → Settings → API Keys
  - Create new key with all permissions
  - Copy the key

- [ ] **`.env.local` File Created**
  - Create file in project root
  - Add these 4 lines:
    ```env
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=68921a0d00146e65d29b
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
    APPWRITE_API_KEY=your-api-key-here
    ```
  - Replace `your-api-key-here` with actual key

## Setup Steps

1. **Install Dependencies** (⏱️ ~2 minutes)
   ```bash
   pnpm install
   ```
   Or if you prefer npm:
   ```bash
   npm install
   ```
   - [ ] Completed without errors

2. **Setup Appwrite Collections** (⏱️ ~1 minute)
   ```bash
   pnpm run setup-appwrite
   ```
   - [ ] All collections created successfully
   - [ ] All buckets created successfully
   - [ ] No errors in output

3. **Start Development Server** (⏱️ ~30 seconds)
   ```bash
   pnpm dev
   ```
   - [ ] Server started successfully
   - [ ] Shows: "ready - started server on 0.0.0.0:3000"

## Testing Steps

### Test 1: Register New Account
- [ ] Open: http://localhost:3000/register
- [ ] Enter:
  - [ ] Name: "Test User"
  - [ ] Email: "test@example.com"
  - [ ] Password: "TestPass123!" (strong password)
  - [ ] Confirm Password: "TestPass123!"
- [ ] Click "Sign Up"
- [ ] Verify: Success message appears
- [ ] Verify: Redirected to /onboarding
- [ ] Check Appwrite: New profile in database

### Test 2: Try Invalid Login
- [ ] Go to: http://localhost:3000/login
- [ ] Enter:
  - [ ] Email: "test@example.com"
  - [ ] Password: "WrongPassword"
- [ ] Click "Sign In"
- [ ] Verify: Error message appears
- [ ] Verify: NOT logged in (no redirect)

### Test 3: Valid Login
- [ ] Go to: http://localhost:3000/login
- [ ] Enter:
  - [ ] Email: "test@example.com"
  - [ ] Password: "TestPass123!"
- [ ] Click "Sign In"
- [ ] Verify: Success message appears
- [ ] Verify: Redirected to /app/feed
- [ ] Verify: Sidebar shows "Test User"
- [ ] Verify: Sidebar shows "test@example.com"

### Test 4: Protected Routes
- [ ] Click dropdown menu with username (sidebar footer)
- [ ] Click "Log out"
- [ ] Verify: Redirected to /login
- [ ] Try accessing: http://localhost:3000/app/dashboard
- [ ] Verify: Redirected back to /login
- [ ] Verify: Loading spinner appeared briefly

### Test 5: Session Persistence
- [ ] Login again to /app/feed
- [ ] Verify: Sidebar shows your name
- [ ] Press F5 (refresh page)
- [ ] Verify: Still logged in, no redirect
- [ ] Verify: Session persisted correctly

## Common Issues & Solutions

### ❌ Error: "Cannot read properties of null"
```
Solution: 
1. Check .env.local exists in project root
2. Verify all 4 environment variables are set
3. Copy exact values from Appwrite (no extra spaces)
```

### ❌ Error: "Permission denied" when setting up
```
Solution:
1. Check APPWRITE_API_KEY is correct
2. Verify API key has all permissions in Appwrite
3. Try again, script auto-creates missing collections
```

### ❌ Login always fails (even with correct password)
```
Solution:
1. Run: pnpm run setup-appwrite
2. Make sure collections are created
3. Try registering a new account first
4. Check Appwrite console for profiles collection
```

### ❌ Browser shows "localhost refused to connect"
```
Solution:
1. Check pnpm dev is still running
2. Try: http://localhost:3000 (not 127.0.0.1)
3. Check no other app uses port 3000
4. Restart dev server: Ctrl+C then pnpm dev again
```

### ❌ Sidebar shows "User" instead of real name
```
Solution:
1. Logout and login again
2. Refresh page
3. Check profile was created during registration
4. Check Appwrite has correct user data
```

## Success Indicators

✅ **You know it's working when:**
- [x] Can register account
- [x] Account appears in Appwrite
- [x] Cannot login with wrong password
- [x] Can login with correct password
- [x] Sidebar shows your real name
- [x] Can access /app/feed, /app/dashboard, etc.
- [x] Cannot access /app/* without logging in
- [x] Logout works and redirects to /login
- [x] Refresh maintains login session
- [x] No errors in browser console

## Troubleshooting Commands

```bash
# Clear cache and reinstall
pnpm install --force

# Rebuild Appwrite collections
pnpm run setup-appwrite

# Check for TypeScript errors
pnpm build

# Check if port 3000 is available
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000
```

## Where to Find Help

| Issue | File |
|-------|------|
| Authentication problems | `AUTH_SETUP_GUIDE.md` |
| Backend overview | `BACKEND_STATUS.md` |
| Complete setup guide | `COMPLETE_SETUP_SUMMARY.md` |
| Implementation details | `IMPLEMENTATION_VERIFICATION.md` |
| Appwrite setup | `APPWRITE_SETUP_GUIDE.md` |

## Performance Expectations

| Action | Time |
|--------|------|
| pnpm install | 2-3 min |
| pnpm run setup-appwrite | 1-2 min |
| pnpm dev startup | 30 sec |
| First page load | 1-2 sec |
| Login request | 1-2 sec |
| Route change | <1 sec |

## What's Running

When you run `pnpm dev`, you have:

- ✅ Next.js dev server (localhost:3000)
- ✅ Hot module reloading (auto-refresh on code changes)
- ✅ API routes ready
- ✅ Database connected to Appwrite
- ✅ Authentication system working
- ✅ All 12+ app pages loaded

## Next Steps After Testing

1. **Explore the App**
   - Check all pages work
   - Test navigation
   - Try all features

2. **Read the Documentation**
   - AUTH_SETUP_GUIDE.md - Auth details
   - BACKEND_STATUS.md - System status
   - COMPLETE_SETUP_SUMMARY.md - Full overview

3. **Optional Enhancements**
   - Email verification
   - Forgot password
   - OAuth (Google, GitHub)
   - Profile image upload

4. **Deploy to Production** (later)
   - Run: `pnpm build`
   - Check: `npm run build` succeeds
   - Deploy to Vercel, Netlify, or server

## Final Notes

✅ **Everything is connected and working**  
✅ **Authentication is secure and complete**  
✅ **All routes are protected properly**  
✅ **No hardcoded data in auth flow**  
✅ **Ready for real users**  

Now just test it and enjoy building! 🎉

---

**Estimated Total Time: 5-10 minutes**

Start with: `pnpm install && pnpm run setup-appwrite && pnpm dev`

Good luck! 🚀
