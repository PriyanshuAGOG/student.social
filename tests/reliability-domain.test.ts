import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's built-in type-stripping runner requires the explicit extension.
import { humanTextError, isHumanReadableText } from '../lib/validation/human-text.ts'
// @ts-expect-error Node's built-in type-stripping runner requires the explicit extension.
import { normalizeNotificationDocument } from '../lib/notifications/normalize.ts'

test('human-readable labels reject numeric-only event and Pod names', () => {
  assert.equal(isHumanReadableText('123456', 3), false)
  assert.match(humanTextError('Pod category', '2026', 2) || '', /descriptive word/)
  assert.equal(humanTextError('Pod category', 'Data Science', 2), null)
})

test('legacy notifications receive safe text, links, and dates', () => {
  const notification = normalizeNotificationDocument({ $id: 'n1', userId: 'u1', type: 'pod-invite', timestamp: 'Invalid Date', $createdAt: '2026-08-30T08:00:00.000Z', metadata: JSON.stringify({ podId: 'p1', postId: 'post1' }) })
  assert.equal(notification.type, 'pod_invite')
  assert.equal(notification.message, 'You have a new update.')
  assert.equal(notification.timestamp, '2026-08-30T08:00:00.000Z')
  assert.equal(notification.actionUrl, '/app/feed?post=post1')
})
