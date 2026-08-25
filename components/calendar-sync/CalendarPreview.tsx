'use client'

import { CalendarClock } from 'lucide-react'

export type CalendarPreviewEvent = { title: string; type?: string; startAt?: string }

export default function CalendarPreview({ items }: { items: CalendarPreviewEvent[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><CalendarClock className="h-5 w-5" /></div><div><h2 className="font-semibold">Calendar preview</h2><p className="text-sm text-muted-foreground">A safe preview of what your feed currently exports.</p></div></div>
      <div className="mt-4 divide-y rounded-xl border">
        {items.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No upcoming calendar items match these settings.</p> : items.map((item, index) => <div key={`${item.title}-${item.startAt || index}`} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs capitalize text-muted-foreground">{(item.type || 'event').replaceAll('_', ' ')}</p></div><time className="text-xs text-muted-foreground" dateTime={item.startAt}>{item.startAt ? new Date(item.startAt).toLocaleString() : 'Time withheld'}</time></div>)}
      </div>
    </section>
  )
}
