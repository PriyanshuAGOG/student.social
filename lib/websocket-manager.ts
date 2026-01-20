/**
 * WebSocket Manager for Appwrite Realtime
 * 
 * Provides robust handling for:
 * - Graceful subscription cleanup
 * - Reconnection with exponential backoff
 * - Heartbeat monitoring
 * - Preventing "WebSocket already in CLOSING or CLOSED state" errors
 */

interface SubscriptionInfo {
  subscription: any
  channel: string
  callback: (payload: any) => void
  createdAt: number
}

export class SafeWebSocketManager {
  private subscriptions = new Map<string, SubscriptionInfo>()
  private isClosing = false
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>()
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>()
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 5
  private baseReconnectDelay = 1000
  private maxReconnectDelay = 30000

  /**
   * Add a subscription with safe cleanup tracking
   */
  addSubscription(id: string, subscription: any, channel?: string, callback?: (payload: any) => void) {
    // Clean up existing subscription if any
    this.removeSubscription(id)
    
    this.subscriptions.set(id, {
      subscription,
      channel: channel || id,
      callback: callback || (() => {}),
      createdAt: Date.now(),
    })
    
    // Start heartbeat monitoring for this subscription
    this.startHeartbeat(id)
  }

  /**
   * Start heartbeat monitoring for a subscription
   */
  private startHeartbeat(id: string) {
    // Clear any existing heartbeat
    this.stopHeartbeat(id)
    
    // Only start heartbeat in browser environment
    if (typeof window === 'undefined') return
    
    // Check subscription health every 30 seconds
    const interval = setInterval(() => {
      const info = this.subscriptions.get(id)
      if (!info) {
        this.stopHeartbeat(id)
        return
      }
      
      // Check if subscription is still active (basic check)
      if (info.subscription && typeof info.subscription === 'function') {
        // Subscription is still a valid unsubscribe function
        return
      }
      
      // If subscription object exists but seems stale (>5 min old without activity)
      const age = Date.now() - info.createdAt
      if (age > 5 * 60 * 1000) {
        console.debug(`[WebSocket] Subscription ${id} may be stale (age: ${Math.round(age / 1000)}s)`)
      }
    }, 30000)
    
    this.heartbeatIntervals.set(id, interval)
  }

  /**
   * Stop heartbeat monitoring for a subscription
   */
  private stopHeartbeat(id: string) {
    const interval = this.heartbeatIntervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.heartbeatIntervals.delete(id)
    }
  }

  /**
   * Remove a subscription safely
   */
  removeSubscription(id: string) {
    // Stop heartbeat first
    this.stopHeartbeat(id)
    
    // Clear any pending reconnect
    const reconnectTimeout = this.reconnectTimeouts.get(id)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      this.reconnectTimeouts.delete(id)
    }
    
    // Reset reconnect attempts
    this.reconnectAttempts.delete(id)
    
    const info = this.subscriptions.get(id)
    if (info) {
      try {
        // Handle both function-style and object-style subscriptions
        if (typeof info.subscription === 'function') {
          info.subscription() // Call unsubscribe function
        } else if (typeof info.subscription?.unsubscribe === 'function') {
          info.subscription.unsubscribe()
        }
      } catch (e) {
        // Ignore cleanup errors - WebSocket may already be closed
        console.debug(`[WebSocket] Cleanup notice for ${id}:`, (e as Error)?.message || e)
      }
      this.subscriptions.delete(id)
    }
  }

  /**
   * Close all subscriptions safely without throwing errors
   */
  closeAll() {
    if (this.isClosing) return
    this.isClosing = true

    // Stop all heartbeats first
    for (const [id] of this.heartbeatIntervals) {
      this.stopHeartbeat(id)
    }

    // Clear all reconnect timeouts
    for (const [, timeout] of this.reconnectTimeouts) {
      clearTimeout(timeout)
    }
    this.reconnectTimeouts.clear()
    this.reconnectAttempts.clear()

    // Remove all subscriptions
    for (const [id] of this.subscriptions) {
      try {
        this.removeSubscription(id)
      } catch (e) {
        // Ignore individual cleanup errors
      }
    }

    this.subscriptions.clear()
    this.isClosing = false
  }

  /**
   * Get number of active subscriptions
   */
  getActiveCount(): number {
    return this.subscriptions.size
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id)
  }

  /**
   * Get subscription info (for debugging)
   */
  getSubscriptionInfo(id: string): { channel: string; age: number } | null {
    const info = this.subscriptions.get(id)
    if (!info) return null
    return {
      channel: info.channel,
      age: Date.now() - info.createdAt,
    }
  }

  /**
   * Schedule a reconnection with exponential backoff
   */
  scheduleReconnect(id: string, reconnectFn: () => Promise<void>): void {
    // Clear any existing reconnect timeout
    const existingTimeout = this.reconnectTimeouts.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const attempts = (this.reconnectAttempts.get(id) || 0) + 1
    this.reconnectAttempts.set(id, attempts)

    if (attempts > this.maxReconnectAttempts) {
      console.error(`[WebSocket] Max reconnect attempts reached for ${id}`)
      return
    }

    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, attempts - 1) + Math.random() * 1000,
      this.maxReconnectDelay
    )

    console.log(`[WebSocket] Scheduling reconnect for ${id} in ${Math.round(delay)}ms (attempt ${attempts})`)

    const timeout = setTimeout(async () => {
      this.reconnectTimeouts.delete(id)
      try {
        await reconnectFn()
        // Reset attempts on successful reconnect
        this.reconnectAttempts.delete(id)
        console.log(`[WebSocket] Reconnected ${id} successfully`)
      } catch (e) {
        console.error(`[WebSocket] Reconnect failed for ${id}:`, e)
        // Schedule another attempt
        this.scheduleReconnect(id, reconnectFn)
      }
    }, delay)

    this.reconnectTimeouts.set(id, timeout)
  }
}

