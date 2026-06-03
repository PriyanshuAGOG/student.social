'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useCall, defaultCallContext, type CallContextType, type Call } from '@/hooks/use-call'
import { IncomingCallOverlay } from './IncomingCallOverlay'
import { OutgoingCallScreen } from './OutgoingCallScreen'
import { ActiveCallScreen } from './ActiveCallScreen'

export const CallContext = createContext<CallContextType>(defaultCallContext)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const callHook = useCall()
  const [isInitializing, setIsInitializing] = useState(true)
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null)
  const [rejectingCallId, setRejectingCallId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch active calls on mount
  useEffect(() => {
    const fetchActiveCalls = async () => {
      try {
        const response = await fetch('/api/calls/active', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          // If there are incoming ringing calls, set as incoming
          const incomingCall = data.calls?.find((call: Call) => call.status === 'ringing')
          if (incomingCall) {
            // Enrich call with caller info
            const enrichedCall: Call = {
              ...incomingCall,
              caller: data.calls?.[0]?.caller,
            }
            // Trigger incoming call UI
            if (callHook.incomingCall?.id !== enrichedCall.id) {
              // Update state through context
            }
          }
        }
      } catch (error) {
        console.error('[CallProvider] Failed to fetch active calls:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    fetchActiveCalls()

    // Start polling for incoming calls every 3 seconds
    pollingIntervalRef.current = setInterval(fetchActiveCalls, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Handle incoming call acceptance
  const handleAcceptCall = useCallback(
    async (callId: string) => {
      setAcceptingCallId(callId)
      try {
        await callHook.acceptCall(callId)
      } catch (error) {
        console.error('[CallProvider] Failed to accept call:', error)
      } finally {
        setAcceptingCallId(null)
      }
    },
    [callHook]
  )

  // Handle incoming call rejection
  const handleRejectCall = useCallback(
    async (callId: string) => {
      setRejectingCallId(callId)
      try {
        await callHook.rejectCall(callId)
      } catch (error) {
        console.error('[CallProvider] Failed to reject call:', error)
      } finally {
        setRejectingCallId(null)
      }
    },
    [callHook]
  )

  // Handle end call
  const handleEndCall = useCallback(
    async (callId: string) => {
      try {
        await callHook.endCall(callId)
      } catch (error) {
        console.error('[CallProvider] Failed to end call:', error)
      }
    },
    [callHook]
  )

  const value: CallContextType = {
    ...callHook,
  }

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Incoming call overlay */}
      {callHook.incomingCall && callHook.callState === 'incoming_ringing' && (
        <IncomingCallOverlay
          callerId={callHook.incomingCall.callerId}
          callerName={callHook.incomingCall.caller?.name || 'User'}
          callerAvatar={callHook.incomingCall.caller?.avatar}
          callType={callHook.incomingCall.callType}
          onAccept={() => handleAcceptCall(callHook.incomingCall!.id)}
          onReject={() => handleRejectCall(callHook.incomingCall!.id)}
          isLoading={acceptingCallId === callHook.incomingCall.id}
        />
      )}

      {/* Outgoing call screen */}
      {callHook.activeCall &&
        callHook.callState === 'outgoing_ringing' &&
        callHook.activeCall.status === 'ringing' && (
          <OutgoingCallScreen
            receiverName="User"
            callType={callHook.activeCall.callType}
            onCancel={() => callHook.cancelCall(callHook.activeCall!.id)}
            isLoading={false}
          />
        )}

      {/* Active call screen */}
      {callHook.activeCall && callHook.callState === 'active' && (
        <ActiveCallScreen
          otherPartyName="User"
          callType={callHook.activeCall.callType}
          duration={callHook.callDuration}
          isMuted={callHook.isMuted}
          isCameraOff={callHook.isCameraOff}
          onToggleMute={callHook.toggleMute}
          onToggleCamera={callHook.toggleCamera}
          onEndCall={() => handleEndCall(callHook.activeCall!.id)}
          isConnecting={!(['idle', 'active', 'ended'] as const).includes(callHook.callState as any)}
        />
      )}
    </CallContext.Provider>
  )
}

export function useCallContext() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCallContext must be used within CallProvider')
  }
  return context
}
