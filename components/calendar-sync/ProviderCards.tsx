'use client'

import { Apple, CalendarPlus, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { providerLinks } from '@/lib/calendar/providerLinks'

export default function ProviderCards({ feedUrl, webcalUrl }: { feedUrl: string; webcalUrl: string }) {
  const providers = [
    { name: 'Google Calendar', description: 'Copy the link, then add a calendar from URL.', open: providerLinks.google, icon: CalendarPlus },
    { name: 'Apple Calendar', description: 'Subscribe in one step on Apple devices.', open: webcalUrl, icon: Apple },
    { name: 'Outlook', description: 'Add a calendar by subscribing from the web.', open: providerLinks.outlook, icon: CalendarPlus },
    { name: 'Other calendar apps', description: 'Works with any app that supports ICS feeds.', open: '', icon: CalendarPlus },
  ]
  const copy = () => navigator.clipboard.writeText(feedUrl)
  return (
    <section aria-labelledby="calendar-providers-heading">
      <div className="mb-3"><h2 id="calendar-providers-heading" className="font-semibold">Choose your calendar app</h2><p className="mt-1 text-sm text-muted-foreground">The same private feed can be used on multiple devices.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map(({ name, description, open, icon: Icon }) => <article key={name} className="flex min-h-48 flex-col rounded-2xl border bg-card p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-medium">{name}</h3><p className="mt-1 flex-1 text-sm leading-5 text-muted-foreground">{description}</p><div className="mt-4 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={copy}><Copy className="mr-2 h-3.5 w-3.5" />Copy</Button>{open ? <Button asChild size="sm" variant="ghost"><a href={open} target={open.startsWith('http') ? '_blank' : undefined} rel={open.startsWith('http') ? 'noreferrer' : undefined}>Open<ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button> : null}</div></article>)}
      </div>
    </section>
  )
}
