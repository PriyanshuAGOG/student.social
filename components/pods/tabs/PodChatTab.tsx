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
import { Send, MessageSquare, Loader2, Users, Reply, X } from "lucide-react"
import { chatService, profileService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Message {
  $id: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
  type: string
  replyTo?: string | null
  replyToMessage?: Message | null
}

interface PodChatTabProps {
  podId: string
  podName: string
  members: Array<{ id: string; name: string; avatar?: string; isOnline?: boolean }>
}

export function PodChatTab({ podId, podName, members }: PodChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const chatRoomId = `${podId}_general`

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages
  useEffect(() => {
    let initialized = false

    const loadMessages = async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true)
      else setIsSyncing(true)
      try {
        const res = await chatService.getMessages(chatRoomId, 100, 0)
        const messagesData = res.documents || []
        
        // Enrich messages with author info from members
        const enrichedMessages = messagesData.map((msg: any) => {
          const member = members.find(m => m.id === msg.authorId)
          return {
            ...msg,
            authorName: msg.authorName || member?.name || "Unknown",
            authorAvatar: msg.authorAvatar || member?.avatar || "/placeholder.svg",
          }
        })
        
        // Handle replies
        const messagesWithReplies = enrichedMessages.map((msg: any) => {
          if (msg.replyTo) {
            const replyMessage = enrichedMessages.find((m: any) => m.$id === msg.replyTo)
            return { ...msg, replyToMessage: replyMessage || null }
          }
          return msg
        })
        
        setMessages(messagesWithReplies)
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        setIsLoading(false)
        setIsSyncing(false)
      }
    }
    
    loadMessages(true)
    
    // Poll for new messages every 3 seconds without flicker
    const interval = setInterval(() => loadMessages(false), 3000)
    return () => clearInterval(interval)
  }, [chatRoomId, members])

  const handleSend = async () => {
    if (!inputValue.trim() || !user?.$id) return
    
    setIsSending(true)
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
      } catch {}

      const msg = await chatService.sendMessage(chatRoomId, user.$id, inputValue.trim(), {
        senderName: authorName,
        senderAvatar: authorAvatar,
      })
      
      const newMessage: Message = {
        ...msg,
        content: inputValue.trim(),
        authorId: user.$id,
        timestamp: new Date().toISOString(),
        type: "text",
        authorName,
        authorAvatar,
        replyToMessage: replyingTo,
      }
      
      setMessages(prev => [...prev, newMessage])
      setInputValue("")
      setReplyingTo(null)
      scrollToBottom()
    } catch (error: any) {
      console.error("Failed to send message:", error)
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

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return "now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return date.toLocaleDateString()
    } catch {
      return ""
    }
  }

  const onlineCount = members.filter(m => m.isOnline).length

  return (
    <div className="h-[600px] flex flex-col">
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
                </div>
              </div>
              {isSyncing && !isLoading && (
                <Badge variant="outline" className="text-[10px]">Updating…</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrent = message.authorId === user?.$id
                  const isSystem = message.authorId === "system" || message.type === "system"
                  
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
                      className={`flex gap-3 group ${isCurrent ? "justify-end" : "justify-start"}`}
                    >
                      {!isCurrent && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={message.authorAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{(message.authorName || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[75%] ${isCurrent ? "items-end" : "items-start"}`}>
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
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className="text-[10px] opacity-60 mt-1">{formatTime(message.timestamp)}</p>
                        </div>
                        
                        {/* Reply button */}
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" /> Reply
                        </button>
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
              disabled={isSending || !user}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isSending || !user} size="icon">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
