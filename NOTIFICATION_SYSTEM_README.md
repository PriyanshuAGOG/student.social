# Peerspark Notification System

Enterprise-grade, billion-dollar scale notification system built for Peerspark. Multi-channel delivery (in-app, push, email, SMS), intelligent routing, user preferences, quiet hours, rate limiting, and powerful admin tools.

## 🚀 What's Included

### Core System
- **Multi-Channel Delivery**: In-app, push notifications, email, and SMS
- **Intelligent Queue**: Async processing with retry logic and deduplication
- **User Preferences**: Granular control per channel and category
- **Quiet Hours**: Respect user's do-not-disturb schedule
- **Rate Limiting**: Per-user limits to prevent notification fatigue
- **Suppression Management**: User unsubscribes and opt-outs
- **Activity Tracking**: Monitor engagement and detect churn risk
- **Delivery Logs**: Complete audit trail of all notifications
- **Admin Broadcasts**: Create campaigns for user segments
- **Template System**: Reusable templates with variable interpolation

### UI Components
- **NotificationInbox** - Full-featured notification center
- **NotificationPreferences** - User settings panel
- **AdminBroadcast** - Admin dashboard for campaigns

### Database Collections (10 total)
- notification_preferences
- notification_templates
- notification_queue
- notification_delivery_logs
- in_app_notifications
- notification_device_targets
- user_activity_state
- notification_rate_limits
- notification_suppression
- admin_broadcasts

### API Endpoints
- GET `/api/notifications/inbox` - Fetch notifications
- GET `/api/notifications/preferences` - Get settings
- POST `/api/notifications/preferences` - Update settings
- PATCH `/api/notifications/[id]/read` - Mark as read
- DELETE `/api/notifications/[id]` - Delete notification
- POST `/api/admin/broadcasts` - Create broadcast

### Appwrite Functions
- `notification-worker` - Scheduled queue processor (runs every minute)

## 📁 Project Structure

```
Peerspark/
├── lib/notifications/
│   ├── schema.ts                 # TypeScript types for all collections
│   ├── service.ts                # Core API functions (queue, preferences, etc)
│   ├── templates.ts              # Template management & rendering
│   ├── utils.ts                  # Utility functions
│   └── index.ts                  # Main exports
│
├── components/notifications/
│   ├── NotificationInbox.tsx      # User notification center UI
│   ├── NotificationPreferences.tsx# User settings panel UI
│   └── AdminBroadcast.tsx         # Admin broadcast creation UI
│
├── app/api/notifications/
│   ├── inbox/route.ts            # GET notifications
│   ├── preferences/route.ts       # GET/POST preferences
│   ├── [id]/read/route.ts        # PATCH mark as read
│   └── [id]/route.ts             # DELETE notification
│
├── app/api/admin/
│   └── broadcasts/route.ts        # POST create broadcast
│
├── appwrite/functions/
│   └── notification-worker/
│       └── src/main.ts            # Queue processor function
│
├── scripts/
│   └── setup-notifications-db.js  # Database schema setup script
│
├── docs/
│   ├── NOTIFICATIONS_SYSTEM.md    # Complete system documentation
│   ├── NOTIFICATIONS_QUICK_START.md# 5-minute setup guide
│   └── PROVIDER_SETUP.md          # Email/push provider setup
│
└── .env.example                   # All required env vars
```

## 🚀 Quick Start (5 minutes)

### 1. Configure Environment

```bash
cp .env.example .env.local
# Fill in required values
```

### 2. Create Database Collections

```bash
node scripts/setup-notifications-db.js
```

### 3. Deploy Worker Function

```bash
appwrite deploy function notification-worker --entrypoint src/main.ts
```

Configure as scheduled function: `*/1 * * * *` (every minute)

### 4. Test It

```typescript
import { queueNotification } from '@/lib/notifications'

await queueNotification({
  userId: 'test-user',
  templateKey: 'study_session_starting',
  category: 'study',
  variables: { sessionName: 'Math 101', minutesUntilStart: 15 },
})
```

See docs/NOTIFICATIONS_QUICK_START.md for detailed instructions.

## 📚 Documentation

