# Peerspark Notification System

Enterprise-grade notification engine with multi-channel delivery, user preferences, quiet hours, rate limiting, and re-engagement campaigns.

## Architecture Overview

```
User Action/Event
    ↓
API Route / Server Function
    ↓
queueNotification() → notification_queue
    ↓
notification-worker function (scheduled every 1 minute)
    ↓
Check Preferences + Quiet Hours + Rate Limits + Suppression
    ↓
Render Template + Get Devices
    ↓
Send via Appwrite Messaging (Push, Email, SMS)
    ↓
Log Delivery + Update Activity State
    ↓
User receives notification on their device/inbox
```

## Database Collections

### notification_preferences
Stores user notification settings per channel and category.
- **Key Field**: `userId` (unique per user)
- **Channels**: inApp, push, email, sms
- **Categories**: 15 types (study, class, deadline, etc.)
- **Features**: Quiet hours, rate limits, digest settings

### notification_templates
Reusable templates with variable interpolation.
- **Key Field**: `templateKey` + `channel` + `locale`
- **Supported Variables**: `{{variableName}}`
- **Channels**: in_app, push, email, sms

### notification_queue
Main processing queue for notifications.
- **Status**: queued, processing, sent, partial, failed, expired
- **Priority**: low, normal, high, critical
- **Dedupe**: Prevents duplicate notifications via dedupeKey
- **Retry Logic**: Configurable attempts with exponential backoff

### in_app_notifications
User notification inbox.
- **Auto-expire**: After 30 days by default
- **Read Status**: Track read/unread
- **Priority Levels**: Low, normal, high, critical

### notification_delivery_logs
Complete audit trail of all delivery attempts.
- **Status Tracking**: sent, failed, skipped, rate_limited, blocked, opened, clicked
- **Provider Integration**: Track FCM, email provider, SMS provider IDs
- **Analytics**: Enable performance monitoring

### Additional Collections
- `notification_device_targets`: Device management for push notifications
- `user_activity_state`: Engagement tracking for re-engagement campaigns
- `notification_rate_limits`: Per-user, per-channel rate limiting
- `notification_suppression`: Unsubscribes and suppressions
- `admin_broadcasts`: Admin-created campaigns

## Setting Up the Notification System

### 1. Create Database Collections

Run the setup script to create all collections and indexes:

```bash
node scripts/setup-notifications-db.js
```

This creates:
- 10 database collections
- Proper indexes for performance
- Permissions for security
- Default attributes

### 2. Configure Appwrite Messaging Providers

#### Email (Brevo SMTP)

1. Go to Appwrite Console → Messaging → Providers
2. Click "Add Provider" → "Email" → "SMTP"
3. Fill in:
   - **Provider Name**: `brevo-smtp`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **From Email**: `notifications@peerspark.app`
   - **Username & Password**: Get from Brevo account
4. Copy the Provider ID to `APPWRITE_EMAIL_PROVIDER_ID`

#### Push (Firebase Cloud Messaging)

1. Create Firebase project at console.firebase.google.com
2. Enable Cloud Messaging
3. Create web app and get credentials
4. Generate VAPID key (Cloud Messaging settings)
5. In Appwrite Console → Messaging → Providers → "Add Provider" → "FCM"
6. Add service account credentials
7. Copy Provider ID to `APPWRITE_PUSH_PROVIDER_ID`

#### SMS (Optional - Disabled by Default)

```
Not configured unless SMS_ENABLED=true and provider is set
```

### 3. Environment Variables

Copy from `.env.example` and set real values:

```bash
# Required
APPWRITE_ENDPOINT=...
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
APPWRITE_DATABASE_ID=...

# Providers
APPWRITE_EMAIL_PROVIDER_ID=brevo-smtp
APPWRITE_PUSH_PROVIDER_ID=fcm

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# Features
SMS_ENABLED=false
MARKETING_NOTIFICATIONS_ENABLED=false
ADMIN_BROADCASTS_ENABLED=true
```

### 4. Deploy Appwrite Function

Deploy the `notification-worker` function to process the queue:

```bash
# Via Appwrite CLI
appwrite deploy function notification-worker --entrypoint src/main.ts
```

