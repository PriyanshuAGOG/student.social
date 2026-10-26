export type Point = { x: number; y: number; z?: number }
export type Hand = { points: Point[]; side: string }
export type CallReaction = 'heart' | 'thumbs-up' | 'celebrate' | 'hand'
export type GestureAction = CallReaction | 'snap'
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const palmSize = (p: Point[]) => Math.max(0.025, distance(p[0], p[9]))
const extended = (p: Point[], tip: number, pip: number) => distance(p[tip], p[0]) > distance(p[pip], p[0]) * 1.18

export function staticGesture(hands: Hand[]): CallReaction | null {
  const valid = hands.filter(hand => hand.points.length === 21 && hand.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))
  if (valid.length === 2) {
    const [a, b] = valid.map(hand => hand.points)
    const size = (palmSize(a) + palmSize(b)) / 2
    // Two-hand heart: thumbs meet below the joined index tips.
    if (distance(a[8], b[8]) < size * 0.65 && distance(a[4], b[4]) < size * 0.7 &&
      (a[4].y + b[4].y) / 2 > (a[8].y + b[8].y) / 2 + size * 0.2 && distance(a[0], b[0]) > size * 0.8) return 'heart'
  }
  for (const { points: p } of valid) {
    const size = palmSize(p)
    const [index, middle, ring, pinky] = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => extended(p, tip, pip))
    if (!index && !middle && !ring && !pinky && p[4].y < p[3].y - size * 0.2 && p[4].y < p[5].y - size * 0.3) return 'thumbs-up'
    if (index && middle && !ring && !pinky && distance(p[8], p[12]) > size * 0.45) return 'celebrate'
    if (index && middle && ring && pinky && distance(p[4], p[17]) > size * 1.1 && p[12].y < p[0].y - size) return 'hand'
  }
  return null
}

/** A bounded, camera-only pinch/release detector. Sound never triggers a snap. */
export class GestureDetector {
  private candidate: CallReaction | null = null
  private candidateSince = 0
  private held: CallReaction | null = null
  private neutralSince = 0
  private lastAction = -Infinity
  private pinches = new Map<string, { started: number; last: number }>()
  private trace: Array<Point & { time: number }> = []

  update(hands: Hand[], now: number): GestureAction | null {
    if (!Number.isFinite(now)) return null
    const valid = hands.filter(hand => hand.points.length === 21 && hand.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))
    for (const [key, pinch] of this.pinches) if (now - pinch.last > 250) this.pinches.delete(key)
    for (const hand of valid) {
      const p = hand.points
      const gap = distance(p[4], p[12]) / palmSize(p)
      const pinch = this.pinches.get(hand.side)
      if (gap < 0.32) {
        this.pinches.set(hand.side, { started: pinch?.started ?? now, last: now })
      } else if (pinch && gap > 0.72) {
        this.pinches.delete(hand.side)
        if (now - pinch.started >= 45 && now - pinch.started <= 750 && now - this.lastAction > 1600) {
          this.lastAction = now
          this.trace = []
          return 'snap'
        }
      }
    }
    const gesture = staticGesture(valid)
    if (!gesture) {
      if (!this.neutralSince) this.neutralSince = now
      if (now - this.neutralSince > 350) this.held = null
    } else this.neutralSince = 0
    if (gesture !== this.candidate) { this.candidate = gesture; this.candidateSince = now }
    if (gesture && gesture !== this.held && now - this.candidateSince >= (gesture === 'hand' ? 950 : 500) && now - this.lastAction > 2200) {
      this.held = gesture; this.lastAction = now; this.trace = []
      return gesture
    }
    // Draw a heart with a single extended index finger. A closed two-lobed path is required.
    const p = valid.length === 1 ? valid[0].points : null
    if (!gesture && p && extended(p, 8, 6) && !extended(p, 12, 10) && !extended(p, 16, 14)) {
      this.trace.push({ ...p[8], time: now })
      this.trace = this.trace.filter(point => now - point.time < 4500).slice(-60)
      if (now - this.lastAction > 2400 && isHeartTrace(this.trace)) {
        this.trace = []; this.lastAction = now; return 'heart'
      }
    } else this.trace = []
    return null
  }
}

export function isHeartTrace(points: Point[]) {
  if (points.length < 18) return false
  const xs = points.map(p => p.x), ys = points.map(p => p.y)
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys)
  const width = right - left, height = bottom - top
  if (width < 0.16 || height < 0.16 || width / height < 0.65 || width / height > 1.7) return false
  if (distance(points[0], points.at(-1)!) > Math.min(width, height) * 0.22) return false
  const normalized = points.map(p => ({ x: (p.x - left) / width, y: (p.y - top) / height }))
  const has = (predicate: (p: Point) => boolean) => normalized.some(predicate)
  // Both round lobes, a top centre notch, and a single bottom centre point.
  return has(p => p.x < 0.3 && p.y < 0.24) && has(p => p.x > 0.7 && p.y < 0.24) &&
    has(p => p.x > 0.38 && p.x < 0.62 && p.y > 0.16 && p.y < 0.48) &&
    has(p => p.x > 0.35 && p.x < 0.65 && p.y > 0.92) &&
    !has(p => (p.x < 0.18 || p.x > 0.82) && p.y > 0.78)
}
