'use client'

import React from 'react'

interface ChatHeaderProps {
  title: string
  subtitle?: string
  avatar?: string
  onlineCount?: number
  totalMembers?: number
  onCall?: () => void
  onVideoCall?: () => void
  onMoreOptions?: () => void
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {onVideoCall && (
          <button
            onClick={onVideoCall}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Video call"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}

        {onCall && (
          <button
            onClick={onCall}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Voice call"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
        )}

        {onMoreOptions && (
          <button
            onClick={onMoreOptions}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="More options"
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
