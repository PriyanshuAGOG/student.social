"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { presenceService } from "@/lib/appwrite"

interface PresenceEntry {
  userId?: string
  isOnline?: boolean
  isTyping?: boolean
  lastSeenAt?: string
  updatedAt?: string
}

const PRESENCE_HEARTBEAT_MS = 30_000
const PRESENCE_MIN_UPDATE_MS = 3_000
const PRESENCE_MAX_RETRIES = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withPresenceRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < PRESENCE_MAX_RETRIES; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < PRESENCE_MAX_RETRIES - 1) {
        await sleep(500 * 2 ** attempt)
      }
    }
  }

  throw lastError
}

export function useChatPresence(roomId: string, userId?: string) {
  const [presenceEntries, setPresenceEntries] = useState<PresenceEntry[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPresenceUpdateRef = useRef(0)

  const upsertPresence = useCallback((entry: PresenceEntry) => {
    if (!entry?.userId) return
    setPresenceEntries((prev) => {
      const next = [...prev]
      const index = next.findIndex((candidate) => candidate.userId === entry.userId)
      if (index >= 0) {
        next[index] = { ...next[index], ...entry }
      } else {
        next.push(entry)
      }
      return next
    })
  }, [])

  const sendPresence = useCallback(
    async (options: { isTyping?: boolean; isOnline?: boolean }, force = false) => {
      if (!roomId || !userId) return

      const now = Date.now()
      if (!force && now - lastPresenceUpdateRef.current < PRESENCE_MIN_UPDATE_MS) return
      lastPresenceUpdateRef.current = now

      try {
        await withPresenceRetry(() => presenceService.updatePresence(roomId, options))
      } catch {
        // Presence is non-critical; failures must never block chat UI or surface as unhandled promises.
      }
    },
    [roomId, userId],
  )

  useEffect(() => {
    if (!roomId || !userId) return

    let cancelled = false
    setPresenceEntries([])
    lastPresenceUpdateRef.current = 0

    void withPresenceRetry(() => presenceService.getPresence(roomId))
      .then((entries) => {
        if (cancelled) return
        setPresenceEntries(Array.isArray(entries) ? entries : [])
      })
      .catch(() => {
        // Presence reads are non-critical and should silently fail after retries.
      })

    const unsubscribe = presenceService.subscribeToPresence(roomId, (entry: PresenceEntry) => {
      if (cancelled) return
      upsertPresence(entry)
    })

    void sendPresence({ isOnline: true, isTyping: false }, true)

    const heartbeat = setInterval(() => {
      void sendPresence({ isOnline: true, isTyping: false }, true)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void sendPresence({ isOnline: false, isTyping: false }, true)
      } else {
        void sendPresence({ isOnline: true, isTyping: false }, true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(heartbeat)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      void sendPresence({ isOnline: false, isTyping: false }, true)
      unsubscribe()
    }
  }, [roomId, userId, upsertPresence, sendPresence])

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !userId) return
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      void sendPresence({ isOnline: true, isTyping }, false)

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          void sendPresence({ isOnline: true, isTyping: false }, true)
        }, 1500)
      }
    },
    [roomId, userId, sendPresence],
  )

  const otherTypingEntries = useMemo(
    () => presenceEntries.filter((entry) => entry.userId !== userId && entry.isTyping),
    [presenceEntries, userId],
  )

  const onlineEntries = useMemo(
    () => presenceEntries.filter((entry) => entry.isOnline),
    [presenceEntries],
  )

  return {
    presenceEntries,
    otherTypingEntries,
    onlineEntries,
    otherTypingCount: otherTypingEntries.length,
    isSomeoneTyping: otherTypingEntries.length > 0,
    setTyping,
  }
}
