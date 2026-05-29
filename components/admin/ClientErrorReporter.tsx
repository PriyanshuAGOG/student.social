'use client'

import { useEffect } from 'react'

let installed = false

async function reportClientError(payload: {
  type: 'runtime' | 'unhandledrejection' | 'console' | 'network' | 'bug_report'
  message: string
  stack?: string
  route?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await fetch('/api/client-errors', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        route: payload.route || window.location.pathname,
        userAgent: navigator.userAgent,
      }),
    })
  } catch {
    // Error reporting must never break the product experience.
  }
}

export function ClientErrorReporter() {
  useEffect(() => {
    if (installed || typeof window === 'undefined') return
    installed = true

    const onError = (event: ErrorEvent) => {
      reportClientError({
        type: 'runtime',
        message: event.message || 'Runtime error',
        stack: event.error?.stack,
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      reportClientError({
        type: 'unhandledrejection',
        message: reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection'),
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      installed = false
    }
  }, [])

  return null
}

export { reportClientError }
