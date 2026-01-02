# ⚠️ APPWRITE PERMISSIONS FIX - CRITICAL

## Problem

You're getting: **"The current user is not authorized to perform the requested action"**

This means your Appwrite API key doesn't have proper permissions for database and storage operations.

---

## Solution: Set Up Proper Appwrite Permissions

### Step 1: Update Collection Permissions

Go to each collection in Appwrite console and set permissions:

**For Each Collection (profiles, posts, messages, pods, resources, notifications, calendar_events, chat_rooms):**

1. **Open:** https://cloud.appwrite.io
2. **Go to:** peerspark-main-db → Collection Name
3. **Click:** Permissions (top right)
4. **Add Permissions:**

```
Role: Any (Guests)
Permissions:
  ✓ read
  
Role: User
Permissions:
  ✓ read
  ✓ create
  ✓ update (own documents only)
  ✓ delete (own documents only)
```

### Step 2: Update Storage Bucket Permissions

**For Each Bucket (avatars, resources, attachments, post_images):**

1. **Go to:** Storage → Bucket Name
2. **Click:** Permissions
3. **Add Permissions:**

```
Role: Any (Guests)
Permissions:
  ✓ read
  
Role: User
Permissions:
  ✓ read
  ✓ create
  ✓ update (own files only)
  ✓ delete (own files only)
```

### Step 3: Verify API Key Permissions

1. **Go to:** Settings → API Keys
2. **Click:** Your API Key
3. **Verify Scopes Include:**
   - ✓ databases.read
   - ✓ databases.write
   - ✓ files.read
   - ✓ files.write
   - ✓ accounts.read
   - ✓ accounts.write
   - ✓ users.read
   - ✓ users.write
   - ✓ teams.read
   - ✓ teams.write

If missing, edit the key and enable all scopes.

---

## Alternative: Create New API Key with Full Permissions

If the current key doesn't have full permissions:

1. **Go to:** https://cloud.appwrite.io → Settings → API Keys
2. **Click:** Create API Key
3. **Name:** PeerSpark Backend
4. **Enable ALL Scopes:** (Select all checkboxes)
5. **Copy:** The new key
6. **Update:** `.env.local` with new `APPWRITE_API_KEY`
7. **Restart:** Dev server (`pnpm dev`)

---

## Database Rules for Records

The system expects documents to be created with certain rules:

### When User Creates a Record
- The `authorId` or `userId` should be set to current user's ID
- User can only update/delete their own records
- Appwrite handles permission checks

### Record Ownership

```typescript
// Profile - user can only edit own profile
authorId = "user123" // Can only be edited by user123

// Posts - user can only edit own posts  
authorId = "user123" // Can only be edited by user123

// Messages - user can only edit own messages
authorId = "user123" // Can only be edited by user123

// Resources - user can only delete own uploads
authorId = "user123" // Can only be edited by user123
```

---

## For Development (Allow Everything)

If you want to test quickly with permissions open:

**For Each Collection:**
1. Permissions
2. Add: Role=Any, Permissions=All (read, create, update, delete)
3. Add: Role=User, Permissions=All

**Warning:** Only for testing! Secure this before going to production.

---

## Error Messages & Solutions

### Error: "The current user is not authorized..."
→ **Fix:** Add User role with create/update/delete permissions to collection

### Error: "document_already_exists"
→ **Fix:** Use unique() for document IDs (already done in code)

### Error: "collection_not_found"
→ **Fix:** Create missing collections with `pnpm run setup-appwrite`

### Error: "file_not_found"
→ **Fix:** Create missing storage buckets with `pnpm run setup-appwrite`

---

## Quick Checklist

- [ ] All 8 collections exist
- [ ] All 4 storage buckets exist
- [ ] API key has all scopes enabled
- [ ] Collections have User role with create/update/delete permissions
- [ ] Storage buckets have User role with create/update/delete permissions
- [ ] `.env.local` has correct API key
- [ ] Dev server restarted after changes

---

## Test Permissions Work

Try this in browser console:

```javascript
// Test registration
const result = await fetch('/api/register', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User'
  })
})
console.log(await result.json())
```

If successful → Permissions are correct!

---

## Production Checklist

Before going live:

```
[ ] Remove "Any" role from all collections
[ ] Only allow authenticated users
[ ] Enable SSL/TLS
[ ] Set API key scope restrictions
[ ] Enable rate limiting
[ ] Enable CORS only for your domain
[ ] Regular backups enabled
[ ] Monitoring/alerts set up
```

---

**After fixing permissions, restart dev server and test again!**
