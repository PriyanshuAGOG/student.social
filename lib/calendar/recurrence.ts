export function expandRecurringEvent(event: any, windowStart: Date, windowEnd: Date): any[] {
  if (!event?.recurrenceRule) return [event]
  const rule = String(event.recurrenceRule).toUpperCase()
  const stepDays = rule.includes('FREQ=DAILY') ? 1 : rule.includes('FREQ=WEEKLY') ? 7 : 0
  if (!stepDays) return [event]

  const start = new Date(event.startAt)
  const end = new Date(event.endAt)
  const duration = Math.max(0, end.getTime() - start.getTime()) || 60 * 60 * 1000

  const instances: any[] = []
  for (let t = new Date(start); t <= windowEnd; t = new Date(t.getTime() + stepDays * 24 * 60 * 60 * 1000)) {
    if (t < windowStart) continue
    instances.push({
      ...event,
      isRecurringInstance: true,
      startAt: new Date(t).toISOString(),
      endAt: new Date(t.getTime() + duration).toISOString(),
      recurringInstanceKey: `${event.$id || event.id}_${t.getTime()}`,
    })
    if (instances.length > 2000) break
  }
  return instances.length ? instances : [event]
}