- **[NOTIFICATIONS_SYSTEM.md](./docs/NOTIFICATIONS_SYSTEM.md)** - Complete reference documentation
  - Architecture overview
  - Collection schemas
  - Using the notification system
  - Template system
  - Feature deep-dives
  - API endpoints
  - Testing guide
  - Troubleshooting

- **[NOTIFICATIONS_QUICK_START.md](./docs/NOTIFICATIONS_QUICK_START.md)** - Get running in 5 minutes
  - Step-by-step setup
  - Common use cases
  - Example code
  - Quick troubleshooting

- **[PROVIDER_SETUP.md](./docs/PROVIDER_SETUP.md)** - Email & push configuration
  - Brevo (email) setup
  - Firebase (push) setup
  - Twilio (SMS) optional setup
  - Provider health checks
  - Monitoring & maintenance

## 🎯 Features

### Multi-Channel Delivery
Send notifications via:
- **In-App**: Instant, persisted inbox
- **Push**: Browser & mobile push notifications
- **Email**: HTML or plain text emails
- **SMS**: Text message alerts (optional)

### Intelligent Routing
- Respects user's enabled channels
- Checks per-category preferences
- Enforces quiet hours (except critical)
- Applies rate limits
- Honors suppression/unsubscribe
- Deduplicates identical notifications

### Quiet Hours
Users define DND period (e.g., 10 PM - 7 AM). Automatically delays non-critical notifications. Critical (security/system) bypass quiet hours.

### Rate Limiting
- Push: 8 per day (3 per hour)
- Email: 2 per day
- SMS: 1 per day
- In-app: Unlimited

Configurable per user in preferences.

### Reengagement Campaigns
- Activity tracking (last seen, streaks, risk level)
- Automatic churn detection
- Target inactive users with re-engagement notifications
- Measure campaign effectiveness via delivery logs

### Admin Broadcasts
- Create one-time campaigns
- Target user segments (all users, inactive 3d+, new users, etc.)
- Schedule for later
- Track delivery success
- Respects all user preferences

### Delivery Tracking
Complete audit trail:
- What was sent (template, variables)
- When it was sent
- Which channel(s)
- Delivery status (sent, failed, skipped, rate limited, etc.)
- Delivery errors
- Provider integration details

## 💾 Database Collections

### notification_preferences (1 per user)
- Channel toggles: inApp, push, email, sms
- Per-category channel settings (15 categories × 3 channels)
- Quiet hours: start time, end time, timezone
- Digest settings: daily, weekly, send time
- Rate limits: configurable maximums
- Critical alerts always on toggle

### notification_queue
- Main processing queue
- Status tracking: queued, processing, sent, failed, expired
- Priority levels: low, normal, high, critical
- Deduplication via dedupeKey
- Retry logic with exponential backoff
- Scheduled delivery support

### notification_templates
- Reusable templates per channel
- Variable interpolation: `{{variableName}}`
- Multi-locale support (defaults to English)
- Rich HTML templates for email
- Version tracking

### in_app_notifications
- User inbox/notification center
- Read/unread tracking
- Auto-expire after 30 days
- Category and priority
- CTA links for engagement
- Metadata support

### notification_delivery_logs
- One entry per delivery attempt
- Detailed status information
- Provider integration IDs
- Error tracking
- Enable analytics and monitoring

### notification_device_targets
- Device tokens for push notifications
- Platform detection (web, Android, iOS, desktop)
- Device metadata
- Status tracking (active, revoked, expired)

### user_activity_state
- Engagement tracking per user
- Last seen, last action timestamps
- Current & longest streaks
- Weekly/monthly study minutes
- Engagement score
- Risk level (healthy → churn_risk)

### notification_rate_limits
- Per-user, per-channel, per-window tracking
- Sliding window rate limit enforcement
- Auto-cleanup of expired windows

### notification_suppression
- User unsubscribes
- Suppression reasons (user disabled, bounce, complaint, etc.)
- Channel + category combinations
- Status tracking

### admin_broadcasts
- Campaign metadata
- Target segments
- Scheduled delivery
- Status tracking (draft, scheduled, sent, failed)
- Audit trail (created by, created at)

## 🔌 API Reference

### GET /api/notifications/inbox

Fetch user's in-app notifications.

