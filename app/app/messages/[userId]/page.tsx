'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { chatService, profileService, callService } from '@/lib/appwrite'
import { normalizeMessage, type StandardizedMessage } from '@/lib/message-normalizer'
import { ChatHeader } from '@/components/chat/premium/ChatHeader'
import { MessageGroup } from '@/components/chat/premium/MessageGroup'
import { ChatComposer } from '@/components/chat/premium/ChatComposer'
import { TypingIndicator } from '@/components/chat/premium/TypingIndicator'
import { useChatPresence } from '@/hooks/use-chat-presence'

export default function PremiumDirectMessagePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const targetUserId = params.userId as string

  // State
  const [targetProfile, setTargetProfile] = useState<any>(null)
  const [roomId, setRoomId] = useState<string>('')
  const [messages, setMessages] = useState<StandardizedMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<StandardizedMessage | null>(null)
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [showCallHistory, setShowCallHistory] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { presenceEntries, isSomeoneTyping, setTyping } = useChatPresence(roomId, user?.$id)

  const typingUsers = presenceEntries
    .filter((entry) => entry.userId !== user?.$id && entry.status === 'typing')
    .map((entry) => entry.userName)

  // Initialize
  useEffect(() => {
    if (!user?.$id) {
      router.push('/login')
      return
    }

    const init = async () => {
      setIsLoading(true)
      try {
        const [profile] = await Promise.all([
          profileService.getProfile(targetUserId),
        ])
        setTargetProfile(profile)

        const room = await chatService.getOrCreateDirectRoom(user.$id, targetUserId)
        setRoomId(room.$id)
        await loadMessages(room.$id)
      } catch (error: any) {
        toast({
          title: 'Failed to open conversation',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [user?.$id, targetUserId, router, toast])

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = chatService.subscribeToMessages(roomId, (newMsg: any) => {
      const normalized = normalizeMessage(newMsg, user?.$id)
      setMessages((prev) => {
        const exists = prev.some((m) => m.$id === normalized.$id)
        return exists ? prev : [...prev, normalized]
      })
    })

    return () => unsubscribe?.()
  }, [roomId, user?.$id])

  // Handle typing status
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTyping(Boolean(inputValue.trim()))
    }, 750)

    return () => clearTimeout(timeout)
  }, [inputValue, setTyping])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (rid: string) => {
    try {
      const res = await chatService.getMessages(rid, 100)
      const normalized = (res.documents || [])
        .map((msg: any) => normalizeMessage(msg, user?.$id))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      setMessages(normalized)
    } catch (error: any) {
      toast({
        title: 'Failed to load messages',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !roomId || !user?.$id) return

    setIsSending(true)
    try {
      const response = await chatService.sendMessage(
        roomId,
        user.$id,
        inputValue.trim(),
        'text',
        { replyTo: replyingTo?.$id }
      )

      const normalized = normalizeMessage(response, user.$id)
      setMessages((prev) => [...prev, normalized])
      setInputValue('')
      setReplyingTo(null)
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId)
      setMessages((prev) => prev.filter((m) => m.$id !== messageId))
    } catch (error: any) {
      toast({
        title: 'Failed to delete message',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      // Optimistically update reactions
      setMessages((prev) =>
        prev.map((m) => {
          if (m.$id === messageId) {
            const reactions = m.metadata?.reactions || {}
            return {
              ...m,
              metadata: {
                ...m.metadata,
                reactions: {
                  ...reactions,
                  [emoji]: [...(reactions[emoji] || []), user?.$id || ''].filter(Boolean),
                },
              },
            }
          }
          return m
        })
      )
      
      // Try to sync with server if method exists
      if (typeof (chatService as any).addReaction === 'function') {
        await (chatService as any).addReaction(messageId, emoji)
      }
    } catch (error: any) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleStartCall = async () => {
    if (!roomId || !user?.$id || !targetProfile?.$id) return

    setIsStartingCall(true)
    try {
      // Use startRoomCall if initiateCall doesn't exist
      const callMethod = typeof (callService as any).initiateCall === 'function' 
        ? (callService as any).initiateCall 
        : (callService as any).startRoomCall
      
      await callMethod(roomId, 'voice')
    } catch (error: any) {
      toast({
        title: 'Failed to start call',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsStartingCall(false)
    }
  }

  const handleStartVideoCall = async () => {
    if (!roomId || !user?.$id || !targetProfile?.$id) return

    setIsStartingCall(true)
    try {
      // Use startRoomCall if initiateCall doesn't exist
      const callMethod = typeof (callService as any).initiateCall === 'function' 
        ? (callService as any).initiateCall 
        : (callService as any).startRoomCall
      
      await callMethod(roomId, 'video')
    } catch (error: any) {
      toast({
        title: 'Failed to start video call',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsStartingCall(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <ChatHeader
        title={targetProfile?.name || targetProfile?.username || 'User'}
        subtitle={targetProfile?.bio || ''}
        avatar={targetProfile?.avatar}
        showBackButton={true}
        onBack={() => router.back()}
        onCall={handleStartCall}
        onVideoCall={handleStartVideoCall}
        onMoreOptions={() => console.log('More options')}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400 text-sm">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">Start a conversation</p>
          </div>
        ) : (
          <>
            <MessageGroup
              messages={messages}
              currentUserId={user?.$id || ''}
              onReply={setReplyingTo}
              onDelete={handleDeleteMessage}
              onReact={handleReact}
            />
            {isSomeoneTyping && (
              <TypingIndicator names={typingUsers} isTyping={true} />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <ChatComposer
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isSending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder="Type a message..."
      />
    </div>
  )
}
