# Notification System - Quick Start Guide

Get the notification system running in 5 minutes.

## Prerequisites

- Appwrite Cloud account or self-hosted instance
- Brevo (Sendinblue) account for email (free tier available)
- Firebase project for push notifications (free tier available)

## Step 1: Configure Environment Variables (2 minutes)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your credentials:

```env
# Appwrite
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=peerspark-main-db

# Providers (optional, required for email/push)
APPWRITE_EMAIL_PROVIDER_ID=brevo-smtp
APPWRITE_PUSH_PROVIDER_ID=fcm

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Feature toggles
SMS_ENABLED=false
ADMIN_BROADCASTS_ENABLED=true
```

## Step 2: Create Database Collections (1 minute)

Run the setup script:

```bash
node scripts/setup-notifications-db.js
```

This creates all 10 collections with proper indexes.

## Step 3: Deploy Appwrite Function (1 minute)

The notification worker function processes the queue every minute.

### Option A: Deploy via CLI

```bash
appwrite deploy function notification-worker \
  --entrypoint src/main.ts
```

### Option B: Manual Deployment

1. Go to Appwrite Console → Functions
2. Create new function: `notification-worker`
3. Copy contents of `appwrite/functions/notification-worker/src/main.ts`
4. Set runtime: `Node.js (Latest)`
5. Configure schedule: `*/1 * * * *` (every minute)

## Step 4: Test It Works (1 minute)

### 1. Queue a Test Notification

```typescript
import { queueNotification } from '@/lib/notifications'

// In a server action or API route
await queueNotification({
  userId: 'test-user-id',
  templateKey: 'study_session_starting',
  category: 'study',
  priority: 'normal',
  channels: ['in_app'],
  variables: {
    sessionName: 'Math 101',
    minutesUntilStart: 15,
  },
})

console.log('Notification queued!')
```

### 2. Check the Inbox

```typescript
// In your component
const response = await fetch('/api/notifications/inbox', {
  headers: { 'x-user-id': 'test-user-id' },
})
const { data } = await response.json()
console.log('Notifications:', data)
```

### 3. Verify in Appwrite

1. Go to Appwrite Console → Database
2. Check `notification_queue` collection → should see your test notification
3. Wait 1-2 minutes for worker to process
4. Check `in_app_notifications` → should see it there now

## Using in Your App

### 1. Display Notification Inbox

```tsx
import { NotificationInbox } from '@/lib/notifications'

export default function NotificationsPage() {
  return <NotificationInbox />
}
```

### 2. Let Users Change Preferences

```tsx
import { NotificationPreferences } from '@/lib/notifications'

export default function SettingsPage() {
  return <NotificationPreferences />
}
```

### 3. Queue Notifications When Events Happen

```tsx
// When user completes an assignment
import { queueNotification } from '@/lib/notifications'

await queueNotification({
  userId: user.id,
  templateKey: 'assignment_completed',
  category: 'progress',
  channels: ['in_app', 'push', 'email'],
  variables: {
    assignmentName: 'Math Homework',
    gradeName: 'A',
  },
})
```

## Common Use Cases

### Study Session Starting Soon

```typescript
await queueNotification({
  userId,
  templateKey: 'study_session_starting',
  category: 'study',
  priority: 'normal',
  variables: {
    sessionName: 'Daily Math Practice',
    minutesUntilStart: 15,
  },
})
```

### Assignment Deadline Approaching

```typescript
await queueNotification({
  userId,
  templateKey: 'deadline_approaching',
  category: 'deadline',
  priority: 'high',
  variables: {
    assignmentName: 'Essay on Climate Change',
    subjectName: 'Environmental Science',
    hoursRemaining: 24,
    dueDate: '2024-05-25 11:59 PM',
  },
})
```

### Achievement Unlocked

```typescript
await queueNotification({
  userId,
  templateKey: 'streak_milestone',
  category: 'streak',
  priority: 'normal',
  variables: {
    streakDays: 7,
  },
})
```

### Re-engagement Campaign

```typescript
// Send to inactive users
await queueNotification({
  userId,
  templateKey: 'reengagement_welcome_back',
  category: 'reengagement',
  priority: 'low',
  channels: ['email'], // Email only to avoid spam
  variables: {
    userName: 'Sarah',
    daysInactive: 7,
  },
})
```

