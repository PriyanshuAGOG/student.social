'use client'

import Image from 'next/image'
import { LoaderCircle, Phone, PhoneOff, Video } from 'lucide-react'

interface IncomingCallOverlayProps {
  callerName: string
  callerAvatar?: string
  callType: 'audio' | 'video'
  onAccept: () => void
  onReject: () => void
  isLoading?: boolean
}

function CallerAvatar({ name, avatar }: { name: string; avatar?: string }) {
  return (
    <div className="relative">
      <span className="absolute inset-[-5px] animate-ping rounded-full border border-[#8fbdb7]/25 [animation-duration:2.4s]" aria-hidden="true" />
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(145deg,#4c7772,#293d3a)] text-sm font-semibold text-white shadow-[0_12px_35px_rgba(0,0,0,0.4)]">
        {avatar ? <Image src={avatar} alt={name} fill unoptimized sizes="48px" className="object-cover" /> : <span>{name.trim().charAt(0).toUpperCase() || 'P'}</span>}
      </div>
    </div>
  )
}

export function IncomingCallOverlay({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
  isLoading = false,
}: IncomingCallOverlayProps) {
  const isVideo = callType === 'video'

  return (
    <div
      className="peer-call-overlay fixed inset-x-0 top-0 z-[90] flex justify-center px-2 pt-[max(.65rem,env(safe-area-inset-top))] text-white"
      role="alertdialog"
      aria-modal="false"
      aria-label={`Incoming ${isVideo ? 'video' : 'voice'} call from ${callerName}`}
    >
      <section className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#292b28]/97 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <CallerAvatar name={callerName} avatar={callerAvatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{callerName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
            {isVideo ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
            Incoming {isVideo ? 'video' : 'voice'} call
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2" aria-live="polite">
          <button type="button" onClick={onReject} disabled={isLoading} className="grid size-11 place-items-center rounded-full bg-[#a7595c] text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50" aria-label="Decline call"><PhoneOff className="h-4 w-4" /></button>
          <button type="button" onClick={onAccept} disabled={isLoading} className="grid size-11 place-items-center rounded-full bg-[#8fbdb7] text-[#182826] shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50" aria-label="Accept call">
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isVideo ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </button>
        </div>
      </section>
    </div>
  )
}
