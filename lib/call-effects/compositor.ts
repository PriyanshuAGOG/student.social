export type DustState = { from: number; to: number; started: number; duration: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n))
export function dissolveProgress(state: DustState, now: number) {
  const t = clamp((now - state.started) / Math.max(1, state.duration))
  const eased = t * t * (3 - 2 * t)
  return state.from + (state.to - state.from) * eased
}
export function noiseAt(x: number, y: number) {
  // Stable spatial grain, so forward and reverse animations reassemble the same pixels.
  let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}
export function dustAlpha(confidence: number, x: number, y: number, progress: number) {
  if (progress <= 0) return confidence
  if (progress >= 1) return 0
  const threshold = noiseAt(Math.floor(x * 256), Math.floor(y * 256)) * 0.65 + x * 0.35
  return confidence * clamp((threshold - progress) / 0.08 + 0.5)
}

type Particle = { x: number; y: number; dx: number; dy: number; size: number; color: string; delay: number }
export class PersonCompositor {
  readonly background = document.createElement('canvas')
  private foreground = document.createElement('canvas')
  private maskCanvas = document.createElement('canvas')
  private mask: { data: Uint8Array; width: number; height: number } | null = null
  private particles: Particle[] = []
  private transition: DustState = { from: 0, to: 0, started: 0, duration: 1350 }
  private reducedMotion = false
  backgroundReady = false
  hidden = false
  get active() { return this.hidden || this.transition.from !== this.transition.to }

  readonly canvas: HTMLCanvasElement
  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas }
  setReducedMotion(value: boolean) { this.reducedMotion = value }
  setMask(data: Uint8Array, width: number, height: number) {
    if (data.length !== width * height || width <= 0 || height <= 0) return
    this.mask = { data, width, height }
    if (this.maskCanvas.width !== width || this.maskCanvas.height !== height) { this.maskCanvas.width = width; this.maskCanvas.height = height }
  }
  resize(width: number, height: number) {
    if (this.canvas.width === width && this.canvas.height === height) return false
    for (const canvas of [this.canvas, this.foreground, this.background]) { canvas.width = width; canvas.height = height }
    this.reset(true)
    this.mask = null
    return true
  }
  capture(source: CanvasImageSource) {
    this.background.getContext('2d')!.drawImage(source, 0, 0, this.canvas.width, this.canvas.height)
    this.backgroundReady = true
  }
  reset(clearBackground = false) {
    this.hidden = false
    this.transition = { from: 0, to: 0, started: 0, duration: 1350 }
    this.particles = []
    if (clearBackground) {
      this.backgroundReady = false
      this.background.getContext('2d')?.clearRect(0, 0, this.background.width, this.background.height)
    }
  }
  toggle(source: CanvasImageSource, now: number) {
    if (!this.backgroundReady || !this.mask) return false
    const current = dissolveProgress(this.transition, now)
    if (current > 0 && current < 1) return false
    this.hidden = !this.hidden
    this.transition = { from: current, to: this.hidden ? 1 : 0, started: now, duration: this.reducedMotion ? 220 : 1350 }
    this.makeParticles(source)
    return true
  }
  private makeParticles(source: CanvasImageSource) {
    if (!this.mask || this.reducedMotion) return
    const ctx = this.foreground.getContext('2d', { willReadFrequently: true })!
    const { width, height } = this.canvas
    ctx.drawImage(source, 0, 0, width, height)
    const pixels = ctx.getImageData(0, 0, width, height).data
    this.particles = []
    const step = Math.max(7, Math.round(Math.sqrt(width * height / 650)))
    for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
      const maskIndex = Math.floor(y / height * this.mask.height) * this.mask.width + Math.floor(x / width * this.mask.width)
      if (this.mask.data[maskIndex] < 160) continue
      const index = (y * width + x) * 4
      const seed = noiseAt(x, y)
      this.particles.push({ x, y, dx: width * (0.1 + seed * 0.38), dy: -height * (0.1 + noiseAt(y, x) * 0.35), size: 1.5 + seed * 3, color: `rgb(${pixels[index]} ${pixels[index + 1]} ${pixels[index + 2]})`, delay: seed * 0.4 })
    }
  }
  draw(source: CanvasImageSource, now: number) {
    const ctx = this.canvas.getContext('2d')!
    const { width, height } = this.canvas
    const progress = dissolveProgress(this.transition, now)
    if (progress === this.transition.to && this.transition.from !== this.transition.to) this.transition.from = this.transition.to
    if (!this.backgroundReady || !this.mask || (progress === 0 && !this.hidden)) {
      ctx.drawImage(source, 0, 0, width, height)
      return
    }
    ctx.drawImage(this.background, 0, 0, width, height)
    if (progress === 1) return
    const maskCtx = this.maskCanvas.getContext('2d')!
    const image = maskCtx.createImageData(this.mask.width, this.mask.height)
    for (let y = 0; y < this.mask.height; y++) for (let x = 0; x < this.mask.width; x++) {
      const index = y * this.mask.width + x
      const confidence = clamp((this.mask.data[index] / 255 - 0.2) / 0.6)
      image.data[index * 4 + 3] = Math.round((this.reducedMotion ? confidence * (1 - progress) : dustAlpha(confidence, x / this.mask.width, y / this.mask.height, progress)) * 255)
    }
    maskCtx.putImageData(image, 0, 0)
    const fg = this.foreground.getContext('2d')!
    fg.globalCompositeOperation = 'source-over'
    fg.clearRect(0, 0, width, height)
    fg.drawImage(source, 0, 0, width, height)
    fg.globalCompositeOperation = 'destination-in'
    fg.drawImage(this.maskCanvas, 0, 0, width, height)
    fg.globalCompositeOperation = 'source-over'
    ctx.drawImage(this.foreground, 0, 0)
    if (!this.reducedMotion) {
      for (const particle of this.particles) {
        const travel = clamp((progress - particle.delay) / (1 - particle.delay))
        if (!travel || travel >= 1) continue
        ctx.globalAlpha = Math.sin(travel * Math.PI) * 0.85
        ctx.fillStyle = particle.color
        ctx.fillRect(particle.x + particle.dx * travel, particle.y + particle.dy * travel, particle.size * (1 - travel * 0.7), particle.size * (1 - travel * 0.7))
      }
      ctx.globalAlpha = 1
    }
  }
  dispose() {
    this.reset(true)
    this.mask = null
    for (const canvas of [this.background, this.foreground, this.maskCanvas, this.canvas]) { canvas.width = 0; canvas.height = 0 }
  }
}
