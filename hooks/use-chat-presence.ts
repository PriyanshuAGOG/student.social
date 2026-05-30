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

export function useChatPresence(roomId: string, userId?: string) {
  const [presenceEntries, setPresenceEntries] = useState<PresenceEntry[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (!roomId || !userId) return

    let cancelled = false
    setPresenceEntries([])
    void presenceService.getPresence(roomId)
      .then((entries) => {
        if (cancelled) return
        setPresenceEntries(Array.isArray(entries) ? entries : [])
      })
      .catch((error) => {
        console.error("Failed to load chat presence:", error)
      })

    const unsubscribe = presenceService.subscribeToPresence(roomId, (entry: PresenceEntry) => {
      if (cancelled) return
      upsertPresence(entry)
    })

    void presenceService.updatePresence(roomId, { isOnline: true, isTyping: false })

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void presenceService.updatePresence(roomId, { isOnline: false, isTyping: false })
      } else {
        void presenceService.updatePresence(roomId, { isOnline: true, isTyping: false })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      void presenceService.updatePresence(roomId, { isOnline: false, isTyping: false })
      unsubscribe()
    }
  }, [roomId, userId, upsertPresence])

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !userId) return
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      void presenceService.updatePresence(roomId, { isOnline: true, isTyping })

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          void presenceService.updatePresence(roomId, { isOnline: true, isTyping: false })
        }, 1500)
      }
    },
    [roomId, userId],
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
