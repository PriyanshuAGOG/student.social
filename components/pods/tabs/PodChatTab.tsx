"use client"

/**
 * PodChatTab Component
 * 
 * Full embedded chat for pod communication with real-time messaging.
 */

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare, Loader2, Users, Reply, X, Clock3, Search } from "lucide-react"
import { chatService, profileService } from "@/lib/appwrite"
import { attachReplyTargets, formatChatTimestamp, normalizeChatMessage } from "@/lib/chat-domain"
import { CallHistoryDialog } from "@/components/chat/call-history-dialog"
import { MessageActionsMenu, type ChatMessageActionTarget } from "@/components/chat/message-actions-menu"
import { SummaryTaskStatus } from "@/components/chat/summary-task-status"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useChatPresence } from "@/hooks/use-chat-presence"
import { createOutboxMessage, mergeChatMessages, useChatOutbox } from "@/hooks/use-chat-outbox"
import { useAiSummaryTasks } from "@/hooks/use-ai-summary-tasks"

interface Message {
  $id: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
  type: string
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  clientMessageId?: string
  replyTo?: string | null
  replyToMessage?: Message | null
  readBy?: string[]
  metadata?: Record<string, any>
  deletedAt?: string | null
  deliveryState?: string
}

interface PodChatTabProps {
  podId: string
  podName: string
  members: Array<{ id: string; name: string; avatar?: string; isOnline?: boolean }>
}

