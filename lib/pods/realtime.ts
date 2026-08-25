"use client"

import { client, DATABASE_ID } from "@/lib/appwrite"

export function subscribeToPodCollections(
  podId: string,
  collectionIds: string[],
  callback: (event: unknown) => void,
) {
  if (!podId || typeof client.subscribe !== "function") return () => {}
  const channels = collectionIds.map(
    (collectionId) => `databases.${DATABASE_ID}.collections.${collectionId}.documents`,
  )
  const unsubscribe = client.subscribe(channels as any, (event: any) => {
    const payload = event?.payload || {}
    if (payload.podId && payload.podId !== podId) return
    callback(event)
  })
  return typeof unsubscribe === "function" ? unsubscribe : () => {}
}
