'use client'
import { providerLinks } from '@/lib/calendar/providerLinks'

export default function ProviderCards({ feedUrl }: { feedUrl: string }) {
  return <div className='grid md:grid-cols-2 gap-4'>
    {[
      {name:'Google Calendar',desc:'Subscribe from URL',open:providerLinks.google},
      {name:'Apple Calendar',desc:'One-click webcal subscribe',open:`webcal://localhost:3000${feedUrl}`},
      {name:'Outlook',desc:'Subscribe from web',open:providerLinks.outlook},
      {name:'Other Apps',desc:'Any ICS-compatible app',open:'#'},
    ].map(p => <div key={p.name} className='border rounded-xl p-4 space-y-2'>
      <h3 className='font-semibold'>{p.name}</h3><p className='text-sm text-muted-foreground'>{p.desc}</p>
      <div className='flex gap-2'><button className='px-3 py-1 border rounded' onClick={()=>navigator.clipboard.writeText(feedUrl)}>Copy URL</button><a className='px-3 py-1 border rounded' href={p.open}>Open</a></div>
    </div>)}
  </div>
}