/**
 * Global instance for WebSocket management
 */
let wsManager: SafeWebSocketManager | null = null
let visibilityHandler: (() => void) | null = null

export function getWebSocketManager(): SafeWebSocketManager {
  if (!wsManager) {
    wsManager = new SafeWebSocketManager()
    
    // Clean up on window unload to prevent errors
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        wsManager?.closeAll()
      })

      // Handle tab visibility changes for better connection management
      visibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
          // Could pause non-critical subscriptions here
          console.debug('[WebSocket] Tab hidden, active subscriptions:', wsManager?.getActiveCount())
        } else {
          // Tab is visible again - subscriptions should auto-reconnect
          console.debug('[WebSocket] Tab visible, active subscriptions:', wsManager?.getActiveCount())
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }
  return wsManager
}

/**
 * Clean up the global WebSocket manager instance
 */
export function destroyWebSocketManager(): void {
  if (wsManager) {
    wsManager.closeAll()
    wsManager = null
  }
  if (typeof window !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
}

/**
 * Suppress noisy WebSocket close warnings
 * These are browser-level messages that can't be prevented at the WebSocket API level
 */
let warningsSuppressed = false

export function suppressWebSocketWarnings(): void {
  if (typeof window === 'undefined' || warningsSuppressed) return
  
  warningsSuppressed = true
  const originalWarn = console.warn
  const originalError = console.error

  const shouldSuppress = (message: string): boolean => {
    return (
      (message.includes('WebSocket') && message.includes('CLOSING')) ||
      (message.includes('WebSocket') && message.includes('CLOSED')) ||
      message.includes('Realtime got disconnected') ||
      message.includes('Server Error') && message.includes('realtime')
    )
  }

  console.warn = (...args: any[]) => {
    const message = String(args[0] || '')
    if (shouldSuppress(message)) {
      // Log as debug instead of warning
      console.debug('[WebSocket suppressed]', ...args)
      return
    }
    originalWarn.apply(console, args)
  }

  console.error = (...args: any[]) => {
    const message = String(args[0] || '')
    if (shouldSuppress(message)) {
      // Log as debug instead of error
      console.debug('[WebSocket suppressed]', ...args)
      return
    }
    originalError.apply(console, args)
  }
}

/**
 * Initialize WebSocket management with default settings
 * Call this once on app startup
 */
export function initializeWebSocketManager(): SafeWebSocketManager {
  suppressWebSocketWarnings()
  return getWebSocketManager()
}
