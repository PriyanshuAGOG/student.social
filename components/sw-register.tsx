'use client'

import { useEffect } from 'react'

const SW_UPDATE_READY_EVENT = 'student-social:sw-update-ready'

function announceWaitingWorker(worker: ServiceWorker) {
  window.dispatchEvent(new CustomEvent(SW_UPDATE_READY_EVENT, { detail: { worker } }))
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false
    const handleControllerChange = () => {
      if (refreshing || sessionStorage.getItem('student-social-sw-reload') !== 'true') return
      refreshing = true
      sessionStorage.removeItem('student-social-sw-reload')
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    let registration: ServiceWorkerRegistration | undefined
    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        if (registration.waiting && navigator.serviceWorker.controller) {
          announceWaitingWorker(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration?.installing
          if (!installingWorker) return
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              announceWaitingWorker(installingWorker)
            }
          })
        })

        const checkForUpdate = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            registration?.update().catch(() => undefined)
          }
        }
        document.addEventListener('visibilitychange', checkForUpdate)
        window.addEventListener('online', checkForUpdate)

        return () => {
          document.removeEventListener('visibilitychange', checkForUpdate)
          window.removeEventListener('online', checkForUpdate)
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        return undefined
      }
    }

    let removeUpdateListeners: (() => void) | undefined
    void register().then((cleanup) => {
      removeUpdateListeners = cleanup
    })

    return () => {
      removeUpdateListeners?.()
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
