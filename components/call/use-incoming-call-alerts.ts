'use client'

import { useEffect } from 'react'

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