```bash
curl /api/notifications/inbox?limit=20&offset=0&unreadOnly=true \
  -H "x-user-id: user123"
```

**Parameters:**
- `limit` (default: 20) - Number of notifications to fetch
- `offset` (default: 0) - Pagination offset
- `unreadOnly` (default: false) - Only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "notif123",
      "title": "Study Session Reminder",
      "body": "Your Math 101 session starts in 15 minutes",
      "category": "study",
      "priority": "normal",
      "isRead": false,
      "createdAt": "2024-05-24T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### GET /api/notifications/preferences

Get user notification preferences.

```bash
curl /api/notifications/preferences \
  -H "x-user-id: user123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "pref123",
    "userId": "user123",
    "inAppEnabled": true,
    "pushEnabled": false,
    "emailEnabled": true,
    "smsEnabled": false,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00",
    "timezone": "America/New_York"
  }
}
```

### POST /api/notifications/preferences

Update notification preferences.

```bash
curl -X POST /api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "pushEnabled": true,
    "emailEnabled": false,
    "quietHoursStart": "23:00"
  }'
```

### PATCH /api/notifications/{id}/read

Mark a notification as read.

```bash
curl -X PATCH /api/notifications/notif123/read \
  -H "x-user-id: user123"
```

### DELETE /api/notifications/{id}

Delete a notification.

```bash
curl -X DELETE /api/notifications/notif123 \
  -H "x-user-id: user123"
```

### POST /api/admin/broadcasts

Create an admin broadcast.

```bash
curl -X POST /api/admin/broadcasts \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin123" \
  -H "x-is-admin: true" \
  -d '{
    "title": "System Maintenance",
    "body": "We will be down for 1 hour on May 25th",
    "category": "system",
    "channels": "in_app,email",
    "targetSegment": "all_users",
    "scheduledFor": "2024-05-25T02:00:00Z"
  }'
```

## 🛠️ Core Functions

### Queue a Notification

```typescript
import { queueNotification } from '@/lib/notifications'

await queueNotification({
  userId: 'user123',
  templateKey: 'deadline_approaching',
  category: 'deadline',
  priority: 'high',
  channels: ['in_app', 'push', 'email'],
  variables: {
    assignmentName: 'Essay on Climate',
    hoursRemaining: 24,
  },
  scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
})
```

### Get User Preferences

```typescript
import { getUserPreferences } from '@/lib/notifications'

const prefs = await getUserPreferences('user123')
console.log(prefs.pushEnabled)
console.log(prefs.quietHoursStart)
```

### Create In-App Notification

```typescript
import { createInAppNotification } from '@/lib/notifications'

await createInAppNotification('user123', {
  title: 'Assignment Submitted',
  body: 'Your essay has been submitted successfully',
  category: 'progress',
  priority: 'normal',
  ctaLabel: 'View',
  ctaUrl: '/app/assignments/essay123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
})
```

### Render Template

```typescript
import { renderNotificationTemplate } from '@/lib/notifications/templates'

const rendered = await renderNotificationTemplate(
  'study_session_starting',
  'push',
  {
    sessionName: 'Math 101',
    minutesUntilStart: 15,
  },
  'en'
)

console.log(rendered.title)   // "Study Time!"
console.log(rendered.body)    // "Your study session "Math 101" starts in 15 minutes."
```

## 🎨 UI Components

### NotificationInbox

```typescript
import { NotificationInbox } from '@/lib/notifications'

export default function NotificationsPage() {
  return (
    <div>
      <NotificationInbox />
    </div>
  )
}
```

Features:
- Display all notifications
- Filter by unread
- Mark as read
- Delete notifications
- Category badges
- Time ago display
- CTA buttons
- Auto-refresh every 30 seconds

### NotificationPreferences

```typescript
import { NotificationPreferences } from '@/lib/notifications'

export default function SettingsPage() {
  return (
    <div>
      <NotificationPreferences />
    </div>
  )
}
```

Features:
- Channel toggles
- Per-category settings in table
- Quiet hours configuration
- Digest schedule
- Save and validation

### AdminBroadcast

```typescript
import { AdminBroadcast } from '@/components/notifications/AdminBroadcast'

export default function AdminPanel() {
  return (
    <div>
      <AdminBroadcast />
    </div>
  )
}
```

