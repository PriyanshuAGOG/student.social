'use client'

import React, { useMemo, useState } from 'react'
import { ConversationItem } from './ConversationItem'

interface Conversation {
  $id: string
  name: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unreadCount?: number
  isOnline?: boolean
  type?: 'direct' | 'group' | 'pod'
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (conversation: Conversation) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  isLoading?: boolean
  showSearchBox?: boolean
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
  showSearchBox = true,
}: ConversationListProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const filteredConversations = useMemo(() => {
    if (!localQuery.trim()) return conversations

    const query = localQuery.toLowerCase()
    return conversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
    )
  }, [conversations, localQuery])

  const handleSearchChange = (newQuery: string) => {
    setLocalQuery(newQuery)
    onSearchChange?.(newQuery)
  }

  return (
    <div className="h-full flex flex-col bg-black border-r border-white/5 w-[340px]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <h2 className="text-lg font-semibold text-white mb-3">Messages</h2>

        {/* Search box */}
        {showSearchBox && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-sm">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">
              {localQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <nav className="space-y-0">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.$id}
                id={conversation.$id}
                name={conversation.name}
                avatar={conversation.avatar}
                lastMessage={conversation.lastMessage}
                timestamp={conversation.timestamp}
                unreadCount={conversation.unreadCount}
                isSelected={selectedId === conversation.$id}
                isOnline={conversation.isOnline}
                type={conversation.type}
                onClick={() => onSelect(conversation)}
              />
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
