'use client'

import React, { useRef, useState, useEffect } from 'react'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAttach?: () => void
  onEmoji?: () => void
  onVoice?: () => void
  isLoading?: boolean
  isListening?: boolean
  placeholder?: string
  replyingTo?: any
  onCancelReply?: () => void
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onAttach,
  onEmoji,
  onVoice,
  isLoading,
  isListening,
  placeholder = 'Type a message...',
  replyingTo,
  onCancelReply,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-xl p-4 space-y-3">
      {/* Reply target */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 mb-0.5">Replying to {replyingTo.authorName}</div>
            <div className="text-sm text-slate-200 truncate">{replyingTo.content?.substring(0, 80)}</div>
          </div>
          {onCancelReply && (
            <button
              onClick={onCancelReply}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Composer input area */}
      <div className="flex items-end gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors focus-within:border-white/30">
        {/* Attachment button */}
        <button
          onClick={onAttach}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex-shrink-0"
          title="Attach file"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>

        {/* Image button */}
        <button
          onClick={onAttach}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex-shrink-0"
          title="Attach image"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none max-h-[120px] disabled:opacity-50"
          rows={1}
          style={{ minHeight: '20px' }}
        />

        {/* Emoji button */}
        <button
          onClick={onEmoji}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex-shrink-0"
          title="Add emoji"
        >
          <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </button>

        {/* Voice button */}
        <button
          onClick={onVoice}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ${
            isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-slate-400'
          }`}
          title={isListening ? 'Stop recording' : 'Voice message'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.2-.9-5.7-2.36m9.4-8.54V5a4 4 0 00-8 0v3.37M3.41 9c0 .5.45.9.9.9h.18c.47-1.45 1.69-2.66 3.21-3.16V5a4 4 0 018 0v1.74c1.52.5 2.74 1.71 3.21 3.16h.18c.45 0 .9-.4.9-.9" />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 transition-colors flex-shrink-0"
          title="Send message"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
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
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346276 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7521035 3.50612381,10.7521035 L16.6915026,11.5375905 C16.6915026,11.5375905 17.1624089,11.5375905 17.1624089,12.0088827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Help text */}
      <div className="text-xs text-slate-500 px-4">
        Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/20">Enter</kbd> to send,{' '}
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/20">Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}
