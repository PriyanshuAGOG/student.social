'use client'

import { Channel, Realtime } from 'appwrite'
import { client, DATABASE_ID } from '@/lib/appwrite'

const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'

/**
 * Fast-path call signaling. Appwrite document permissions ensure clients only
 * receive sessions for rooms they belong to. The API poll remains the recovery
 * path after sleep, network changes, or a missed socket event.
 */
export function subscribeToCallSessions(onChange: (session: any) => void) {
  const realtime = new Realtime(client)
  let closed = false
  let subscription: { close?: () => Promise<void> | void } | null = null

  realtime.subscribe(
    Channel.database(DATABASE_ID).collection(CALL_SESSIONS_COLLECTION_ID).document(),
    (event) => {
      if (!closed) onChange(event.payload)
    },
  ).then((next) => {
    if (closed) {
      void next.close()
      return
    }
    subscription = next
  }).catch((error) => {
    if (!closed && process.env.NODE_ENV === 'development') {
      console.warn('[calls] Realtime signaling unavailable; recovery polling remains active.', error)
    }
  })

  return () => {
    closed = true
    void subscription?.close?.()
  }
}
