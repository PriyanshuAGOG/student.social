import { Track, type TrackProcessor, type VideoProcessorOptions } from 'livekit-client'
import { GestureDetector, type GestureAction, type Hand } from './gestures'
import { PersonCompositor } from './compositor'

export type CameraEffectsState = { ready: boolean; backgroundReady: boolean; hidden: boolean; captureSeconds: number | null; hint: string }
export const INITIAL_EFFECTS_STATE: CameraEffectsState = { ready: false, backgroundReady: false, hidden: false, captureSeconds: null, hint: '' }
type VisionResult = { type: 'result'; hands: Hand[]; mask?: Uint8Array; width: number; height: number; personRatio: number | null; elapsed: number; time: number }

export class CallEffectsProcessor implements TrackProcessor<Track.Kind.Video> {
  name = 'student-social-camera-effects-v1'
  processedTrack?: MediaStreamTrack
  private source: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private compositor: PersonCompositor | null = null
  private worker: Worker | null = null
  private detector = new GestureDetector()
  private frame = 0
  private running = false
  private busy = false
  private inferenceAt = 0
  private responseAt = 0
  private lastDraw = 0
  private currentTime = -1
  private inferenceInterval = 120
  private captureAt = 0
  private captureExpires = 0
  private emptyFrames = 0
  private maskAt = 0
  private geometryChangedAt = 0
  private rejectLoad: ((error: Error) => void) | null = null
  private state: CameraEffectsState = { ...INITIAL_EFFECTS_STATE }
  private gestures = true
  private reducedMotion = false
  private disposed = false
  private generation = 0
  constructor(private callbacks: { state: (value: CameraEffectsState) => void; gesture: (action: GestureAction) => void; fatal: (message: string) => void }) {}

