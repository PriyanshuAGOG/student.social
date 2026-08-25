'use client'

import { useEffect, useState } from 'react'
import { BellRing, Check, LoaderCircle, X } from 'lucide-react'
import { getCallNotificationStatus, isInstalledPwa, syncCallNotificationSubscription, type CallNotificationStatus } from '@/lib/pwa/call-notifications'

export function CallAlertsPrompt() {
  const [status, setStatus] = useState<CallNotificationStatus>('unsupported')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const next = getCallNotificationStatus()
    setStatus(next)
    if (next === 'enabled') void syncCallNotificationSubscription(false).catch(() => undefined)
    const isAndroidWrapper = localStorage.getItem('student-social-android-version-code') !== null
    if (next === 'prompt' && (isInstalledPwa() || isAndroidWrapper) && sessionStorage.getItem('student-call-alert-prompt-dismissed') !== '1') {
      const timer = window.setTimeout(() => setVisible(true), 1400)
      return () => window.clearTimeout(timer)
    }
  }, [])

  const enable = async () => {
    setBusy(true)
    try {
      const next = await syncCallNotificationSubscription(true)
      setStatus(next)
      if (next === 'enabled') window.setTimeout(() => setVisible(false), 900)
    } catch {
      setStatus(getCallNotificationStatus())
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    sessionStorage.setItem('student-call-alert-prompt-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside className="student-call-alert-prompt" aria-live="polite">
      <span className="student-call-alert-icon">{status === 'enabled' ? <Check aria-hidden="true" /> : <BellRing aria-hidden="true" />}</span>
      <div><strong>{status === 'denied' ? 'Call alerts are blocked' : status === 'enabled' ? 'Call alerts are on' : 'Hear incoming study calls'}</strong><small>{status === 'denied' ? 'Allow notifications in your device settings.' : 'Get a lock-screen alert when the app is closed.'}</small></div>
      {status === 'prompt' ? <button type="button" onClick={enable} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : 'Enable'}</button> : null}
      <button type="button" onClick={dismiss} className="student-call-alert-dismiss" aria-label="Dismiss call alert setup"><X /></button>
    </aside>
  )
}
