"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Clock3, Loader2, MessageSquare, Phone, Search, Send, User, Video } from "lucide-react"
import { CallHistoryDialog } from "@/components/chat/call-history-dialog"
import { MessageActionsMenu, type ChatMessageActionTarget } from "@/components/chat/message-actions-menu"
import { useAuth } from "@/lib/auth-context"
import { callService, chatService, profileService } from "@/lib/appwrite"
import { attachReplyTargets, formatChatTimestamp, normalizeChatMessage } from "@/lib/chat-domain"
import { useToast } from "@/hooks/use-toast"
import { useChatPresence } from "@/hooks/use-chat-presence"

interface Message {
  $id: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
  type?: string
  replyTo?: string | null
  replyToMessage?: Message | null
  isEdited?: boolean
  fileUrl?: string | null
  fileName?: string | null
  clientMessageId?: string
  readBy?: string[]
  metadata?: Record<string, any>
  deletedAt?: string | null
  deliveryState?: string
}

export default function DirectMessagePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const targetUserId = params.userId as string

  const [targetProfile, setTargetProfile] = useState<any>(null)
  const [roomId, setRoomId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [selfProfile, setSelfProfile] = useState<any>(null)
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const endRef = useRef<HTMLDivElement>(null)
  const { presenceEntries, isSomeoneTyping, setTyping } = useChatPresence(roomId, user?.$id)

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!inputValue.trim()) {
      setTyping(false)
      return
    }

    setTyping(true)
  }, [inputValue, setTyping])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!user?.$id) {
        router.push("/login")
        return
      }
      if (!targetUserId) return

      setIsLoading(true)
      try {
        const [profile, self] = await Promise.all([
          targetUserId ? profileService.getProfile(targetUserId) : Promise.resolve(null),
          profileService.getProfile(user.$id),
        ])
        if (!cancelled) {
          setTargetProfile(profile)
          setSelfProfile(self)
        }

        const room = await chatService.getOrCreateDirectRoom(user.$id, targetUserId)
        if (cancelled) return
        setRoomId(room.$id)
        await loadMessages(room.$id, true, { selfProfile: self, targetProfile: profile })
      } catch (err: any) {
        if (!cancelled) {
          toast({ title: "Direct message unavailable", description: err?.message || "Try again later.", variant: "destructive" })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [targetUserId, user?.$id, router, toast])

  useEffect(() => {
    if (!roomId) return
    const interval = setInterval(() => loadMessages(roomId, false), 2500)
    return () => clearInterval(interval)
  }, [roomId])

  const loadMessages = async (
    rid: string,
    firstLoad = false,
    profiles?: { selfProfile?: any; targetProfile?: any }
  ) => {
    try {
      if (!firstLoad) setIsSyncing(true)
      const res = await chatService.getMessages(rid, 100, 0)
      const docs = attachReplyTargets(res.documents || [])
      const self = (profiles?.selfProfile ?? selfProfile) as any
      const target = (profiles?.targetProfile ?? targetProfile) as any
      const selfName = self?.name || user?.name
      const selfAvatar = self?.avatar || "/placeholder.svg"
      const enriched: Message[] = docs.map((msg: any): Message => {
        const normalized = normalizeChatMessage(msg)
        return {
          ...normalized,
          content: normalized.content || "",
          timestamp: normalized.timestamp,
          authorName: normalized.authorName || (normalized.authorId === user?.$id ? selfName : target?.name) || "User",
          authorAvatar: normalized.authorAvatar || (normalized.authorId === user?.$id ? selfAvatar : target?.avatar) || "/placeholder.svg",
        }
      })
      setMessages(enriched)
    } catch (err) {
      console.error("DM load failed", err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !roomId || !user?.$id) return
    setIsSending(true)
    try {
      const senderProfile = selfProfile ?? (await profileService.getProfile(user.$id))
      if (!selfProfile && senderProfile) setSelfProfile(senderProfile)
      const senderName = senderProfile?.name || user.name || "You"
      const senderAvatar = senderProfile?.avatar || "/placeholder.svg"

      const msg = await chatService.sendMessage(roomId, user.$id, inputValue.trim(), {
        senderName,
        senderAvatar,
        replyTo: replyingTo?.$id || null,
      })
      const newMessage: Message = {
        ...msg,
        content: msg.content || inputValue.trim(),
        authorId: user.$id,
        authorName: senderName,
        authorAvatar: senderAvatar,
        timestamp: msg.timestamp || msg.$createdAt || new Date().toISOString(),
        replyTo: replyingTo?.$id || null,
        replyToMessage: replyingTo,
      }
      setMessages((prev: Message[]) => [...prev, newMessage])
      setInputValue("")
      setReplyingTo(null)
      setTyping(false)
      scrollToBottom()
    } catch (err: any) {
      toast({ title: "Failed to send", description: err?.message || "Try again", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const handleRetry = async (message: any) => {
    if (!roomId || !user?.$id || !message?.clientMessageId) return

    setIsSending(true)
    try {
      const senderProfile = selfProfile ?? (await profileService.getProfile(user.$id))
      if (!selfProfile && senderProfile) setSelfProfile(senderProfile)
      const senderName = senderProfile?.name || user.name || "You"
      const senderAvatar = senderProfile?.avatar || "/placeholder.svg"
      const msg = await chatService.sendMessage(roomId, user.$id, message.content, {
        senderName,
        senderAvatar,
        replyTo: message.replyTo || null,
      })

      setMessages((prev: Message[]) => [
        ...prev,
        {
          ...msg,
          content: msg.content || message.content,
          authorId: user.$id,
          authorName: senderName,
          authorAvatar: senderAvatar,
          timestamp: msg.timestamp || msg.$createdAt || new Date().toISOString(),
          replyTo: message.replyTo || null,
          replyToMessage: message.replyToMessage || null,
        },
      ])
      scrollToBottom()
    } catch (error: any) {
      toast({ title: "Retry failed", description: error?.message || "Try again", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const startCall = async (mediaType: 'voice' | 'video') => {
    if (!roomId || !user?.$id || isStartingCall) return

    setIsStartingCall(true)
    try {
      const session = await callService.startRoomCall(roomId, mediaType)
      const joinUrl = session?.joinUrl || session?.url
      if (joinUrl && typeof window !== 'undefined') {
        window.open(joinUrl, '_blank', 'noopener,noreferrer')
      }
      toast({
        title: mediaType === 'voice' ? 'Voice call started' : 'Video call started',
        description: `Call session created for ${targetProfile?.name || 'this conversation'}`,
      })
    } catch (err: any) {
      toast({ title: 'Failed to start call', description: err?.message || 'Try again', variant: 'destructive' })
    } finally {
      setIsStartingCall(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const peerPresence = presenceEntries.find((entry) => entry.userId && entry.userId !== user?.$id)
  const visibleMessages = messages.filter((msg) => {
    if (!messageSearchQuery.trim()) return true
    const haystack = `${msg.content} ${msg.authorName || ""}`.toLowerCase()
    return haystack.includes(messageSearchQuery.trim().toLowerCase())
  })

  const isImageMessage = (message: Message) => {
    const url = message.fileUrl || message.content
    return Boolean(url && /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(url))
  }

  const updateLocalMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.$id === messageId ? updater(message) : message)))
  }

  const handleCopyMessage = async (message: ChatMessageActionTarget) => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: "Copied", description: "Message copied to clipboard." })
    } catch (error: any) {
      toast({ title: "Copy failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleEditMessage = async (message: ChatMessageActionTarget) => {
    const nextContent = window.prompt("Edit message", message.content)
    if (nextContent === null) return
    const trimmed = nextContent.trim()
    if (!trimmed) return

    try {
      const updated = await chatService.updateMessage(message.$id, "edit", { content: trimmed })
      updateLocalMessage(message.$id, (current) => ({
        ...current,
        ...updated,
        content: updated.content || trimmed,
        isEdited: true,
      }))
    } catch (error: any) {
      toast({ title: "Edit failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (message: ChatMessageActionTarget) => {
    if (!window.confirm("Delete this message?")) return

    try {
      const updated = await chatService.deleteMessage(message.$id)
      updateLocalMessage(message.$id, (current) => ({
        ...current,
        ...updated,
        content: "[deleted]",
        deletedAt: new Date().toISOString(),
        deliveryState: "deleted",
      }))
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleTogglePin = async (message: ChatMessageActionTarget) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "pin")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Pin failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleToggleStar = async (message: ChatMessageActionTarget) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "star")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Star failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleReportMessage = async (message: ChatMessageActionTarget) => {
    try {
      await chatService.reportMessage(message.$id, user?.$id || "", "policy_violation", `Reported from DM with ${targetProfile?.name || "member"}`)
      toast({ title: "Reported", description: "The message has been sent for review." })
    } catch (error: any) {
      toast({ title: "Report failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  if (!user?.$id) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={targetProfile?.avatar || "/placeholder.svg"} />
          <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{targetProfile?.name || "Direct Message"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {isSomeoneTyping ? "Typing..." : peerPresence?.isOnline ? "Online" : "Private conversation"}
          </p>
        </div>
        {isSyncing && !isLoading && <Badge variant="outline" className="text-[10px]">Syncing...</Badge>}
        <Button variant="ghost" size="icon" onClick={() => setShowCallHistory(true)} disabled={isLoading} title="Call history">
          <Clock3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => startCall('voice')} disabled={isStartingCall || isLoading} title="Voice call">
          <Phone className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => startCall('video')} disabled={isStartingCall || isLoading} title="Video call">
          <Video className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="h-[74vh] flex flex-col border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Direct Messages
            </CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                placeholder="Search this conversation"
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-6">
                        Start the conversation with {targetProfile?.name || "this member"}.
                      </div>
                    )}
                    {messages.length > 0 && visibleMessages.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-6">
                        No messages match your search.
                      </div>
                    )}
                    {visibleMessages.map((msg) => {
                      const isMe = msg.authorId === user.$id
                      const messageMetadata = msg.metadata || {}
                      const isPinned = Array.isArray(messageMetadata.pinnedBy) && messageMetadata.pinnedBy.includes(user.$id)
                      const isStarred = Array.isArray(messageMetadata.starredBy) && messageMetadata.starredBy.includes(user.$id)
                      return (
                        <div key={msg.$id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                            {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.authorName}</p>}
                            {msg.deletedAt ? (
                              <div className="rounded-lg border border-dashed px-3 py-2 text-xs opacity-70">
                                This message was deleted.
                              </div>
                            ) : msg.fileUrl && isImageMessage(msg) ? (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border mb-2">
                                <img src={msg.fileUrl} alt={msg.fileName || "Attachment"} className="max-h-64 w-full object-cover" />
                              </a>
                            ) : msg.fileUrl ? (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="mb-2 block rounded-lg border px-3 py-2 text-sm underline">
                                {msg.fileName || "Attachment"}
                              </a>
                            ) : null}
                            {msg.replyToMessage && (
                              <div className="mb-2 rounded-lg border border-black/5 bg-black/5 px-2 py-1 text-xs opacity-80">
                                <p className="font-medium">{msg.replyToMessage.authorName || "Someone"}</p>
                                <p className="truncate">{msg.replyToMessage.content}</p>
                              </div>
                            )}
                            {!msg.deletedAt && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                            <p className="text-[10px] opacity-60 mt-1">{formatChatTimestamp(msg.timestamp)}</p>
                            {isMe && (
                              <div className="mt-1 flex items-center gap-2 text-[10px] opacity-60">
                                <span>
                                  {msg.deliveryState === "failed"
                                    ? "Failed to send"
                                    : msg.deliveryState === "sending" || msg.deliveryState === "queued"
                                      ? "Sending..."
                                      : (msg.readBy || []).length > 1
                                        ? "Read"
                                        : "Sent"}
                                </span>
                                {msg.deliveryState === "failed" && (
                                  <button className="underline" onClick={() => handleRetry(msg)}>
                                    Retry
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <button
                                className="text-[11px] font-medium opacity-70 hover:opacity-100"
                                onClick={() => setReplyingTo(msg)}
                              >
                                Reply
                              </button>
                              <MessageActionsMenu
                                message={msg}
                                isOwnMessage={isMe}
                                isPinned={isPinned}
                                isStarred={isStarred}
                                onCopy={handleCopyMessage}
                                onEdit={handleEditMessage}
                                onDelete={handleDeleteMessage}
                                onTogglePin={handleTogglePin}
                                onToggleStar={handleToggleStar}
                                onReport={handleReportMessage}
                                onRequestSummary={async (m) => {
                                  try {
                                    await fetch('/api/ai/summaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId: roomId, messageIds: [m.$id], requestedBy: user?.$id }) })
                                  } catch (e) { console.warn(e) }
                                }}
                                onRequestCallback={async (m) => {
                                  try {
                                    await fetch('/api/calls/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromUserId: user?.$id, toUserId: m.authorId, roomId }) })
                                  } catch (e) { console.warn(e) }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={endRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-3">
                  {replyingTo && (
                    <div className="mb-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">Replying to {replyingTo.authorName || "message"}</p>
                        <p className="truncate text-muted-foreground">{replyingTo.content}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Message ${targetProfile?.name || "member"}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={() => setTyping(false)}
                      disabled={isSending}
                      className="h-11"
                    />
                    <Button onClick={handleSend} disabled={!inputValue.trim() || isSending} className="h-11 px-4">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CallHistoryDialog
        roomId={roomId}
        roomName={targetProfile?.name || "Direct Message"}
        open={showCallHistory}
        onOpenChange={setShowCallHistory}
      />
    </div>
  )
}
