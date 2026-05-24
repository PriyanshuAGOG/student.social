# Email & Push Provider Setup Guide

Complete setup instructions for configuring email and push notification providers.

## Email Provider: Brevo (Sendinblue)

### Step 1: Create Brevo Account

1. Go to [brevo.com](https://brevo.com)
2. Sign up for free account (free tier: 300 emails/day)
3. Verify your email address

### Step 2: Get SMTP Credentials

1. Dashboard → Settings → SMTP & API
2. Copy these details:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Your login email
   - **Password**: Your SMTP password (create if needed)

### Step 3: Verify Sender Email

1. Dashboard → Senders & Domains
2. Add sender: `notifications@yourdomain.com`
3. Click verification email sent to that address
4. Verify from the email link

### Step 4: Configure in Appwrite

#### Via Appwrite Console:

1. Go to Console → Messaging → Providers
2. Click "Add Provider" → "Email"
3. Select "SMTP"
4. Fill in:
   - **Name**: `brevo-smtp`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Encryption**: TLS (default)
   - **From Email**: `notifications@yourdomain.com`
   - **From Name**: `Peerspark`
   - **Username**: Your Brevo email
   - **Password**: Your SMTP password
5. Click "Create" and copy the Provider ID

#### Via Appwrite CLI:

```bash
appwrite messaging createEmailProvider \
  --providerId=brevo-smtp \
  --name="Brevo SMTP" \
  --host=smtp-relay.brevo.com \
  --port=587 \
  --fromEmail=notifications@yourdomain.com \
  --fromName="Peerspark" \
  --username=your-email@example.com \
  --password=your-smtp-password
```

### Step 5: Update Environment

```env
APPWRITE_EMAIL_PROVIDER_ID=brevo-smtp
```

### Testing Email Provider

```bash
# Send test email via Appwrite
appwrite messaging sendEmail \
  --email=test@example.com \
  --to=recipient@example.com \
  --subject="Test Email" \
  --body="This is a test"
```

### Troubleshooting Email

**Issue**: "provider_missing" in delivery logs
- Verify `APPWRITE_EMAIL_PROVIDER_ID` is set correctly
- Check provider is configured in Appwrite Console
- Verify provider is "active" status

**Issue**: Emails not receiving
- Check spam folder
- Verify sender email is verified in Brevo
- Check Brevo logs for bounces/failures
- Try sending directly from Brevo dashboard first

**Issue**: SMTP authentication failed
- Verify username and password are correct
- Check Brevo SMTP credentials page
- Ensure account is active (not suspended)

---

## Push Provider: Firebase Cloud Messaging

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create project"
3. Project name: `peerspark` (or your app name)
4. Accept terms and create

### Step 2: Register Web App

1. Project → Project Settings
2. Under "Your apps" → Click "Add app" → Web
3. App name: `peerspark-web`
4. Register and copy credentials:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

### Step 3: Enable Cloud Messaging

1. Firebase Console → Cloud Messaging (left menu)
2. Cloud Messaging is automatically enabled
3. Go to "Project settings" → "Cloud Messaging" tab
4. Copy **Server API Key** (you'll need this)

### Step 4: Generate VAPID Key

The VAPID key is needed for web push. Generate it:

#### Via Firebase Admin SDK:

```bash
npm install firebase-admin
```

```javascript
const admin = require('firebase-admin');
const messaging = admin.messaging();

// Generate VAPID key pair
// Use Firebase Console to generate it instead
```

#### Via Firebase Console:

1. Project Settings → Cloud Messaging tab
2. Under "Web push certificates" → Generate keypair
3. Copy the VAPID public key

### Step 5: Create Service Account

1. Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely

### Step 6: Configure in Appwrite

#### Via Appwrite Console:

1. Messaging → Providers
2. Click "Add Provider" → "Push"
3. Select "Firebase Cloud Messaging"
4. Fill in:
   - **Name**: `fcm`
   - **Server API Key**: From Firebase project settings
   - Service account JSON (optional but recommended)
5. Click "Create" and copy Provider ID

#### Via Appwrite CLI:

```bash
appwrite messaging createPushProvider \
  --providerId=fcm \
  --name="Firebase Cloud Messaging" \
  --apiKey=YOUR_SERVER_API_KEY
```

### Step 7: Update Environment

```env
APPWRITE_PUSH_PROVIDER_ID=fcm
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY
```

### Step 8: Register Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
```

### Step 9: Initialize Firebase in App

Create `lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)

export async function registerForPushNotifications(userId: string) {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    if (token) {
      // Save token to database
      await fetch('/api/notifications/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId }),
      })

      // Listen for messages
      onMessage(messaging, (payload) => {
        console.log('Notification received:', payload)
        // Show notification UI or trigger app action
      })
    }
  } catch (error) {
    console.error('Failed to register for push:', error)
  }
}
```

### Step 10: Request Permission

Create a component to request notification permission:

```typescript
'use client'

