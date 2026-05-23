'use client'

export default function CalendarPreview(){
  const items=[{title:'[Study] DSA Practice Session', type:'study_session', at:'Tomorrow 2:30 PM'}]
  return <div className='border rounded-xl p-4'><h3 className='font-semibold mb-2'>Calendar Preview</h3>{items.map((i)=><div key={i.title} className='text-sm py-1'>{i.title} · {i.type} · {i.at}</div>)}</div>
}
