'use client'

import { useEffect } from 'react'
import type { CallOutcome } from '@/hooks/use-call'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  audioContext ||= new AudioContextClass()
  return audioContext
}

function playRingtone(context: AudioContext): void {
  const start = context.currentTime
  const master = context.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.18, start + 0.035)
  master.gain.setValueAtTime(0.18, start + 1.45)
  master.gain.exponentialRampToValueAtTime(0.0001, start + 1.72)
  master.connect(context.destination)

  const notes = [
    [493.88, 0], [659.25, 0.16], [739.99, 0.34],
    [493.88, 0.82], [659.25, 0.98], [739.99, 1.16],
  ] as const
  for (const [frequency, offset] of notes) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.7, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.38)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.4)
  }
}

function playRingbackTone(context: AudioContext): void {
  const start = context.currentTime
  const master = context.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.12, start + 0.025)
  master.gain.setValueAtTime(0.12, start + 0.72)
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
  master.connect(context.destination)

  for (const frequency of [440, 480]) {
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(master)
    oscillator.start(start)
    oscillator.stop(start + 0.92)
  }
}

export function useIncomingCallAlerts(active: boolean): void {
  useEffect(() => {
    const primeAudio = () => {
      const context = getAudioContext()
      if (context?.state === 'suspended') void context.resume().catch(() => undefined)
    }
    window.addEventListener('pointerdown', primeAudio, { once: true, passive: true })
    window.addEventListener('keydown', primeAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', primeAudio)
      window.removeEventListener('keydown', primeAudio)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const context = getAudioContext()
    const ring = () => {
      if (context?.state === 'running') playRingtone(context)
      if ('vibrate' in navigator) navigator.vibrate([420, 160, 420, 720])
    }

    if (context?.state === 'suspended') void context.resume().then(ring).catch(() => undefined)
    else ring()
    const interval = window.setInterval(ring, 3000)
    return () => {
      window.clearInterval(interval)
      if ('vibrate' in navigator) navigator.vibrate(0)
    }
  }, [active])
}

export function useOutgoingCallTone(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const context = getAudioContext()
    const ring = () => {
      if (context?.state === 'running') playRingbackTone(context)
    }

    if (context?.state === 'suspended') void context.resume().then(ring).catch(() => undefined)
    else ring()
    const interval = window.setInterval(ring, 3000)
    return () => window.clearInterval(interval)
  }, [active])
}

function playOutcomeTone(context: AudioContext, kind: CallOutcome['kind']): void {
  const start = context.currentTime
  const frequencies = kind === 'declined' ? [330, 277, 220] : kind === 'missed' ? [440, 330] : [392]
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const offset = index * 0.24
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, start + offset)
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.12, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.2)
  })
}

export function playCallParticipantTone(kind: 'joined' | 'left'): void {
  const context = getAudioContext()
  if (!context || context.state !== 'running') return
  const start = context.currentTime
  const frequencies = kind === 'joined' ? [523.25, 659.25] : [392, 293.66]
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const offset = index * 0.12
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.09, start + offset + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.11)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.13)
  })
}

export function useCallOutcomeAlert(outcome: CallOutcome | null): void {
  useEffect(() => {
    if (!outcome) return
    const context = getAudioContext()
    if (!context) return
    if (context.state === 'suspended') {
      void context.resume().then(() => playOutcomeTone(context, outcome.kind)).catch(() => undefined)
    } else {
      playOutcomeTone(context, outcome.kind)
    }
  }, [outcome])
}
