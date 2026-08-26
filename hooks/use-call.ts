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
  caller?: { id: string; name: string; avatar?: string }
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
  syncActiveCalls: (calls: Call[]) => void
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
  syncActiveCalls: () => {},
}

export function useCall(): CallContextType {
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [callState, setCallState] = useState<CallContextType['callState']>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissedCallIdsRef = useRef(new Set<string>())

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
      return null
    })
    setIncomingCall((current) => {
      if (current?.id) dismissedCallIdsRef.current.add(current.id)
      return null
    })
    setCallState('idle')
    setCallDuration(0)
    setError(null)
  }, [])

  const startCall = useCallback(async (_receiverId: string, chatId: string, type: 'audio' | 'video', options?: { title?: string }) => {
    setError(null)
    setCallState('connecting')
    try {
      const session = normalizeCall(await callService.startRoomCall(chatId, type === 'audio' ? 'voice' : 'video', options?.title))
      dismissedCallIdsRef.current.delete(session.id)
      setActiveCall({ ...session, roomTitle: options?.title, direction: 'outgoing' })
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
      setActiveCall({ ...(incomingCall || session), ...session, direction: 'incoming' })
      setIncomingCall(null)
      setCallState('active')
    } catch (cause: any) {
      setError(cause?.message || 'Failed to accept call')
      setCallState('ended')
      throw cause
    }
  }, [incomingCall])

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

  const syncActiveCalls = useCallback((calls: Call[]) => {
    const normalized = (calls || [])
      .map(normalizeCall)
      .filter((call) => !dismissedCallIdsRef.current.has(call.id))
    const active = normalized.find((call) => call.state === 'active')
    if (active) {
      setActiveCall((current) => current?.id === active.id
        ? { ...current, ...active, roomTitle: active.roomTitle || current.roomTitle }
        : active)
      setIncomingCall(null)
      setCallState('active')
      return
    }

    const incoming = normalized.find((call) => call.state === 'ringing' && call.direction === 'incoming')
    if (incoming) {
      setIncomingCall((current) => current?.id === incoming.id ? current : incoming)
      setCallState((current) => current === 'active' || current === 'outgoing_ringing' ? current : 'incoming_ringing')
      return
    }

    setIncomingCall(null)
    setCallState((current) => current === 'incoming_ringing' ? 'idle' : current)
  }, [])

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
    syncActiveCalls,
  }
}
