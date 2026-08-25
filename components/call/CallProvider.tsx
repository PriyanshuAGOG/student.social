'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useCall, defaultCallContext, type CallContextType } from '@/hooks/use-call'
import { IncomingCallOverlay } from './IncomingCallOverlay'
import { subscribeToCallSessions } from '@/lib/appwrite/call-realtime'
import { closeCallNotification } from '@/lib/pwa/call-notifications'
import { CallAlertsPrompt } from './CallAlertsPrompt'
import { useIncomingCallAlerts, useOutgoingCallTone } from './use-incoming-call-alerts'

const LiveKitCallStage = dynamic(
  () => import('./LiveKitCallStage').then((module) => module.LiveKitCallStage),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[80] grid place-items-center bg-[#242724] text-sm text-white/55">Preparing your call…</div>,
  },
)

export const CallContext = createContext<CallContextType>(defaultCallContext)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const callHook = useCall()
  const activeFetchFailuresRef = useRef(0)
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null)
  const [rejectingCallId, setRejectingCallId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  useIncomingCallAlerts(Boolean(callHook.incomingCall && callHook.callState === 'incoming_ringing'))
  useOutgoingCallTone(callHook.callState === 'outgoing_ringing')

  // Fetch active calls on mount
  useEffect(() => {
    const fetchActiveCalls = async () => {
      try {
        const response = await fetch('/api/calls/active', {
          credentials: 'include',
        })

        if (response.status === 401) {
          return
        }

        if (!response.ok) {
          activeFetchFailuresRef.current += 1
          if (activeFetchFailuresRef.current <= 2) {
            const payload = await response.json().catch(() => null)
            console.warn('[CallProvider] Active call polling unavailable:', payload?.error || response.statusText)
          }
          return
        }

        activeFetchFailuresRef.current = 0
        const data = await response.json()
        callHook.syncActiveCalls(data.calls || [])
      } catch (error) {
        activeFetchFailuresRef.current += 1
        if (activeFetchFailuresRef.current <= 2) {
          console.warn('[CallProvider] Failed to fetch active calls:', error)
        }
      } finally {}
    }

    fetchActiveCalls()
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    const unsubscribeRealtime = subscribeToCallSessions(() => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => void fetchActiveCalls(), 100)
    })

    // Appwrite Realtime is the primary signal. A light, visible-tab-only poll
    // recovers missed socket events without creating constant background load.
    pollingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchActiveCalls()
    }, 30_000)
    const refreshOnFocus = () => { if (document.visibilityState === 'visible') void fetchActiveCalls() }
    document.addEventListener('visibilitychange', refreshOnFocus)
    window.addEventListener('online', fetchActiveCalls)

    return () => {
      document.removeEventListener('visibilitychange', refreshOnFocus)
      window.removeEventListener('online', fetchActiveCalls)
      unsubscribeRealtime()
      if (refreshTimer) clearTimeout(refreshTimer)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [callHook.syncActiveCalls])

  // Handle incoming call acceptance
  const handleAcceptCall = useCallback(
    async (callId: string) => {
      setAcceptingCallId(callId)
      try {
        await callHook.acceptCall(callId)
        await closeCallNotification(callId)
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
        await closeCallNotification(callId)
      } catch (error) {
        console.error('[CallProvider] Failed to reject call:', error)
      } finally {
        setRejectingCallId(null)
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
      <CallAlertsPrompt />

      {/* Incoming call overlay */}
      {callHook.incomingCall && callHook.callState === 'incoming_ringing' && (
        <IncomingCallOverlay
          callerName={callHook.incomingCall.caller?.name || 'User'}
          callerAvatar={callHook.incomingCall.caller?.avatar}
          callType={callHook.incomingCall.callType}
          onAccept={() => handleAcceptCall(callHook.incomingCall!.id)}
          onReject={() => handleRejectCall(callHook.incomingCall!.id)}
          isLoading={acceptingCallId === callHook.incomingCall.id || rejectingCallId === callHook.incomingCall.id}
        />
      )}

      {/* One media implementation for direct, group, pod, and classroom calls. */}
      {callHook.activeCall && ['outgoing_ringing', 'connecting', 'active', 'reconnecting'].includes(callHook.callState) && (
        <LiveKitCallStage
          sessionId={callHook.activeCall.id}
          roomTitle={callHook.activeCall.roomTitle || callHook.activeCall.caller?.name || 'Student.social call'}
          mediaType={callHook.activeCall.mediaType}
          callState={callHook.callState}
          direction={callHook.activeCall.direction}
          onClose={callHook.clearActiveCall}
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
