"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
    </div>
  )
}