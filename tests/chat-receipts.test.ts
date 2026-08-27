import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- Node's strip-types runner requires the explicit TypeScript suffix.
import { deriveDeliveryState, mergeReceipt, receiptAudience } from '../lib/chat-receipts.ts'

test('message journey advances from sent to reached to seen', () => {
  assert.equal(deriveDeliveryState([], 'sent'), 'sent')
  assert.equal(deriveDeliveryState([{ userId: 'a', deliveredAt: '2026-08-27T10:00:00Z' }], 'sent'), 'delivered')
  assert.equal(deriveDeliveryState([{ userId: 'a', deliveredAt: '2026-08-27T10:00:00Z', readAt: '2026-08-27T10:01:00Z' }], 'sent'), 'read')
})

test('receipt updates preserve delivery time and add seen time', () => {
  const receipts = mergeReceipt(
    [{ userId: 'student-a', deliveredAt: 'delivered', readAt: null }],
    { userId: 'student-a', readAt: 'seen' },
  )
  assert.deepEqual(receipts, [{ userId: 'student-a', deliveredAt: 'delivered', readAt: 'seen' }])
  assert.deepEqual(receiptAudience(receipts), { deliveredBy: ['student-a'], readBy: ['student-a'] })
})

test('sending and failed local states are not overwritten by receipts', () => {
  const receipt = [{ userId: 'student-a', deliveredAt: 'delivered', readAt: 'seen' }]
  assert.equal(deriveDeliveryState(receipt, 'sending'), 'sending')
  assert.equal(deriveDeliveryState(receipt, 'failed'), 'failed')
})
