"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Search, Phone, Video, MoreVertical, Users, Hash, Plus, Smile, Paperclip, ImageIcon, Calendar, Settings, MessageSquare, X, Menu, ArrowLeft, AtSign, Mic, Loader2, Reply, CornerUpLeft, WifiOff, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { callService, chatService } from "@/lib/appwrite"
import { attachReplyTargets, formatChatTimestamp, normalizeChatRooms } from "@/lib/chat-domain"
import { CallHistoryDialog } from "@/components/chat/call-history-dialog"
import { MessageActionsMenu } from "@/components/chat/message-actions-menu"
import { useAuth } from "@/lib/auth-context"
import { announceToScreenReader } from "@/lib/accessibility-utils"
import { useChatPresence } from "@/hooks/use-chat-presence"
import { createOutboxMessage, mergeChatMessages, useChatOutbox } from "@/hooks/use-chat-outbox"

interface ChatRoom {
  $id: string
  name?: string
  type: "pod" | "direct"
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  isOnline?: boolean
  participants?: string[]
  podId?: string
}

interface Message {
  $id: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
  type: "text" | "image" | "file" | "system"
  fileUrl?: string
  fileName?: string
  isEdited?: boolean
  mentions?: string[]
  readBy?: string[]
  replyTo?: string | null
  replyToMessage?: Message | null
  clientMessageId?: string
  deliveryState?: string
  errorMessage?: string | null
  metadata?: Record<string, any>
  deletedAt?: string | null
}

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [showMobileChatList, setShowMobileChatList] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected')
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { presenceEntries, isSomeoneTyping, setTyping } = useChatPresence(selectedRoom?.$id || "", user?.$id)
  const { outboxMessages, queueMessage, markMessageSending, markMessageFailed, removeMessage } = useChatOutbox(selectedRoom?.$id || "")

  useEffect(() => {
    const routeRoomId = searchParams.get("room")
    if (!routeRoomId || selectedRoom) return

    const room = rooms.find((entry) => entry.$id === routeRoomId || entry.podId === routeRoomId)
    if (room) {
      setSelectedRoom(room)
      setShowMobileChatList(false)
    }
  }, [searchParams, rooms, selectedRoom])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Voice input handler
  const startVoiceInput = () => {
    if (typeof window === 'undefined') return
    
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(prev => prev + (prev ? ' ' : '') + transcript)
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        setIsListening(false)
        console.error('Speech recognition error:', event.error)
        toast({
          title: "Voice input error",
          description: event.error === 'not-allowed' 
            ? "Microphone access denied. Please allow microphone access in your browser settings."
            : "Could not recognize speech. Please try again.",
          variant: "destructive",
        })
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Try using Chrome or Edge.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadRooms = async () => {
      if (!user?.$id) return
      setIsLoadingRooms(true)
      try {
        const { podRooms, directRooms } = await chatService.getUserChatRooms(user.$id)
        const normalized = normalizeChatRooms([...(podRooms || []), ...(directRooms || [])], user.$id)
        setRooms(normalized)

        const routeRoomId = searchParams.get("room")
        if (routeRoomId) {
          const matchedRoom = normalized.find((room) => room.$id === routeRoomId || room.podId === routeRoomId)
          if (matchedRoom) {
            setSelectedRoom(matchedRoom)
            setShowMobileChatList(false)
          } else {
            const podRoom = await chatService.getOrCreatePodRoom(routeRoomId, "Pod Chat", [user.$id])
            const nextRoom = normalizeChatRooms([podRoom], user.$id)[0] as ChatRoom
            setRooms((prev) => normalizeChatRooms([nextRoom, ...prev.filter((room) => room.$id !== nextRoom.$id)], user.$id) as ChatRoom[])
            setSelectedRoom(nextRoom)
            setShowMobileChatList(false)
          }
        }
      } catch (error: any) {
        console.error(error)
        toast({ title: "Failed to load chats", description: error?.message, variant: "destructive" })
      } finally {
        setIsLoadingRooms(false)
      }
    }
    loadRooms()
  }, [user?.$id, searchParams])

  useEffect(() => {
    const loadMessages = async (fromPoll = false) => {
      if (!selectedRoom) return
      try {
        if (fromPoll) {
          setConnectionStatus("reconnecting")
        }
        const res = await chatService.getMessages(selectedRoom.$id, 50, 0)
        const messagesWithReplies = attachReplyTargets(res.documents || []) as unknown as Message[]
        setMessages(messagesWithReplies)
        setConnectionStatus("connected")
      } catch (error) {
        console.error(error)
        setConnectionStatus("error")
      }
    }
    loadMessages()

    const interval = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(interval)
  }, [selectedRoom])

  useEffect(() => {
    if (!inputValue.trim()) {
      setTyping(false)
      return
    }

    setTyping(true)
  }, [inputValue, setTyping])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRoom || !user?.$id) return

    setIsLoading(true)
    const original = inputValue.trim()
    const replyToId = replyingTo?.$id || null
    const senderName = user.name || "You"
    const senderAvatar = user?.avatar || "/placeholder.svg"
    const optimisticMessage = createOutboxMessage({
      roomId: selectedRoom.$id,
      authorId: user.$id,
      content: original,
      authorName: senderName,
      authorAvatar: senderAvatar,
      replyTo: replyToId,
      replyToMessage: replyingTo,
    })
    const clientMessageId = optimisticMessage.clientMessageId

    queueMessage({
      ...optimisticMessage,
      deliveryState: "sending",
    })
    setInputValue("")
    setReplyingTo(null)
    setTyping(false)
    try {
      const msg = await chatService.sendMessage(selectedRoom.$id, user.$id, original, "text", { replyTo: replyToId, clientMessageId }) as unknown as Message
      // Attach reply info to the new message for display
      const newMessage: Message = {
        ...msg,
        content: msg.content || original,
        authorId: user.$id,
        authorName: senderName,
        authorAvatar: senderAvatar,
        timestamp: msg.timestamp || msg.$createdAt || new Date().toISOString(),
        replyToMessage: replyingTo,
      }
      removeMessage(clientMessageId)
      setMessages((prev) => [...prev, newMessage])
      setRooms((prev) =>
        prev.map((room) =>
          room.$id === selectedRoom.$id
            ? { ...room, lastMessage: original, lastMessageTime: new Date().toISOString() }
            : room,
        ),
      )
      const shouldAskAI = original.includes("@ai")
      scrollToBottom()
      announceToScreenReader(`Sent message in ${selectedRoom.name}`)

      if (shouldAskAI) {
        const aiPayload = {
          messages: [
            { role: "system", content: "You are the pod AI helper. Answer concisely with next steps." },
            { role: "user", content: original.replace("@ai", "").trim() || original },
          ],
        }
        try {
          const resp = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiPayload),
          })
          if (resp.ok) {
            const data = await resp.json()
            const aiMsg = await chatService.sendMessage(
              selectedRoom.$id,
              "ai",
              data.message || "Here's a quick answer.",
              "text",
              { senderName: "AI Assistant" }
            ) as unknown as Message
            aiMsg.authorName = "AI Assistant"
            aiMsg.authorId = "ai"
            setMessages((prev) => [...prev, aiMsg])
            setRooms((prev) =>
              prev.map((room) =>
                room.$id === selectedRoom.$id
                  ? { ...room, lastMessage: aiMsg.content, lastMessageTime: new Date().toISOString() }
                  : room,
              ),
            )
            scrollToBottom()
          }
        } catch (err) {
          console.warn("AI chat reply failed", err)
        }
      }
    } catch (error: any) {
      console.error(error)
      markMessageFailed(clientMessageId, error?.message || "Try again")
      toast({ title: "Failed to send message", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryMessage = async (message: Message) => {
    if (!selectedRoom || !user?.$id || !message.clientMessageId) return

    markMessageSending(message.clientMessageId)
    setIsLoading(true)
    try {
      const retrySenderName = user.name || "You"
      const retrySenderAvatar = user?.avatar || "/placeholder.svg"
      const msg = await chatService.sendMessage(selectedRoom.$id, user.$id, message.content, "text", {
        replyTo: message.replyTo || null,
        clientMessageId: message.clientMessageId,
        senderName: retrySenderName,
        senderAvatar: retrySenderAvatar,
      }) as unknown as Message

      removeMessage(message.clientMessageId)
      setMessages((prev) => [...prev, { ...msg, content: msg.content || message.content, replyToMessage: message.replyToMessage }])
      scrollToBottom()
    } catch (error: any) {
      markMessageFailed(message.clientMessageId, error?.message || "Try again")
      toast({ title: "Retry failed", description: error?.message || "Try again", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const updateLocalMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.$id === messageId ? updater(message) : message)))
  }

  const isImageMessage = (message: Message) => Boolean(message.fileUrl && /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(message.fileUrl))

  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: "Copied", description: "Message copied to clipboard." })
    } catch (error: any) {
      toast({ title: "Copy failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleEditMessage = async (message: Message) => {
    const nextContent = window.prompt("Edit message", message.content)
    if (nextContent === null) return
    const trimmed = nextContent.trim()
    if (!trimmed) return

    try {
      const updated = await chatService.updateMessage(message.$id, "edit", { content: trimmed })
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated, content: updated.content || trimmed, isEdited: true }))
    } catch (error: any) {
      toast({ title: "Edit failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm("Delete this message?")) return

    try {
      const updated = await chatService.deleteMessage(message.$id)
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated, content: "[deleted]", deletedAt: new Date().toISOString(), deliveryState: "deleted" }))
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleTogglePin = async (message: Message) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "pin")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Pin failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleToggleStar = async (message: Message) => {
    try {
      const updated = await chatService.updateMessage(message.$id, "star")
      updateLocalMessage(message.$id, (current) => ({ ...current, ...updated }))
    } catch (error: any) {
      toast({ title: "Star failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleReportMessage = async (message: Message) => {
    try {
      await chatService.reportMessage(message.$id, user?.$id || "", "policy_violation", `Reported from room ${selectedRoom?.name || selectedRoom?.$id || 'conversation'}`)
      toast({ title: "Reported", description: "The message has been sent for review." })
    } catch (error: any) {
      toast({ title: "Report failed", description: error?.message || "Try again", variant: "destructive" })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom || !user?.$id) return

    try {
      setIsLoading(true)
      const attachment = await chatService.uploadAttachment(file, user.$id)
      const msg = await chatService.sendMessage(selectedRoom.$id, user.$id, attachment.fileName, "file", {
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
      })
      setMessages((prev) => [...prev, msg as unknown as Message])
      toast({ title: "Uploaded", description: `${attachment.fileName} sent` })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Upload failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const startCall = async (mediaType: "voice" | "video") => {
    if (!selectedRoom || !user?.$id || isStartingCall) return

    setIsStartingCall(true)
    try {
      const session = await callService.startRoomCall(selectedRoom.$id, mediaType)
      const joinUrl = session?.joinUrl || session?.url

      if (joinUrl && typeof window !== "undefined") {
        window.open(joinUrl, "_blank", "noopener,noreferrer")
      }

      toast({
        title: mediaType === "voice" ? "Voice call started" : "Video call started",
        description: `Call session created for ${selectedRoom.name}`,
      })
    } catch (error: any) {
      console.error(`Failed to start ${mediaType} call:`, error)
      toast({
        title: "Failed to start call",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStartingCall(false)
    }
  }

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowMobileChatList(false)
  }

  const filteredRooms = rooms.filter((room) => (room.name || room.$id).toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedRoomPresence = presenceEntries.find((entry) => entry.userId && entry.userId !== user?.$id)
  const visibleMessages = mergeChatMessages(messages, outboxMessages).filter((message) => {
    if (!messageSearchQuery.trim()) return true
    const haystack = `${message.content} ${message.authorName || ""}`.toLowerCase()
    return haystack.includes(messageSearchQuery.trim().toLowerCase())
  })

  const insertAIMention = () => {
    const currentValue = inputValue
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const newValue = currentValue.slice(0, cursorPosition) + "@ai " + currentValue.slice(cursorPosition)
    setInputValue(newValue)
    
    // Focus and set cursor position after @ai
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(cursorPosition + 4, cursorPosition + 4)
      }
    }, 0)
  }

  return (
    <div className="bg-background flex flex-col md:flex-row min-h-screen md:h-[calc(100dvh-64px)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 border-r bg-card flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pods">Pods</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 mt-2">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {isLoadingRooms ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={`skeleton-${i}`} className="animate-pulse">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-24 mb-2" />
                            <div className="h-3 bg-muted rounded w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                  <Card
                    key={room.$id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedRoom?.$id === room.$id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {room.type === "pod" ? <Hash className="h-4 w-4" /> : (room.name || "??").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {room.type === "direct" && room.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{room.name}</p>
                            {room.lastMessageTime && (
                              <span className="text-xs text-muted-foreground">{formatChatTimestamp(room.lastMessageTime)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                            {room.unreadCount && room.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pods" className="flex-1 mt-2">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredRooms
                  .filter((room) => room.type === "pod")
                  .map((room) => (
                    <Card
                      key={room.$id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedRoom?.$id === room.$id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleRoomSelect(room)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              <Hash className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{room.name}</p>
                              {room.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">
                                  {formatChatTimestamp(room.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="direct" className="flex-1 mt-2">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredRooms
                  .filter((room) => room.type === "direct")
                  .map((room) => (
                    <Card
                      key={room.$id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedRoom?.$id === room.$id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleRoomSelect(room)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={room.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{(room.name || "??").slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            {room.isOnline && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{room.name}</p>
                              {room.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">
                                  {formatChatTimestamp(room.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Chat List */}
      <div
        className={`md:hidden ${showMobileChatList ? "flex" : "hidden"} w-full min-h-screen bg-background flex-col transition-all overflow-hidden`}
      >
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2 flex-shrink-0" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pods">Pods</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 mt-2 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.$id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleRoomSelect(room)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {room.type === "pod" ? <Hash className="h-4 w-4" /> : (room.name || "?").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {room.type === "direct" && room.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{room.name}</p>
                            {room.lastMessageTime && (
                              <span className="text-xs text-muted-foreground">{formatChatTimestamp(room.lastMessageTime)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                            {room.unreadCount && room.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pods" className="flex-1 mt-2 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredRooms
                  .filter((room) => room.type === "pod")
                  .map((room) => (
                    <Card
                      key={room.$id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleRoomSelect(room)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              <Hash className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{room.name}</p>
                              {room.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">{formatChatTimestamp(room.lastMessageTime)}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="direct" className="flex-1 mt-2 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredRooms
                  .filter((room) => room.type === "direct")
                  .map((room) => (
                    <Card
                      key={room.$id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleRoomSelect(room)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={room.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{(room.name || "?").slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            {room.isOnline && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{room.name}</p>
                              {room.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">{formatChatTimestamp(room.lastMessageTime)}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${showMobileChatList ? "hidden md:flex" : "flex"}`}>
        {selectedRoom ? (
          <>
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowMobileChatList(true)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedRoom.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedRoom.type === "pod" ? <Hash className="h-3 w-3" /> : (selectedRoom.name || "??").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {selectedRoom.type === "direct" && selectedRoom.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">{selectedRoom.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoom.type === "pod" ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {isSomeoneTyping ? `${selectedRoomPresence ? 1 : 0} typing` : "Study Group"}
                        </span>
                      ) : isSomeoneTyping ? (
                        "Typing..."
                      ) : (selectedRoomPresence?.isOnline ?? selectedRoom.isOnline) ? (
                        "Online"
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startCall("video")} disabled={isStartingCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startCall("voice")} disabled={isStartingCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 md:p-4 border-b bg-card/80 backdrop-blur-sm">
              <div className="relative max-w-4xl mx-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Search messages in this conversation"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Desktop Chat Header */}
            <div className="hidden md:block border-b bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRoom.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedRoom.type === "pod" ? <Hash className="h-4 w-4" /> : (selectedRoom.name || "??").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {selectedRoom.type === "direct" && selectedRoom.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedRoom.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.type === "pod" ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {isSomeoneTyping ? "Typing..." : "Study Group"}
                        </span>
                      ) : isSomeoneTyping ? (
                        "Typing..."
                      ) : (selectedRoomPresence?.isOnline ?? selectedRoom.isOnline) ? (
                        "Online"
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startCall("video")} disabled={isStartingCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startCall("voice")} disabled={isStartingCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Users className="h-4 w-4 mr-2" />
                        View Members
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowCallHistory(true)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Chat Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Connection Status Banner */}
            {connectionStatus !== 'connected' && (
              <div className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${
                connectionStatus === 'reconnecting' 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {connectionStatus === 'reconnecting' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Refreshing message state...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Connection lost. Messages may be delayed.</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-current underline"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-hidden relative">
              <ScrollArea className="h-full">
                <div className="p-4 pb-4 space-y-4 max-w-4xl mx-auto">
                  {messages.length > 0 && visibleMessages.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No messages match your search.
                    </div>
                  ) : visibleMessages.map((message) => {
                  const isCurrent = message.authorId === user?.$id
                  const isAI = message.authorId === "ai"
                  const bubbleClass = isCurrent
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : isAI
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-2xl rounded-bl-md border border-blue-200 dark:border-blue-800"
                      : "bg-muted rounded-2xl rounded-bl-md"

                  return (
                    <div
                      key={message.$id}
                      className={`flex gap-3 group ${isCurrent ? "justify-end" : "justify-start"}`}
                    >
                      {!isCurrent && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.authorAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {(message.authorName || "?").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex flex-col gap-1">
                        {/* Reply preview */}
                        {message.replyToMessage && (
                          <div className={`flex items-center gap-2 text-xs ${isCurrent ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg max-w-[200px]">
                              <CornerUpLeft className="h-3 w-3 shrink-0" />
                              <span className="font-medium">{message.replyToMessage.authorName || 'Someone'}</span>
                              <span className="truncate opacity-75">{message.replyToMessage.content}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Reply button for others' messages - show on left */}
                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setReplyingTo(message)}
                              title="Reply"
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                          )}

                          <div className={`max-w-[90%] sm:max-w-[80%] md:max-w-[72%] ${bubbleClass} p-3`}>
                            {!isCurrent && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.authorName || "Unknown"}
                                {isAI && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    AI
                                  </Badge>
                                )}
                              </p>
                            )}
                            {message.deletedAt ? (
                              <div className="rounded-lg border border-dashed px-3 py-2 text-xs opacity-70">This message was deleted.</div>
                            ) : message.type === "file" && message.fileUrl && isImageMessage(message) ? (
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-2 block overflow-hidden rounded-lg border"
                              >
                                <img
                                  src={message.fileUrl}
                                  alt={message.fileName || "Attachment"}
                                  className="max-h-64 w-full object-cover"
                                />
                              </a>
                            ) : message.type === "file" && message.fileUrl ? (
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-2 block rounded-lg border px-3 py-2 text-sm underline font-medium"
                              >
                                {message.fileName || "Attachment"}
                              </a>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content.split(/(@\w+)/g).map((part, index) => {
                                  if (part.startsWith("@")) {
                                    return (
                                      <span key={index} className="text-blue-600 dark:text-blue-400 font-medium">
                                        {part}
                                      </span>
                                    )
                                  }
                                  return part
                                })}
                              </p>
                            )}
                            <p className="text-xs opacity-70 mt-2">
                              {formatChatTimestamp(message.timestamp)}
                              {message.isEdited && <span className="ml-1">(edited)</span>}
                            </p>
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
                                  <button className="underline" onClick={() => handleRetryMessage(message)}>
                                    Retry
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <button
                                className="text-[11px] font-medium opacity-70 hover:opacity-100"
                                onClick={() => setReplyingTo(message)}
                              >
                                Reply
                              </button>
                              <MessageActionsMenu
                                message={message}
                                isOwnMessage={isCurrent}
                                isPinned={Boolean(Array.isArray((message as any).metadata?.pinnedBy) && (message as any).metadata.pinnedBy.includes(user?.$id))}
                                isStarred={Boolean(Array.isArray((message as any).metadata?.starredBy) && (message as any).metadata.starredBy.includes(user?.$id))}
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

                        </div>
                      </div>

                      {isCurrent && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}

                {isLoading && (
                  <div className="flex gap-3 justify-start text-muted-foreground text-sm">Sending...</div>
                )}
                <div ref={messagesEndRef} className="h-1" />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="sticky bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 p-3 md:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+68px)] md:pb-4">
              <div className="max-w-4xl mx-auto">
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-t-lg px-3 py-2 mb-2 border border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Reply className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary">Replying to {replyingTo.authorName || 'message'}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onBlur={() => setTyping(false)}
                      placeholder={replyingTo ? `Reply to ${replyingTo.authorName || 'message'}...` : `Message ${selectedRoom.name}...`}
                      className="min-h-[44px] max-h-24 md:max-h-32 resize-none pr-12 md:pr-32 text-base"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-0.5 md:gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 md:h-8 md:w-8 p-0"
                        onClick={startVoiceInput}
                        disabled={isLoading || isListening}
                        title="Voice input"
                      >
                        <Mic className={`h-4 w-4 ${isListening ? "text-red-500 animate-pulse" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 md:h-8 md:w-8 p-0"
                        onClick={insertAIMention}
                        disabled={isLoading}
                        title="Mention AI Assistant"
                      >
                        <AtSign className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 md:h-8 md:w-8 p-0 hidden sm:flex"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0 hidden sm:flex" onClick={() => fileInputRef.current?.click()} disabled={isLoading} title="Attach image">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0 hidden md:flex" disabled={isLoading}>
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="h-11 w-11 md:w-auto md:px-4 flex-shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="hidden md:flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <p>Press Enter to send. Use Shift+Enter for a new line. Type @ai to ask the assistant.</p>
                  <p>{selectedRoom.type === "pod" ? "Pod chat" : "Direct message"} • Secure delivery path active</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />

            {selectedRoom && (
              <CallHistoryDialog
                roomId={selectedRoom.$id}
                roomName={selectedRoom.name || "Conversation"}
                open={showCallHistory}
                onOpenChange={setShowCallHistory}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {isLoadingRooms ? (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Loading conversations...</h3>
                  <p className="text-muted-foreground">Please wait while we load your chats</p>
                </>
              ) : rooms.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">Join a pod or start a direct message to begin chatting</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
                  <div className="mt-4 md:hidden">
                    <Button variant="outline" onClick={() => setShowMobileChatList(true)}>
                      Open chat list
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
          </div>
        )}
      </div>
    </div>
  )
}
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">Join a pod or start a direct message to begin chatting</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
                  <div className="mt-4 md:hidden">
                    <Button variant="outline" onClick={() => setShowMobileChatList(true)}>
                      Open chat list
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
          </div>
        )}
      </div>
    </div>
  )
}
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
                  <div className="mt-4 md:hidden">
                    <Button variant="outline" onClick={() => setShowMobileChatList(true)}>
                      Open chat list
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
          </div>
        )}
      </div>
    </div>
  )
}
