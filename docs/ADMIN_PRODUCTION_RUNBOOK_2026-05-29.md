# Admin Command Center Production Runbook

Date: 2026-05-29

This runbook prepares the new admin command center for production by restoring dependencies, syncing Appwrite schema, validating security, building the app, and deploying.

## 1. Required Environment

Create or update `.env.local` in the project root.

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_DATABASE_ID=your_database_id

APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_server_api_key

SESSION_COOKIE_SECRET=use_a_long_random_secret
NEXT_PUBLIC_ADMIN_EMAILS=chat.priyanshuag@gmail.com
ADMIN_OWNER_EMAILS=chat.priyanshuag@gmail.com

ADMIN_ROLES_COLLECTION_ID=admin_roles
ADMIN_AUDIT_LOGS_COLLECTION_ID=admin_audit_logs
ADMIN_SESSIONS_COLLECTION_ID=admin_sessions
CONTENT_REPORTS_COLLECTION_ID=content_reports
MODERATION_ACTIONS_COLLECTION_ID=moderation_actions
CLIENT_ERRORS_COLLECTION_ID=client_errors
API_ERROR_EVENTS_COLLECTION_ID=api_error_events
SYSTEM_HEALTH_EVENTS_COLLECTION_ID=system_health_events
FEATURE_FLAGS_COLLECTION_ID=feature_flags
ADMIN_NOTES_COLLECTION_ID=admin_notes
SUPPORT_TICKETS_COLLECTION_ID=support_tickets
ADMIN_SAVED_VIEWS_COLLECTION_ID=admin_saved_views
ADMIN_BROADCASTS_COLLECTION_ID=admin_broadcasts
```

The Appwrite API key must have permissions to manage databases, collections, attributes, indexes, storage, users, and documents.

## 2. Clean Dependency Install

If `node_modules` is broken or `next` is not recognized, run:

```powershell
Get-Process node,pnpm,npm -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
pnpm install --frozen-lockfile
```

If pnpm still hangs, try npm:

```powershell
Get-Process node,pnpm,npm -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm ci
```

Verify binaries:

```powershell
Test-Path .\node_modules\.bin\next.cmd
pnpm exec next --version
```

## 3. Sync Appwrite Schema

First normalize env aliases and run the schema updater:

```powershell
node scripts/setup-appwrite.js
```

Or run the schema updater directly:

```powershell
node scripts/update-schema.js
```

Expected result:
- Existing collections are detected.
- Missing admin collections are created.
- Missing attributes/indexes are created.
- No secret values are printed.

New admin collections that must exist:

```text
admin_roles
admin_audit_logs
admin_sessions
content_reports
moderation_actions
client_errors
api_error_events
system_health_events
feature_flags
admin_notes
support_tickets
admin_saved_views
admin_broadcasts
```

Existing collections that receive moderation fields:

```text
posts
pods
resources
```

Fields added:

```text
moderationStatus
moderatedBy
moderatedAt
```

## 4. Build And Static Checks

Run:

```powershell
pnpm exec next build
```

Optional checks:

```powershell
pnpm exec eslint . --ext .ts,.tsx
node -c scripts/setup-appwrite.js
node -c scripts/update-schema.js
git diff --check
```

Do not deploy until `next build` passes.

## 5. Local Production Smoke Test

Start the production server:

```powershell
pnpm exec next start
```

Open:

```text
http://localhost:3000/app/admin
```

Verify:
- Non-admin users are redirected away from `/app/admin`.
- Admin user can load the command center.
- Overview metrics load.
- Users tab loads.
- Reports tab loads.
- Feed tab loads.
- Pods tab loads.
- Chat tab loads privacy-safe report data only.
- Vault tab loads resources.
- Courses tab loads course state.
- Notifications tab can create a broadcast.
- Errors tab loads client/API errors.
- System tab shows collection readiness.
- Security tab shows audit logs.

## 6. Security Verification

Run these checks before production:

```powershell
# Must return 401 or 403 without a real admin session cookie.
curl.exe -i https://your-domain.com/api/admin/overview

# Must not grant admin access from spoofed headers.
curl.exe -i https://your-domain.com/api/admin/broadcasts `
  -H "Content-Type: application/json" `
  -H "x-user-id: fake" `
  -H "x-user-email: chat.priyanshuag@gmail.com" `
  -H "x-user-role: admin"
```

Expected:
- No admin API works without a valid authenticated admin session.
- Spoofed headers do not grant access.
- Every mutation creates an `admin_audit_logs` document or logs an audit fallback.
- Sensitive user data is redacted for lower-privilege roles.

## 7. Admin Functional Test

Use the owner account:

```text
chat.priyanshuag@gmail.com
```

Test these actions:
- Create a test broadcast to a safe/small segment.
- Submit a content report from feed.
- Resolve the report in admin.
- Hide and restore a test post.
- Close and restore a test pod.
- Quarantine and restore a test resource.
- Submit a bug report from Settings.
- Confirm the bug appears in the Errors tab.
- Update a feature flag.
- Confirm each mutation appears in Security > Audit.

## 8. Vercel Deployment

Set the same env vars in Vercel:

```text
Project Settings > Environment Variables
```

Required production env vars:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_DATABASE_ID`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_API_KEY`
- `SESSION_COOKIE_SECRET`
- `NEXT_PUBLIC_ADMIN_EMAILS`
- `ADMIN_OWNER_EMAILS`
- Admin collection IDs listed above

Deploy:

```powershell
git status
git add .
git commit -m "Build admin command center"
git push origin main
```

After deployment:

```powershell
curl.exe -i https://studentssocial.vercel.app/api/admin/overview
```

Expected without browser session:

```text
401 Unauthorized
```

Then login in the browser as owner and open:

```text
https://studentssocial.vercel.app/app/admin
```

## 9. Production Acceptance Criteria

The admin panel is production-ready only when:
- `pnpm install --frozen-lockfile` or `npm ci` completes.
- `node scripts/update-schema.js` completes.
- `pnpm exec next build` passes.
- `/app/admin` loads for the owner account.
- `/app/admin` is blocked for normal users.
- `/api/admin/*` is blocked without a real admin session.
- Broadcast creation works and writes an audit log.
- Report review works and writes moderation + audit logs.
- Client bug reports appear in the Errors tab.
- System tab reports all required collections as ready.
- Vercel deployment succeeds with the same env vars.

## 10. Current Known Blockers

As of 2026-05-29:
- Local dependency install timed out, so `next build` could not be verified.
- Appwrite schema sync failed locally because required Appwrite env vars were not available.

Resolve those two blockers first, then run this runbook from top to bottom.
