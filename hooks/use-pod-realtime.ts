"use client"

import { useEffect, useRef, useState } from "react"
import { POD_COLLECTION_IDS } from "@/lib/appwrite/pod-types"
import { subscribeToPodCollections } from "@/lib/pods/realtime"
import { useAuth } from "@/lib/auth-context"

export function usePodRealtime(podId: string, collectionIds: string[], onEvent?: (event: unknown) => void) {
  const { user } = useAuth()
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seen = useRef(new Set<string>())

  useEffect(() => {
    if (!podId || !user?.$id || collectionIds.length === 0) {
      setIsLive(false)
      return
    }

    setError(null)
    const unsubscribe = subscribeToPodCollections(podId, collectionIds, (event: any) => {
      const id = `${event?.payload?.$id || ""}:${(event?.events || []).join("|")}`
      if (id && seen.current.has(id)) return
      if (id) seen.current.add(id)
      setIsLive(true)
      onEvent?.(event)
    })

    setIsLive(true)
    return () => {
      try {
        unsubscribe()
      } catch (err: any) {
        setError(err?.message || "Live updates paused.")
      }
      setIsLive(false)
      seen.current.clear()
    }
  }, [podId, user?.$id, collectionIds.join(","), onEvent])

  return { isLive, error }
}

export function usePodMessagesRealtime(podId: string, channelId: string, onEvent?: (event: unknown) => void) {
  return usePodRealtime(podId, [POD_COLLECTION_IDS.messages, POD_COLLECTION_IDS.messageReactions], (event: any) => {
    if (event?.payload?.channelId && event.payload.channelId !== channelId) return
    onEvent?.(event)
  })
}

export function usePodTasksRealtime(podId: string, onEvent?: (event: unknown) => void) {
  return usePodRealtime(podId, [POD_COLLECTION_IDS.tasks, POD_COLLECTION_IDS.taskSubmissions], onEvent)
}

export function usePodResourcesRealtime(podId: string, onEvent?: (event: unknown) => void) {
  return usePodRealtime(podId, [POD_COLLECTION_IDS.resources], onEvent)
}

export function usePodSessionsRealtime(podId: string, onEvent?: (event: unknown) => void) {
  return usePodRealtime(podId, [POD_COLLECTION_IDS.sessions, POD_COLLECTION_IDS.sessionAttendance], onEvent)
}

export function usePodMembershipRealtime(podId: string, onEvent?: (event: unknown) => void) {
  return usePodRealtime(podId, [POD_COLLECTION_IDS.memberships], onEvent)
}
