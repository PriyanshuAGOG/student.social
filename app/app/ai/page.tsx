"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, User, Sparkles, BookOpen, Calculator, Code, Lightbulb, Mic, Paperclip, MoreVertical, Copy, ThumbsUp, ThumbsDown, RefreshCw, ArrowLeft, Plus, Loader2, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "text" | "code" | "math" | "suggestion"
  attachmentName?: string
}

interface AIAttachment {
  fileId: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  extractedText: string
}

interface Suggestion {
  id: string
  title: string
  description: string
  icon: any
  category: string
}

const suggestions: Suggestion[] = [
  {
    id: "1",
    title: "Explain a concept",
    description: "Get detailed explanations on any topic",
    icon: BookOpen,
    category: "Learning",
  },
  {
    id: "2",
    title: "Solve math problems",
    description: "Step-by-step solutions for equations",
    icon: Calculator,
    category: "Math",
  },
  {
    id: "3",
    title: "Code assistance",
    description: "Debug, explain, or write code",
    icon: Code,
    category: "Programming",
  },
  {
    id: "4",
    title: "Study tips",
    description: "Personalized learning strategies",
    icon: Lightbulb,
    category: "Study",
  },
]

function createWelcomeMessage(): Message {
  return {
    id: "welcome",
    content: "Hello! I’m your AI study companion. Bring me a concept, problem, draft, or messy thought and we’ll work through it together. What are you learning today?",
    sender: "ai",
    timestamp: new Date(),
  }
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSeconds, setVoiceSeconds] = useState(0)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<AIAttachment | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const discardVoiceRef = useRef(false)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isListening) return
    const startedAt = Date.now()
    setVoiceSeconds(0)
    const timer = window.setInterval(() => setVoiceSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250)
    return () => window.clearInterval(timer)
  }, [isListening])

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    discardVoiceRef.current = true
    recorder.ondataavailable = null
    recorder.onstop = null
    recorder.onerror = null
    if (recorder.state !== 'inactive') recorder.stop()
    recorder.stream.getTracks().forEach((track) => track.stop())
  }, [])

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !pendingAttachment) || isLoading) return

    const visibleContent = inputValue.trim() || `Please help me understand ${pendingAttachment?.fileName}.`
    const tutorContent = pendingAttachment
      ? `${visibleContent}\n\n[Attachment: ${pendingAttachment.fileName}, ${pendingAttachment.fileType}]\n${pendingAttachment.extractedText}`
      : visibleContent

    const userMessage: Message = {
      id: Date.now().toString(),
      content: visibleContent,
      sender: "user",
      timestamp: new Date(),
      attachmentName: pendingAttachment?.fileName,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setPendingAttachment(null)
    setIsLoading(true)

    try {
      // Call the real AI API
      const payload = {
        messages: [...messages, { ...userMessage, content: tutorContent }].map((m) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.content,
        })),
        system: "Help students with explanations, problem-solving, coding, study strategies, and more. Be concise, helpful, and encouraging. Use markdown formatting for code and structured content.",
        context: { resources: true, calendar: true },
      }

      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(errText || "AI request failed")
      }

      const data = await resp.json()
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || "I'm here to help! Could you please rephrase your question?",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error: any) {
      console.error("AI error:", error)
      toast({
        title: "AI Error",
        description: error?.message || "Could not get a response. Please try again.",
        variant: "destructive",
      })
      // Add user-friendly error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I couldn't reach the AI service right now. Your question is saved in this chat; please try again in a moment or contact support if the issue persists.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputValue(suggestion.title)
    textareaRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied.",
    })
  }

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1]
      if (previousUserMessage.sender === "user") {
        setIsLoading(true)
        try {
          const payload = {
            messages: messages.slice(0, messageIndex).map((m) => ({
              role: m.sender === "ai" ? "assistant" : "user",
              content: m.content,
            })),
            system: "Help students with explanations, problem-solving, coding, study strategies, and more. Be concise, helpful, and encouraging.",
            context: { resources: true, calendar: true },
          }

          const resp = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!resp.ok) {
            throw new Error("Failed to regenerate response")
          }

          const data = await resp.json()
          const newResponse: Message = {
            id: Date.now().toString(),
            content: data.message || "I'm here to help! Could you please rephrase your question?",
            sender: "ai",
            timestamp: new Date(),
          }
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[messageIndex] = newResponse
            return newMessages
          })
        } catch (error: any) {
          toast({
            title: "Regenerate failed",
            description: error?.message || "Could not regenerate response",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }
  }

  const processAIAttachment = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Attachment too large", description: "AI attachments must be 10 MB or smaller.", variant: "destructive" })
      return
    }
    setIsUploadingAttachment(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/ai/attachments', { method: 'POST', credentials: 'include', body: form })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.attachment) throw new Error(payload?.error || 'Could not process the attachment')
      setPendingAttachment(payload.attachment as AIAttachment)
      toast({ title: "Attachment ready", description: `${file.name} is ready for AI.` })
    } catch (error: any) {
      toast({ title: "Attachment failed", description: error?.message || "Please try another file.", variant: "destructive" })
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) void processAIAttachment(file)
  }

  const startVoiceInput = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({ title: "Voice recording unavailable", description: "This browser cannot record audio messages.", variant: "destructive" })
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 }) : new MediaRecorder(stream)
      audioChunksRef.current = []
      discardVoiceRef.current = false
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data) }
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop())
        setIsListening(false)
        toast({ title: "Recording stopped", description: "The browser could not continue recording.", variant: "destructive" })
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        mediaRecorderRef.current = null
        setIsListening(false)
        setVoiceSeconds(0)
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type })
        if (!discardVoiceRef.current && blob.size > 0) {
          const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
          void processAIAttachment(new File([blob], `ai-voice-${Date.now()}.${extension}`, { type }))
        }
      }
      recorder.start(750)
      setIsListening(true)
    } catch (error: any) {
      toast({ title: "Microphone unavailable", description: error?.message || "Allow microphone access and try again.", variant: "destructive" })
    }
  }

  const discardVoiceInput = () => {
    discardVoiceRef.current = true
    mediaRecorderRef.current?.stop()
    setIsListening(false)
    setVoiceSeconds(0)
  }

  return (
    <div className="student-ai-page flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <div className="student-ai-mobile-header md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Back to previous screen" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Avatar className="h-7 w-7">
              <AvatarImage src="/placeholder.svg?height=32&width=32&text=AI" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="student-ai-mobile-title truncate">AI assistant</h1>
            <p className="truncate text-[10px] text-muted-foreground">Ready to help</p>
          </div>
          <Badge variant="secondary" className="h-7 gap-1 px-2 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3f6f6b]" />
            Online
          </Badge>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="student-ai-header hidden md:block border-b bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40&text=AI" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="font-semibold">AI Study Assistant</h1>
            <p className="text-sm text-muted-foreground">Always ready to help you learn</p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Online
            </Badge>
          </div>
        </div>
      </div>

      <div className="student-ai-body">
        <aside className="student-ai-rail hidden lg:flex">
          <Button onClick={() => { setMessages([createWelcomeMessage()]); setInputValue("") }} className="student-ai-new"><Plus />New conversation</Button>
          <div className="student-ai-rail-label">START WITH A MODE</div>
          <div className="student-ai-modes">
            {suggestions.map((suggestion) => (
              <button key={suggestion.id} type="button" onClick={() => handleSuggestionClick(suggestion)}>
                <span><suggestion.icon aria-hidden="true" /></span>
                <div><strong>{suggestion.title}</strong><small>{suggestion.description}</small></div>
              </button>
            ))}
          </div>
          <div className="student-ai-note"><Sparkles /><strong>Built for learning</strong><p>Ask for a hint, a plan, a critique, or a simpler explanation—not just an answer.</p></div>
        </aside>
        <section className="student-ai-conversation">
      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="p-4 pb-4 space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[85%] md:max-w-[80%] ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-muted rounded-2xl rounded-bl-md"
                } p-3 relative group`}
              >
                {message.attachmentName ? <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl bg-black/10 px-2.5 py-1.5 text-xs"><Paperclip className="h-3.5 w-3.5" /><span className="truncate">{message.attachmentName}</span></div> : null}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* Message Actions */}
                {message.sender === "ai" && (
                  <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Open AI response actions">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyMessage(message.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => regenerateResponse(message.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Good response
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Poor response
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="student-ai-composer sticky bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Suggestions (show when no messages or few messages) */}
          {messages.length <= 1 && (
            <div className="mb-3 md:mb-4">
              <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking about:</p>
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    className="h-auto p-2 md:p-3 text-left justify-start bg-transparent hover:bg-muted/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 w-full">
                      <div className="p-1 md:p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                        <suggestion.icon className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground truncate hidden sm:block">{suggestion.description}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              <Separator className="my-3 md:my-4" />
            </div>
          )}

          {/* Message Input */}
          {isListening ? (
            <div className="mb-2 flex min-h-12 items-center gap-2 rounded-2xl border border-[#76556d]/25 bg-[#76556d]/[0.07] px-3 py-2 text-xs" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#76556d]" />
              <span className="font-semibold tabular-nums text-[#76556d]">{Math.floor(voiceSeconds / 60)}:{String(voiceSeconds % 60).padStart(2, '0')}</span>
              <div className="flex h-7 min-w-0 flex-1 items-center justify-center gap-[3px] overflow-hidden" aria-hidden>{Array.from({ length: 24 }, (_, index) => <span key={index} className="w-[3px] animate-pulse rounded-full bg-[#76556d]/75" style={{ height: `${7 + ((index * 9) % 19)}px`, animationDelay: `${(index % 6) * 95}ms` }} />)}</div>
              <button type="button" onClick={discardVoiceInput} className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-destructive" aria-label="Discard AI voice message"><X className="h-4 w-4" /></button>
              <button type="button" onClick={startVoiceInput} className="rounded-full bg-[#76556d] px-3 py-1.5 font-semibold text-white" aria-label="Finish AI voice message">Use</button>
            </div>
          ) : null}
          {pendingAttachment || isUploadingAttachment ? (
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/45 px-3 py-2 text-xs">
              {isUploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Paperclip className="h-4 w-4 text-primary" />}
              <span className="min-w-0 flex-1 truncate">{isUploadingAttachment ? "Reading attachment…" : pendingAttachment?.fileName}</span>
              {pendingAttachment ? <button type="button" onClick={() => setPendingAttachment(null)} className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Remove AI attachment"><X className="h-3.5 w-3.5" /></button> : null}
            </div>
          ) : null}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="min-h-[44px] max-h-24 md:max-h-32 resize-none pr-14 md:pr-20 text-base"
                disabled={isLoading}
              />
              <input
                ref={attachmentInputRef}
                type="file"
                className="sr-only"
                accept="image/*,audio/*,application/pdf,text/*,.js,.ts,.tsx,.py,.java,.cpp,.md"
                onChange={handleAttachmentSelected}
              />
              <div className="absolute right-2 bottom-2 flex gap-0.5 md:gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                  onClick={startVoiceInput}
                  disabled={isLoading || isUploadingAttachment}
                  aria-label={isListening ? "Finish voice message" : "Record a voice message for AI"}
                >
                  <Mic className={`h-4 w-4 ${isListening ? "text-red-500" : ""}`} />
                </Button>
                <Button variant="ghost" size="sm" className="flex h-7 w-7 p-0 md:h-8 md:w-8" disabled={isLoading || isUploadingAttachment} onClick={() => attachmentInputRef.current?.click()} aria-label="Attach a file for AI analysis">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSendMessage} disabled={(!inputValue.trim() && !pendingAttachment) || isLoading || isUploadingAttachment} className="h-11 w-11 md:w-auto md:px-4 flex-shrink-0" aria-label="Send question to AI">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden md:flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <p>Press Enter to send, Shift+Enter for new line</p>
            <p>Powered by AI • Always learning</p>
          </div>
        </div>
      </div>
        </section>
      </div>
    </div>
  )
}
