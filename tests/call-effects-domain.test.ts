import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error Node strip-types uses explicit source extensions.
import { GestureDetector, staticGesture, isHeartTrace, type Hand, type Point } from '../lib/call-effects/gestures.ts'
// @ts-expect-error Node strip-types uses explicit source extensions.
import { decodeReaction, encodeReaction, ReactionGate } from '../lib/call-effects/protocol.ts'
// @ts-expect-error Node strip-types uses explicit source extensions.
import { dissolveProgress, dustAlpha } from '../lib/call-effects/compositor.ts'

function hand(): Hand {
  const points = Array.from({length: 21}, () => ({x: 0.5, y: 0.65}))
  points[0] = {x: 0.5, y: 0.9}; points[9] = {x: 0.5, y: 0.6}
  for (const pip of [6, 10, 14, 18]) points[pip] = {x: 0.5, y: 0.5}
  points[4] = {x: 0.2, y: 0.6}; points[3] = {x: 0.3, y: 0.7}; points[5] = {x: 0.5, y: 0.65}
  return {points, side: 'Left'}
}
test('a middle-thumb pinch and fast release toggles once with a cooldown', () => {
  const detector = new GestureDetector(), h = hand()
  h.points[4] = {...h.points[12]}
  assert.equal(detector.update([h], 100), null)
  h.points[4] = {x: 0.15, y: 0.6}
  assert.equal(detector.update([h], 210), 'snap')
  h.points[4] = {...h.points[12]}; detector.update([h], 350)
  h.points[4] = {x: 0.15, y: 0.6}
  assert.equal(detector.update([h], 460), null)
})
test('lost tracking and slow pinches never masquerade as a snap', () => {
  for (const mode of ['lost', 'slow']) {
    const detector = new GestureDetector(), h = hand()
    h.points[4] = {...h.points[12]}; detector.update([h], 100)
    if (mode === 'slow') for (const time of [300, 500, 700, 900]) detector.update([h], time)
    else detector.update([], 500)
    h.points[4] = {x: 0.15, y: 0.6}
    assert.equal(detector.update([h], 1000), null)
  }
})
test('reactions need a steady hold and release before repeating', () => {
  const detector = new GestureDetector(), h = hand()
  h.points[4] = {x: 0.4, y: 0.2}
  assert.equal(staticGesture([h]), 'thumbs-up')
  assert.equal(detector.update([h], 100), null)
  assert.equal(detector.update([h], 700), 'thumbs-up')
  assert.equal(detector.update([h], 5000), null)
  detector.update([], 5500); detector.update([], 6000)
  detector.update([h], 6500)
  assert.equal(detector.update([h], 7200), 'thumbs-up')
})
test('malformed hands cannot trigger a gesture', () => {
  assert.equal(staticGesture([{points: [], side: 'Left'}]), null)
  assert.equal(new GestureDetector().update([{...hand(), points: Array.from({length: 21}, () => ({x: NaN, y: 0}))}], 100), null)
})
test('drawn heart requires a closed two-lobed outline rather than a circle', () => {
  const heart: Point[] = Array.from({length: 49}, (_, index) => {
    const t = index / 48 * Math.PI * 2
    return {x: .5 + 16 * Math.sin(t) ** 3 / 80, y: .5 - (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 80}
  })
  assert.equal(isHeartTrace(heart), true)
  assert.equal(isHeartTrace(Array.from({length: 49}, (_, i) => ({x: .5 + .2 * Math.cos(i/48 * Math.PI*2), y: .5 + .2 * Math.sin(i/48 * Math.PI*2)}))), false)
  assert.equal(isHeartTrace(heart.slice(0, 20)), false)
})
test('reaction packets reject unknown versions, malicious types and oversized input', () => {
  const valid = encodeReaction('heart', 'reaction-123')
  assert.deepEqual(decodeReaction(valid), {v: 1, id: 'reaction-123', kind: 'heart'})
  for (const value of ['{broken', JSON.stringify({v: 2, id: 'reaction-123', kind: 'heart'}), JSON.stringify({v: 1, id: 'reaction-123', kind: '<script>'}), 'x'.repeat(257)]) assert.equal(decodeReaction(new TextEncoder().encode(value)), null)
})
test('reaction gate bounds bursts and rejects replay while separating senders', () => {
  const gate = new ReactionGate(), packet = {v: 1 as const, id: 'reaction-123', kind: 'heart' as const}
  assert.equal(gate.accept('peer', packet, 100), true)
  assert.equal(gate.accept('peer', {...packet, id: 'reaction-456'}, 200), false)
  assert.equal(gate.accept('other', packet, 200), true)
  assert.equal(gate.accept('peer', packet, 5000), false)
  assert.equal(gate.accept('peer', {...packet, id: 'reaction-789'}, 5000), true)
})
test('dissolve endpoints preserve a full person or remove only the masked person', () => {
  assert.equal(dustAlpha(.8, .4, .6, 0), .8)
  assert.equal(dustAlpha(.8, .4, .6, 1), 0)
  assert.equal(dustAlpha(0, .4, .6, .5), 0)
  const out = {from: 0, to: 1, started: 100, duration: 1000}
  assert.equal(dissolveProgress(out, 100), 0)
  assert.equal(dissolveProgress(out, 600), .5)
  assert.equal(dissolveProgress(out, 1100), 1)
  assert.equal(dissolveProgress({...out, from: 1, to: 0}, 1100), 0)
})
