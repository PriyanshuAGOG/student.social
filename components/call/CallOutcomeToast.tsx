'use client'

import { useEffect } from 'react'
import { PhoneMissed, X } from 'lucide-react'
import type { CallOutcome } from '@/hooks/use-call'
import { useCallOutcomeAlert } from './use-incoming-call-alerts'

export function CallOutcomeToast({ outcome, onClose }: { outcome: CallOutcome; onClose: () => void }) {
  useCallOutcomeAlert(outcome)

  useEffect(() => {
    const timer = window.setTimeout(onClose, 7_000)
    return () => window.clearTimeout(timer)
  }, [onClose, outcome.callId])

  return (
    <div className="fixed left-1/2 top-[max(.75rem,env(safe-area-inset-top))] z-[100] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-[#272a27]/96 p-3 text-white shadow-[0_18px_55px_rgba(0,0,0,.38)] backdrop-blur-2xl" role="status" aria-live="assertive">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#a7595c]/20 text-[#e7a7a9]"><PhoneMissed className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{outcome.title}</p>
        <p className="mt-0.5 text-xs leading-5 text-white/55">{outcome.message}</p>
      </div>
      <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Dismiss call update"><X className="h-4 w-4" /></button>
    </div>
  )
}
