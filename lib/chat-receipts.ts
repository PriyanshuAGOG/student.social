export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageReceipt {
  userId: string
  deliveredAt?: string | null
  readAt?: string | null
}

export function deriveDeliveryState(
  receipts: MessageReceipt[] = [],
  fallback: MessageDeliveryState = 'sent',
): MessageDeliveryState {
  if (fallback === 'sending' || fallback === 'failed') return fallback
  if (receipts.some((receipt) => Boolean(receipt.readAt))) return 'read'
  if (receipts.some((receipt) => Boolean(receipt.deliveredAt))) return 'delivered'
  return 'sent'
}

export function mergeReceipt(
  receipts: MessageReceipt[] = [],
  incoming: MessageReceipt,
): MessageReceipt[] {
  const byUser = new Map(receipts.map((receipt) => [receipt.userId, receipt]))
  const current = byUser.get(incoming.userId)
  byUser.set(incoming.userId, {
    ...current,
    ...incoming,
    deliveredAt: incoming.deliveredAt || current?.deliveredAt || null,
    readAt: incoming.readAt || current?.readAt || null,
  })
  return Array.from(byUser.values())
}

export function receiptAudience(receipts: MessageReceipt[] = []) {
  return {
    deliveredBy: receipts.filter((receipt) => Boolean(receipt.deliveredAt)).map((receipt) => receipt.userId),
    readBy: receipts.filter((receipt) => Boolean(receipt.readAt)).map((receipt) => receipt.userId),
  }
}
