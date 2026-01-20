/**
 * Accessibility Utilities
 * 
 * Helpers for ensuring proper focus management and accessibility
 * compliance throughout the application.
 */

/**
 * Blur active element before opening a modal/dialog
 * This prevents the "aria-hidden on focused element" warning from Radix
 */
export function blurActiveElement(): void {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

/**
 * Safely focus an element, checking if it's focusable
 */
export function safeFocus(element: HTMLElement | null): void {
  if (!element) return
  
  // Check if element is focusable
  const focusableSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  
  if (element.matches(focusableSelector)) {
    element.focus()
  } else {
    // Try to find the first focusable child
    const focusable = element.querySelector<HTMLElement>(focusableSelector)
    focusable?.focus()
  }
}

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void
  deactivate: () => void
} {
  const focusableSelector = 
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  
  let previouslyFocused: HTMLElement | null = null
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    
    const focusable = container.querySelectorAll<HTMLElement>(focusableSelector)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }
  
  return {
    activate: () => {
      previouslyFocused = document.activeElement as HTMLElement
      container.addEventListener('keydown', handleKeyDown)
      
      // Focus first focusable element
      const focusable = container.querySelectorAll<HTMLElement>(focusableSelector)
      focusable[0]?.focus()
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }
}

/**
 * Generate a unique ID for accessibility purposes
 */
export function generateA11yId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Announce a message to screen readers using a live region
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return
  
  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  announcer.textContent = message
  
  document.body.appendChild(announcer)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer)
  }, 1000)
}

/**
 * Hook for managing keyboard shortcuts
 */
export function setupKeyboardShortcuts(shortcuts: {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  handler: () => void
}[]): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleKeyDown = (e: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!e.ctrlKey === !!shortcut.ctrlKey &&
        !!e.shiftKey === !!shortcut.shiftKey
      ) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Skip link component helper - returns skip link element properties
 */
export function getSkipLinkProps(targetId: string): {
  href: string
  onClick: (e: React.MouseEvent) => void
} {
  return {
    href: `#${targetId}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }
}