Configure it as a scheduled function:
- **Trigger Type**: Schedule
- **Schedule**: `*/1 * * * *` (every 1 minute)

## Using the Notification System

### Queue a Notification

```typescript
import { queueNotification } from '@/lib/notifications'

await queueNotification({
  userId: 'user123',
  templateKey: 'study_session_starting',
  category: 'study',
  priority: 'normal',
  channels: ['in_app', 'push'],
  variables: {
    sessionName: 'Math 101 Study',
    minutesUntilStart: 15,
  },
})
```

### Get User Preferences

```typescript
import { getUserPreferences } from '@/lib/notifications'

const prefs = await getUserPreferences('user123')
console.log(prefs.pushEnabled) // false
console.log(prefs.quietHoursEnabled) // true
```

### Update Preferences

```typescript
import { upsertUserPreferences } from '@/lib/notifications'

await upsertUserPreferences('user123', {
  pushEnabled: true,
  emailEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '08:00',
  timezone: 'America/New_York',
})
```

### Create In-App Notification

```typescript
import { createInAppNotification } from '@/lib/notifications'

await createInAppNotification('user123', {
  title: 'Assignment Submitted',
  body: 'Your assignment was successfully submitted!',
  category: 'progress',
  priority: 'normal',
  ctaLabel: 'View',
  ctaUrl: '/app/assignments/123',
})
```

### Get Notifications

```typescript
// Browser side
const response = await fetch('/api/notifications/inbox', {
  headers: { 'x-user-id': userId },
})
const { data } = await response.json()
```

## Template System

### Using Built-in Templates

The system includes default templates for:
- `study_session_starting` - Study reminders
- `deadline_approaching` - Assignment deadlines
- `streak_milestone` - Achievement notifications
- `progress_update` - Weekly summaries
- `class_announcement` - Class updates
- `security_alert` - Account security
- `weekly_digest` - Weekly email summary

### Creating Custom Templates

```typescript
import { upsertTemplate } from '@/lib/notifications/templates'

await upsertTemplate(
  'custom_event',
  'push',
  'admin',
  {
    titleTemplate: 'Event Alert',
    bodyTemplate: 'You have a new event: {{eventName}} at {{eventTime}}',
    locale: 'en',
    status: 'active',
    version: 1,
  }
)
```

### Variable Interpolation

Templates support `{{variableName}}` syntax:

```
Template: "You have {{count}} new messages"
Variables: { count: 5 }
Result: "You have 5 new messages"
```

## Features

### Quiet Hours
Prevents notifications during sleep hours (configurable per user).
- Respect user's timezone
- Bypass for critical/security notifications
- Default: 22:00 - 07:00

### Rate Limiting
Per-user, per-channel limits:
- Push: 8 per day (3 per hour)
- Email: 2 per day
- SMS: 1 per day (if enabled)
- In-app: Unlimited

### Deduplication
Prevents duplicate notifications with `dedupeKey`:
```typescript
const dedupeKey = `user_assignment_due_${assignmentId}`
```

### Suppression
Users can unsubscribe from categories/channels:
```typescript
// Mark as suppressed
// System automatically skips sending
```

### Delivery Logs
Complete audit trail:
- What was sent (channel, message)
- When it was sent
- Delivery status (sent, failed, opened, clicked)
- Errors and retry info

### Activity Tracking
Monitors user engagement:
- `lastSeenAt`: Last app interaction
- `currentStreak`: Days of consistent activity
- `riskLevel`: Health score (healthy → churn_risk)
- Enables targeted re-engagement campaigns

### Admin Broadcasts
Create one-time campaigns to user segments:
- Target: all_users, active_users, inactive_3d, etc.
- Channels: in_app, push, email
- Schedule for later delivery
- Track delivery success

## API Endpoints

### GET /api/notifications/inbox
Get user's in-app notifications.
```bash
curl /api/notifications/inbox?limit=20&offset=0&unreadOnly=true \
  -H "x-user-id: user123"
```

### GET /api/notifications/preferences
Get notification preferences.
```bash
curl /api/notifications/preferences \
  -H "x-user-id: user123"
```

### POST /api/notifications/preferences
Update notification preferences.
```bash
curl -X POST /api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"pushEnabled": true}'
```