Features:
- Create campaigns
- Target user segments
- Select channels
- Schedule for later
- Preview before sending
- Category selection
- Validation and error handling

## ⚙️ Configuration

All configuration via `.env.local`:

```env
# Core
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=peerspark-main-db

# Providers
APPWRITE_EMAIL_PROVIDER_ID=brevo-smtp
APPWRITE_PUSH_PROVIDER_ID=fcm

# Features
SMS_ENABLED=false
MARKETING_NOTIFICATIONS_ENABLED=false
ADMIN_BROADCASTS_ENABLED=true

# Rate Limits
NOTIFICATION_MAX_PUSH_PER_HOUR=3
NOTIFICATION_MAX_PUSH_PER_DAY=8
NOTIFICATION_MAX_EMAIL_PER_DAY=2
NOTIFICATION_MAX_SMS_PER_DAY=1

# Defaults
NOTIFICATION_DEFAULT_QUIET_HOURS_START=22:00
NOTIFICATION_DEFAULT_QUIET_HOURS_END=07:00
NOTIFICATION_DEFAULT_TIMEZONE=UTC

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

## 🧪 Testing

### Manual Test

```bash
# 1. Queue a test notification
node -e "
  const { queueNotification } = require('./lib/notifications');
  queueNotification({
    userId: 'test-user',
    templateKey: 'study_session_starting',
    category: 'study',
    variables: { sessionName: 'Test', minutesUntilStart: 15 }
  }).then(() => console.log('Queued!'));
"

# 2. Check notification_queue in Appwrite Console
# 3. Run worker function manually
# 4. Check in_app_notifications collection
```

### Test Different Scenarios

**Quiet Hours:**
- Set quiet hours 10 PM - 7 AM
- Queue notification at 11 PM
- Verify delayed in database
- Queue critical notification
- Verify sends immediately

**Rate Limiting:**
- Queue 10 push notifications
- Check rate_limits collection
- Verify last one is skipped

**Preferences:**
- Disable push for user
- Queue push notification
- Verify status is "skipped"

## 📊 Monitoring

### Success Rate

```typescript
const logs = await databases.listDocuments(
  DATABASE_ID,
  'notification_delivery_logs',
  [],
  100
)

const successful = logs.documents.filter(d => d.status === 'sent').length
const rate = (successful / logs.documents.length * 100).toFixed(2)
console.log(`Success rate: ${rate}%`)
```

### Failed Deliveries

```typescript
const failed = await databases.listDocuments(
  DATABASE_ID,
  'notification_delivery_logs',
  [Query.equal('status', 'failed')],
  50
)

failed.documents.forEach(doc => {
  console.log(`${doc.channel}: ${doc.errorMessage}`)
})
```

### User Engagement

```typescript
const activity = await databases.getDocument(
  DATABASE_ID,
  'user_activity_state',
  userId
)

console.log(`Last seen: ${activity.lastSeenAt}`)
console.log(`Risk level: ${activity.riskLevel}`)
console.log(`Current streak: ${activity.currentStreak}`)
```

## 🔒 Security

- RLS on all collections (users see only their own)
- Rate limiting prevents spam
- User suppression honored
- Quiet hours respected
- No raw tokens stored
- Complete audit trail
- All data in transit via HTTPS

## 📈 Performance

- Indexed queries for fast lookups
- Batch processing (10 notifications per run)
- Async delivery doesn't block user actions
- Template caching
- Deduplication prevents duplicates
- Rate limiting prevents overload

## 🚀 Deployment

Deploy to production:

1. Set real API keys in environment
2. Configure Appwrite providers
3. Run database setup script
4. Deploy worker function with schedule
5. Test with real users
6. Monitor delivery logs
7. Adjust rate limits if needed

## 💬 Support

For issues or questions:

1. Check NOTIFICATIONS_SYSTEM.md for details
2. Review PROVIDER_SETUP.md for configuration
3. Check Appwrite function logs
4. Review delivery logs in database
5. Check browser console for client errors

## 📝 License

Part of Peerspark project.

---

**Built with Appwrite. Multi-channel. Intelligent. Scalable.**
