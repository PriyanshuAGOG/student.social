"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SummaryViewer } from "@/components/chat/summary-viewer"
import { useToast } from "@/hooks/use-toast"
import type { AiSummaryTask } from "@/hooks/use-ai-summary-tasks"

interface SummaryTaskStatusProps {
  task: AiSummaryTask | null
  isLoading?: boolean
  error?: string | null
  className?: string
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "queued":
      return "Queued"
    case "processing":
      return "Processing"
    case "done":
      return "Done"
    case "failed":
      return "Failed"
    default:
      return "Pending"
  }
}

export function SummaryTaskStatus({ task, isLoading, error, className }: SummaryTaskStatusProps) {
  if (!task && !isLoading && !error) return null

  const status = task?.status || (isLoading ? "processing" : undefined)
  const tone = status === "failed" ? "destructive" : status === "done" ? "default" : "secondary"
  const { toast } = useToast()
  const [retrying, setRetrying] = useState(false)

  return (
    <div className={cn("rounded-xl border bg-muted/30 px-3 py-2 text-xs", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={tone as any} className="uppercase tracking-wide text-[10px]">
          {getStatusLabel(status)}
        </Badge>
        <span className="font-medium">AI summary</span>
        {task?.$id ? <span className="text-muted-foreground">#{task.$id.slice(-6)}</span> : null}
      </div>
      {task?.summary ? <p className="mt-2 line-clamp-2 text-muted-foreground">{task.summary}</p> : null}
      {task?.lastError ? <p className="mt-2 text-destructive">{task.lastError}</p> : null}
      {error ? <p className="mt-2 text-destructive">{error}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        {task?.$id && status === 'done' && (
          <>
            <a href={`/ai/summaries/${task.$id}`} className="underline text-sm">Open full summary</a>
            <SummaryViewer taskId={task.$id} />
          </>
        )}
        {task?.$id && status === 'failed' && (
          <Button size="sm" variant="ghost" onClick={async () => {
            try {
              setRetrying(true)
              const res = await fetch('/api/ai/summaries/retry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task.$id }) })
              const payload = await res.json().catch(() => null)
              if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Retry failed')
              toast({ title: 'Retry queued', description: `New task ${payload.task.$id} queued.` })
            } catch (e: any) {
              toast({ title: 'Retry failed', description: e?.message || 'Please try again', variant: 'destructive' })
            } finally { setRetrying(false) }
          }}>
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
        )}
      </div>
    </div>
  )
}