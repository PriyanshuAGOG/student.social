'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'

interface ChatBubbleProps {
  content: string
  isOwn: boolean
  timestamp: string
  authorName?: string
  authorAvatar?: string
  fileUrl?: string | null
  fileName?: string | null
  replyToMessage?: any
  isEdited?: boolean
  deliveryState?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  onReply?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onReact?: (emoji: string) => void
  reactions?: Record<string, string[]>
}

export function ChatBubble({
  content,
  isOwn,
  timestamp,
  authorName,
  authorAvatar,
  fileUrl,
  fileName,
  replyToMessage,
  isEdited,
  deliveryState,
  onReply,
  onDelete,
  onEdit,
  onReact,
  reactions,
}: ChatBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  const timeFormatted = format(new Date(timestamp), 'HH:mm')
  const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)

  return (
    <div
      className={`flex gap-3 py-2 transition-opacity duration-200 ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for received messages */}
      {!isOwn && authorAvatar && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden">
          {authorAvatar.startsWith('http') ? (
            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <span>{authorName?.[0] || '?'}</span>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply target */}
        {replyToMessage && (
          <div className="px-3 py-2 rounded-lg text-xs text-slate-400 border border-slate-700/50 bg-slate-900/30">
            <div className="font-medium text-slate-200 mb-1">{replyToMessage.authorName}</div>
            <div className="truncate text-slate-300">{replyToMessage.content?.substring(0, 50)}</div>
          </div>
        )}

        {/* Main message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 transition-all duration-150 group ${
            isOwn
              ? 'bg-white/8 backdrop-blur-sm border border-white/10 text-white'
              : 'bg-white/5 backdrop-blur-sm border border-white/5 text-white'
          } ${showActions ? 'shadow-lg' : ''}`}
        >
          {/* File attachment */}
          {fileUrl && !isImage && (
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <a
                href={fileUrl}
                download={fileName}
                className="underline hover:text-slate-100 truncate"
              >
                {fileName || 'Download'}
              </a>
            </div>
          )}

          {/* Image attachment */}
          {isImage && (
            <img
              src={fileUrl}
              alt="Attachment"
              className="rounded-lg max-h-64 max-w-full mb-2 object-cover"
            />
          )}

          {/* Text content */}
          <p className="text-sm leading-relaxed text-slate-50 break-words">{content}</p>

          {/* Edit indicator */}
          {isEdited && (
            <span className="text-xs text-slate-400 mt-1 block">(edited)</span>
          )}
        </div>

        {/* Reactions */}
        {reactions && Object.keys(reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                className="px-2 py-1 rounded-full text-xs bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                onClick={() => onReact?.(emoji)}
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and delivery state */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <span>{timeFormatted}</span>
          {isOwn && (
            <>
              {deliveryState === 'sending' && (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {deliveryState === 'sent' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {deliveryState === 'read' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                    opacity="0.5"
                  />
                </svg>
              )}
              {deliveryState === 'failed' && (
                <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons (hover reveal) */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={onReply}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6-6m0 0l-6-6"
              />
            </svg>
          </button>
          {onReact && (
            <button
              onClick={() => onReact('👍')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="React"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5"
                />
              </svg>
            </button>
          )}
          {onEdit && isOwn && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onDelete && isOwn && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
