import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CallEffectsPanel, TileReaction } from '../../components/call/effects/CallEffectsPanel'
import type { useCallEffects, VisibleReaction } from '../../components/call/effects/useCallEffects'
import type { CallReaction } from '../../lib/call-effects/gestures'

function Fixture() {
  const voiceOnly = new URLSearchParams(location.search).has('voice')
  const [panelOpen, setPanelOpen] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [gestures, setGestures] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reactions, setReactions] = useState<VisibleReaction[]>([])
  const react = async (kind: CallReaction) => setReactions([{id: crypto.randomUUID(), identity: 'qa', name: 'You', kind, expiresAt: Date.now() + 3000}])
  const effects: ReturnType<typeof useCallEffects> = {
    panelOpen, setPanelOpen, enabled, loading: false, gestures, setGestures, reduceMotion, setReduceMotion,
    camera: {ready: true, backgroundReady: true, hidden, captureSeconds: null, hint: hidden ? 'You disappeared. Snap again or press Return. Your microphone is unchanged.' : 'Background ready. Step back in, then snap to disappear.'},
    error: '', reactions, react, isCameraEnabled: !voiceOnly, supported: true,
    toggleEnabled: () => setEnabled(value => !value), snap: () => setHidden(value => !value), capture: () => {}, cancelCapture: () => {}, restore: () => setHidden(false),
  }
  return <div style={{position: 'fixed', inset: 0, background: '#252925', color: '#f5eee8'}}>
    <p style={{padding: 24}}>Call effects · isolated interface fixture</p>
    <div style={{position: 'absolute', inset: '80px 20px 110px', borderRadius: 24, background: 'linear-gradient(150deg,#4f6660,#2d3635)'}}><TileReaction reaction={reactions[0]} reduceMotion={reduceMotion} /></div>
    <button className="call-effects-trigger" onClick={() => setPanelOpen(true)} aria-label="Reactions and camera effects">Reactions</button>
    <CallEffectsPanel effects={effects} />
  </div>
}

createRoot(document.getElementById('root')!).render(<Fixture />)
