import 'server-only'

import webPush from 'web-push'
import type { Users } from 'node-appwrite'

export const PUSH_SUBSCRIPTIONS_PREF_KEY = 'studentSocialPushSubscriptions'

export interface StoredPushSubscription {
  endpoint: string
  expirationTime?: number | null
  keys: { p256dh: string; auth: string }
  updatedAt?: string
}

interface IncomingCallPush {
  sessionId: string
  callerName: string
  callerAvatar?: string | null
  mediaType: 'voice' | 'video'
  joinUrl: string
}

function configured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY)
}

function configureVapid(): void {
  webPush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app',
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
    process.env.WEB_PUSH_PRIVATE_KEY!,
  )
}

export async function sendIncomingCallPush(users: Users, userId: string, call: IncomingCallPush) {
  if (!configured()) return { sent: 0, disabled: true }
  configureVapid()

  const prefs = await users.getPrefs<Record<string, unknown>>({ userId }).catch(() => ({} as Record<string, unknown>))
  const subscriptions = Array.isArray(prefs[PUSH_SUBSCRIPTIONS_PREF_KEY])
    ? (prefs[PUSH_SUBSCRIPTIONS_PREF_KEY] as StoredPushSubscription[])
    : []
  if (!subscriptions.length) return { sent: 0, disabled: false }

  const payload = JSON.stringify({
    type: 'incoming-call',
    title: `${call.callerName} is calling`,
    body: `Incoming ${call.mediaType === 'video' ? 'video' : 'voice'} call on Student.social`,
    tag: `student-call-${call.sessionId}`,
    requireInteraction: true,
    data: {
      callId: call.sessionId,
      callerName: call.callerName,
      callerAvatar: call.callerAvatar || null,
      mediaType: call.mediaType,
      url: call.joinUrl,
    },
  })

  const expired = new Set<string>()
  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(subscription, payload, {
        TTL: 60,
        urgency: 'high',
        topic: `call-${call.sessionId}`.slice(0, 32),
        timeout: 5000,
      })
      return true
    } catch (error: any) {
      if ([404, 410].includes(Number(error?.statusCode))) expired.add(subscription.endpoint)
      throw error
    }
  }))

  if (expired.size) {
    await users.updatePrefs({
      userId,
      prefs: {
        ...prefs,
        [PUSH_SUBSCRIPTIONS_PREF_KEY]: subscriptions.filter((subscription) => !expired.has(subscription.endpoint)),
      },
    }).catch(() => undefined)
  }

  return { sent: results.filter((result) => result.status === 'fulfilled').length, disabled: false }
}

export async function sendCallResolvedPush(users: Users, userId: string, call: { sessionId: string; roomTitle?: string | null }) {
  if (!configured()) return { sent: 0, disabled: true }
  configureVapid()
  const prefs = await users.getPrefs<Record<string, unknown>>({ userId }).catch(() => ({} as Record<string, unknown>))
  const subscriptions = Array.isArray(prefs[PUSH_SUBSCRIPTIONS_PREF_KEY])
    ? (prefs[PUSH_SUBSCRIPTIONS_PREF_KEY] as StoredPushSubscription[])
    : []
  if (!subscriptions.length) return { sent: 0, disabled: false }

  const payload = JSON.stringify({
    type: 'call-resolved',
    title: 'Missed Student.social call',
    body: `${call.roomTitle || 'Your study call'} is no longer ringing.`,
    tag: `student-call-${call.sessionId}`,
    requireInteraction: false,
    data: { url: '/app/chat' },
  })
  const results = await Promise.allSettled(subscriptions.map((subscription) => webPush.sendNotification(subscription, payload, {
    TTL: 60,
    urgency: 'normal',
    topic: `call-${call.sessionId}`.slice(0, 32),
    timeout: 5000,
  })))
  return { sent: results.filter((result) => result.status === 'fulfilled').length, disabled: false }
}
