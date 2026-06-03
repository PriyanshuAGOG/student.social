'use client'

import React, { useEffect, useState } from 'react'
import { Phone, PhoneOff, Video, Loader } from 'lucide-react'

interface IncomingCallOverlayProps {
  callerId: string
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
  isLoading?: boolean
}

export function IncomingCallOverlay({
  callerId,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
  isLoading = false,
}: IncomingCallOverlayProps) {
  const [isRinging, setIsRinging] = useState(true)

  useEffect(() => {
    // Ringtone effect (simple pulse)
    const interval = setInterval(() => {
      setIsRinging((prev) => !prev)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      {/* Call card */}
      <div className="bg-gradient-to-b from-slate-900 to-black rounded-2xl p-8 w-full max-w-sm mx-4 space-y-6">
        {/* Caller info */}
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-2xl font-semibold text-white overflow-hidden ${
              isRinging ? 'ring-2 ring-offset-2 ring-offset-black ring-slate-400' : ''
            }`}
          >
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
            ) : (
              <span>{callerName[0]}</span>
            )}
          </div>

          {/* Caller name */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">{callerName}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {callType === 'video' ? 'Incoming video call' : 'Incoming voice call'}
            </p>
          </div>
        </div>

        {/* Call type indicator */}
        <div className="flex justify-center">
          {callType === 'video' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Video className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Video Call</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Voice Call</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          {/* Reject button */}
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Decline</span>
          </button>

          {/* Accept button */}
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl text-green-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  )
}
