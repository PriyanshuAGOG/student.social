"use client"

import { useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "student.social.chat.outbox.v1"

export type ChatOutboxStatus = "queued" | "sending" | "failed"

export interface ChatOutboxMessage {
  $id: string
  id: string
  roomId: string
  clientMessageId: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  timestamp: string
  type: string
  deliveryState: ChatOutboxStatus
  replyTo?: string | null
  replyToMessage?: any
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  errorMessage?: string | null
  localOnly: true
  readBy?: string[]
}

function getClientMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function readStore(): Record<string, ChatOutboxMessage[]> {
  if (typeof window === "undefined") return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, ChatOutboxMessage[]>) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage failures; the outbox still works in memory.
  }
}

export function createOutboxMessage(input: {
  roomId: string
  authorId: string
  content: string
  type?: string
  authorName?: string
  authorAvatar?: string
  replyTo?: string | null
  replyToMessage?: any
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  clientMessageId?: string
  deliveryState?: ChatOutboxStatus
}): ChatOutboxMessage {
  const clientMessageId = input.clientMessageId || getClientMessageId()
  const timestamp = new Date().toISOString()

  return {
    $id: clientMessageId,
    id: clientMessageId,
    roomId: input.roomId,
    clientMessageId,
    content: input.content,
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    timestamp,
    type: input.type || "text",
    deliveryState: input.deliveryState || "sending",
    replyTo: input.replyTo || null,
    replyToMessage: input.replyToMessage || null,
    fileUrl: input.fileUrl || null,
    fileName: input.fileName || null,
    fileSize: typeof input.fileSize === "number" ? input.fileSize : null,
    errorMessage: null,
    localOnly: true,
    readBy: [input.authorId],
  }
}

export function mergeChatMessages<T extends { $id?: string; id?: string; clientMessageId?: string; timestamp?: string }>(
  serverMessages: T[],
  outboxMessages: ChatOutboxMessage[],
) {
  const merged = new Map<string, T | ChatOutboxMessage>()

  for (const message of serverMessages) {
    const key = message.clientMessageId || message.$id || message.id || `${message.timestamp || "message"}`
    merged.set(key, message)
  }

  for (const message of outboxMessages) {
    const key = message.clientMessageId || message.$id || message.id
    if (!merged.has(key)) {
      merged.set(key, message)
    }
  }

  return Array.from(merged.values()).sort((a, b) => new Date((a as any).timestamp || 0).getTime() - new Date((b as any).timestamp || 0).getTime())
}

export function useChatOutbox(roomId: string) {
  const [outboxMessages, setOutboxMessages] = useState<ChatOutboxMessage[]>([])

  useEffect(() => {
    if (!roomId) {
      setOutboxMessages([])
      return
    }

    const store = readStore()
    setOutboxMessages(Array.isArray(store[roomId]) ? store[roomId] : [])
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    const store = readStore()
    store[roomId] = outboxMessages
    writeStore(store)
  }, [roomId, outboxMessages])

  const queueMessage = (message: ChatOutboxMessage) => {
    setOutboxMessages((prev) => {
      const next = prev.filter((entry) => entry.clientMessageId !== message.clientMessageId)
      next.push(message)
      return next
    })
    return message
  }

  const markMessageSending = (clientMessageId: string) => {
    setOutboxMessages((prev) =>
      prev.map((entry) =>
        entry.clientMessageId === clientMessageId
          ? { ...entry, deliveryState: "sending", errorMessage: null }
          : entry,
      ),
    )
  }

  const markMessageFailed = (clientMessageId: string, errorMessage?: string) => {
    setOutboxMessages((prev) =>
      prev.map((entry) =>
        entry.clientMessageId === clientMessageId
          ? { ...entry, deliveryState: "failed", errorMessage: errorMessage || "Failed to send message" }
          : entry,
      ),
    )
  }

  const removeMessage = (clientMessageId: string) => {
    setOutboxMessages((prev) => prev.filter((entry) => entry.clientMessageId !== clientMessageId))
  }

  const clearOutbox = () => {
    setOutboxMessages([])
  }

  const sendingCount = useMemo(
    () => outboxMessages.filter((entry) => entry.deliveryState === "sending" || entry.deliveryState === "queued").length,
    [outboxMessages],
  )

  return {
    outboxMessages,
    queueMessage,
    markMessageSending,
    markMessageFailed,
    removeMessage,
    clearOutbox,
    sendingCount,
  }
}
