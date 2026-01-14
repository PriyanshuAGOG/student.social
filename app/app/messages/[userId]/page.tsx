"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Loader2, MessageSquare, Send, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { chatService, profileService } from "@/lib/appwrite"
import { useToast } from "@/hooks/use-toast"

interface Message {
  $id: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
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
  const [selfProfile, setSelfProfile] = useState<any>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      const docs = res.documents || []
      const self = (profiles?.selfProfile ?? selfProfile) as any
      const target = (profiles?.targetProfile ?? targetProfile) as any
      const selfName = self?.name || user?.name
      const selfAvatar = self?.avatar || "/placeholder.svg"
      const enriched: Message[] = docs.map((msg: any): Message => ({
        ...msg,
        content: msg.content || "",
        timestamp: msg.timestamp || msg.$createdAt || new Date().toISOString(),
        authorName: msg.authorName || (msg.authorId === user?.$id ? selfName : target?.name) || "User",
        authorAvatar: msg.authorAvatar || (msg.authorId === user?.$id ? selfAvatar : target?.avatar) || "/placeholder.svg",
      }))
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
      })
      const newMessage: Message = {
        ...msg,
        content: msg.content || inputValue.trim(),
        authorId: user.$id,
        authorName: senderName,
        authorAvatar: senderAvatar,
        timestamp: msg.timestamp || msg.$createdAt || new Date().toISOString(),
      }
      setMessages((prev: Message[]) => [...prev, newMessage])
      setInputValue("")
      scrollToBottom()
    } catch (err: any) {
      toast({ title: "Failed to send", description: err?.message || "Try again", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
          <p className="text-xs text-muted-foreground truncate">Private conversation</p>
        </div>
        {isSyncing && !isLoading && <Badge variant="outline" className="text-[10px]">Syncing…</Badge>}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Card className="h-[70vh] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Direct Messages
            </CardTitle>
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
                    {messages.map((msg) => {
                      const isMe = msg.authorId === user.$id
                      return (
                        <div key={msg.$id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.authorName}</p>}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className="text-[10px] opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={endRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Message ${targetProfile?.name || "member"}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isSending}
                    />
                    <Button onClick={handleSend} disabled={!inputValue.trim() || isSending}>
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