  static supported() {
    return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
  }
  private update(update: Partial<CameraEffectsState>) {
    this.state = { ...this.state, ...update }
    this.callbacks.state(this.state)
  }
  async init(options: VideoProcessorOptions) {
    if (!CallEffectsProcessor.supported()) throw new Error('This browser supports reaction buttons, but cannot run camera gestures. Try an up-to-date browser.')
    this.disposed = false
    const generation = ++this.generation
    this.source = document.createElement('video')
    this.source.muted = true; this.source.playsInline = true; this.source.autoplay = true
    this.source.srcObject = new MediaStream([options.track])
    this.canvas = document.createElement('canvas')
    this.compositor = new PersonCompositor(this.canvas)
    try {
      let playTimeout: number | undefined
      try {
        await Promise.race([this.source.play(), new Promise<never>((_resolve, reject) => {
          playTimeout = window.setTimeout(() => reject(new Error('Your camera is not producing video yet. Turn it off and on, then retry effects.')), 8000)
        })])
      } finally { window.clearTimeout(playTimeout) }
      if (this.disposed || generation !== this.generation) throw new Error('Camera effects cancelled')
      if (!this.source.videoWidth || !this.source.videoHeight) throw new Error('Wait until your camera is visible, then enable camera effects again.')
      this.resize()
      this.compositor.draw(this.source, performance.now())
      await this.loadVision()
      if (this.disposed || generation !== this.generation) throw new Error('Camera effects cancelled')
      this.processedTrack = this.canvas.captureStream(25).getVideoTracks()[0]
      if (!this.processedTrack) throw new Error('This browser cannot publish camera effects.')
      this.running = true
      this.responseAt = performance.now()
      this.update({ ready: true, hint: 'Gestures are on. Set up your background to use Snap.' })
      this.tick(performance.now())
    } catch (error) { await this.destroy(); throw error }
  }
  private loadVision() {
    return new Promise<void>((resolve, reject) => {
      const worker = new Worker('/call-effects/vision.worker.js')
      this.worker = worker
      const timer = window.setTimeout(() => reject(new Error('Camera effects took too long to load. Check your connection and retry.')), 30_000)
      this.rejectLoad = error => { window.clearTimeout(timer); reject(error) }
      const failure = (message: string) => {
        window.clearTimeout(timer)
        if (!this.running) reject(new Error(message))
        else { this.running = false; this.callbacks.fatal(message) }
      }
      worker.onerror = () => failure('Camera effects are unavailable on this device. Reaction buttons still work.')
      worker.onmessage = ({ data }) => {
        if (this.disposed) return
        if (data.type === 'ready') { window.clearTimeout(timer); this.rejectLoad = null; resolve() }
        else if (data.type === 'error') failure(data.message)
        else if (data.type === 'result') this.onResult(data)
      }
      worker.postMessage({ type: 'init' })
    })
  }
  private resize() {
    if (!this.source || !this.compositor) return
    const maxEdge = 960
    const scale = Math.min(1, maxEdge / Math.max(this.source.videoWidth, this.source.videoHeight))
    const width = Math.max(2, Math.round(this.source.videoWidth * scale / 2) * 2)
    const height = Math.max(2, Math.round(this.source.videoHeight * scale / 2) * 2)
    if (this.compositor.resize(width, height)) {
      this.maskAt = 0; this.captureAt = 0; this.captureExpires = 0
      this.geometryChangedAt = performance.now()
      this.detector = new GestureDetector()
      this.update({ backgroundReady: false, hidden: false, captureSeconds: null, hint: 'Camera changed. Capture the background again to use Snap.' })
    }
  }
  private tick = (now: number) => {
    if (!this.running || !this.source || !this.canvas || !this.compositor) return
    this.frame = requestAnimationFrame(this.tick)
    if (this.source.readyState < 2) return
    this.resize()
    // No stale mask may conceal the camera indefinitely after an inference failure.
    if (this.busy && now - this.responseAt > 7000) {
      this.running = false; this.callbacks.fatal('Camera effects paused because tracking stopped responding. Your camera has been restored.'); return
    }
    if (now - this.lastDraw >= 38) {
      this.compositor.draw(this.source, now)
      this.lastDraw = now
    }
    if (this.captureAt) {
      const seconds = Math.max(0, Math.ceil((this.captureAt - now) / 1000))
      if (this.state.captureSeconds !== seconds) this.update({ captureSeconds: seconds })
      if (now > this.captureExpires) {
        this.captureAt = 0
        this.update({ captureSeconds: null, hint: 'We still see someone in frame. Move out completely and try again.' })
      }
    }
    if (this.busy || now - this.inferenceAt < this.inferenceInterval || this.currentTime === this.source.currentTime) return
    this.busy = true; this.inferenceAt = now; this.currentTime = this.source.currentTime
    const generation = this.generation
    const scale = Math.min(1, 384 / Math.max(this.source.videoWidth, this.source.videoHeight))
    void createImageBitmap(this.source, { resizeWidth: Math.max(2, Math.round(this.source.videoWidth * scale)), resizeHeight: Math.max(2, Math.round(this.source.videoHeight * scale)) }).then(bitmap => {
      if (!this.running || generation !== this.generation || !this.worker) { bitmap.close(); this.busy = false; return }
      const segment = Boolean(this.captureAt || this.compositor?.active || now - this.maskAt > 300)
      this.worker.postMessage({ type: 'frame', bitmap, time: now, gestures: this.gestures, segment }, [bitmap])
    }).catch(() => { this.busy = false; this.running = false; this.callbacks.fatal('Camera effects stopped reading the camera. Your original camera will continue.') })
  }
  private onResult(result: VisionResult) {
    this.busy = false; this.responseAt = performance.now()
    if (result.time < this.geometryChangedAt) return
    this.inferenceInterval = Math.max(100, Math.min(350, result.elapsed * 1.4))
    if (result.mask && this.compositor) { this.compositor.setMask(result.mask, result.width, result.height); this.maskAt = this.responseAt }
    if (this.captureAt && this.responseAt >= this.captureAt && result.personRatio !== null) {
      this.emptyFrames = result.personRatio < 0.012 ? this.emptyFrames + 1 : 0
      if (this.emptyFrames >= 2 && this.source && this.compositor) {
        this.compositor.capture(this.source)
        this.captureAt = 0
        this.update({ backgroundReady: true, captureSeconds: null, hint: 'Background ready. Step back in, then snap to disappear.' })
      }
    }
    if (this.gestures && !this.captureAt) {
      const action = this.detector.update(result.hands, result.time)
      if (action) {
        if (action === 'snap') this.snap()
        else this.callbacks.gesture(action)
      }
    }
  }
  snap() {
    if (!this.source || !this.compositor) return
    if (!this.compositor.backgroundReady) { this.update({ hint: 'Capture an empty background first, then snap again.' }); return }
    if (performance.now() - this.maskAt > 1200) { this.update({ hint: 'Waiting for a clear camera frame. Try again in a moment.' }); return }
    if (this.compositor.toggle(this.source, performance.now())) this.update({ hidden: this.compositor.hidden, hint: this.compositor.hidden ? 'You disappeared. Snap again or press Return. Your microphone is unchanged.' : 'You’re back.' })
  }
  captureBackground() {
    if (!this.running || !this.compositor) return
    this.compositor.reset(true); this.emptyFrames = 0
    this.captureAt = performance.now() + 3000
    this.captureExpires = this.captureAt + 7000
    this.update({ hidden: false, backgroundReady: false, captureSeconds: 3, hint: 'Step completely out of frame. Keep your camera still.' })
  }
  cancelCapture() { this.captureAt = 0; this.update({ captureSeconds: null, hint: 'Background capture cancelled.' }) }
  restore() { this.compositor?.reset(); this.update({ hidden: false, hint: 'You’re visible again.' }) }
  setGestures(enabled: boolean) { this.gestures = enabled; this.detector = new GestureDetector() }
  setReducedMotion(value: boolean) { this.reducedMotion = value; this.compositor?.setReducedMotion(value) }
  async restart(options: VideoProcessorOptions) {
    await this.destroy()
    this.detector = new GestureDetector()
    await this.init(options)
    this.compositor?.setReducedMotion(this.reducedMotion)
  }
  async destroy() {
    this.generation++; this.disposed = true; this.running = false; this.busy = false
    cancelAnimationFrame(this.frame)
    this.rejectLoad?.(new Error('Camera effects cancelled')); this.rejectLoad = null
    this.worker?.terminate(); this.worker = null
    this.processedTrack?.stop(); this.processedTrack = undefined
    // Only the processed track is owned here. Never stop the microphone or raw camera.
    if (this.source) { this.source.pause(); this.source.srcObject = null; this.source.remove(); this.source = null }
    this.compositor?.dispose(); this.compositor = null; this.canvas = null
    this.captureAt = 0; this.captureExpires = 0; this.currentTime = -1; this.inferenceAt = 0; this.maskAt = 0
    this.update({ ...INITIAL_EFFECTS_STATE })
  }
}
