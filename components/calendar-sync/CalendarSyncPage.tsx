'use client'
import { useState } from 'react'
import ProviderCards from './ProviderCards'
import FeedSettingsPanel from './FeedSettingsPanel'
import SecurityPanel from './SecurityPanel'
import CalendarPreview from './CalendarPreview'

export default function CalendarSyncPage() {
  const [copied, setCopied] = useState(false)
  const feedUrl = '/api/calendar-sync/feed?token=pscal_v1_demo'
  return <div className='max-w-6xl mx-auto p-6 space-y-6'>
    <div><h1 className='text-3xl font-bold'>Calendar Sync</h1><p className='text-muted-foreground'>Connect Peerspark to Google, Apple, Outlook, and ICS-compatible apps.</p></div>
    <div className='border rounded-xl p-4 space-y-2'>
      <p className='font-medium'>Private calendar link</p>
      <code className='text-sm break-all'>{feedUrl}</code>
      <div className='flex gap-2'><button className='px-3 py-2 border rounded' onClick={async()=>{await navigator.clipboard.writeText(feedUrl);setCopied(true)}}>Copy URL</button><a className='px-3 py-2 border rounded' href={`webcal://localhost:3000${feedUrl}`}>Open in Apple Calendar</a></div>
      {copied && <p className='text-sm text-green-600'>Your calendar link was copied.</p>}
    </div>
    <ProviderCards feedUrl={feedUrl} />
    <div className='grid md:grid-cols-2 gap-4'><FeedSettingsPanel /><SecurityPanel /></div>
    <CalendarPreview />
  </div>
}
