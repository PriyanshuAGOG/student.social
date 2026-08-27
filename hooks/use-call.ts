'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { callService } from '@/lib/appwrite/calls'

export interface Call {
  id: string
  $id?: string
  roomName: string
  roomTitle?: string
  chatId: string
  roomId: string
  callerId: string
  participantIds: string[]
  callType: 'audio' | 'video'
  mediaType: 'voice' | 'video'
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'failed'
  state: 'ringing' | 'active' | 'declined' | 'ended' | 'missed' | 'failed'
  direction?: 'incoming' | 'outgoing'
  startedAt: string
  acceptedAt?: string
  endedAt?: string
  endedReason?: string
  caller?: { id: string; name: string; avatar?: string }
}

export interface CallOutcome {
  callId: string
  kind: 'declined' | 'missed' | 'ended' | 'failed'
  title: string
  message: string
  occurredAt: string
}

export interface CallContextType {
  activeCall: Call | null
  incomingCall: Call | null
  callState: 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connecting' | 'active' | 'reconnecting' | 'ended'
  startCall: (receiverId: string, chatId: string, type: 'audio' | 'video', options?: { title?: string }) => Promise<Call>
  acceptCall: (callId: string) => Promise<void>
  rejectCall: (callId: string) => Promise<void>
  endCall: (callId: string) => Promise<void>
  cancelCall: (callId: string) => Promise<void>
  toggleMute: () => void
  toggleCamera: () => void
  switchAudioOutput: (deviceId: string) => Promise<void>
  clearActiveCall: () => void
  isMuted: boolean
  isCameraOff: boolean
  callDuration: number
  error: string | null
  lastCallOutcome: CallOutcome | null
  dismissCallOutcome: () => void
  syncActiveCalls: (calls: Call[], resolvedCalls?: Call[]) => void
}

function normalizeCall(input: any): Call {
  const state = input?.state || (input?.status === 'accepted' ? 'active' : input?.status) || 'ringing'
  const mediaType = input?.mediaType === 'voice' || input?.callType === 'audio' ? 'voice' : 'video'
  return {
    ...input,
    id: input?.$id || input?.id,
    roomId: input?.roomId || input?.chatId,
    chatId: input?.roomId || input?.chatId,
    roomName: input?.providerSessionId || input?.roomName || input?.$id || input?.id,
    participantIds: Array.isArray(input?.participantIds) ? input.participantIds : [],
    mediaType,
    callType: mediaType === 'voice' ? 'audio' : 'video',
    state,
    status: state === 'active' ? 'accepted' : state,
    startedAt: input?.startedAt || new Date().toISOString(),
  }
}

function describeCallOutcome(call: Call): CallOutcome {
  const isOutgoing = call.direction === 'outgoing'
  const kind = call.state === 'declined' || call.state === 'missed' || call.state === 'failed' ? call.state : 'ended'
  let title = 'Call ended'
  let message = 'The call has finished.'

  if (kind === 'declined') {
    title = 'Call declined'
    message = isOutgoing ? 'They may be busy and declined your call.' : 'You declined the incoming call.'
  } else if (kind === 'missed' || call.endedReason === 'no_answer') {
    title = 'No answer'
    message = isOutgoing ? 'They did not answer the call.' : 'You missed an incoming call.'
  } else if (kind === 'failed') {
    title = 'Call could not connect'
    message = 'A connection problem ended this call.'
  } else if (call.endedReason === 'participant_left') {
    message = 'The other participant left the call.'
  } else if (call.endedReason === 'caller_cancelled') {
    message = isOutgoing ? 'You cancelled the call.' : 'The caller cancelled before you answered.'
  }

  return {
    callId: call.id,
    kind: kind === 'missed' || call.endedReason === 'no_answer' ? 'missed' : kind,
    title,
    message,
    occurredAt: call.endedAt || new Date().toISOString(),
  }
}

export const defaultCallContext: CallContextType = {
  activeCall: null,
  incomingCall: null,
  callState: 'idle',
  startCall: async () => { throw new Error('CallProvider not initialized') },
  acceptCall: async () => { throw new Error('CallProvider not initialized') },
  rejectCall: async () => { throw new Error('CallProvider not initialized') },
  endCall: async () => { throw new Error('CallProvider not initialized') },
  cancelCall: async () => { throw new Error('CallProvider not initialized') },
  toggleMute: () => {},
  toggleCamera: () => {},
  switchAudioOutput: async () => {},
  clearActiveCall: () => {},
  isMuted: false,
  isCameraOff: false,
  callDuration: 0,
  error: null,
  lastCallOutcome: null,
  dismissCallOutcome: () => {},
  syncActiveCalls: () => {},
}

