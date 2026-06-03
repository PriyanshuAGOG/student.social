'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'

interface ConversationItemProps {
  id: string
  name: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unreadCount?: number
  isSelected?: boolean
  isOnline?: boolean
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  type?: 'direct' | 'group' | 'pod'
}

export function ConversationItem({
  id,
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount,
  isSelected,
  isOnline,
  onClick,
  onContextMenu,
  type = 'direct',
}: ConversationItemProps) {
  const timeFormatted = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: false }) : ''

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-2 ${
        isSelected
          ? 'bg-white/10 border-l-white/40'
          : 'hover:bg-white/5 border-l-transparent hover:border-l-white/20'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-sm font-semibold text-white overflow-hidden flex-shrink-0">
          {avatar && avatar.startsWith('http') ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{name[0]?.toUpperCase()}</span>
          )}
        </div>
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h3 className="font-medium text-sm text-white truncate">{name}</h3>
          {timeFormatted && (
            <span className="text-xs text-slate-500 flex-shrink-0">{timeFormatted}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">{lastMessage || 'No messages yet'}</p>
      </div>

      {/* Unread indicator */}
      {unreadCount && unreadCount > 0 && (
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
          <span className="text-xs font-bold text-black">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </div>
      )}
    </button>
  )
}
