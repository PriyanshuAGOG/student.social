'use client'

export type CallNotificationStatus = 'unsupported' | 'unconfigured' | 'prompt' | 'denied' | 'enabled'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || ''

function decodeApplicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

export function isInstalledPwa(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function getCallNotificationStatus(): CallNotificationStatus {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (!PUBLIC_KEY) return 'unconfigured'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'prompt'
  return 'enabled'
}

export async function syncCallNotificationSubscription(requestPermission = false): Promise<CallNotificationStatus> {
  const initialStatus = getCallNotificationStatus()
  if (initialStatus === 'unsupported' || initialStatus === 'unconfigured' || initialStatus === 'denied') return initialStatus

  if (Notification.permission !== 'granted') {
    if (!requestPermission) return 'prompt'
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'prompt'
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeApplicationServerKey(PUBLIC_KEY),
  })

  const response = await fetch('/api/push/subscription', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok) throw new Error('Could not enable call alerts on this device')
  return 'enabled'
}

export async function closeCallNotification(callId: string): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready.catch(() => null)
  registration?.active?.postMessage({ type: 'CALL_RESOLVED', callId })
}
