'use client'

import React from 'react'

interface TypingIndicatorProps {
  names?: string[]
  isTyping?: boolean
}

export function TypingIndicator({ names = [], isTyping = false }: TypingIndicatorProps) {
  if (!isTyping || names.length === 0) return null

  const displayName =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names[0]} and ${names.length - 1} others`

  return (
    <div className="flex items-end gap-3 py-2 px-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" />
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-slate-400"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">{displayName} typing...</p>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
