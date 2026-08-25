'use client'

import Image from 'next/image'
import { LoaderCircle, LockKeyhole, Phone, PhoneOff, ShieldCheck, Video } from 'lucide-react'

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
      <span className="absolute inset-[-18px] animate-ping rounded-full border border-[#8fbdb7]/20 [animation-duration:2.4s]" aria-hidden="true" />
      <span className="absolute inset-[-8px] rounded-full border border-white/10" aria-hidden="true" />
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(145deg,#4c7772,#293d3a)] text-3xl font-semibold text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:h-28 md:w-28">
        {avatar ? <Image src={avatar} alt={name} fill unoptimized sizes="128px" className="object-cover" /> : <span>{name.trim().charAt(0).toUpperCase() || 'P'}</span>}
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
      className="peer-call-overlay fixed inset-0 z-[90] flex items-end justify-center bg-[#222321]/94 text-white backdrop-blur-2xl md:items-center md:p-6"
      style={{ height: '100dvh', maxHeight: 'none', overflow: 'hidden' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Incoming ${isVideo ? 'video' : 'voice'} call from ${callerName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(143,189,183,0.16),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(118,85,109,0.14),transparent_32%),linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.24))]" aria-hidden="true" />

      <section className="relative flex min-h-[68dvh] w-full max-w-md flex-col items-center justify-between rounded-t-[1.75rem] border border-white/[0.08] bg-[#292b28]/96 px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 shadow-[0_-24px_90px_rgba(0,0,0,0.42)] md:min-h-0 md:rounded-[1.75rem] md:px-9 md:py-8">
        <div className="flex w-full items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-white/55"><ShieldCheck className="h-4 w-4 text-[#8fbdb7]" /> Student.social</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45"><LockKeyhole className="h-3 w-3" /> Private</span>
        </div>

        <div className="my-7 flex flex-col items-center text-center md:my-10">
          <CallerAvatar name={callerName} avatar={callerAvatar} />
          <h1 className="mt-6 max-w-full truncate text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{callerName}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/50">
            {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Incoming {isVideo ? 'video' : 'voice'} call
          </p>
          <p className="mt-3 max-w-xs text-xs leading-5 text-white/35">Answer when you’re ready. The call opens in a focused, distraction-free space.</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-5" aria-live="polite">
          <button type="button" onClick={onReject} disabled={isLoading} className="group flex flex-col items-center gap-3 rounded-2xl py-2 text-sm font-medium text-white/55 transition hover:text-white disabled:opacity-50">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#a7595c] text-white shadow-[0_12px_32px_rgba(89,35,42,0.28)] transition group-hover:scale-105 group-active:scale-95"><PhoneOff className="h-5 w-5" /></span>
            Decline
          </button>
          <button type="button" onClick={onAccept} disabled={isLoading} className="group flex flex-col items-center gap-3 rounded-2xl py-2 text-sm font-medium text-white/75 transition hover:text-white disabled:opacity-50">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8fbdb7] text-[#182826] shadow-[0_12px_32px_rgba(63,111,107,0.28)] transition group-hover:scale-105 group-active:scale-95">
              {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : isVideo ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </span>
            {isLoading ? 'Connecting…' : 'Accept'}
          </button>
        </div>
      </section>
    </div>
  )
}
