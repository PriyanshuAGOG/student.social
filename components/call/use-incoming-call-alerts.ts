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

function playChime(context: AudioContext): void {
  const start = context.currentTime
  const master = context.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.12, start + 0.035)
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.78)
  master.connect(context.destination)

  for (const [frequency, offset] of [[523.25, 0], [659.25, 0.18]] as const) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.75, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.48)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.5)
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
      if (context?.state === 'running') playChime(context)
      if ('vibrate' in navigator) navigator.vibrate([320, 180, 320])
    }

    if (context?.state === 'suspended') void context.resume().then(ring).catch(() => undefined)
    else ring()
    const interval = window.setInterval(ring, 2300)
    return () => {
      window.clearInterval(interval)
      if ('vibrate' in navigator) navigator.vibrate(0)
    }
  }, [active])
}
