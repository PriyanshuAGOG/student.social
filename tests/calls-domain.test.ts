import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error -- Node 22's strip-types test runner requires the explicit .ts suffix.
import { CALL_ACCEPTANCE_GRACE_MS, CALL_RING_TIMEOUT_MS, assertCallActionAllowed, canAccessCall, canRecoverTimedOutCall, getRecoveredCallUpdates, getSessionUpdates, hasRemainingCallParticipants, isCallExpired, isCallResolutionDue, isParticipantInvitationCurrent, parseStringList, shouldEndCallWhenParticipantLeaves, shouldSurfaceActiveCall } from '../lib/calls/domain.ts'
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

test('a late invitee can accept an already active group call', () => {
  const active = { ...base, state: 'active', participantIds: ['guest-1', 'guest-2'] }
  assert.doesNotThrow(() => assertCallActionAllowed(active, 'guest-2', 'accept'))
  assert.deepEqual(getSessionUpdates(active, 'guest-2', 'accept', '2026-08-25T10:00:00.000Z'), {
    lastActivityAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    acceptedAt: '2026-08-25T10:00:00.000Z',
  })
})

test('terminal calls reject joining but allow idempotent leave', () => {
  const ended = { ...base, state: 'ended' }
  assert.throws(() => assertCallActionAllowed(ended, 'student-a', 'join'), /CALL_ALREADY_FINISHED/)
  assert.doesNotThrow(() => assertCallActionAllowed(ended, 'student-a', 'leave'))
})

test('ring timeout and serialized member parsing are deterministic', () => {
  assert.equal(CALL_RING_TIMEOUT_MS, 45_000)
  assert.equal(isCallExpired({ ...base, ringTimeoutAt: '2020-01-01T00:00:00.000Z' }), true)
  const timeout = '2026-08-27T10:00:00.000Z'
  assert.equal(isCallResolutionDue({ ...base, ringTimeoutAt: timeout }, Date.parse(timeout) + CALL_ACCEPTANCE_GRACE_MS - 1), false)
  assert.equal(isCallResolutionDue({ ...base, ringTimeoutAt: timeout }, Date.parse(timeout) + CALL_ACCEPTANCE_GRACE_MS), true)
  assert.deepEqual(parseStringList('["a","a","b"]'), ['a', 'b'])
})

test('a timeout race can be recovered briefly without reviving old calls', () => {
  const endedAt = '2026-08-27T10:00:00.000Z'
  const missed = { ...base, state: 'missed', endedReason: 'no_answer', endedAt }
  assert.equal(canRecoverTimedOutCall(missed, Date.parse(endedAt) + CALL_ACCEPTANCE_GRACE_MS - 1), true)
  assert.equal(canRecoverTimedOutCall(missed, Date.parse(endedAt) + CALL_ACCEPTANCE_GRACE_MS + 1), false)
  assert.equal(canRecoverTimedOutCall({ ...missed, endedReason: 'caller_cancelled' }, Date.parse(endedAt) + 1), false)
  assert.deepEqual(getRecoveredCallUpdates('2026-08-27T10:00:01.000Z'), {
    state: 'active',
    acceptedAt: '2026-08-27T10:00:01.000Z',
    endedAt: '',
    endedReason: '',
    lastActivityAt: '2026-08-27T10:00:01.000Z',
    updatedAt: '2026-08-27T10:00:01.000Z',
  })
})

test('either participant leaving a direct call ends it, while group calls continue', () => {
  assert.equal(shouldEndCallWhenParticipantLeaves({ callerId: 'caller', participantIds: ['guest'] }, 'guest'), true)
  assert.equal(shouldEndCallWhenParticipantLeaves({ callerId: 'caller', participantIds: ['guest'] }, 'caller'), true)
  assert.equal(shouldEndCallWhenParticipantLeaves({ callerId: 'caller', participantIds: ['guest-a', 'guest-b'] }, 'guest-a'), false)
})

test('stale participant invitations cannot replay as phantom calls after login', () => {
  const now = Date.parse('2026-08-26T12:00:00.000Z')
  const activeSession = { $id: 'active-call', state: 'active' }
  assert.equal(isParticipantInvitationCurrent({ state: 'invited', updatedAt: '2026-08-26T11:59:30.000Z' }, activeSession, now), true)
  assert.equal(isParticipantInvitationCurrent({ state: 'invited', updatedAt: '2026-08-26T11:58:59.000Z' }, activeSession, now), false)
  assert.equal(isParticipantInvitationCurrent({ state: 'joined', updatedAt: '2020-01-01T00:00:00.000Z' }, activeSession, now), true)
  assert.equal(isParticipantInvitationCurrent({ state: 'declined', updatedAt: '2026-08-26T11:59:59.000Z' }, activeSession, now), false)
  assert.equal(isParticipantInvitationCurrent({ state: 'invited' }, { state: 'ringing', ringTimeoutAt: '2026-08-26T11:59:47.000Z' }, now), false)
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
