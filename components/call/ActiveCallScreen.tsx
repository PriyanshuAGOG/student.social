'use client'

import React from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react'

interface ActiveCallScreenProps {
  otherPartyName: string
  otherPartyAvatar?: string
  callType: 'audio' | 'video'
  duration: number
  isMuted: boolean
  isCameraOff: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onEndCall: () => void
  isLoading?: boolean
  isConnecting?: boolean
}

export function ActiveCallScreen({
  otherPartyName,
  otherPartyAvatar,
  callType,
  duration,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  isLoading = false,
  isConnecting = false,
}: ActiveCallScreenProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-slate-900 to-black z-50 flex flex-col items-center justify-between p-4">
      {/* Top section - connection status */}
      {isConnecting && (
        <div className="mt-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-sm">
          Connecting...
        </div>
      )}

      {/* Middle section - participant info */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        {/* Avatar with status */}
        <div className="relative">
          {!isConnecting && (
            <div className="absolute inset-0 rounded-full border-4 border-green-500/50 animate-pulse" />
          )}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-4xl font-semibold text-white overflow-hidden">
            {otherPartyAvatar ? (
              <img
                src={otherPartyAvatar}
                alt={otherPartyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{otherPartyName[0]}</span>
            )}
          </div>
        </div>

        {/* Name and call type */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold text-white">{otherPartyName}</h2>
          <p className="text-lg text-slate-300">{callType === 'video' ? 'Video call' : 'Voice call'}</p>
        </div>

        {/* Duration timer */}
        <div className="text-2xl font-mono text-slate-300 tracking-wider">{formatDuration(duration)}</div>
      </div>

      {/* Bottom section - controls */}
      <div className="w-full flex items-center justify-center gap-6 mb-8">
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          disabled={isLoading || isConnecting}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors border-2 ${
            isMuted
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>

        {/* Camera toggle (video calls only) */}
        {callType === 'video' && (
          <button
            onClick={onToggleCamera}
            disabled={isLoading || isConnecting}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors border-2 ${
              isCameraOff
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />}
          </button>
        )}

        {/* Speaker button */}
        <button
          disabled={isLoading || isConnecting}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-colors border-2 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Speaker options"
        >
          <Volume2 className="w-7 h-7" />
        </button>

        {/* End call button */}
        <button
          onClick={onEndCall}
          disabled={isLoading}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-colors border-2 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title="End call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}
