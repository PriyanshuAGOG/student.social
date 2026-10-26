'use client'

import { useEffect, useRef } from 'react'
import { Camera, Hand, Heart, PartyPopper, ScanLine, Sparkles, ThumbsUp, Undo2, X } from 'lucide-react'
import type { CallReaction } from '@/lib/call-effects/gestures'
import type { useCallEffects, VisibleReaction } from './useCallEffects'
import './call-effects.css'

const reactions = [
  { kind: 'heart' as const, label: 'Send a heart', title: 'Love it', Icon: Heart },
  { kind: 'thumbs-up' as const, label: 'Send a thumbs up', title: 'Got it', Icon: ThumbsUp },
  { kind: 'celebrate' as const, label: 'Celebrate', title: 'Celebrate', Icon: PartyPopper },
  { kind: 'hand' as const, label: 'Ask to speak', title: 'My turn', Icon: Hand },
]
export function ReactionArt({ kind }: { kind: CallReaction }) {
  const Icon = reactions.find(item => item.kind === kind)!.Icon
  return <><div className={`call-reaction-symbol call-reaction-symbol--${kind}`}><Icon aria-hidden="true" /></div>{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} aria-hidden="true" />)}</>
}
export function TileReaction({ reaction, reduceMotion }: { reaction?: VisibleReaction; reduceMotion: boolean }) {
  if (!reaction) return null
  return <div key={reaction.id} className={`call-tile-reaction${reduceMotion ? ' call-reaction-still' : ''}`} data-kind={reaction.kind} aria-hidden="true"><ReactionArt kind={reaction.kind} /></div>
}

export function CallEffectsPanel({ effects }: { effects: ReturnType<typeof useCallEffects> }) {
  const panel = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const onClose = () => effects.setPanelOpen(false)
  useEffect(() => {
    if (!effects.panelOpen) return
    const before = document.activeElement as HTMLElement | null
    close.current?.focus()
    return () => before?.focus()
  }, [effects.panelOpen])
  if (!effects.panelOpen) return null
  return <>
    <button className="call-effects-scrim" type="button" aria-label="Close reactions and camera effects" onClick={onClose} />
    <aside ref={panel} className="call-effects-panel" role="dialog" aria-modal="true" aria-labelledby="call-effects-heading" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose() }
      if (event.key !== 'Tab') return
      const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)') || [])]
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}>
      <header><div><p className="call-effects-eyebrow">A LITTLE MORE HUMAN</p><h2 id="call-effects-heading">In the moment</h2></div><button ref={close} type="button" aria-label="Close effects" className="call-effects-close" onClick={onClose}><X /></button></header>
      <p className="call-effects-intro">A little love. A small win. Your turn to speak.</p>
      <div className="call-reaction-picker">{reactions.map(({ kind, title, label, Icon }) => <button type="button" key={kind} aria-label={label} onClick={() => void effects.react(kind)}><Icon aria-hidden="true" /><span>{title}</span></button>)}</div>
      <section className="call-effects-camera">
        <div className="call-effects-row"><div className="call-effects-camera-heading"><Sparkles /><div><h3>Camera magic</h3><p>Gestures, with your own touch.</p></div></div><button type="button" role="switch" aria-checked={effects.enabled} aria-label="Camera effects" className="call-effects-switch" disabled={!effects.isCameraEnabled || !effects.supported} onClick={effects.toggleEnabled}><span /></button></div>
        {!effects.isCameraEnabled ? <p className="call-effects-note"><Camera />Turn on your camera to use gestures and Snap.</p> : !effects.supported ? <p className="call-effects-note">Reaction buttons work here. Camera gestures need a browser with worker and canvas support.</p> : effects.enabled && (effects.loading || !effects.camera.ready) ? <p className="call-effects-note" role="status">Preparing camera effects… This may take a moment the first time.</p> : null}
        {effects.enabled && effects.camera.ready && <>
          <div className="call-effects-snap-card"><span className="call-effects-snap-mark" aria-hidden="true"><Sparkles /></span><div><h3>Snap out. Snap back.</h3><p>Capture your empty background, then touch your thumb to your middle finger and quickly release. Keep your hand in view.</p></div></div>
          <div className="call-effects-snap-actions"><button type="button" disabled={effects.camera.captureSeconds !== null} onClick={effects.capture}><ScanLine />{effects.camera.backgroundReady ? 'Recapture background' : 'Set up background'}</button><button type="button" className="call-effects-primary" disabled={!effects.camera.backgroundReady || effects.camera.captureSeconds !== null} onClick={effects.snap}><Sparkles />{effects.camera.hidden ? 'Snap back' : 'Try Snap'}</button></div>
          {effects.camera.captureSeconds !== null && <div className="call-effects-countdown" role="status"><strong>{effects.camera.captureSeconds || '…'}</strong><span>{effects.camera.captureSeconds ? 'Step out of frame' : 'Checking for an empty background'}</span><button type="button" onClick={effects.cancelCapture}>Cancel</button></div>}
          <p className="call-effects-hint" role="status">{effects.camera.hint}</p>
          {effects.camera.hidden && <button type="button" className="call-effects-restore" onClick={effects.restore}><Undo2 />Return instantly</button>}
          <label className="call-effects-check"><input type="checkbox" checked={effects.gestures} onChange={event => effects.setGestures(event.target.checked)} /><span><strong>Gesture controls</strong><small>Snap, thumbs up, two-hand heart, peace sign, or a held open palm. Trace a heart with your index finger.</small></span></label>
        </>}
      </section>
      <label className="call-effects-check"><input type="checkbox" checked={effects.reduceMotion} onChange={event => effects.setReduceMotion(event.target.checked)} /><span><strong>Gentle motion</strong><small>Still reactions and a soft fade instead of particles.</small></span></label>
      {effects.error && <p role="alert" className="call-effects-error">{effects.error}</p>}
      <p className="call-effects-privacy">Gesture detection stays on your device. Effects appear in your shared camera. Your camera stays on while you’re invisible; your microphone is unchanged. Keep the camera still after capturing the background.</p>
    </aside>
  </>
}
