/**
 * WebSocket Error Fix
 * 
 * This utility handles graceful WebSocket cleanup to prevent:
 * "WebSocket is already in CLOSING or CLOSED state" errors
 * 
 * The issue occurs when Appwrite realtime subscriptions try to close
 * connections that are already closed. This utility provides safe cleanup.
 */

export class SafeWebSocketManager {
  private subscriptions = new Map<string, any>();
  private isClosing = false;

  /**
   * Add a subscription with safe cleanup tracking
   */
  addSubscription(id: string, subscription: any) {
    this.subscriptions.set(id, subscription);
  }

  /**
   * Remove a subscription safely
   */
  removeSubscription(id: string) {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      try {
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      this.subscriptions.delete(id);
    }
  }

  /**
   * Close all subscriptions safely without throwing errors
   */
  closeAll() {
    if (this.isClosing) return;
    this.isClosing = true;

    for (const [id] of this.subscriptions) {
      this.removeSubscription(id);
    }

    this.subscriptions.clear();
    this.isClosing = false;
  }

  /**
   * Get number of active subscriptions
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }
}

/**
 * Global instance for WebSocket management
 */
let wsManager: SafeWebSocketManager | null = null;

export function getWebSocketManager(): SafeWebSocketManager {
  if (!wsManager) {
    wsManager = new SafeWebSocketManager();
    
    // Clean up on window unload to prevent errors
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        wsManager?.closeAll();
      });
    }
  }
  return wsManager;
}

/**
 * Suppress WebSocket close warnings in development
 * The "WebSocket is already in CLOSING or CLOSED state" message is logged
 * by the browser's WebSocket implementation, not our code
 */
export function suppressWebSocketWarnings() {
  if (typeof window !== 'undefined') {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      const message = String(args[0]);
      if (message.includes('WebSocket') && message.includes('CLOSING')) {
        // Suppress this specific warning
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = String(args[0]);
      if (message.includes('WebSocket') && message.includes('CLOSING')) {
        // Suppress this specific error
        return;
      }
      originalError.apply(console, args);
    };
  }
}