### PATCH /api/notifications/{id}/read
Mark notification as read.
```bash
curl -X PATCH /api/notifications/notif123/read \
  -H "x-user-id: user123"
```

### DELETE /api/notifications/{id}
Delete notification.
```bash
curl -X DELETE /api/notifications/notif123 \
  -H "x-user-id: user123"
```

## UI Components

### NotificationInbox
Full-featured notification center:
```typescript
import { NotificationInbox } from '@/lib/notifications'

export default function Page() {
  return <NotificationInbox />
}
```

Features:
- Unread count badge
- Filter by read/unread
- Mark as read/unread
- Delete notifications
- Category badges
- Time ago display
- CTA buttons

### NotificationPreferences
Settings panel for users:
```typescript
import { NotificationPreferences } from '@/lib/notifications'

export default function SettingsPage() {
  return <NotificationPreferences />
}
```

Features:
- Channel toggles (in-app, push, email, SMS)
- Per-category settings
- Quiet hours configuration
- Digest schedule
- Rate limit display

## Testing

### Manual Testing

1. Queue a test notification:
```typescript
await queueNotification({
  userId: 'test-user',
  templateKey: 'study_session_starting',
  category: 'study',
  variables: { sessionName: 'Test', minutesUntilStart: 15 },
})
```

2. Check notification_queue collection in Appwrite
3. Run the worker function
4. Check in_app_notifications collection

### Testing Different Channels

```typescript
// Test all channels
await queueNotification({
  userId: 'test-user',
  templateKey: 'test_notification',
  category: 'system',
  channels: ['in_app', 'push', 'email', 'sms'],
  variables: { message: 'Test' },
})
```

### Testing Quiet Hours

1. Set quiet hours: 22:00 - 07:00
2. Queue notification at 23:00
3. Verify it's delayed until 07:00
4. Queue critical notification at 23:00
5. Verify it sends immediately (bypasses quiet hours)

### Testing Rate Limits

1. Queue 9 push notifications to same user on same day
2. First 8 send, 9th is rate_limited
3. Check delivery logs for status

## Performance

### Optimization Tips

1. **Batch Processing**: The worker processes 10 notifications per run
2. **Indexing**: All queries use indexed fields for fast lookups
3. **Caching**: Consider caching templates
4. **Async Processing**: Delivery happens asynchronously

### Scaling

For large deployments:
- Increase worker batch size in `notification-worker`
- Deploy multiple worker instances
- Use database read replicas
- Implement Redis caching for preferences
- Archive old delivery logs

## Troubleshooting

### Notifications Not Sending

Check in order:
1. Is queue item created? → Check `notification_queue`
2. Is worker running? → Check function logs
3. Are preferences enabled? → Check `notification_preferences`
4. Is user in quiet hours? → Check timestamp vs quiet hours
5. Is rate limited? → Check `notification_rate_limits`
6. Is suppressed? → Check `notification_suppression`
7. Is provider configured? → Check Appwrite Messaging providers

### Delivery Logs Show "provider_missing"

- Email: Check `APPWRITE_EMAIL_PROVIDER_ID`
- Push: Check `APPWRITE_PUSH_PROVIDER_ID`
- SMS: Set `SMS_ENABLED=true` and configure provider

### Templates Not Rendering

1. Verify template exists: Check `notification_templates`
2. Check locale (defaults to 'en')
3. Verify variables in payload match template `{{variables}}`
4. Check template status is 'active'

## Security Considerations

1. **Permissions**: Collections have RLS, only users see their own
2. **Rate Limiting**: Built-in protection against notification bombing
3. **Quiet Hours**: Respects user's DND preferences
4. **Device Tokens**: Never stored raw, only hashed for comparison
5. **Audit Trail**: Complete delivery logs for compliance
6. **Encryption**: All data in transit via HTTPS

## Future Enhancements

- Push to mobile apps (iOS/Android)
- SMS via Twilio/Nexmo
- Webhook integrations
- In-app notification syncing across devices
- Analytics dashboard
- A/B testing for templates
- ML-based optimal send time
- Nested notification threads
- Real-time WebSocket delivery
