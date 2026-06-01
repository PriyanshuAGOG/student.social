"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export type AiSummaryTaskStatus = "queued" | "processing" | "done" | "failed" | string

export interface AiSummaryTask {
  $id: string
  roomId?: string
  messageIds?: string[]
  requestedBy?: string | null
  summaryType?: string
  status?: AiSummaryTaskStatus
  summary?: string | null
  lastError?: string | null
  createdAt?: string
  updatedAt?: string
  processedAt?: string
}

export function useAiSummaryTasks(roomId: string) {
  const [tasks, setTasks] = useState<AiSummaryTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!roomId) {
      setTasks([])
      setError(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai/summaries?roomId=${encodeURIComponent(roomId)}`, {
        credentials: "include",
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Failed to load summary tasks (${response.status})`)
      }

      setTasks(Array.isArray(payload.tasks) ? payload.tasks : [])
      setError(null)
    } catch (err: any) {
      setError(err?.message || "Failed to load summary tasks")
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    loadTasks()
    if (!roomId) return

    const interval = setInterval(loadTasks, 4000)
    return () => clearInterval(interval)
  }, [roomId, loadTasks])

  const latestTask = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.processedAt || a.createdAt || 0).getTime()
      const bTime = new Date(b.updatedAt || b.processedAt || b.createdAt || 0).getTime()
      return bTime - aTime
    })[0] || null
  }, [tasks])

  return {
    tasks,
    latestTask,
    isLoading,
    error,
    refresh: loadTasks,
  }
}