export function PodChatTab({ podId, podName, members }: PodChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRoomId, setChatRoomId] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isSomeoneTyping, otherTypingCount, setTyping } = useChatPresence(chatRoomId, user?.$id)
  const { outboxMessages, queueMessage, markMessageSending, markMessageFailed, removeMessage } = useChatOutbox(chatRoomId)
  const { latestTask: latestSummaryTask, isLoading: isLoadingSummaryTasks, error: summaryTaskError } = useAiSummaryTasks(chatRoomId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const visibleMessages = messages.filter((message) => {
    if (!messageSearchQuery.trim()) return true
    const haystack = `${message.content} ${message.authorName || ""}`.toLowerCase()
    return haystack.includes(messageSearchQuery.trim().toLowerCase())
  })

  const mergedMessages = mergeChatMessages(messages, outboxMessages)
  const visibleMergedMessages = mergedMessages.filter((message) => {
    if (!messageSearchQuery.trim()) return true
    const haystack = `${message.content} ${message.authorName || ""} ${message.fileName || ""}`.toLowerCase()
    return haystack.includes(messageSearchQuery.trim().toLowerCase())
  })

  const isImageMessage = (message: Message) => Boolean(message.fileUrl && /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(message.fileUrl))

  const updateLocalMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.$id === messageId ? updater(message) : message)))
  }

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

  // Load messages
  useEffect(() => {
    let cancelled = false

    const ensureRoomAndLoadMessages = async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true)
      else setIsSyncing(true)
      try {
        const room = await chatService.getOrCreatePodRoom(
          podId,
          podName,
          members.map((member) => member.id),
        )
        if (cancelled) return

        setChatRoomId(room.$id)

        const res = await chatService.getMessages(room.$id, 100, 0)
        const messagesData = attachReplyTargets(res.documents || [])

        // Enrich messages with author info from members
        const enrichedMessages = messagesData.map((msg: any) => {
          const member = members.find(m => m.id === msg.authorId)
          const normalized = normalizeChatMessage(msg)
          return {
            ...normalized,
            authorName: normalized.authorName || member?.name || "Unknown",
            authorAvatar: normalized.authorAvatar || member?.avatar || "/placeholder.svg",
          }
        })

        if (!cancelled) {
          setMessages(enrichedMessages)
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsSyncing(false)
        }
      }
    }
    
    ensureRoomAndLoadMessages(true)
    
    // Poll for new messages every 3 seconds without flicker
    const interval = setInterval(() => ensureRoomAndLoadMessages(false), 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [members, podId, podName])

  const handleSend = async () => {
    if (!inputValue.trim() || !user?.$id) return
    setIsSending(true)
    const originalContent = inputValue.trim()
    const originalReply = replyingTo
    let optimisticClientMessageId = ""
    try {
      // Get user's profile for name/avatar
      let authorName = user.name || "User"
      let authorAvatar = "/placeholder.svg"
      try {
        const profile = await profileService.getProfile(user.$id)
        if (profile) {
          authorName = profile.name || authorName
          authorAvatar = profile.avatar || authorAvatar
        }
      } catch (profileError) {
        console.debug('[PodChatTab] Profile fetch failed, using defaults:', profileError)
      }

      if (!chatRoomId) {
        throw new Error("Chat room is not ready yet")
      }

      const optimisticMessage = createOutboxMessage({
        roomId: chatRoomId,
        authorId: user.$id,
        content: originalContent,
        authorName,
        authorAvatar,
        replyTo: originalReply?.$id || null,
        replyToMessage: originalReply,
      })
      optimisticClientMessageId = optimisticMessage.clientMessageId

      queueMessage({
        ...optimisticMessage,
        deliveryState: "sending",
      })
      setInputValue("")
      setReplyingTo(null)
      setTyping(false)

      const msg = await chatService.sendMessage(chatRoomId, user.$id, originalContent, {
        senderName: authorName,
        senderAvatar: authorAvatar,
        replyTo: originalReply?.$id || null,
        clientMessageId: optimisticClientMessageId,
      })
      
      const newMessage: Message = {
        ...msg,
        content: msg.content || originalContent,
        authorId: user.$id,
        timestamp: new Date().toISOString(),
        type: "text",
        authorName,
        authorAvatar,
        replyTo: originalReply?.$id || null,
        replyToMessage: originalReply,
      }
      
      removeMessage(optimisticClientMessageId)
      setMessages(prev => [...prev, newMessage])
      scrollToBottom()
    } catch (error: any) {
      console.error("Failed to send message:", error)
      if (optimisticClientMessageId) {
        markMessageFailed(optimisticClientMessageId, error?.message || "Please try again")
      }
      toast({
        title: "Failed to send message",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRetry = async (message: any) => {
    if (!chatRoomId || !user?.$id || !message?.clientMessageId) return

    markMessageSending(message.clientMessageId)
    setIsSending(true)
    try {
      let authorName = user.name || "User"
      let authorAvatar = "/placeholder.svg"
      try {
        const profile = await profileService.getProfile(user.$id)
        if (profile) {
          authorName = profile.name || authorName
          authorAvatar = profile.avatar || authorAvatar
        }
      } catch (profileError) {
        console.debug('[PodChatTab] Profile fetch failed, using defaults:', profileError)
      }

      const msg = await chatService.sendMessage(chatRoomId, user.$id, message.content, {
        senderName: authorName,
        senderAvatar: authorAvatar,
        replyTo: message.replyTo || null,
        clientMessageId: message.clientMessageId,
      })

      removeMessage(message.clientMessageId)
      setMessages(prev => [...prev, {
        ...msg,
        content: msg.content || message.content,
        authorId: user.$id,
        timestamp: new Date().toISOString(),
        type: "text",
        authorName,
        authorAvatar,
        replyTo: message.replyTo || null,
        replyToMessage: message.replyToMessage,
      }])
      scrollToBottom()
    } catch (error: any) {
      markMessageFailed(message.clientMessageId, error?.message || "Please try again")
      toast({
        title: "Retry failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyMessage = async (message: ChatMessageActionTarget) => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: "Copied", description: "Message copied to clipboard." })
    } catch (error: any) {
      toast({ title: "Copy failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleEditMessage = async (message: ChatMessageActionTarget) => {
    const nextContent = window.prompt("Edit message", message.content)
    if (nextContent === null) return
    const trimmed = nextContent.trim()
    if (!trimmed) return

    try {
      const updated = await chatService.updateMessage(message.$id, "edit", { content: trimmed })
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated, content: updated.content || trimmed, isEdited: true }))
    } catch (error: any) {
      toast({ title: "Edit failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (message: ChatMessageActionTarget) => {
    if (!window.confirm("Delete this message?")) return

    try {
      const updated = await chatService.deleteMessage(message.$id)
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated, content: "[deleted]", deletedAt: new Date().toISOString(), deliveryState: "deleted" }))
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleTogglePin = async (message: ChatMessageActionTarget) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "pin")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Pin failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleToggleStar = async (message: ChatMessageActionTarget) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "star")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Star failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleReportMessage = async (message: ChatMessageActionTarget) => {
    try {
      await chatService.reportMessage(message.$id, user?.$id || "", "policy_violation", `Reported from pod chat ${podName}`)
      toast({ title: "Reported", description: "The message has been sent for review." })
    } catch (error: any) {
      toast({ title: "Report failed", description: error?.message || "Please try again", variant: "destructive" })
    }
  }

  const handleRequestSummary = async (message: ChatMessageActionTarget) => {
    if (!chatRoomId || !user?.$id) return

    try {
      const response = await fetch("/api/ai/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomId: chatRoomId, messageIds: [message.$id], requestedBy: user.$id }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Failed to queue summary (${response.status})`)
      }

      const task = payload.task
      toast({
        title: "Summary queued",
        description: task?.$id ? `Task #${String(task.$id).slice(-6)} is ${task.status || "queued"}.` : "Processing in the background.",
      })
    } catch (error: any) {
      toast({ title: "Summary request failed", description: error?.message || "Please try again.", variant: "destructive" })
    }
  }

  const handleRequestCallback = async (message: ChatMessageActionTarget) => {
    if (!chatRoomId || !user?.$id) return

    try {
      const response = await fetch("/api/calls/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromUserId: user.$id, toUserId: message.authorId, roomId: chatRoomId, reason: "Requested from pod chat" }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Failed to create callback (${response.status})`)
      }

      const joinUrl = payload.joinUrl || payload.session?.joinUrl
      if (joinUrl && typeof window !== "undefined") {
        const opened = window.open(joinUrl, "_blank", "noopener,noreferrer")
        if (!opened) window.location.href = joinUrl
      }

      toast({
        title: "Callback ready",
        description: joinUrl ? "Opened the call UI in a new tab." : "The recipient was notified.",
      })
    } catch (error: any) {
      toast({ title: "Callback failed", description: error?.message || "Please try again.", variant: "destructive" })
    }
  }

  const onlineCount = members.filter(m => m.isOnline).length

  return (
    <div className="flex flex-col min-h-[420px] md:h-[600px]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="py-3 px-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{podName} Chat</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{members.length} members</span>
                  {onlineCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">{onlineCount} online</span>
                    </>
                  )}
                  {isSomeoneTyping && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">{otherTypingCount} typing</span>
                    </>
                  )}
                </div>
              </div>
              {isSyncing && !isLoading && (
                <Badge variant="outline" className="text-[10px]">Updating…</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCallHistory(true)} disabled={!chatRoomId}>
              <Clock3 className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search this pod chat"
              className="pl-10"
            />
          </div>
          <SummaryTaskStatus task={latestSummaryTask} isLoading={isLoadingSummaryTasks} error={summaryTaskError} className="mt-3" />
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : visibleMergedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{messages.length === 0 ? "No messages yet. Start the conversation!" : "No messages match your search."}</p>
                </div>
              ) : (
                visibleMergedMessages.map((rawMessage) => {
                  const message = rawMessage as Message
                  const isCurrent = message.authorId === user?.$id
                  const isSystem = message.authorId === "system" || message.type === "system"
                  const messageMetadata = (message as any).metadata || {}
                  const isPinned = Array.isArray(messageMetadata.pinnedBy) && messageMetadata.pinnedBy.includes(user?.$id)
                  const isStarred = Array.isArray(messageMetadata.starredBy) && messageMetadata.starredBy.includes(user?.$id)
                  
                  if (isSystem) {
                    return (
                      <div key={message.$id} className="flex justify-center">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {message.content}
                        </Badge>
                      </div>
                    )
                  }
                  
                  return (
                    <div
                      key={message.$id}
                      className={`group flex gap-3 ${isCurrent ? "justify-end" : "justify-start"}`}
                    >
                      {!isCurrent && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={message.authorAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{(message.authorName || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[90%] sm:max-w-[78%] ${isCurrent ? "items-end" : "items-start"}`}>
                        {/* Reply preview */}
                        {message.replyToMessage && (
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1 pl-2 border-l-2 border-muted">
                            <Reply className="w-3 h-3" />
                            <span className="font-medium">{message.replyToMessage.authorName}</span>
                            <span className="truncate max-w-[150px]">{message.replyToMessage.content}</span>
                          </div>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-2 ${
                          isCurrent 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        }`}>
                          {!isCurrent && (
                            <p className="text-xs font-medium mb-1 opacity-70">{message.authorName}</p>
                          )}
                          {message.deletedAt ? (
                            <div className="rounded-lg border border-dashed px-3 py-2 text-xs opacity-70">This message was deleted.</div>
                          ) : message.fileUrl && isImageMessage(message) ? (
                            <a href={message.fileUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg border">
                              <img src={message.fileUrl} alt={message.fileName || "Attachment"} className="max-h-64 w-full object-cover" />
                            </a>
                          ) : message.fileUrl ? (
                            <a href={message.fileUrl} target="_blank" rel="noreferrer" className="mb-2 block rounded-lg border px-3 py-2 text-sm underline">
                              {message.fileName || "Attachment"}
                            </a>
                          ) : null}
                          {!message.deletedAt && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
                          <p className="text-[10px] opacity-60 mt-1">{formatChatTimestamp(message.timestamp)}</p>
                          {isCurrent && (
                            <div className="mt-1 flex items-center gap-2 text-[10px] opacity-60">
                              <span>
                                {message.deliveryState === "failed"
                                  ? "Failed to send"
                                  : message.deliveryState === "sending" || message.deliveryState === "queued"
                                    ? "Sending..."
                                    : (message.readBy || []).length > 1
                                      ? "Read"
                                      : "Sent"}
                              </span>
                              {message.deliveryState === "failed" && (
                                <button className="underline" onClick={() => handleRetry(message)}>
                                  Retry
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Reply button */}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setReplyingTo(message)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                          <MessageActionsMenu
                            message={message}
                            isOwnMessage={isCurrent}
                            isPinned={isPinned}
                            isStarred={isStarred}
                            onCopy={handleCopyMessage}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onTogglePin={handleTogglePin}
                            onToggleStar={handleToggleStar}
                            onReport={handleReportMessage}
                            onRequestSummary={handleRequestSummary}
                            onRequestCallback={handleRequestCallback}
                          />
                        </div>
                      </div>
                      
                      {isCurrent && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0">
          {replyingTo && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-2 text-xs">
              <div className="flex items-center gap-2">
                <Reply className="w-3 h-3 text-primary" />
                <span>Replying to <span className="font-medium">{replyingTo.authorName}</span></span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => setTyping(false)}
              disabled={isSending || !user}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isSending || !user} size="icon">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      <CallHistoryDialog
        roomId={chatRoomId}
        roomName={`${podName} Chat`}
        open={showCallHistory}
        onOpenChange={setShowCallHistory}
      />
    </div>
  )
}
