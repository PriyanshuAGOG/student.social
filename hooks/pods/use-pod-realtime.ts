"use client"

import { useEffect, useRef, useState } from "react"
import { client, DATABASE_ID } from "@/lib/appwrite"
import { POD_COLLECTIONS } from "@/lib/pods/types"

type RealtimeState = {
  connected: boolean
  error: string | null
  lastEventId: string | null
}

function useRealtimeChannels(enabled: boolean, channels: string[], onEvent?: (event: any) => void): RealtimeState {
  const seen = useRef(new Set<string>())
  const [state, setState] = useState<RealtimeState>({ connected: false, error: null, lastEventId: null })

  useEffect(() => {
    if (!enabled || !channels.length || typeof client?.subscribe !== "function") return
    let unsubscribe: undefined | (() => void)
    try {
      unsubscribe = client.subscribe(channels as any, (event: any) => {
        const eventId = `${event?.timestamp || ""}:${event?.payload?.$id || ""}:${event?.events?.join("|") || ""}`
        if (seen.current.has(eventId)) return
        seen.current.add(eventId)
        setState({ connected: true, error: null, lastEventId: eventId })
        onEvent?.(event)
      }) as any
      setState((prev) => ({ ...prev, connected: true, error: null }))
    } catch (error: any) {
      setState({ connected: false, error: error?.message || "Live updates paused. Reconnecting...", lastEventId: null })
    }
    return () => {
      try {
        unsubscribe?.()
      } catch {
        setState((prev) => ({ ...prev, connected: false }))
      }
    }
  }, [enabled, channels.join("|")])

  return state
}

const collectionChannel = (collectionId: string) => `databases.${DATABASE_ID}.collections.${collectionId}.documents`

export function usePodRealtime(podId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) {
  return useRealtimeChannels(Boolean(podId && authenticated), [
    collectionChannel(POD_COLLECTIONS.memberships),
    collectionChannel(POD_COLLECTIONS.roadmapItems),
    collectionChannel(POD_COLLECTIONS.tasks),
    collectionChannel(POD_COLLECTIONS.taskSubmissions),
    collectionChannel(POD_COLLECTIONS.sessions),
    collectionChannel(POD_COLLECTIONS.resources),
    collectionChannel(POD_COLLECTIONS.checkins),
    collectionChannel(POD_COLLECTIONS.channels),
    collectionChannel(POD_COLLECTIONS.messages),
    collectionChannel(POD_COLLECTIONS.reactions),
  ], (event) => {
    if (event?.payload?.podId && event.payload.podId !== podId) return
    onEvent?.(event)
  })
}

export function usePodMessagesRealtime(podId: string | undefined, channelId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) {
  return useRealtimeChannels(Boolean(podId && channelId && authenticated), [collectionChannel(POD_COLLECTIONS.messages), collectionChannel(POD_COLLECTIONS.reactions)], (event) => {
    if (event?.payload?.podId && event.payload.podId !== podId) return
    if (event?.payload?.channelId && event.payload.channelId !== channelId) return
    onEvent?.(event)
  })
}

export const usePodTasksRealtime = (podId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) =>
  useRealtimeChannels(Boolean(podId && authenticated), [collectionChannel(POD_COLLECTIONS.tasks), collectionChannel(POD_COLLECTIONS.taskSubmissions)], onEvent)

export const usePodResourcesRealtime = (podId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) =>
  useRealtimeChannels(Boolean(podId && authenticated), [collectionChannel(POD_COLLECTIONS.resources)], onEvent)

export const usePodSessionsRealtime = (podId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) =>
  useRealtimeChannels(Boolean(podId && authenticated), [collectionChannel(POD_COLLECTIONS.sessions)], onEvent)

export const usePodMembershipRealtime = (podId: string | undefined, authenticated: boolean, onEvent?: (event: any) => void) =>
  useRealtimeChannels(Boolean(podId && authenticated), [collectionChannel(POD_COLLECTIONS.memberships)], onEvent)
