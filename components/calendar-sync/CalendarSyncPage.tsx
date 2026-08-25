'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Check, Copy, ExternalLink, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getDefaultCalendarSyncSettings, type CalendarSyncSettings } from '@/lib/calendar/settings'
import ProviderCards from './ProviderCards'
import FeedSettingsPanel from './FeedSettingsPanel'
import SecurityPanel from './SecurityPanel'
import CalendarPreview, { type CalendarPreviewEvent } from './CalendarPreview'

type FeedStatus = 'loading' | 'not_enabled' | 'active' | 'disabled' | 'revoked'

type FeedData = {
  status: FeedStatus
  feedUrl?: string
  webcalUrl?: string
  tokenPrefix?: string
  settings?: CalendarSyncSettings
  fetchCount?: number
  lastFetchedAt?: string | null
}

async function calendarRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
    headers,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message || 'Calendar sync could not be updated.')
  }
  return payload.data as T
}

export default function CalendarSyncPage() {
  const { toast } = useToast()
  const [feed, setFeed] = useState<FeedData>({ status: 'loading' })
  const [settings, setSettings] = useState<CalendarSyncSettings>(getDefaultCalendarSyncSettings())
  const [preview, setPreview] = useState<CalendarPreviewEvent[]>([])
  const [workingAction, setWorkingAction] = useState('')
  const [copied, setCopied] = useState(false)

  const loadFeed = useCallback(async () => {
    setFeed((current) => ({ ...current, status: 'loading' }))
    try {
      const data = await calendarRequest<FeedData>('/api/calendar-sync/manage')
      setFeed(data)
      if (data.settings) setSettings(data.settings)
    } catch (error) {
      setFeed({ status: 'not_enabled' })
      toast({ title: 'Calendar sync unavailable', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    }
  }, [toast])

  const loadPreview = useCallback(async () => {
    if (feed.status !== 'active' && feed.status !== 'disabled') return
    try {
      const data = await calendarRequest<{ events?: CalendarPreviewEvent[] }>('/api/calendar-sync/manage?action=preview')
      setPreview(data.events || [])
    } catch {
      setPreview([])
    }
  }, [feed.status])

  useEffect(() => { void loadFeed() }, [loadFeed])
  useEffect(() => { void loadPreview() }, [loadPreview])

  const runAction = async (action: 'create' | 'rotate' | 'disable' | 'enable') => {
    if (action === 'rotate' && !window.confirm('Regenerate this private link? Apps using the old link will stop syncing.')) return
    setWorkingAction(action)
    try {
      const data = await calendarRequest<FeedData>(`/api/calendar-sync/manage?action=${action}`, { method: 'POST' })
      setFeed((current) => ({ ...current, ...data }))
      if (data.settings) setSettings(data.settings)
      setCopied(false)
      toast({ title: action === 'create' ? 'Calendar feed created' : action === 'rotate' ? 'Private link regenerated' : action === 'disable' ? 'Calendar feed paused' : 'Calendar feed enabled' })
    } catch (error) {
      toast({ title: 'Calendar sync was not changed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setWorkingAction('')
    }
  }

  const saveSettings = async () => {
    setWorkingAction('settings')
    try {
      const data = await calendarRequest<FeedData>('/api/calendar-sync/manage', { method: 'PATCH', body: JSON.stringify(settings) })
      setFeed((current) => ({ ...current, ...data }))
      if (data.settings) setSettings(data.settings)
      toast({ title: 'Calendar settings saved' })
      void loadPreview()
    } catch (error) {
      toast({ title: 'Settings were not saved', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setWorkingAction('')
    }
  }

  const copyFeedUrl = async () => {
    if (!feed.feedUrl) return
    await navigator.clipboard.writeText(feed.feedUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  if (feed.status === 'loading') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center p-6" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading your calendar connection…</span>
      </div>
    )
  }

  const enabled = feed.status !== 'not_enabled' && feed.status !== 'revoked'

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24 sm:p-6 md:pb-8 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><CalendarDays className="h-4 w-4" />One calendar, everywhere</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Calendar Sync</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Keep classes, study sessions, deadlines, and goals updated in Google, Apple, Outlook, or any calendar app.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeed} aria-label="Refresh calendar sync status"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </header>

      {!enabled ? (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Create your private calendar feed</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Student.social creates a revocable link for this account. Your calendar app checks it for updates; your login details are never shared.</p>
            </div>
            <Button onClick={() => void runAction('create')} disabled={workingAction === 'create'}>
              {workingAction === 'create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create feed
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${feed.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                  <h2 className="font-semibold">Private calendar link</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{feed.status}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Treat this link like a password. Regenerate it any time from the security panel.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" onClick={copyFeedUrl} disabled={!feed.feedUrl}>
                  {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? 'Copied' : 'Copy link'}
                </Button>
                {feed.webcalUrl ? <Button asChild><a href={feed.webcalUrl}>Open calendar<ExternalLink className="ml-2 h-4 w-4" /></a></Button> : null}
              </div>
            </div>
            <code className="mt-4 block overflow-x-auto rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">{feed.feedUrl}</code>
          </section>

          <ProviderCards feedUrl={feed.feedUrl || ''} webcalUrl={feed.webcalUrl || ''} />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
            <FeedSettingsPanel settings={settings} onChange={setSettings} onSave={() => void saveSettings()} saving={workingAction === 'settings'} />
            <SecurityPanel status={feed.status} tokenPrefix={feed.tokenPrefix} fetchCount={feed.fetchCount} lastFetchedAt={feed.lastFetchedAt} workingAction={workingAction} onRotate={() => void runAction('rotate')} onToggle={() => void runAction(feed.status === 'active' ? 'disable' : 'enable')} />
          </div>
          <CalendarPreview items={preview} />
        </>
      )}
    </div>
  )
}
