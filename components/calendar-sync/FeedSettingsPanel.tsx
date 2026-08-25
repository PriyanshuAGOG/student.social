'use client'

import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { CalendarSyncSettings } from '@/lib/calendar/settings'

type Props = { settings: CalendarSyncSettings; onChange: (settings: CalendarSyncSettings) => void; onSave: () => void; saving?: boolean }

const inclusionOptions: Array<{ key: keyof CalendarSyncSettings; label: string }> = [
  { key: 'includeClasses', label: 'Classes' }, { key: 'includeStudySessions', label: 'Study sessions' },
  { key: 'includeDeadlines', label: 'Deadlines' }, { key: 'includeAssignments', label: 'Assignments' },
  { key: 'includeExams', label: 'Exams' }, { key: 'includeGoals', label: 'Goals' },
  { key: 'includeHabits', label: 'Habits' }, { key: 'includeProgressReviews', label: 'Progress reviews' },
]

export default function FeedSettingsPanel({ settings, onChange, onSave, saving }: Props) {
  const update = <K extends keyof CalendarSyncSettings>(key: K, value: CalendarSyncSettings[K]) => onChange({ ...settings, [key]: value })
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-semibold">Feed settings</h2><p className="mt-1 text-sm text-muted-foreground">Choose what leaves Student.social and how much detail calendar apps can display.</p></div>
        <Button size="sm" onClick={onSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="calendar-feed-name">Calendar name</Label><Input id="calendar-feed-name" value={settings.feedName} maxLength={120} onChange={(event) => update('feedName', event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="calendar-privacy-mode">Privacy mode</Label><Select value={settings.privacyMode} onValueChange={(value) => update('privacyMode', value as CalendarSyncSettings['privacyMode'])}><SelectTrigger id="calendar-privacy-mode"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full">Full details</SelectItem><SelectItem value="minimal">Minimal details</SelectItem><SelectItem value="title_only">Titles only</SelectItem><SelectItem value="busy_only">Busy blocks only</SelectItem></SelectContent></Select></div>
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-medium">Included learning activity</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{inclusionOptions.map(({ key, label }) => <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-sm"><span>{label}</span><Switch checked={Boolean(settings[key])} onCheckedChange={(checked) => update(key, checked as never)} aria-label={`Include ${label.toLowerCase()}`} /></label>)}</div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="calendar-past-window">Past days</Label><Input id="calendar-past-window" type="number" min={0} max={365} value={settings.pastWindowDays} onChange={(event) => update('pastWindowDays', Number(event.target.value))} /></div>
        <div className="space-y-2"><Label htmlFor="calendar-future-window">Future days</Label><Input id="calendar-future-window" type="number" min={7} max={730} value={settings.futureWindowDays} onChange={(event) => update('futureWindowDays', Number(event.target.value))} /></div>
        <div className="space-y-2"><Label htmlFor="calendar-reminder">Reminder</Label><Select value={String(settings.defaultReminderMinutes)} onValueChange={(value) => update('defaultReminderMinutes', Number(value))}><SelectTrigger id="calendar-reminder"><SelectValue /></SelectTrigger><SelectContent>{[0, 5, 10, 15, 30, 60, 1440].map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes === 0 ? 'None' : minutes === 1440 ? '1 day before' : `${minutes} min before`}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-300">Anyone with your private link can read the exported details. Use “Busy blocks only” on shared devices.</p>
    </section>
  )
}
