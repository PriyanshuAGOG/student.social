'use client'

import React from 'react'
import { MoreVertical, Phone, Search, Settings, Video, VolumeX } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface ChatHeaderProps {
  title: string
  subtitle?: string
  avatar?: string
  onlineCount?: number
  totalMembers?: number
  onCall?: () => void
  onVideoCall?: () => void
  onMoreOptions?: () => void
  onSearchMessages?: () => void
  onMuteConversation?: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatHeader({
  title,
  subtitle,
  avatar,
  onlineCount,
  totalMembers,
  onCall,
  onVideoCall,
  onMoreOptions,
  onSearchMessages,
  onMuteConversation,
  onBack,
  showBackButton = false,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Avatar */}
        {avatar && (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-sm font-semibold text-white overflow-hidden flex-shrink-0">
            {avatar.startsWith('http') ? (
              <img src={avatar} alt={title} className="w-full h-full object-cover" />
            ) : (
              <span>{title[0]}</span>
            )}
          </div>
        )}

        {/* Title & subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">
              {onlineCount && totalMembers ? (
                <>
                  {onlineCount} online of {totalMembers} members
                </>
              ) : (
                subtitle
              )}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 text-slate-200">
        {onVideoCall && (
          <button
            type="button"
            onClick={onVideoCall}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 shadow-sm transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Video call"
            aria-label="Start video call"
          >
            <Video className="h-5 w-5" />
          </button>
        )}

        {onCall && (
          <button
            type="button"
            onClick={onCall}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 shadow-sm transition hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Voice call"
            aria-label="Start voice call"
          >
            <Phone className="h-5 w-5" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 shadow-sm transition hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              title="More options"
              aria-label="Open conversation options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-white/10 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem onSelect={onSearchMessages} className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Search className="mr-2 h-4 w-4" />
              Search messages
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onMuteConversation} className="cursor-pointer focus:bg-white/10 focus:text-white">
              <VolumeX className="mr-2 h-4 w-4" />
              Mute conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onSelect={onMoreOptions} className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Settings className="mr-2 h-4 w-4" />
              Conversation details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
