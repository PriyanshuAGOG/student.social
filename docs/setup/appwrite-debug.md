# 🔧 APPWRITE DEBUGGING AND VERIFICATION GUIDE

## Quick Test: Run Backend Test Suite

```bash
# Run the test suite to diagnose issues
node scripts/test-backend.js
```

This will check:
- ✓ Database connection
- ✓ All 8 collections exist
- ✓ All 4 storage buckets exist
- ✓ Collection permissions are set correctly
- ✓ Storage bucket permissions are set correctly
- ✓ Environment variables are configured

## Understanding Error Messages

### Error 1: "The current user is not authorized to perform the requested action"

**What it means:**
The user is authenticated but doesn't have permission to access/modify a collection or bucket.

**Root causes:**
1. Collection/bucket permissions not set for "user" role
2. Document permissions not set correctly when created
3. API key doesn't have required scopes

**How to fix:**

**For Collections:**
```
1. Go to Appwrite Console
2. Select your project
3. Database → peerspark-main-db → [Collection]
4. Click "Settings"
5. Scroll to "Permissions"
6. Add these permissions:
   - read("any")
   - read("user")
   - create("user")
   - update("user")
   - delete("user")
7. Click "Save"
8. Repeat for all 8 collections
```

**For Storage Buckets:**
```
1. Go to Appwrite Console
2. Select your project
3. Storage → [Bucket Name]
4. Click "Settings"
5. Scroll to "Permissions"
6. Add these permissions:
   - read("any")
   - read("user")
   - create("user")
   - update("user")
   - delete("user")
7. Click "Save"
8. Repeat for all 4 buckets
```

**For API Key Scopes:**
```
1. Go to Appwrite Console
2. Settings → API Keys
3. Click on your key or create new one
4. Enable ALL scopes:
   ✓ account.*
   ✓ avatars.*
   ✓ databases.*
   ✓ files.*
   ✓ messages.*
   ✓ storage.*
   ✓ teams.*
   ✓ users.*
5. Save and copy the key
6. Update APPWRITE_API_KEY in .env.local
```

### Error 2: "TypeError: account.createEmailSession is not a function"

**What it means:**
The Appwrite Account service is not properly initialized or the appwrite package version is incompatible.

**Root causes:**
1. Appwrite SDK version mismatch
2. Account class not properly imported
3. Client not properly initialized
4. Node.js/browser incompatibility

**How to fix:**

```bash
# Update Appwrite SDK
pnpm add appwrite@latest

# Clear cache
rm -rf node_modules/.pnpm
pnpm install

# Restart dev server
pnpm dev
```

### Error 3: "Invalid project ID"

**What it means:**
The NEXT_PUBLIC_APPWRITE_PROJECT_ID is wrong or not set.

**How to fix:**

```bash
# Check your .env.local
cat .env.local | grep PROJECT_ID

# Should be: 68921a0d00146e65d29b
# If different, update it

# Verify in Appwrite Console
# Settings → General → Project ID
```

### Error 4: "Cannot read properties of undefined (reading 'email')"

**What it means:**
The current user is null/undefined. User is not authenticated.

**How to fix:**

```bash
# This is expected on login page
# Once logged in, it should work

# If happening after login:
1. Check browser localStorage
2. Check if session cookie is set
3. Check Appwrite session in console
```

## Step-by-Step Verification

### 1. Verify Appwrite Account Service

Create a test file: `scripts/verify-account.js`

```javascript
const { account } = require('../lib/appwrite.ts');

async function test() {
  try {
    console.log('Account methods:', Object.getOwnPropertyNames(Account.prototype));
    console.log('Has createEmailSession:', typeof account.createEmailSession);
    console.log('Account instance:', account);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
```

Run: `node scripts/verify-account.js`

### 2. Verify Database Connection

Create a test file: `scripts/verify-database.js`

