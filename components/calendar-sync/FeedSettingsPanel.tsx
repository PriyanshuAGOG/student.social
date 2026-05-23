'use client'
import { useState } from 'react'

export default function FeedSettingsPanel() {
  const [privacyMode, setPrivacyMode] = useState('full')
  return <div className='border rounded-xl p-4 space-y-3'>
    <h3 className='font-semibold'>Feed Settings</h3>
    <label className='text-sm'>Privacy Mode</label>
    <select className='w-full border rounded p-2' value={privacyMode} onChange={(e)=>setPrivacyMode(e.target.value)}>
      <option value='full'>Full</option><option value='minimal'>Minimal</option><option value='title_only'>Title Only</option><option value='busy_only'>Busy Only</option>
    </select>
    <p className='text-xs text-amber-600'>Anyone with link can view exported details. Use Minimal or Busy Only for shared devices.</p>
  </div>
}
