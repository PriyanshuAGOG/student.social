# Complete Authentication Setup & Testing Guide

## What Has Been Fixed

✅ **Auth Context Provider** - Global authentication state management
✅ **Protected Routes** - `/app/*` routes now require authentication
✅ **Real Appwrite Integration** - Login and Register now use actual Appwrite authentication
✅ **Logout Functionality** - Users can properly logout via sidebar
✅ **User Display** - Current user info shown in sidebar with real data
✅ **Auto-redirect** - Unauthenticated users redirected to `/login`

## Authentication Flow

### 1. Registration Process
1. User fills registration form at `/register`
2. Clicks "Sign Up"
3. Real Appwrite `account.create()` is called
4. User profile is created in database
5. User redirected to `/onboarding`

### 2. Login Process
1. User enters email & password at `/login`
2. Clicks "Sign In"
3. Real Appwrite `account.createEmailSession()` is called
4. Auth context updates with user data
5. User redirected to `/app/feed`
6. If unauthenticated, accessing `/app/*` redirects to `/login`

### 3. Logout Process
1. User clicks "Log out" in sidebar dropdown
2. Real Appwrite `account.deleteSession()` is called
3. Auth context clears user data
4. User redirected to `/login`
5. Next `/app` access shows loading spinner then redirects to login

## Testing Instructions

### Prerequisites
- Appwrite collections created (run: `pnpm run setup-appwrite`)
- Environment variables set in `.env.local`
- Dependencies installed (`pnpm install`)

### Test Case 1: Registration
```bash
1. pnpm dev
2. Navigate to http://localhost:3000/register
3. Fill form with:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123! (must meet strength requirements)
4. Verify: Redirects to /onboarding
5. Check Appwrite: User document created in "profiles" collection
```

### Test Case 2: Invalid Login (Wrong Password)
```bash
1. Navigate to http://localhost:3000/login
2. Enter:
   - Email: test@example.com
   - Password: WrongPassword
3. Verify: Error toast shows authentication failed
4. Verify: User NOT logged in (cannot access /app/feed)
```

### Test Case 3: Valid Login
```bash
1. Navigate to http://localhost:3000/login
2. Enter:
   - Email: test@example.com
   - Password: TestPass123!
3. Verify: Success toast shows
4. Verify: Redirected to /app/feed
5. Verify: Sidebar shows "Test User" and "test@example.com"
```

### Test Case 4: Protected Routes
```bash
1. Logout first (click Log out in sidebar)
2. Navigate directly to http://localhost:3000/app/dashboard
3. Verify: Loading spinner appears
4. Verify: Redirected to /login
```

### Test Case 5: Logout
```bash
1. While logged in at /app/feed
2. Click sidebar user dropdown menu
3. Click "Log out"
4. Verify: Toast confirms logout
5. Verify: Redirected to /login
6. Verify: Trying to access /app/* redirects to login
```

### Test Case 6: Session Persistence
```bash
1. Login to /app/feed
2. Refresh page (F5)
3. Verify: Still logged in (no redirect)
4. Verify: Sidebar shows user info
5. Check browser DevTools > Application > Cookies:
   - Should see Appwrite session cookie
```

## Files Modified

### New Files Created
- `lib/auth-context.tsx` - Auth provider and useAuth hook
- `lib/protect-route.tsx` - Route protection component

### Files Updated
- `app/layout.tsx` - Added AuthProvider wrapper
- `app/app/layout.tsx` - Added ProtectRoute wrapper
- `app/login/page.tsx` - Real Appwrite integration
- `app/register/page.tsx` - Real Appwrite integration
- `components/app-sidebar.tsx` - Real logout + user data

### Unchanged (Already Good)
- `lib/appwrite.ts` - Auth service methods already implemented

## Architecture Overview

```
App Layout (Root)
├── AuthProvider (checks session on mount)
│   └── ThemeProvider
│       └── Pages
│           └── /login, /register (public)
│           └── /app/* (protected)
│               └── ProtectRoute (redirects if not authenticated)
│                   └── AppSidebar (uses useAuth hook)
```

## Troubleshooting

### Issue: Still allowing login without credentials
**Solution:** Appwrite collections not created. Run: `pnpm run setup-appwrite`

### Issue: Login succeeds but redirect doesn't happen
**Solution:** Check browser console for errors. Verify Appwrite endpoint in `.env.local`

### Issue: Appwrite API errors
**Solution:** 
1. Verify `APPWRITE_API_KEY` in `.env.local` is correct
2. Check Appwrite project ID matches `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
3. Ensure all collections exist in Appwrite

### Issue: User data not showing in sidebar
**Solution:** Profile document might not exist. Ensure registration creates profile document.

## Next Steps

1. ✅ Start dev server: `pnpm dev`
2. ✅ Test registration flow (create new account)
3. ✅ Test login/logout
4. ✅ Verify protected routes
5. 📋 Add forgot password functionality
6. 📋 Add email verification
7. 📋 Add OAuth (Google/GitHub)
8. 📋 Add two-factor authentication

## Environment Variables Needed

All should be in `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=694ed12f003c942317f4
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
APPWRITE_API_KEY=your-api-key-here
```

## Support

If authentication issues persist:
1. Check Appwrite console for error details
2. Verify all collections created via `setup-appwrite` script
3. Check browser DevTools Network tab for failed requests
4. Check browser console for JavaScript errors
