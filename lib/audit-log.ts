export type AuditAction =
  | 'payment_checkout_create'
  | 'assignment_grade_single'
  | 'assignment_grade_batch'

export function writeAuditLog(entry: {
  action: AuditAction
  actorId: string
  correlationId: string
  targetId?: string
  status: 'success' | 'failure'
  details?: Record<string, unknown>
}) {
  // Structured log (replace with sink provider later)
  console.info(JSON.stringify({
    ts: new Date().toISOString(),
    type: 'audit',
    ...entry,
  }))
}
