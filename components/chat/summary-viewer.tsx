"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function SummaryViewer({ taskId, autoOpen }: { taskId: string | null; autoOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(autoOpen))
  const [task, setTask] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !taskId) return
    let mounted = true
    setLoading(true)
    fetch(`/api/ai/summaries/${encodeURIComponent(taskId)}`)
      .then((r) => r.json())
      .then((payload) => {
        if (!mounted) return
        if (payload?.success) setTask(payload.task)
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [open, taskId])

  if (!taskId) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Preview</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Summary Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {loading ? <p>Loading…</p> : task ? (
            <div className="whitespace-pre-wrap">{task.summary || 'No summary available yet.'}</div>
          ) : (
            <p className="text-muted-foreground">Could not load summary.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
