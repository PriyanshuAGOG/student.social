'use client'

export default function SecurityPanel({ tokenPrefix='pscal_v1_demo' }: { tokenPrefix?: string }) {
  return <div className='border rounded-xl p-4 space-y-2'>
    <h3 className='font-semibold'>Security</h3>
    <p className='text-sm'>Token Prefix: <code>{tokenPrefix}</code></p>
    <div className='flex gap-2'><button className='px-3 py-1 border rounded'>Regenerate Link</button><button className='px-3 py-1 border rounded'>Disable Feed</button></div>
  </div>
}
