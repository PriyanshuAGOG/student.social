'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export interface Call {
  id: string
  roomName: string
  chatId: string
  callerId: string
  receiverId: string
  callType: 'audio' | 'video'
  status: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | 'failed'
  startedAt: string
  acceptedAt?: string
  endedAt?: string
  durationSeconds?: number
  caller?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface CallContextType {
  activeCall: Call | null
  incomingCall: Call | null
  callState: 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connecting' | 'active' | 'reconnecting' | 'ended'
  startCall: (receiverId: string, chatId: string, type: 'audio' | 'video') => Promise<Call>
  acceptCall: (callId: string) => Promise<void>
  rejectCall: (callId: string) => Promise<void>
  endCall: (callId: string) => Promise<void>
  cancelCall: (callId: string) => Promise<void>
  toggleMute: () => void
  toggleCamera: () => void
  switchAudioOutput: (deviceId: string) => Promise<void>
  isMuted: boolean
  isCameraOff: boolean
  callDuration: number
  error: string | null
}

// Default context value
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
  isMuted: false,
  isCameraOff: false,
  callDuration: 0,
  error: null,
}

export function useCall(): CallContextType {
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [callState, setCallState] = useState<CallContextType['callState']>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Cleanup duration timer
  useEffect(() => {
    if (callState !== 'active') {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      setCallDuration(0)
      return
    }

    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [callState])

  const startCall = useCallback(
    async (receiverId: string, chatId: string, type: 'audio' | 'video'): Promise<Call> => {
      setError(null)
      setCallState('outgoing_ringing')

      try {
        const response = await fetch('/api/calls/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ receiverId, chatId, type }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to start call')
        }

        const data = await response.json()
        const call = data.call

        setActiveCall({
          ...call,
          chatId,
          callType: type,
        } as Call)

        // Set timeout for no answer (45 seconds)
        const noAnswerTimeout = setTimeout(async () => {
          if (activeCall?.status === 'ringing') {
            await cancelCall(call.id)
          }
        }, 45000)

        return call
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to start call'
        setError(errorMsg)
        setCallState('failed')
        throw err
      }
    },
    [activeCall]
  )

  const acceptCall = useCallback(
    async (callId: string) => {
      setError(null)
      setCallState('connecting')

      try {
        const response = await fetch('/api/calls/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId, action: 'accept' }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to accept call')
        }

        const data = await response.json()

        // Update incoming call to active
        if (incomingCall) {
          setActiveCall({
            ...incomingCall,
            status: 'accepted',
          })
          setIncomingCall(null)
          setCallState('active')
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to accept call'
        setError(errorMsg)
        setCallState('failed')
        throw err
      }
    },
    [incomingCall]
  )

  const rejectCall = useCallback(
    async (callId: string) => {
      setError(null)

      try {
        const response = await fetch('/api/calls/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId, action: 'reject' }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to reject call')
        }

        setIncomingCall(null)
        setCallState('ended')
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to reject call'
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const endCall = useCallback(
    async (callId: string) => {
      setError(null)

      try {
        const response = await fetch('/api/calls/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to end call')
        }

        setActiveCall(null)
        setIncomingCall(null)
        setCallState('idle')
        setIsMuted(false)
        setIsCameraOff(false)
        setCallDuration(0)
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to end call'
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const cancelCall = useCallback(
    async (callId: string) => {
      await endCall(callId)
    },
    [endCall]
  )

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => !prev)
  }, [])

  const switchAudioOutput = useCallback(
    async (deviceId: string) => {
      // This would be implemented with actual audio device selection
      // For now, just acknowledge the action
    },
    []
  )

  return {
    activeCall,
    incomingCall,
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    cancelCall,
    toggleMute,
    toggleCamera,
    switchAudioOutput,
    isMuted,
    isCameraOff,
    callDuration,
    error,
  }
}
