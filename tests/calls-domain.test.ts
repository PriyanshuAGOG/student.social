import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- Node 22's strip-types test runner requires the explicit .ts suffix.
import { assertCallActionAllowed, canAccessCall, getSessionUpdates, hasRemainingCallParticipants, isCallExpired, parseStringList, shouldSurfaceActiveCall } from '../lib/calls/domain.ts'
// @ts-expect-error -- Node 22's strip-types test runner requires the explicit .ts suffix.
import { createOutboxMessage, mergeChatMessages } from '../hooks/use-chat-outbox.ts'

const base = {
  callerId: 'caller',
  participantIds: ['student-a', 'student-b'],
  state: 'ringing',
  ringTimeoutAt: '2099-01-01T00:00:00.000Z',
}

test('call access is limited to caller and invited participants', () => {
  assert.equal(canAccessCall(base, 'caller'), true)
  assert.equal(canAccessCall(base, 'student-a'), true)
  assert.equal(canAccessCall(base, 'outsider'), false)
})

test('only caller can end for everyone', () => {
  assert.throws(() => assertCallActionAllowed(base, 'student-a', 'end'), /CALL_END_REQUIRES_CALLER/)
  const update = getSessionUpdates(base, 'caller', 'end', '2026-08-22T00:00:00.000Z')
  assert.equal(update.state, 'ended')
})

test('invitee accept activates a ringing call', () => {
  const update = getSessionUpdates(base, 'student-a', 'accept', '2026-08-22T00:00:00.000Z')
  assert.equal(update.state, 'active')
  assert.equal(update.acceptedAt, '2026-08-22T00:00:00.000Z')
})

test('terminal calls reject joining but allow idempotent leave', () => {
  const ended = { ...base, state: 'ended' }
  assert.throws(() => assertCallActionAllowed(ended, 'student-a', 'join'), /CALL_ALREADY_FINISHED/)
  assert.doesNotThrow(() => assertCallActionAllowed(ended, 'student-a', 'leave'))
})

test('ring timeout and serialized member parsing are deterministic', () => {
  assert.equal(isCallExpired({ ...base, ringTimeoutAt: '2020-01-01T00:00:00.000Z' }), true)
  assert.deepEqual(parseStringList('["a","a","b"]'), ['a', 'b'])
})

test('leaving participants are not resurfaced and solo rooms can terminate', () => {
  const session = { $id: 'call-1', state: 'active' }
  assert.equal(shouldSurfaceActiveCall(session, new Set(['call-1'])), true)
  assert.equal(shouldSurfaceActiveCall(session, new Set()), false)
  assert.equal(hasRemainingCallParticipants([{ userId: 'caller', state: 'joined' }], 'caller'), false)
  assert.equal(hasRemainingCallParticipants([
    { userId: 'caller', state: 'joined' },
    { userId: 'student-a', state: 'invited' },
  ], 'caller'), true)
})

test('outbox IDs are stable and server acknowledgements deduplicate optimistic messages', () => {
  const optimistic = createOutboxMessage({ roomId: 'room', authorId: 'student-a', content: 'hello', clientMessageId: 'same-id' })
  const merged = mergeChatMessages([{ $id: 'server-id', clientMessageId: 'same-id', timestamp: optimistic.timestamp }], [optimistic])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].$id, 'server-id')
})
