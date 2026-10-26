'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { LocalVideoTrack, RoomEvent, type RemoteParticipant } from 'livekit-client'
import { CallEffectsProcessor, INITIAL_EFFECTS_STATE, type CameraEffectsState } from '@/lib/call-effects/processor'
import type { CallReaction } from '@/lib/call-effects/gestures'
import { decodeReaction, EFFECTS_TOPIC, encodeReaction, ReactionGate } from '@/lib/call-effects/protocol'

export type VisibleReaction = { id: string; identity: string; name: string; kind: CallReaction; expiresAt: number }
export function useCallEffects(onIssue?: (message: string) => void) {
  const room = useRoomContext()
  const { cameraTrack, isCameraEnabled } = useLocalParticipant()
  const [panelOpen, setPanelOpen] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [camera, setCamera] = useState<CameraEffectsState>({ ...INITIAL_EFFECTS_STATE })
  const [error, setError] = useState('')
  const [gestures, setGestures] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [reactions, setReactions] = useState<VisibleReaction[]>([])
  const processor = useRef<CallEffectsProcessor | null>(null)
  const gate = useRef(new ReactionGate())
  const sendAt = useRef(-Infinity)
  const alive = useRef(true)
  const onIssueRef = useRef(onIssue)
  onIssueRef.current = onIssue
  const addReaction = useCallback((identity: string, name: string, kind: CallReaction, id: string) => {
    setReactions(previous => [...previous.filter(item => item.identity !== identity && item.expiresAt > Date.now()), { id, identity, name: name || 'Someone', kind, expiresAt: Date.now() + (kind === 'hand' ? 10_000 : 3200) }].slice(-12))
  }, [])
  const react = useCallback(async (kind: CallReaction) => {
    if (performance.now() - sendAt.current < 1800) return
    sendAt.current = performance.now()
    const id = crypto.randomUUID()
    const participant = room.localParticipant
    try {
      await participant.publishData(encodeReaction(kind, id), { reliable: true, topic: EFFECTS_TOPIC })
      if (alive.current) addReaction(participant.identity, 'You', kind, id)
    } catch {
      if (alive.current) setError('Your reaction could not be sent. Wait for the call to reconnect, then try again.')
    }
  }, [addReaction, room])
  useEffect(() => {
    alive.current = true
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(media.matches)
    const change = () => setReduceMotion(media.matches)
    media.addEventListener('change', change)
    return () => { alive.current = false; media.removeEventListener('change', change) }
  }, [])
  useEffect(() => {
    const receive = (data: Uint8Array, participant?: RemoteParticipant, _kind?: unknown, topic?: string) => {
      if (topic !== EFFECTS_TOPIC || !participant || !room.remoteParticipants.has(participant.identity)) return
      const packet = decodeReaction(data)
      if (!packet || !gate.current.accept(participant.identity, packet, performance.now())) return
      addReaction(participant.identity, participant.name || 'Someone', packet.kind, packet.id)
    }
    const leave = (participant: RemoteParticipant) => {
      gate.current.remove(participant.identity)
      setReactions(items => items.filter(item => item.identity !== participant.identity))
    }
    room.on(RoomEvent.DataReceived, receive)
    room.on(RoomEvent.ParticipantDisconnected, leave)
    const timer = window.setInterval(() => setReactions(items => items.some(item => item.expiresAt <= Date.now()) ? items.filter(item => item.expiresAt > Date.now()) : items), 700)
    return () => { room.off(RoomEvent.DataReceived, receive); room.off(RoomEvent.ParticipantDisconnected, leave); window.clearInterval(timer) }
  }, [addReaction, room])

  const track = cameraTrack?.track
  useEffect(() => {
    if (!enabled || !isCameraEnabled || !(track instanceof LocalVideoTrack)) return
    let cancelled = false
    const candidate = new CallEffectsProcessor({
      state: value => { if (!cancelled && alive.current) setCamera(value) },
      gesture: action => { if (!cancelled && action !== 'snap') void react(action) },
      fatal: message => {
        if (cancelled || !alive.current) return
        setError(message); setEnabled(false); onIssueRef.current?.(message)
      },
    })
    processor.current = candidate
    setLoading(true); setError('')
    void (async () => {
      try {
        if (track.getProcessor()) throw new Error('Turn off the other camera filter before enabling gestures.')
        await track.setProcessor(candidate, true)
        if (cancelled) {
          if (track.getProcessor() === candidate) await track.stopProcessor()
          else await candidate.destroy()
        }
      } catch (cause) {
        if (track.getProcessor() === candidate) await track.stopProcessor().catch(() => undefined)
        else await candidate.destroy()
        if (!cancelled && alive.current) {
          const message = cause instanceof Error ? cause.message : 'Camera effects could not start.'
          setError(message); setEnabled(false); onIssueRef.current?.(message)
        }
      } finally { if (!cancelled && alive.current) setLoading(false) }
    })()
    return () => {
      cancelled = true
      if (processor.current === candidate) processor.current = null
      // The SDK may still be attaching the processor. The completion above handles that race.
      if (track.getProcessor() === candidate) void track.stopProcessor().catch(() => {
        const message = 'Could not restore the original camera after effects. Toggle your camera off and on.'
        if (alive.current) setError(message)
        onIssueRef.current?.(message)
      })
      else void candidate.destroy()
    }
  }, [enabled, isCameraEnabled, track, react])
  useEffect(() => { processor.current?.setGestures(gestures) }, [gestures, loading])
  useEffect(() => { processor.current?.setReducedMotion(reduceMotion) }, [reduceMotion, loading])
  useEffect(() => {
    const suspend = () => {
      if (!document.hidden) return
      setEnabled(false); setLoading(false); setCamera({ ...INITIAL_EFFECTS_STATE })
    }
    document.addEventListener('visibilitychange', suspend)
    return () => document.removeEventListener('visibilitychange', suspend)
  }, [])
  useEffect(() => {
    if (!isCameraEnabled) { setCamera({ ...INITIAL_EFFECTS_STATE }); setLoading(false) }
  }, [isCameraEnabled])

  return {
    panelOpen, setPanelOpen, enabled, loading, camera, error, gestures, setGestures, reduceMotion, setReduceMotion, reactions, react,
    isCameraEnabled, supported: CallEffectsProcessor.supported(),
    toggleEnabled: () => { setEnabled(value => !value); setLoading(false); setCamera({ ...INITIAL_EFFECTS_STATE }); setError('') },
    snap: () => processor.current?.snap(), capture: () => processor.current?.captureBackground(), cancelCapture: () => processor.current?.cancelCapture(),
    restore: () => processor.current?.restore(),
  }
}
