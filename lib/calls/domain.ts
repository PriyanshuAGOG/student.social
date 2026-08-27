export const CALL_STATES = ['ringing', 'active', 'declined', 'ended', 'missed', 'failed'] as const
export type CallState = (typeof CALL_STATES)[number]
export const CALL_ACTIONS = ['accept', 'decline', 'end', 'join', 'leave'] as const
export type CallAction = (typeof CALL_ACTIONS)[number]

export const TERMINAL_CALL_STATES = new Set<CallState>(['declined', 'ended', 'missed', 'failed'])
export const PARTICIPANT_INVITE_TTL_MS = 60_000
export const CALL_RING_TIMEOUT_MS = 45_000

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter((entry) => typeof entry === 'string' && entry.trim()).map(String)))
  }
  if (typeof value === 'string') {
    try {
      return parseStringList(JSON.parse(value))
    } catch {
      return []
    }
  }
  return []
}

export function canAccessCall(session: any, userId: string): boolean {
  return session?.callerId === userId || parseStringList(session?.participantIds).includes(userId)
}

export function isCallExpired(session: any, now = Date.now()): boolean {
  if (session?.state !== 'ringing' || !session?.ringTimeoutAt) return false
  const timeout = Date.parse(String(session.ringTimeoutAt))
  return Number.isFinite(timeout) && timeout <= now
}

export function isParticipantInvitationCurrent(participant: any, session: any, now = Date.now()): boolean {
  if (participant?.state === 'joined') return true
  if (participant?.state !== 'invited') return false

  if (session?.state === 'ringing') {
    const ringTimeout = Date.parse(String(session?.ringTimeoutAt || ''))
    return Number.isFinite(ringTimeout) && ringTimeout > now
  }

  const invitedAt = Date.parse(String(participant?.updatedAt || participant?.createdAt || ''))
  return Number.isFinite(invitedAt) && invitedAt + PARTICIPANT_INVITE_TTL_MS > now
}

export function hasRemainingCallParticipants(participants: any[], departingUserId: string): boolean {
  return (participants || []).some((participant) =>
    participant?.userId !== departingUserId && ['invited', 'joined'].includes(String(participant?.state || '')),
  )
}

export function shouldEndCallWhenParticipantLeaves(session: any, departingUserId: string): boolean {
  const invitedParticipantIds = parseStringList(session?.participantIds)
  return invitedParticipantIds.length <= 1 && (
    session?.callerId === departingUserId || invitedParticipantIds.includes(departingUserId)
  )
}

export function shouldSurfaceActiveCall(session: any, activeParticipantSessionIds: Set<string>, now = Date.now()): boolean {
  return Boolean(
    session?.$id &&
    activeParticipantSessionIds.has(session.$id) &&
    ['ringing', 'active'].includes(String(session?.state || '')) &&
    !isCallExpired(session, now),
  )
}

export function assertCallActionAllowed(session: any, userId: string, action: CallAction): void {
  const state = String(session?.state || '') as CallState
  const isCaller = session?.callerId === userId

  if (!canAccessCall(session, userId)) throw new Error('CALL_ACCESS_DENIED')
  if (TERMINAL_CALL_STATES.has(state)) {
    if ((action === 'end' && state === 'ended') || (action === 'decline' && state === 'declined') || action === 'leave') return
    throw new Error('CALL_ALREADY_FINISHED')
  }
  if (action === 'end' && !isCaller) throw new Error('CALL_END_REQUIRES_CALLER')
  // A participant can be invited after a group call is already active. Their
  // personal participant record is still "invited", so accepting remains a
  // valid transition without moving the shared session backwards to ringing.
  if (action === 'accept' && (isCaller || !['ringing', 'active'].includes(state))) throw new Error('CALL_CANNOT_ACCEPT')
  if (action === 'decline' && (isCaller || state !== 'ringing')) throw new Error('CALL_CANNOT_DECLINE')
  if (action === 'join' && !['ringing', 'active'].includes(state)) throw new Error('CALL_CANNOT_JOIN')
}

export function getSessionUpdates(session: any, userId: string, action: CallAction, now: string, reason?: string) {
  assertCallActionAllowed(session, userId, action)
  const updates: Record<string, unknown> = { lastActivityAt: now, updatedAt: now }

  if (action === 'accept' || action === 'join') {
    if (session.state === 'ringing') updates.state = 'active'
    if (!session.acceptedAt) updates.acceptedAt = now
  } else if (action === 'decline' && parseStringList(session.participantIds).length <= 1) {
    updates.state = 'declined'
    updates.declinedAt = now
    updates.endedAt = now
    updates.endedReason = 'declined'
  } else if (action === 'end') {
    updates.state = 'ended'
    updates.endedAt = now
    updates.endedReason = String(reason || 'ended').slice(0, 255)
  }

  return updates
}
