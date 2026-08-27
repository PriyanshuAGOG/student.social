'use client'

import { useEffect } from 'react'

type ClientErrorType = 'runtime' | 'unhandledrejection' | 'console' | 'network' | 'bug_report'
type Breadcrumb = { type: 'interaction' | 'navigation'; action: string; route: string; timestamp: string }

let installed = false
let nativeFetch: typeof window.fetch | null = null
const recentBreadcrumbs: Breadcrumb[] = []
const recentReports = new Map<string, number>()

function safePath(value: string): string {
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? url.pathname : `${url.origin}${url.pathname}`
  } catch {
    return String(value || '').split('?')[0].slice(0, 500)
  }
}

function safeAction(value: string): string {
  if (/^(?:https?:\/\/|\/)/i.test(value)) return safePath(value)
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

function addBreadcrumb(breadcrumb: Breadcrumb) {
  recentBreadcrumbs.push(breadcrumb)
  if (recentBreadcrumbs.length > 20) recentBreadcrumbs.shift()
}

function stringifyConsoleValue(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

async function reportClientError(payload: {
  type: ClientErrorType
  message: string
  stack?: string
  route?: string
  metadata?: Record<string, unknown>
}) {
  const route = payload.route || window.location.pathname
  const reportKey = `${payload.type}:${route}:${payload.message}`
  const now = Date.now()
  if (now - (recentReports.get(reportKey) || 0) < 10_000) return
  recentReports.set(reportKey, now)

  try {
    const send = nativeFetch || window.fetch.bind(window)
    await send('/api/client-errors', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        message: payload.message.slice(0, 1000),
        route,
        userAgent: navigator.userAgent,
        metadata: {
          ...payload.metadata,
          online: navigator.onLine,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          breadcrumbs: recentBreadcrumbs.slice(-12),
        },
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
    nativeFetch = window.fetch.bind(window)
    const originalConsoleError = console.error.bind(console)

    const onError = (event: ErrorEvent) => {
      const resource = event.target instanceof HTMLElement ? event.target : null
      if (resource) {
        const source = (resource as HTMLScriptElement).src || (resource as HTMLLinkElement).href || (resource as HTMLImageElement).currentSrc || ''
        void reportClientError({
          type: 'network',
          message: `Failed to load ${resource.tagName.toLowerCase()} resource`,
          metadata: { resource: safePath(source), tagName: resource.tagName.toLowerCase() },
        })
        return
      }
      void reportClientError({
        type: 'runtime',
        message: event.message || 'Runtime error',
        stack: event.error?.stack,
        metadata: { filename: safePath(event.filename), lineno: event.lineno, colno: event.colno },
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      void reportClientError({
        type: 'unhandledrejection',
        message: reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection'),
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    const onSecurityPolicyViolation = (event: SecurityPolicyViolationEvent) => {
      void reportClientError({
        type: 'network',
        message: `Content Security Policy blocked ${event.violatedDirective}`,
        metadata: {
          blockedUri: safePath(event.blockedURI),
          directive: event.violatedDirective,
          sourceFile: safePath(event.sourceFile),
          lineNumber: event.lineNumber,
          columnNumber: event.columnNumber,
        },
      })
    }

    const onInteraction = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"],input,select,textarea') : null
      if (!target) return
      const action = target.getAttribute('aria-label') || target.getAttribute('name') || target.getAttribute('href') || target.getAttribute('type') || target.tagName.toLowerCase()
      addBreadcrumb({ type: target.tagName === 'A' ? 'navigation' : 'interaction', action: safeAction(action), route: window.location.pathname, timestamp: new Date().toISOString() })
    }

    console.error = (...args: unknown[]) => {
      originalConsoleError(...args)
      const error = args.find((value) => value instanceof Error) as Error | undefined
      void reportClientError({
        type: 'console',
        message: args.map(stringifyConsoleValue).join(' ').slice(0, 1000) || 'Console error',
        stack: error?.stack,
      })
    }

    window.fetch = async (...args: Parameters<typeof window.fetch>) => {
      const startedAt = performance.now()
      const input = args[0]
      const init = args[1]
      const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url
      const requestPath = safePath(url)
      try {
        const response = await nativeFetch!(...args)
        if (!response.ok && !requestPath.includes('/api/client-errors')) {
          void reportClientError({
            type: 'network',
            message: `${init?.method || (input instanceof Request ? input.method : 'GET')} ${requestPath} returned ${response.status}`,
            metadata: {
              status: response.status,
              statusText: response.statusText,
              method: init?.method || (input instanceof Request ? input.method : 'GET'),
              durationMs: Math.round(performance.now() - startedAt),
              correlationId: response.headers.get('x-correlation-id') || response.headers.get('x-vercel-id') || '',
            },
          })
        }
        return response
      } catch (error) {
        if (!requestPath.includes('/api/client-errors')) {
          void reportClientError({
            type: 'network',
            message: `${init?.method || 'GET'} ${requestPath} failed: ${error instanceof Error ? error.message : String(error)}`,
            stack: error instanceof Error ? error.stack : undefined,
            metadata: { durationMs: Math.round(performance.now() - startedAt) },
          })
        }
        throw error
      }
    }

    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('securitypolicyviolation', onSecurityPolicyViolation)
    document.addEventListener('click', onInteraction, true)

    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('securitypolicyviolation', onSecurityPolicyViolation)
      document.removeEventListener('click', onInteraction, true)
      console.error = originalConsoleError
      if (nativeFetch) window.fetch = nativeFetch
      nativeFetch = null
      installed = false
    }
  }, [])

  return null
}

export { reportClientError }
