"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, User, Sparkles, BookOpen, Calculator, Code, Lightbulb, Mic, Paperclip, MoreVertical, Copy, ThumbsUp, ThumbsDown, RefreshCw, ArrowLeft } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "text" | "code" | "math" | "suggestion"
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

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI study assistant. I can help you with explanations, problem-solving, coding, study strategies, and more. What would you like to learn about today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response (replace with actual AI API call)
    setTimeout(
      () => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(inputValue),
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )
  }

  const generateAIResponse = (input: string): string => {
    // Simple response generation (replace with actual AI integration)
    const responses = [
      `Great question about "${input}"! Let me break this down for you step by step...`,
      `I'd be happy to help you understand "${input}". Here's what you need to know...`,
      `That's an interesting topic! Regarding "${input}", here are the key points...`,
      `Let me explain "${input}" in a way that's easy to understand...`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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

  const regenerateResponse = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1]
      if (previousUserMessage.sender === "user") {
        setIsLoading(true)
        setTimeout(() => {
          const newResponse: Message = {
            id: Date.now().toString(),
            content: generateAIResponse(previousUserMessage.content),
            sender: "ai",
            timestamp: new Date(),
          }
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[messageIndex] = newResponse
            return newMessages
          })
          setIsLoading(false)
        }, 1000)
      }
    }
  }

  const startVoiceInput = () => {
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
        setInputValue(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
        toast({
          title: "Voice input error",
          description: "Could not recognize speech. Please try again.",
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
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32&text=AI" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">AI Study Assistant</h1>
            <p className="text-xs text-muted-foreground">Always ready to help</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Online
          </Badge>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block border-b bg-card p-4">
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 pb-24">
        <div className="space-y-4 max-w-4xl mx-auto">
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* Message Actions */}
                {message.sender === "ai" && (
                  <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur p-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="max-w-4xl mx-auto">
          {/* Suggestions (show when no messages or few messages) - IMPROVED */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">Try asking about:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    className="h-auto p-3 text-left justify-start bg-transparent hover:bg-muted/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                        <suggestion.icon className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{suggestion.description}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              <Separator className="my-4" />
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className="min-h-[44px] max-h-32 resize-none pr-20"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={startVoiceInput}
                  disabled={isLoading || isListening}
                >
                  <Mic className={`h-4 w-4 ${isListening ? "text-red-500" : ""}`} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="h-11 px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <p>Press Enter to send, Shift+Enter for new line</p>
            <p>Powered by AI • Always learning</p>
          </div>
        </div>
      </div>
    </div>
  )
}
