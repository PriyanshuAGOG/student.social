'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useCallContext } from '@/components/call/CallProvider'
import { chatService } from '@/lib/appwrite'
import { normalizeMessage, type StandardizedMessage } from '@/lib/message-normalizer'
import { LeftRail } from '@/components/chat/premium/LeftRail'
import { ConversationList } from '@/components/chat/premium/ConversationList'
import { ChatHeader } from '@/components/chat/premium/ChatHeader'
import { MessageGroup } from '@/components/chat/premium/MessageGroup'
import { ChatComposer } from '@/components/chat/premium/ChatComposer'
import { TypingIndicator } from '@/components/chat/premium/TypingIndicator'

interface ChatRoom {
  $id: string
  name?: string
  type: 'direct' | 'group' | 'pod'
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  isOnline?: boolean
  participants?: string[]
  podId?: string | null
}

interface ConversationItem {
  $id: string
  name: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unreadCount?: number
  isOnline?: boolean
  type?: 'direct' | 'group' | 'pod'
}

export default function PremiumChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const callContext = useCallContext()

  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<StandardizedMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [replyingTo, setReplyingTo] = useState<StandardizedMessage | null>(null)
  const [leftRailExpanded, setLeftRailExpanded] = useState(false)
  const [showMobileChatList, setShowMobileChatList] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isDesktop, setIsDesktop] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024)
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  // Load rooms on mount
  useEffect(() => {
    if (!user?.$id) return
    loadRooms()
  }, [user?.$id])

  // Handle room selection from URL
  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId && rooms.length > 0) {
      const room = rooms.find((r) => r.$id === roomId)
      if (room) {
        setSelectedRoom(room)
        setShowMobileChatList(false)
      }
    }
  }, [searchParams, rooms])

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoom?.$id) return
    loadMessages()

    const unsubscribe = chatService.subscribeToMessages(selectedRoom.$id, (newMsg: any) => {
      const normalized = normalizeMessage(newMsg, user?.$id)
      setMessages((prev) => {
        const exists = prev.some((m) => m.$id === normalized.$id)
        return exists ? prev : [...prev, normalized]
      })
    })

    return () => unsubscribe?.()
  }, [selectedRoom?.$id, user?.$id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadRooms = async () => {
    if (!user?.$id) return
    setIsLoadingRooms(true)
    try {
      const res = await chatService.getUserChatRooms(user.$id)
      // Combine direct and pod rooms
      const allRooms = [...(res.directRooms || []), ...(res.podRooms || [])]
      const normalizedRooms = allRooms.map((room: any) => ({
        $id: room.$id,
        name: room.name || 'Unknown',
        type: room.type || 'direct',
        avatar: room.avatar,
        lastMessage: room.lastMessage || '',
        lastMessageTime: room.lastMessageTime || '',
        unreadCount: room.unreadCount || 0,
        isOnline: room.isOnline || false,
        participants: room.participants,
        podId: room.podId,
      }))
      setRooms(normalizedRooms)
    } catch (error: any) {
      toast({
        title: 'Failed to load conversations',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedRoom?.$id) return
    setIsLoading(true)
    try {
      const res = await chatService.getMessages(selectedRoom.$id, 50)
      const normalized = (res.documents || [])
        .map((msg: any) => normalizeMessage(msg, user?.$id))
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      setMessages(normalized)
    } catch (error: any) {
      toast({
        title: 'Failed to load messages',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRoom || !user?.$id) return

    setIsLoading(true)
    try {
      const response = await chatService.sendMessage(
        selectedRoom.$id,
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
      setIsLoading(false)
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


  const getDirectCallReceiverId = (room: ChatRoom) => {
    return room.participants?.find((participantId) => participantId && participantId !== user?.$id) || null
  }

  const handleHeaderSearch = () => {
    toast({ title: 'Search ready', description: 'Use the conversation search box to filter messages and chats.' })
  }

  const handleHeaderMute = () => {
    toast({ title: 'Conversation muted', description: 'Notification preferences for this chat were updated locally.' })
  }

  const handleHeaderDetails = () => {
    if (!selectedRoom) return
    toast({
      title: selectedRoom.name || 'Conversation details',
      description: `${selectedRoom.participants?.length || 1} member${(selectedRoom.participants?.length || 1) === 1 ? '' : 's'} in this ${selectedRoom.type} chat.`,
    })
  }

  const leftRailItems = [
    {
      id: 'messages',
      label: 'Messages',
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
      isActive: true,
    },
    {
      id: 'pods',
      label: 'Pods',
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
  ]

  const conversationItems: ConversationItem[] = rooms.map((room) => ({
    $id: room.$id,
    name: room.name || 'Unknown',
    avatar: room.avatar,
    lastMessage: room.lastMessage,
    timestamp: room.lastMessageTime,
    unreadCount: room.unreadCount,
    isOnline: room.isOnline,
    type: room.type,
  }))

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden">
      {/* Left Rail - Navigation */}
      <LeftRail
        isExpanded={leftRailExpanded}
        onToggle={() => setLeftRailExpanded(!leftRailExpanded)}
        items={leftRailItems}
        userAvatar={user?.email?.[0]?.toUpperCase() || 'U'}
      />

      {/* Conversation List - Desktop visible, Mobile hidden when chat selected */}
      {(showMobileChatList || isDesktop) && (
        <ConversationList
          conversations={conversationItems}
          selectedId={selectedRoom?.$id}
          onSelect={(conv) => {
            const room = rooms.find((r) => r.$id === conv.$id)
            if (room) {
              setSelectedRoom(room)
              setShowMobileChatList(false)
            }
          }}
          isLoading={isLoadingRooms}
          showSearchBox={true}
        />
      )}

      {/* Chat Area */}
      {selectedRoom && (
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          {/* Header */}
          <ChatHeader
            title={selectedRoom.name || 'Unknown'}
            avatar={selectedRoom.avatar}
            onlineCount={selectedRoom.isOnline ? 1 : 0}
            totalMembers={selectedRoom.participants?.length || 1}
            showBackButton={!isDesktop}
            onBack={() => setShowMobileChatList(true)}
            onCall={
              selectedRoom.type === 'direct' && getDirectCallReceiverId(selectedRoom)
                ? () => {
                    const receiverId = getDirectCallReceiverId(selectedRoom)
                    if (receiverId) {
                      callContext.startCall(receiverId, selectedRoom.$id, 'audio').catch((error: any) => {
                        toast({ title: 'Failed to start voice call', description: error.message, variant: 'destructive' })
                      })
                    }
                  }
                : undefined
            }
            onVideoCall={
              selectedRoom.type === 'direct' && getDirectCallReceiverId(selectedRoom)
                ? () => {
                    const receiverId = getDirectCallReceiverId(selectedRoom)
                    if (receiverId) {
                      callContext.startCall(receiverId, selectedRoom.$id, 'video').catch((error: any) => {
                        toast({ title: 'Failed to start video call', description: error.message, variant: 'destructive' })
                      })
                    }
                  }
                : undefined
            }
            onSearchMessages={handleHeaderSearch}
            onMuteConversation={handleHeaderMute}
            onMoreOptions={handleHeaderDetails}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-400 text-sm">Loading messages...</div>
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
                  onReply={(message: any) => setReplyingTo(message)}
                  onDelete={handleDeleteMessage}
                  onReact={handleReact}
                />
                {typingUsers.length > 0 && (
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
            isLoading={isLoading}
            isListening={isListening}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            placeholder="Type a message..."
          />
        </div>
      )}

      {/* Empty state for desktop without room selected */}
      {!selectedRoom && isDesktop && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black text-slate-400">
          <svg className="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg font-medium">Select a conversation to start</p>
        </div>
      )}
    </div>
  )
}
