# 🔴 CRITICAL APPWRITE FIX GUIDE - READ IMMEDIATELY

## Issues Identified

You're getting these errors because:

1. **"The current user is not authorized to perform the requested action"**
   - ❌ Collections are missing User role permissions
   - ❌ Storage buckets are missing User role permissions
   - ❌ Database permissions not properly configured

2. **"TypeError: account.createEmailSession is not a function"**
   - ❌ Appwrite Account class not properly imported
   - ❌ Client initialization issue
   - ❌ Possible SDK version mismatch

3. **Forgot password not working**
   - ❌ Password recovery email configuration missing
   - ❌ Password recovery not enabled in Appwrite

## STEP 1: Verify Appwrite Setup

### 1.1 Check Your API Key (CRITICAL)

Your API Key needs **ALL** scopes. Follow these steps:

1. Go to: https://cloud.appwrite.io
2. Navigate to: **Settings → API Keys**
3. Click on your API key or create a new one
4. Ensure ALL of these scopes are enabled:
   ```
   ✓ account.read
   ✓ account.write
   ✓ avatars.read
   ✓ avatars.write
   ✓ databases.read
   ✓ databases.write
   ✓ files.read
   ✓ files.write
   ✓ messages.read
   ✓ messages.write
   ✓ storage.read
   ✓ storage.write
   ✓ teams.read
   ✓ teams.write
   ✓ users.read
   ✓ users.write
   ```

5. Copy your complete API key
6. Update your `.env.local`:
   ```
   APPWRITE_API_KEY=your_complete_api_key_here
   ```

### 1.2 Verify Collections Exist

Run this command in terminal:
```bash
node scripts/setup-appwrite.js
```

This will:
- ✓ Create all 8 collections
- ✓ Create all 4 storage buckets
- ✓ Set up basic permissions

## STEP 2: Configure Collection Permissions

You must do this in the Appwrite Console for EACH collection.

### For Each Collection (profiles, posts, messages, pods, resources, notifications, calendar_events, chat_rooms):

1. Go to: https://cloud.appwrite.io
2. Select your Project: `68921a0d00146e65d29b`
3. Go to: **Databases → peerspark-main-db → [Collection Name]**
4. Click: **Settings** tab
5. Set **Collection Permissions** to:
   - `read("any")` - Everyone can read
   - `read("user")` - Logged-in users can read
   - `create("user")` - Logged-in users can create
   - `update("user")` - Logged-in users can update
   - `delete("user")` - Logged-in users can delete

6. Click **Update** to save

### For Each Document (This is AUTO-SET in code):

The app code automatically sets document permissions:
```javascript
read("user:USER_ID")    // Only that user can read
update("user:USER_ID")  // Only that user can update  
delete("user:USER_ID")  // Only that user can delete
```

## STEP 3: Configure Storage Bucket Permissions

Do this for EACH bucket (avatars, resources, attachments, post_images):

1. Go to: https://cloud.appwrite.io
2. Select your Project: `68921a0d00146e65d29b`
3. Go to: **Storage → [Bucket Name]**
4. Click: **Settings** tab
5. Set **Bucket Permissions** to:
   - `read("any")` - Everyone can read files
   - `read("user")` - Logged-in users can read
   - `create("user")` - Logged-in users can upload
   - `update("user")` - Logged-in users can update
   - `delete("user")` - Logged-in users can delete

6. Click **Update** to save

## STEP 4: Enable Email Service

For forgot password to work:

1. Go to: https://cloud.appwrite.io
2. Select your Project
3. Go to: **Settings → Email**
4. Configure your email provider (Gmail SMTP recommended)
5. Or use Appwrite's built-in email service if enabled

## STEP 5: Verify Environment Variables

Check your `.env.local` file:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68921a0d00146e65d29b
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
APPWRITE_API_KEY=your_complete_api_key_with_all_scopes

# Optional for testing
APPWRITE_LOG_DEBUG=true
```

## STEP 6: Test the Connection

Run this in terminal:
```bash
node -e "
const env = require('dotenv').config({ path: '.env.local' });
const vars = env.parsed;
console.log('Environment Check:');
console.log('✓ Endpoint:', vars.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('✓ Project:', vars.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('✓ Database:', vars.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
console.log('✓ API Key:', vars.APPWRITE_API_KEY ? 'Present' : 'MISSING');
"
```

## STEP 7: Restart Everything

```bash
# Kill current dev server (Ctrl+C in terminal)

# Clear cache
rm -rf .next
rm -rf node_modules/.pnpm

# Restart
pnpm install
pnpm dev
```

## STEP 8: Test Authentication

1. Open http://localhost:3000
2. Click **Sign Up**
3. Use test email: `test@example.com`
4. Use password: `TestPassword123!`
5. You should get redirected to `/app/feed`

**If you get an error:**
- Check browser console (F12) for error details
- Check terminal for Appwrite error messages
- See troubleshooting section below

## Troubleshooting

### Error: "The current user is not authorized"
**Solution:** 
- You didn't set collection permissions correctly
- Re-read STEP 2 and STEP 3
- Make sure to click **Update** after setting permissions

### Error: "account.createEmailSession is not a function"
**Solution:**
- Your appwrite package may be outdated
- Run: `pnpm add appwrite@latest`
- Restart dev server

### Error: "Invalid project ID"
**Solution:**
- Verify NEXT_PUBLIC_APPWRITE_PROJECT_ID in `.env.local`
- Should be: `68921a0d00146e65d29b`

### Error: "Invalid API key"
**Solution:**
- API key must be created in Appwrite console
- Must have ALL scopes enabled
- Check for typos in `.env.local`

### Can't reset password
**Solution:**
- Email service not configured
- Follow STEP 4
- Test with valid email that can receive emails

## Quick Checklist

Before proceeding, verify ALL of these:

- [ ] API Key has all scopes enabled
- [ ] `.env.local` has correct API_KEY
- [ ] All 8 collections created
- [ ] All 4 storage buckets created
- [ ] Collection permissions set (8 × confirm)
- [ ] Storage bucket permissions set (4 × confirm)
- [ ] Email service configured
- [ ] Dev server restarted
- [ ] Test account created successfully
- [ ] Logged in successfully to /app/feed

## If You're Still Having Issues

1. **Check Appwrite Status**
   - Visit https://status.appwrite.io
   - Confirm service is operational

2. **Verify Project Settings**
   - Go to Appwrite Console
   - Select your project
   - Check: Settings → General
   - Confirm Project ID: `68921a0d00146e65d29b`

3. **Check Network**
   - Are you behind a firewall?
   - Can you access https://fra.cloud.appwrite.io?

4. **Browser Developer Tools**
   - Press F12
   - Check Network tab for API calls
   - Check Console for error details

## Need More Help?

- Appwrite Docs: https://appwrite.io/docs
- Community: https://appwrite.io/community
- Issues: https://github.com/appwrite/appwrite

---

**IMPORTANT:** After fixing permissions, ALL these features should work:
- ✓ User registration
- ✓ User login
- ✓ Profile creation
- ✓ Create posts
- ✓ Create study pods
- ✓ Send messages
- ✓ Upload resources
- ✓ Password reset
- ✓ All notifications
- ✓ Calendar events
