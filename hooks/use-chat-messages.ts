import { useState, useCallback, useRef, useEffect } from 'react'
import { chatService } from '@/lib/appwrite'

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
  deliveryState?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  metadata?: Record<string, any>
  deletedAt?: string | null
}

interface UseChatMessagesOptions {
  roomId: string
  userId: string
  onNewMessage?: (message: Message) => void
  onMessageDeleted?: (messageId: string) => void
}

export function useChatMessages({ roomId, userId, onNewMessage, onMessageDeleted }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load messages
  const loadMessages = useCallback(
    async (reset = false) => {
      if (!roomId || !userId) return

      setIsLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      try {
        const response = await chatService.getMessages(roomId, 50)
        const normalizedMessages = (response.documents || []).map((msg: any) => ({
          $id: msg.$id,
          content: msg.content || '',
          authorId: msg.authorId || '',
          authorName: msg.authorName || 'Unknown',
          authorAvatar: msg.authorAvatar,
          timestamp: msg.timestamp || new Date().toISOString(),
          type: msg.type || 'text',
          replyTo: msg.replyTo || null,
          replyToMessage: msg.replyToMessage,
          isEdited: msg.isEdited || false,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          deliveryState: msg.deliveryState || 'sent',
          metadata: msg.metadata || {},
          deletedAt: msg.deletedAt || null,
        }))

        if (!abortControllerRef.current.signal.aborted) {
          setMessages(reset ? normalizedMessages : normalizedMessages)
        }
      } catch (err: any) {
        if (!abortControllerRef.current?.signal.aborted) {
          setError(err.message || 'Failed to load messages')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [roomId, userId]
  )

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachmentUrl?: string, attachmentName?: string) => {
      if (!roomId || !content.trim()) return null

      const tempMessage: Message = {
        $id: `temp-${Date.now()}`,
        content,
        authorId: userId,
        authorName: 'You',
        timestamp: new Date().toISOString(),
        type: attachmentUrl ? 'file' : 'text',
        fileUrl: attachmentUrl,
        fileName: attachmentName,
        deliveryState: 'sending',
      }

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage])

      try {
        const response = await chatService.sendMessage(
          roomId,
          userId,
          content,
          attachmentUrl ? 'file' : 'text',
          {
            fileUrl: attachmentUrl,
            fileName: attachmentName,
          }
        )

        const newMessage: Message = {
          $id: response.$id,
          content: response.content || content,
          authorId: response.authorId || userId,
          authorName: response.authorName || 'You',
          authorAvatar: response.authorAvatar,
          timestamp: response.timestamp || new Date().toISOString(),
          type: response.type || (attachmentUrl ? 'file' : 'text'),
          fileUrl: response.fileUrl || attachmentUrl,
          fileName: response.fileName || attachmentName,
          deliveryState: 'sent',
          metadata: response.metadata,
        }

        setMessages((prev) => prev.map((m) => (m.$id === tempMessage.$id ? newMessage : m)))
        onNewMessage?.(newMessage)

        return newMessage
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.$id === tempMessage.$id ? { ...m, deliveryState: 'failed' as const } : m
          )
        )
        setError(err.message || 'Failed to send message')
        return null
      }
    },
    [roomId, userId, onNewMessage]
  )

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await chatService.deleteMessage(messageId)
        setMessages((prev) => prev.filter((m) => m.$id !== messageId))
        onMessageDeleted?.(messageId)
      } catch (err: any) {
        setError(err.message || 'Failed to delete message')
      }
    },
    [onMessageDeleted]
  )

  // Edit message - optimistic update only
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        setMessages((prev) =>
          prev.map((m) =>
            m.$id === messageId
              ? {
                  ...m,
                  content: content,
                  isEdited: true,
                }
              : m
          )
        )
        // Backend edit would happen here if the API supported it
      } catch (err: any) {
        setError(err.message || 'Failed to edit message')
      }
    },
    []
  )

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    loadMessages,
    sendMessage,
    deleteMessage,
    editMessage,
  }
}