import { useEffect } from 'react'
import { registerForPushNotifications } from '@/lib/firebase'

export function PushNotificationOptIn() {
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        // Already granted
        registerForPushNotifications('user-id')
      } else if (Notification.permission !== 'denied') {
        // Ask for permission
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            registerForPushNotifications('user-id')
          }
        })
      }
    }
  }, [])

  return null // Silent component
}
```

### Testing Push Notifications

#### Via Firebase Console:

1. Cloud Messaging → Send your first message
2. Notification title/body
3. Target → FCM registration token
4. (Get token from browser console after registering)
5. Click Send

#### Via Appwrite:

```bash
appwrite messaging sendPush \
  --targetId=DEVICE_TOKEN \
  --title="Test" \
  --body="Test message"
```

### Troubleshooting Push

**Issue**: "provider_missing" in logs
- Verify `APPWRITE_PUSH_PROVIDER_ID` is set
- Check provider exists in Appwrite Console
- Verify server API key is correct

**Issue**: Device not registered
- Check browser console for permission grant errors
- Verify service worker is registered
- Check Firebase initialization config

**Issue**: Token not saving
- Verify `/api/notifications/register-device` route exists
- Check database writes permission
- Verify device registration is happening

---

## SMS Provider (Optional)

SMS is disabled by default. To enable:

### Setup Twilio

1. Create account at [twilio.com](https://twilio.com)
2. Get API credentials (Account SID, Auth Token)
3. Get SMS-enabled phone number

### Configure in Appwrite

```bash
appwrite messaging createSMSProvider \
  --providerId=twilio \
  --name="Twilio SMS" \
  --accountSid=YOUR_ACCOUNT_SID \
  --authToken=YOUR_AUTH_TOKEN \
  --fromNumber=YOUR_PHONE_NUMBER
```

### Update Environment

```env
SMS_ENABLED=true
APPWRITE_SMS_PROVIDER_ID=twilio
```

---

## Provider Health Check

Monitor provider status:

### Email Health

```typescript
// Check delivery logs for email status
const emailLogs = await db.listDocuments(
  DATABASE_ID,
  'notification_delivery_logs',
  [Query.equal('channel', 'email')],
  10
)

const successRate = emailLogs.documents.filter(d => d.status === 'sent').length / emailLogs.documents.length
console.log(`Email success rate: ${(successRate * 100).toFixed(2)}%`)
```

### Push Health

```typescript
const pushLogs = await db.listDocuments(
  DATABASE_ID,
  'notification_delivery_logs',
  [Query.equal('channel', 'push')],
  10
)

const successRate = pushLogs.documents.filter(d => d.status === 'sent').length / pushLogs.documents.length
console.log(`Push success rate: ${(successRate * 100).toFixed(2)}%`)
```

---

## Best Practices

### Email
- Use verified sender domains
- Monitor bounce rates
- Keep list clean (remove bounced emails)
- Use appropriate templates
- Include unsubscribe links for compliance

### Push
- Request permission at right time (after user interaction)
- Don't send too many notifications
- Use clear, concise titles and body
- Include actionable CTAs
- Respect quiet hours/user preferences

### SMS (if enabled)
- Limit to critical alerts only
- Comply with SMS regulations (TCPA, GDPR, etc.)
- Verify phone numbers
- Monitor delivery rates

---

## Monitoring

Create a dashboard to monitor all providers:

```typescript
export async function getProviderMetrics() {
  const logs = await db.listDocuments(
    DATABASE_ID,
    'notification_delivery_logs',
    [Query.orderDesc('createdAt')],
    100
  )

  const metrics = {
    total: logs.total,
    byChannel: {},
    byStatus: {},
    successRate: 0,
  }

  logs.documents.forEach(doc => {
    // Count by channel
    metrics.byChannel[doc.channel] = (metrics.byChannel[doc.channel] || 0) + 1

    // Count by status
    metrics.byStatus[doc.status] = (metrics.byStatus[doc.status] || 0) + 1
  })

  // Calculate success rate
  const successful = metrics.byStatus['sent'] || 0
  metrics.successRate = (successful / metrics.total * 100).toFixed(2)

  return metrics
}
```

---

## Maintenance Checklist

- [ ] Email provider quota not exceeded (if using free tier)
- [ ] Firebase credentials still valid
- [ ] Service worker registered and functional
- [ ] VAPID key not shared publicly
- [ ] Sender email verified in Brevo
- [ ] Bounce rates monitored
- [ ] Token refresh working properly
- [ ] Provider API keys rotated quarterly
