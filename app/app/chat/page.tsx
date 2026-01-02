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
import { Send, Search, Phone, Video, MoreVertical, Users, Hash, Plus, Smile, Paperclip, ImageIcon, Calendar, Settings, MessageSquare, X, Menu, ArrowLeft, AtSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { chatService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"

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
}

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileChatList, setShowMobileChatList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadRooms = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const { podRooms, directRooms } = await chatService.getUserChatRooms(user.$id)
        const normalized = [...(podRooms || []), ...(directRooms || [])].map((room: any) => ({
          ...room,
          $id: room.$id || room.id,
          type: room.type || (room.podId ? "pod" : "direct"),
          name: room.name || room.displayName || room.podName || room.$id,
        })) as ChatRoom[]
        setRooms(normalized)
        if (normalized.length > 0) {
          setSelectedRoom(normalized[0])
        }
      } catch (error: any) {
        console.error(error)
        toast({ title: "Failed to load chats", description: error?.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadRooms()
  }, [user?.$id])

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedRoom) return
      try {
        const res = await chatService.getMessages(selectedRoom.$id, 50, 0)
        setMessages(res.documents || [])
      } catch (error) {
        console.error(error)
        setMessages([])
      }
    }
    loadMessages()
  }, [selectedRoom])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRoom || !user?.$id) return

    setIsLoading(true)
    const original = inputValue
    try {
      const msg = await chatService.sendMessage(selectedRoom.$id, user.$id, original, "text")
      setMessages((prev) => [...prev, msg])
      const shouldAskAI = original.includes("@ai")
      setInputValue("")
      scrollToBottom()

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
              "text"
            )
            aiMsg.authorName = "AI Assistant"
            aiMsg.authorId = "ai"
            setMessages((prev) => [...prev, aiMsg])
            scrollToBottom()
          }
        } catch (err) {
          console.warn("AI chat reply failed", err)
        }
      }
    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to send message", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
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
      setMessages((prev) => [...prev, msg])
      toast({ title: "Uploaded", description: `${attachment.fileName} sent` })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Upload failed", description: error?.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const startVideoCall = async () => {
    if (!selectedRoom) return

    try {
      toast({
        title: "Starting video call",
        description: `Starting call in ${selectedRoom.name}...`,
      })
      // Simulate video call start
      setTimeout(() => {
        toast({
          title: "Call started",
          description: "Video call is now active",
        })
      }, 1000)
    } catch (error) {
      console.error("Failed to start video call:", error)
      toast({
        title: "Failed to start call",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room)
    setShowMobileChatList(false)
  }

  const filteredRooms = rooms.filter((room) => (room.name || room.$id).toLowerCase().includes(searchQuery.toLowerCase()))

  const formatTime = (dateValue: Date | string) => {
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 border-r bg-card flex-col">
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
                {filteredRooms.map((room) => (
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
                              {room.type === "pod" ? <Hash className="h-4 w-4" /> : room.name.slice(0, 2)}
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
                              <span className="text-xs text-muted-foreground">{formatTime(room.lastMessageTime)}</span>
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
                                  {formatTime(room.lastMessageTime)}
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
                              <AvatarFallback>{room.name.slice(0, 2)}</AvatarFallback>
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
                                  {formatTime(room.lastMessageTime)}
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
      <div className={`md:hidden fixed inset-0 z-50 bg-background flex flex-col transform transition-transform ${showMobileChatList ? 'translate-x-0' : '-translate-x-full'}`}>
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
                              <span className="text-xs text-muted-foreground">{formatTime(room.lastMessageTime)}</span>
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
                                <span className="text-xs text-muted-foreground">{formatTime(room.lastMessageTime)}</span>
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
                                <span className="text-xs text-muted-foreground">{formatTime(room.lastMessageTime)}</span>
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
      <div className="flex-1 flex flex-col">
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
                        {selectedRoom.type === "pod" ? <Hash className="h-3 w-3" /> : selectedRoom.name.slice(0, 2)}
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
                          Study Group
                        </span>
                      ) : selectedRoom.isOnline ? (
                        "Online"
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={startVideoCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
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
                        {selectedRoom.type === "pod" ? <Hash className="h-4 w-4" /> : selectedRoom.name.slice(0, 2)}
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
                          Study Group
                        </span>
                      ) : selectedRoom.isOnline ? (
                        "Online"
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={startVideoCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 pb-4 md:pb-4">
              <div className="space-y-4 max-w-4xl mx-auto pb-2">
                {messages.map((message) => {
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
                      className={`flex gap-3 ${isCurrent ? "justify-end" : "justify-start"}`}
                    >
                      {!isCurrent && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.authorAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {(message.authorName || "?").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[85%] md:max-w-[80%] ${bubbleClass} p-3`}>
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
                        {message.type === "file" && message.fileUrl ? (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline font-medium"
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
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {message.isEdited && <span className="ml-1">(edited)</span>}
                        </p>
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
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="sticky bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 p-3 md:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+68px)] md:pb-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${selectedRoom.name}...`}
                      className="min-h-[44px] max-h-24 md:max-h-32 resize-none pr-12 md:pr-32 text-base"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-0.5 md:gap-1">
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
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0 hidden sm:flex" disabled={isLoading}>
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
                  <p>Press Enter to send, Shift+Enter for new line. Type @ai to ask AI assistant</p>
                  <p>{selectedRoom.type === "pod" ? "Pod Chat" : "Direct Message"} • End-to-end encrypted</p>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