export function useCall(): CallContextType {
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [callState, setCallState] = useState<CallContextType['callState']>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastCallOutcome, setLastCallOutcome] = useState<CallOutcome | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissedCallIdsRef = useRef(new Set<string>())
  const resolvedCallIdsRef = useRef(new Set<string>())
  const activeCallRef = useRef<Call | null>(null)
  const incomingCallRef = useRef<Call | null>(null)

  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])
  useEffect(() => { incomingCallRef.current = incomingCall }, [incomingCall])

  useEffect(() => {
    if (callState !== 'active') return
    durationIntervalRef.current = setInterval(() => setCallDuration((seconds) => seconds + 1), 1000)
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [callState])

  const clearActiveCall = useCallback(() => {
    setActiveCall((current) => {
      if (current?.id) dismissedCallIdsRef.current.add(current.id)
      activeCallRef.current = null
      return null
    })
    setIncomingCall((current) => {
      if (current?.id) dismissedCallIdsRef.current.add(current.id)
      incomingCallRef.current = null
      return null
    })
    setCallState('idle')
    setCallDuration(0)
    setError(null)
  }, [])

  const startCall = useCallback(async (_receiverId: string, chatId: string, type: 'audio' | 'video', options?: { title?: string }) => {
    if (activeCallRef.current || incomingCallRef.current) throw new Error('Finish the current call before starting another one')
    setError(null)
    setLastCallOutcome(null)
    setCallState('connecting')
    try {
      const session = normalizeCall(await callService.startRoomCall(chatId, type === 'audio' ? 'voice' : 'video', options?.title))
      dismissedCallIdsRef.current.delete(session.id)
      const outgoing = { ...session, roomTitle: options?.title, direction: 'outgoing' as const }
      activeCallRef.current = outgoing
      setActiveCall(outgoing)
      setCallState('outgoing_ringing')
      return session
    } catch (cause: any) {
      setError(cause?.message || 'Failed to start call')
      setCallState('ended')
      throw cause
    }
  }, [])

  const acceptCall = useCallback(async (callId: string) => {
    setError(null)
    setCallState('connecting')
    try {
      const session = normalizeCall(await callService.updateSession(callId, 'accept'))
      dismissedCallIdsRef.current.delete(session.id)
      const accepted = { ...(incomingCallRef.current || session), ...session, direction: 'incoming' as const }
      activeCallRef.current = accepted
      incomingCallRef.current = null
      setActiveCall(accepted)
      setIncomingCall(null)
      setCallState('active')
    } catch (cause: any) {
      setError(cause?.message || 'Failed to accept call')
      setCallState('ended')
      throw cause
    }
  }, [])

  const rejectCall = useCallback(async (callId: string) => {
    try {
      await callService.updateSession(callId, 'decline')
      clearActiveCall()
    } catch (cause: any) {
      setError(cause?.message || 'Failed to decline call')
      throw cause
    }
  }, [clearActiveCall])

  const endCall = useCallback(async (callId: string) => {
    try {
      await callService.updateSession(callId, 'end')
      clearActiveCall()
    } catch (cause: any) {
      setError(cause?.message || 'Failed to end call')
      throw cause
    }
  }, [clearActiveCall])

  const cancelCall = useCallback((callId: string) => endCall(callId), [endCall])

  const syncActiveCalls = useCallback((calls: Call[], resolvedCalls: Call[] = []) => {
    const normalized = (calls || [])
      .map(normalizeCall)
      .filter((call) => !dismissedCallIdsRef.current.has(call.id))
    const resolved = (resolvedCalls || []).map(normalizeCall)
    const active = normalized.find((call) => call.state === 'active')
    if (active) {
      const current = activeCallRef.current
      const next = current?.id === active.id
        ? { ...current, ...active, roomTitle: active.roomTitle || current.roomTitle }
        : active
      activeCallRef.current = next
      incomingCallRef.current = null
      setActiveCall(next)
      setIncomingCall(null)
      setCallState('active')
      return
    }

    const outgoing = normalized.find((call) => call.state === 'ringing' && call.direction === 'outgoing')
    if (outgoing) {
      const current = activeCallRef.current
      const next = current?.id === outgoing.id ? { ...current, ...outgoing, roomTitle: outgoing.roomTitle || current.roomTitle } : outgoing
      activeCallRef.current = next
      incomingCallRef.current = null
      setActiveCall(next)
      setIncomingCall(null)
      setCallState('outgoing_ringing')
      return
    }

    const incoming = normalized.find((call) => call.state === 'ringing' && call.direction === 'incoming')
    if (incoming) {
      incomingCallRef.current = incoming
      setIncomingCall((current) => current?.id === incoming.id ? current : incoming)
      setCallState((current) => current === 'active' || current === 'outgoing_ringing' ? current : 'incoming_ringing')
      return
    }

    const currentId = activeCallRef.current?.id || incomingCallRef.current?.id
    const terminal = currentId ? resolved.find((call) => call.id === currentId) : undefined
    if (terminal) {
      if (!resolvedCallIdsRef.current.has(terminal.id) && !dismissedCallIdsRef.current.has(terminal.id)) {
        resolvedCallIdsRef.current.add(terminal.id)
        setLastCallOutcome(describeCallOutcome(terminal))
      }
      activeCallRef.current = null
      incomingCallRef.current = null
      setActiveCall(null)
      setIncomingCall(null)
      setCallState('idle')
      setCallDuration(0)
      return
    }

    if (!activeCallRef.current) {
      incomingCallRef.current = null
      setIncomingCall(null)
      setCallState((current) => current === 'incoming_ringing' ? 'idle' : current)
    }
  }, [])

  const dismissCallOutcome = useCallback(() => setLastCallOutcome(null), [])

  return {
    activeCall,
    incomingCall,
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    cancelCall,
    toggleMute: () => {},
    toggleCamera: () => {},
    switchAudioOutput: async () => {},
    clearActiveCall,
    isMuted: false,
    isCameraOff: false,
    callDuration,
    error,
    lastCallOutcome,
    dismissCallOutcome,
    syncActiveCalls,
  }
}