### Admin Broadcast

```tsx
import { AdminBroadcast } from '@/components/notifications/AdminBroadcast'

export default function AdminPanel() {
  return <AdminBroadcast />
}
```

## Quiet Hours Example

User sets quiet hours from 10 PM to 7 AM.

```typescript
// 9 PM - Gets notification immediately
await queueNotification({
  userId: 'john',
  templateKey: 'deadline_approaching',
  category: 'deadline',
  priority: 'normal', // Not critical
})

// 11 PM - Notification is delayed until 7 AM
// The worker checks quiet hours and reschedules it

// 11 PM - Critical security alert BYPASSES quiet hours
await queueNotification({
  userId: 'john',
  templateKey: 'security_alert',
  category: 'security',
  priority: 'critical', // Bypasses quiet hours
})
```

## Preference Customization Example

```typescript
import { upsertUserPreferences } from '@/lib/notifications'

// User disables push notifications
await upsertUserPreferences(user.id, {
  pushEnabled: false,
  emailEnabled: true,
  inAppEnabled: true,
})

// User sets quiet hours
await upsertUserPreferences(user.id, {
  quietHoursEnabled: true,
  quietHoursStart: '23:00',
  quietHoursEnd: '08:00',
  timezone: 'America/New_York',
})

// User customizes per-category
await upsertUserPreferences(user.id, {
  marketingPush: false, // Disable marketing push
  marketingEmail: true, // But allow marketing email
})
```

## Troubleshooting

### Notifications Not Appearing?

1. **Check the queue**
   ```sql
   SELECT * FROM notification_queue 
   WHERE userId = 'test-user-id'
   ORDER BY createdAt DESC LIMIT 5
   ```

2. **Check worker logs**
   - Appwrite Console → Functions → notification-worker → Logs
   - Look for errors in processing

3. **Check preferences**
   ```typescript
   const prefs = await getUserPreferences('test-user-id')
   console.log(prefs) // Are channels enabled?
   ```

4. **Check delivery logs**
   ```sql
   SELECT * FROM notification_delivery_logs 
   WHERE userId = 'test-user-id'
   ORDER BY createdAt DESC
   ```

### Email Not Sending?

1. Verify `APPWRITE_EMAIL_PROVIDER_ID` is set
2. Check provider is configured in Appwrite Console
3. Look for "provider_missing" in delivery logs
4. Test provider directly in Appwrite Messaging

### Push Not Working?

1. Verify `APPWRITE_PUSH_PROVIDER_ID` is set  
2. Check Firebase credentials in Appwrite Console
3. Verify device registration with Firebase
4. Check `notification_device_targets` collection

## Next Steps

1. **Customize templates** - Edit templates in `lib/notifications/templates.ts`
2. **Add more categories** - Extend types in `lib/notifications/schema.ts`
3. **Integrate with your features** - Queue notifications on important user events
4. **Monitor analytics** - Check `notification_delivery_logs` for success rates
5. **Enable premium providers** - Add SMS, push to mobile apps, etc.

## Architecture Files

Key files for reference:

```
lib/notifications/
  ├── schema.ts           # TypeScript types for all collections
  ├── service.ts          # Core API functions
  ├── templates.ts        # Template management
  ├── utils.ts            # Utility functions
  └── index.ts            # Main exports

components/notifications/
  ├── NotificationInbox.tsx       # User inbox UI
  ├── NotificationPreferences.tsx # Settings UI
  └── AdminBroadcast.tsx          # Admin broadcast UI

app/api/notifications/
  ├── inbox/route.ts              # Get notifications
  ├── preferences/route.ts        # Get/set preferences
  ├── [id]/read/route.ts          # Mark as read
  └── [id]/route.ts               # Delete notification

app/api/admin/
  └── broadcasts/route.ts         # Create broadcasts

appwrite/functions/
  └── notification-worker/src/main.ts  # Queue processor
```

## Support

For issues or questions:

1. Check `docs/NOTIFICATIONS_SYSTEM.md` for detailed documentation
2. Review API endpoint documentation
3. Check Appwrite logs in console
4. Check delivery logs in database

## Performance Tips

- Batch notifications when possible
- Use `dedupeKey` to prevent duplicates
- Archive old delivery logs monthly
- Monitor worker function execution time
- Use rate limiting to prevent spam
