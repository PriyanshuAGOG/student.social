import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireUser } from '@/lib/api-security'
import { createAdminClient } from '@/lib/server/appwrite'
import { PUSH_SUBSCRIPTIONS_PREF_KEY, type StoredPushSubscription } from '@/lib/server/web-push'

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(4096),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
})

const removeSchema = z.object({ endpoint: z.string().url().max(4096) })

function currentSubscriptions(prefs: Record<string, unknown>): StoredPushSubscription[] {
  return Array.isArray(prefs[PUSH_SUBSCRIPTIONS_PREF_KEY])
    ? (prefs[PUSH_SUBSCRIPTIONS_PREF_KEY] as StoredPushSubscription[]).filter((item) => item?.endpoint && item?.keys?.p256dh && item?.keys?.auth)
    : []
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'push:subscribe', max: 12, windowMs: 60_000 })
    const auth = requireUser(req)
    const subscription = await parseJsonBody(req, subscriptionSchema, 8192)
    const { users } = createAdminClient()
    const prefs = await users.getPrefs<Record<string, unknown>>({ userId: auth.userId }).catch(() => ({}))
    const subscriptions = currentSubscriptions(prefs)
    const next = [
      ...subscriptions.filter((item) => item.endpoint !== subscription.endpoint),
      { ...subscription, updatedAt: new Date().toISOString() },
    ].slice(-4)

    await users.updatePrefs({ userId: auth.userId, prefs: { ...prefs, [PUSH_SUBSCRIPTIONS_PREF_KEY]: next } })
    return NextResponse.json({ success: true, devices: next.length }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    return NextResponse.json({ success: false, error: 'Failed to register this device for call alerts' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    const auth = requireUser(req)
    const { endpoint } = await parseJsonBody(req, removeSchema, 8192)
    const { users } = createAdminClient()
    const prefs = await users.getPrefs<Record<string, unknown>>({ userId: auth.userId }).catch(() => ({}))
    const next = currentSubscriptions(prefs).filter((item) => item.endpoint !== endpoint)
    await users.updatePrefs({ userId: auth.userId, prefs: { ...prefs, [PUSH_SUBSCRIPTIONS_PREF_KEY]: next } })
    return NextResponse.json({ success: true, devices: next.length })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    return NextResponse.json({ success: false, error: 'Failed to remove this device from call alerts' }, { status: 500 })
  }
}
