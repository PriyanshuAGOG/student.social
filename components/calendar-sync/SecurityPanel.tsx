'use client'

import { KeyRound, Loader2, PauseCircle, PlayCircle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = { status: 'active' | 'disabled' | 'revoked' | 'not_enabled'; tokenPrefix?: string; fetchCount?: number; lastFetchedAt?: string | null; workingAction?: string; onRotate: () => void; onToggle: () => void }

export default function SecurityPanel({ status, tokenPrefix, fetchCount = 0, lastFetchedAt, workingAction, onRotate, onToggle }: Props) {
  const busy = workingAction === 'rotate' || workingAction === 'disable' || workingAction === 'enable'
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div>
      <h2 className="mt-4 font-semibold">Link security</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Pause syncing without changing the link, or regenerate it if it may have been exposed.</p>
      <dl className="mt-5 space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Token</dt><dd><code>{tokenPrefix || 'Unavailable'}…</code></dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Feed checks</dt><dd>{fetchCount.toLocaleString()}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Last checked</dt><dd className="text-right">{lastFetchedAt ? new Date(lastFetchedAt).toLocaleString() : 'Not yet'}</dd></div>
      </dl>
      <div className="mt-5 grid gap-2">
        <Button variant="outline" onClick={onRotate} disabled={busy}>{workingAction === 'rotate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}Regenerate private link</Button>
        <Button variant={status === 'active' ? 'destructive' : 'default'} onClick={onToggle} disabled={busy}>{workingAction === 'disable' || workingAction === 'enable' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : status === 'active' ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}{status === 'active' ? 'Pause calendar feed' : 'Enable calendar feed'}</Button>
      </div>
    </section>
  )
}
