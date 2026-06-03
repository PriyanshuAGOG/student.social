'use client'

import React, { useState, useEffect } from 'react'
import { PhoneOff, Loader } from 'lucide-react'

interface OutgoingCallScreenProps {
  receiverName: string
  receiverAvatar?: string
  callType: 'audio' | 'video'
  onCancel: () => void
  isLoading?: boolean
}

export function OutgoingCallScreen({
  receiverName,
  receiverAvatar,
  callType,
  onCancel,
  isLoading = false,
}: OutgoingCallScreenProps) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-slate-900 to-black z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Avatar with pulse ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 opacity-20 animate-pulse" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-3xl font-semibold text-white overflow-hidden">
            {receiverAvatar ? (
              <img src={receiverAvatar} alt={receiverName} className="w-full h-full object-cover" />
            ) : (
              <span>{receiverName[0]}</span>
            )}
          </div>
        </div>

        {/* Receiver name */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold text-white">{receiverName}</h2>
          <p className="text-lg text-slate-400">
            {callType === 'video' ? 'Video call' : 'Voice call'}
          </p>
        </div>

        {/* Calling status */}
        <div className="text-center">
          <p className="text-slate-300">
            Calling<span className="inline-block w-6 text-left">{dots}</span>
          </p>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <PhoneOff className="w-5 h-5" />
          )}
          <span>Cancel call</span>
        </button>
      </div>
    </div>
  )
}
