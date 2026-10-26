/* MediaPipe runs here so inference does not block call controls or audio. */
/* global importScripts */
let hands, segmenter, busy = false, lastTime = 0
self.exports = {}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      importScripts('/call-effects/vendor/vision_bundle.js')
      const { FilesetResolver, HandLandmarker, ImageSegmenter } = self.exports
      const files = await FilesetResolver.forVisionTasks('/call-effects/vendor/wasm')
      hands = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/call-effects/models/hand_landmarker.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65, minTrackingConfidence: 0.6,
      })
      segmenter = await ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/call-effects/models/selfie_segmenter.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO', outputConfidenceMasks: true, outputCategoryMask: false,
      })
      self.postMessage({ type: 'ready' })
    } catch {
      hands?.close(); segmenter?.close()
      self.postMessage({ type: 'error', message: 'Gesture effects could not load on this device. You can still use reaction buttons.' })
    }
    return
  }
  if (data.type !== 'frame') return
  const bitmap = data.bitmap
  if (busy || !hands || !segmenter) { bitmap?.close(); return }
  busy = true
  const started = performance.now()
  try {
    const time = Math.max(lastTime + 1, data.time)
    lastTime = time
    const result = data.gestures ? hands.detectForVideo(bitmap, time) : null
    let mask, width = 0, height = 0, personRatio = null
    if (data.segment) {
      segmenter.segmentForVideo(bitmap, time, output => {
        // The selfie model has one foreground confidence mask; models with explicit
        // background/person outputs expose the foreground at index 1.
        const labels = segmenter.getLabels()
        const personIndex = labels.findIndex(label => /person|selfie|foreground/i.test(label))
        const masks = output.confidenceMasks || []
        const foreground = masks.length === 1 ? masks[0] : masks[personIndex >= 0 ? personIndex : 1]
        if (!foreground) throw new Error('Foreground mask unavailable')
        const values = foreground.getAsFloat32Array()
        mask = new Uint8Array(values.length)
        let occupied = 0
        for (let index = 0; index < values.length; index++) {
          mask[index] = Math.round(Math.max(0, Math.min(1, values[index])) * 255)
          if (values[index] > 0.65) occupied++
        }
        width = foreground.width; height = foreground.height
        personRatio = occupied / values.length
      })
    }
    const message = { type: 'result', hands: (result?.landmarks || []).map((points, index) => ({ points, side: result.handedness[index]?.[0]?.categoryName || String(index) })), mask, width, height, personRatio, elapsed: performance.now() - started, time: data.time }
    self.postMessage(message, mask ? [mask.buffer] : [])
  } catch {
    self.postMessage({ type: 'error', message: 'Camera effects paused. Your camera and call are still available.' })
  } finally { bitmap?.close(); busy = false }
}
