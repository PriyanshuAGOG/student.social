"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { callService } from "@/lib/appwrite"
import { formatChatTimestamp } from "@/lib/chat-domain"
import { Loader2, Phone, Video, Clock3, ExternalLink } from "lucide-react"

interface CallHistoryDialogProps {
  roomId: string
  roomName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CallHistoryDialog({ roomId, roomName, open, onOpenChange }: CallHistoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!open || !roomId) return

    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const history = await callService.getRoomCallHistory(roomId, 20)
        if (!cancelled) {
          setSessions(Array.isArray(history.documents) ? history.documents : [])
        }
      } catch (error) {
        console.error("Failed to load call history", error)
        if (!cancelled) setSessions([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, roomId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Call history</DialogTitle>
          <DialogDescription>
            Recent voice and video sessions for {roomName}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No call history yet.
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.$id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {session.mediaType === "voice" ? (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="font-medium text-sm truncate">
                          {session.mediaType === "voice" ? "Voice call" : "Video call"}
                        </p>
                        <Badge variant={session.state === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                          {session.state}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        <span>{formatChatTimestamp(session.startedAt || session.createdAt || new Date().toISOString())}</span>
                        {session.participantIds?.length ? <span>• {session.participantIds.length} participants</span> : null}
                      </div>
                    </div>
                    {session.joinUrl && (
                      <Button size="sm" variant="outline" onClick={() => window.open(session.joinUrl, "_blank", "noopener,noreferrer") }>
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