```javascript
const { databases, DATABASE_ID, COLLECTIONS } = require('../lib/appwrite.ts');

async function test() {
  try {
    // Test database exists
    const db = await databases.get(DATABASE_ID);
    console.log('✓ Database found:', db.name);

    // Test collection exists
    const col = await databases.getCollection(DATABASE_ID, COLLECTIONS.PROFILES);
    console.log('✓ Collection found:', col.name);

    // Test read permissions
    const attrs = col.attributes;
    console.log('✓ Attributes:', attrs.map(a => a.key));
  } catch (e) {
    console.error('✗ Error:', e.message);
  }
}

test();
```

### 3. Test Manual Authentication

In browser DevTools console (`F12`):

```javascript
// Import Appwrite
import { account } from '/lib/appwrite.ts';

// Test 1: Get current user
const user = await account.get();
console.log('Current user:', user);

// Test 2: Try to create a session (with valid credentials)
try {
  const session = await account.createEmailSession('test@example.com', 'password123');
  console.log('Session created:', session);
} catch (e) {
  console.error('Session error:', e.message);
}

// Test 3: Get session
const sessions = await account.listSessions();
console.log('Active sessions:', sessions);
```

## Database Permission Checklist

Create this checklist in Appwrite Console:

### Collections - Each must have these permissions:
- [ ] profiles - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] posts - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] messages - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] pods - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] resources - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] notifications - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] calendar_events - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] chat_rooms - read("any"), read("user"), create("user"), update("user"), delete("user")

### Storage Buckets - Each must have these permissions:
- [ ] avatars - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] resources - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] attachments - read("any"), read("user"), create("user"), update("user"), delete("user")
- [ ] post_images - read("any"), read("user"), create("user"), update("user"), delete("user")

## Testing Workflow

### After Fixing Permissions:

```bash
# 1. Test backend connectivity
node scripts/test-backend.js

# 2. Restart dev server
pnpm dev

# 3. Open browser
http://localhost:3000

# 4. Test registration
- Email: test@example.com
- Password: TestPassword123!
- Should redirect to /app/feed

# 5. Test create post
- Should create post successfully

# 6. Test logout
- Should clear session

# 7. Test login
- Should login with same credentials
```

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Unauthorized" on all operations | Set collection permissions to include `create("user")`, `update("user")`, `delete("user")` |
| "createEmailSession is not a function" | Run `pnpm add appwrite@latest` then restart |
| Cannot upload files | Check bucket permissions include `create("user")` |
| Cannot see own posts | Check post collection permissions and document-level permissions |
| Password reset not working | Enable email service in Appwrite settings |
| Session not persisting | Check browser cookies, may need HTTPS in production |

## Environment Variable Verification

```bash
# Check all required variables exist
if [ -f ".env.local" ]; then
  echo "✓ .env.local exists"
  grep -E "^(NEXT_PUBLIC_APPWRITE|APPWRITE_API_KEY)" .env.local
else
  echo "✗ .env.local missing"
fi
```

## Browser DevTools Debugging

When testing in browser:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Look for failed requests** to `fra.cloud.appwrite.io`
4. **Check error response** - copy full error message
5. **Search in docs** for error code

Common status codes:
- `401` - Authentication failed (API key invalid)
- `403` - Permission denied (check collection/bucket permissions)
- `404` - Resource not found (check collection/bucket/document IDs)
- `409` - Conflict (document already exists)

## How to Get Help

If you're still stuck after following this guide:

1. **Check Appwrite Status** - https://status.appwrite.io
2. **Review Error Message** - Copy the exact error text
3. **Check Documentation** - https://appwrite.io/docs
4. **Community Discord** - https://appwrite.io/community

### When reporting issues, include:

```
- Error message (full text)
- What action caused the error (e.g., "click register button")
- Browser console errors (F12 → Console tab)
- Appwrite collection/bucket permissions (screenshot)
- Environment variables (names only, not values)
- Appwrite SDK version (pnpm list appwrite)
```

## Success Indicators

Once everything is working, you should see:

✅ User can register
✅ User can login
✅ User is redirected to /app/feed
✅ User data shows in sidebar
✅ User can create posts
✅ User can create pods
✅ User can send messages
✅ User can upload files
✅ User can logout
✅ Session persists on page reload
✅ User is redirected to /login if not authenticated

---

**Need the test file to pass?** Run `node scripts/test-backend.js` first to identify which step you need to complete.
