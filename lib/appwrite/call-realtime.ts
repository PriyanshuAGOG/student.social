'use client'

import { Channel, Realtime } from 'appwrite'
import { client, DATABASE_ID } from '@/lib/appwrite'
import { reportClientError } from '@/components/admin/ClientErrorReporter'

const CALL_SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions'
const CALL_PARTICIPANTS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALL_PARTICIPANTS_COLLECTION_ID || 'call_participants'

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
    [
      Channel.database(DATABASE_ID).collection(CALL_SESSIONS_COLLECTION_ID).document(),
      Channel.database(DATABASE_ID).collection(CALL_PARTICIPANTS_COLLECTION_ID).document(),
    ],
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
    if (!closed) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[calls] Realtime signaling unavailable; recovery polling remains active.', error)
      }
      void reportClientError({
        type: 'network',
        message: `Call realtime signaling unavailable: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: { channel: CALL_SESSIONS_COLLECTION_ID, recoveryPolling: true },
      })
    }
  })

  return () => {
    closed = true
    void subscription?.close?.()
  }
}
