import assert from 'node:assert/strict'
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { chromium } from '@playwright/test'

// No live accounts, microphone, webcam, Appwrite or LiveKit server required.
// Tests real worker/model loading and a deterministic camera compositor in Chromium.
const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const {webpack} = require('next/dist/compiled/webpack/webpack')
await new Promise((resolve, reject) => {
  const compiler = webpack({
    mode: 'development', devtool: false, context: root, entry: './tests/fixtures/call-effects-panel.tsx',
    output: {path: path.join(root, 'test-results/call-effects/ui'), filename: 'panel.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js']},
    module: {rules: [
      {test: /\.tsx?$/, exclude: /node_modules/, use: path.join(root, 'tests/fixtures/call-effects-ts-loader.cjs')},
      {test: /\.css$/, use: path.join(root, 'tests/fixtures/call-effects-css-loader.cjs')},
    ]},
  })
  compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors() ? reject(error || new Error(stats.toString({all: false, errors: true}))) : resolve()))
})
const sources = new Set(['processor', 'gestures', 'compositor'])
const errors = []
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self'; connect-src 'self'; img-src 'self' blob:; media-src 'self' blob:")
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html')
      res.end('<!doctype html><title>Call effects verification</title><h1>Local call effects QA</h1><canvas id="source" width="640" height="360"></canvas><canvas id="output" width="640" height="360"></canvas><video id="remote" autoplay muted playsinline></video>')
      return
    }
    if (url.pathname === '/livekit.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(await readFile(path.join(root, 'node_modules/livekit-client/dist/livekit-client.umd.js'))); return }
    if (url.pathname === '/panel') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Call reactions preview</title><link rel="stylesheet" href="/panel.css"><style>body{margin:0;font-family:system-ui}*{box-sizing:border-box}button,input{font:inherit}</style><div id="root"></div><script src="/panel.js"></script>'); return }
    if (url.pathname === '/panel.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(await readFile(path.join(root, 'test-results/call-effects/ui/panel.js'))); return }
    if (url.pathname === '/panel.css') { res.setHeader('Content-Type', 'text/css'); res.end(await readFile(path.join(root, 'components/call/effects/call-effects.css'))); return }
    if (['/portrait.jpg', '/right_hands.jpg'].includes(url.pathname)) { res.setHeader('Content-Type', 'image/jpeg'); res.end(await readFile(path.join(root, 'test-results/call-effects/fixtures', path.basename(url.pathname)))); return }
    const match = url.pathname.match(/^\/(processor|gestures|compositor)\.js$/)
    if (match && sources.has(match[1])) {
      const source = await readFile(path.join(root, 'lib/call-effects', `${match[1]}.ts`), 'utf8')
      const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/from ['"]\.\/(gestures|compositor)['"]/g, "from '/$1.js'")
      res.setHeader('Content-Type', 'application/javascript'); res.end(js); return
    }
    if (!url.pathname.startsWith('/call-effects/') || url.pathname.includes('..')) { res.writeHead(404); res.end(); return }
    const target = path.resolve(root, 'public', '.' + url.pathname)
    if (!target.startsWith(path.resolve(root, 'public/call-effects') + path.sep)) throw new Error('Invalid fixture path')
    const type = target.endsWith('.js') ? 'application/javascript' : target.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'
    res.setHeader('Content-Type', type); res.end(await readFile(target))
  } catch (error) { res.writeHead(500); res.end(String(error)) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  const executablePath = process.env.CALL_EFFECTS_CHROMIUM
  browser = await chromium.launch({ executablePath, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: {width: 1280, height: 800} })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  const composite = await page.evaluate(async () => {
    const {PersonCompositor} = await import('/compositor.js')
    const source = document.getElementById('source'), output = document.getElementById('output')
    const c = source.getContext('2d'), out = output.getContext('2d')
    const compositor = new PersonCompositor(output)
    compositor.resize(640, 360)
    c.fillStyle = '#405d73'; c.fillRect(0, 0, 640, 360)
    compositor.capture(source)
    c.fillStyle = '#df915b'; c.fillRect(240, 40, 160, 300)
    const mask = new Uint8Array(64 * 36)
    for (let y = 4; y < 34; y++) for (let x = 24; x < 40; x++) mask[y * 64 + x] = 255
    compositor.setMask(mask, 64, 36)
    const pixel = (x, y) => [...out.getImageData(x, y, 1, 1).data]
    compositor.draw(source, 0)
    const before = pixel(320, 180), background = pixel(10, 10)
    const snap = compositor.toggle(source, 100)
    compositor.draw(source, 800)
    const during = out.getImageData(0, 0, 640, 360).data.filter((_v, i) => i % 4 === 3 && _v > 0).length
    compositor.draw(source, 1500)
    const gone = pixel(320, 180), backgroundAfter = pixel(10, 10)
    const back = compositor.toggle(source, 1600)
    compositor.draw(source, 3000)
    const restored = pixel(320, 180)
    compositor.resize(360, 640)
    const resized = {backgroundReady: compositor.backgroundReady, hidden: compositor.hidden, width: output.width, height: output.height}
    compositor.dispose()
    return {before, background, snap, during, gone, backgroundAfter, back, restored, resized, disposedWidth: output.width}
  })
  assert.equal(composite.snap, true); assert.equal(composite.back, true)
  assert.deepEqual(composite.gone, composite.background)
  assert.deepEqual(composite.backgroundAfter, composite.background)
  assert.deepEqual(composite.restored, composite.before)
  assert.deepEqual(composite.resized, {backgroundReady: false, hidden: false, width: 360, height: 640})
  assert.equal(composite.disposedWidth, 0)
  console.log('PASS Person dissolves and returns while background pixels stay identical')
  console.log('PASS Orientation changes reset the captured background and preserve aspect ratio')
  const result = await page.evaluate(async () => {
    const worker = new Worker('/call-effects/vision.worker.js')
    const wait = type => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Vision worker timeout')), 45000)
      worker.onmessage = ({data}) => {
        if (data.type === 'error') { clearTimeout(timeout); reject(new Error(data.message)) }
        else if (data.type === type) { clearTimeout(timeout); resolve(data) }
      }
      worker.onerror = event => { clearTimeout(timeout); reject(new Error(event.message)) }
    })
    const ready = wait('ready'); worker.postMessage({type: 'init'}); await ready
    const canvas = document.getElementById('source')
    canvas.getContext('2d').fillStyle = '#778e8b'; canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height)
    const bitmap = await createImageBitmap(canvas)
    const pending = wait('result')
    worker.postMessage({type: 'frame', bitmap, time: performance.now(), gestures: true, segment: true}, [bitmap])
    const result = await pending
    worker.terminate()
    return {width: result.width, height: result.height, maskSize: result.mask.length, personRatio: result.personRatio, hands: result.hands.length, elapsed: result.elapsed}
  })
  assert.ok(result.maskSize > 10000)
  assert.equal(result.maskSize, result.width * result.height)
  assert.equal(result.hands, 0)
  assert.ok(result.personRatio < .02, `Empty background incorrectly classified as ${result.personRatio} person`)
  console.log('PASS Real MediaPipe worker initializes both local models under production-style CSP')
  console.log('PASS Empty-background detection uses a real segmentation mask')
  if (process.env.CALL_EFFECTS_MODEL_FIXTURES === '1') {
    const fixtureResult = await page.evaluate(async () => {
      const worker = new Worker('/call-effects/vision.worker.js')
      const wait = type => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Model fixture timed out')), 45000)
        worker.onmessage = ({data}) => {
          if (data.type === 'error') {clearTimeout(timer); reject(new Error(data.message))}
          else if (data.type === type) {clearTimeout(timer); resolve(data)}
        }
      })
      const boot = wait('ready'); worker.postMessage({type: 'init'}); await boot
      const imageResult = async url => {
        const image = new Image(); image.src = url; await image.decode()
        const bitmap = await createImageBitmap(image)
        const result = wait('result')
        worker.postMessage({type: 'frame', bitmap, time: performance.now(), gestures: true, segment: true}, [bitmap])
        return result
      }
      const portrait = await imageResult('/portrait.jpg')
      const hands = await imageResult('/right_hands.jpg')
      worker.terminate()
      return {personRatio: portrait.personRatio, hands: hands.hands.length}
    })
    assert.ok(fixtureResult.personRatio > .1, `Person mask missed the official portrait: ${fixtureResult.personRatio}`)
    assert.ok(fixtureResult.hands >= 1, 'No hands detected in the official hands fixture')
    console.log('PASS Real models identify a person and hands in checksum-verified Google test images')
  }
  const lifecycle = await page.evaluate(async () => {
    const {CallEffectsProcessor} = await import('/processor.js')
    const source = document.getElementById('source')
    const context = source.getContext('2d')
    const draw = setInterval(() => {context.fillStyle = '#526b74'; context.fillRect(0, 0, source.width, source.height)}, 40)
    const input = source.captureStream(25).getVideoTracks()[0]
    const states = [], failures = []
    const processor = new CallEffectsProcessor({state: value => states.push(value), gesture: () => {}, fatal: message => failures.push(message)})
    await processor.init({kind: 'video', track: input})
    const initial = {ready: states.at(-1).ready, processed: processor.processedTrack?.readyState, original: input.readyState}
    const output = processor.processedTrack
    processor.captureBackground()
    const until = Date.now() + 14000
    while (!states.at(-1).backgroundReady && !failures.length && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 100))
    const captured = states.at(-1).backgroundReady
    await processor.destroy()
    const final = {output: output.readyState, original: input.readyState, ready: states.at(-1).ready}
    input.stop(); clearInterval(draw)
    return {initial, captured, final, failures}
  })
  assert.equal(lifecycle.initial.ready, true)
  assert.equal(lifecycle.initial.processed, 'live')
  assert.equal(lifecycle.captured, true)
  assert.deepEqual(lifecycle.failures, [])
  assert.deepEqual(lifecycle.final, {output: 'ended', original: 'live', ready: false})
  console.log('PASS Camera processor outputs a live track, captures an empty plate, and releases only its own resources')
  await page.addScriptTag({url: '/livekit.js'})
  const delivered = await page.evaluate(async () => {
    const {CallEffectsProcessor} = await import('/processor.js')
    const source = document.getElementById('source'), context = source.getContext('2d')
    const draw = setInterval(() => {context.fillStyle = '#526b74'; context.fillRect(0, 0, source.width, source.height)}, 40)
    const raw = source.captureStream(25).getVideoTracks()[0]
    const local = new window.LivekitClient.LocalVideoTrack(raw, {}, true)
    const senderPeer = new RTCPeerConnection({iceServers: []}), receiverPeer = new RTCPeerConnection({iceServers: []})
    const receivedVideo = document.getElementById('remote')
    const received = new Promise(resolve => { receiverPeer.ontrack = event => { receivedVideo.srcObject = new MediaStream([event.track]); resolve(event.track) } })
    senderPeer.onicecandidate = ({candidate}) => { if (candidate) void receiverPeer.addIceCandidate(candidate).catch(() => {}) }
    receiverPeer.onicecandidate = ({candidate}) => { if (candidate) void senderPeer.addIceCandidate(candidate).catch(() => {}) }
    local.sender = senderPeer.addTrack(raw)
    await senderPeer.setLocalDescription(await senderPeer.createOffer())
    await receiverPeer.setRemoteDescription(senderPeer.localDescription)
    await receiverPeer.setLocalDescription(await receiverPeer.createAnswer())
    await senderPeer.setRemoteDescription(receiverPeer.localDescription)
    await received
    await receivedVideo.play()
    const processor = new CallEffectsProcessor({state: () => {}, gesture: () => {}, fatal: message => {throw new Error(message)}})
    await local.setProcessor(processor, true)
    const processed = processor.processedTrack
    const until = Date.now() + 8000
    while ((!receivedVideo.videoWidth || receivedVideo.readyState < 2) && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 100))
    const published = {swapped: local.sender.track === processed, remoteWidth: receivedVideo.videoWidth, remoteHeight: receivedVideo.videoHeight}
    await local.stopProcessor()
    const restored = {original: local.sender.track === raw, source: raw.readyState, processed: processed.readyState}
    senderPeer.close(); receiverPeer.close(); raw.stop(); receivedVideo.srcObject = null; clearInterval(draw)
    return {published, restored}
  })
  assert.equal(delivered.published.swapped, true)
  assert.equal(delivered.published.remoteWidth, 640)
  assert.equal(delivered.published.remoteHeight, 360)
  assert.deepEqual(delivered.restored, {original: true, source: 'live', processed: 'ended'})
  console.log('PASS LiveKit swaps the outgoing sender to the effects track and a WebRTC peer receives the complete frame')
  console.log('PASS Disabling effects restores the original sender without ending the camera')
  await page.context().route('**/call-effects/models/hand_landmarker.task', route => route.fulfill({status: 503, body: 'Deliberate QA model failure'}))
  const failedEffect = await page.evaluate(async () => {
    const {CallEffectsProcessor} = await import('/processor.js')
    const canvas = document.getElementById('source'), context = canvas.getContext('2d')
    const timer = setInterval(() => context.fillRect(0, 0, canvas.width, canvas.height), 40)
    const raw = canvas.captureStream(25).getVideoTracks()[0]
    const track = new window.LivekitClient.LocalVideoTrack(raw, {}, true)
    const peer = new RTCPeerConnection({iceServers: []})
    track.sender = peer.addTrack(raw)
    const processor = new CallEffectsProcessor({state: () => {}, gesture: () => {}, fatal: () => {}})
    let rejected = false
    try {await track.setProcessor(processor)} catch {rejected = true}
    const result = {rejected, originalAlive: raw.readyState === 'live', senderRestored: track.sender.track === raw, noAttachedProcessor: !track.getProcessor()}
    await processor.destroy(); raw.stop(); peer.close(); clearInterval(timer)
    return result
  })
  assert.deepEqual(failedEffect, {rejected: true, originalAlive: true, senderRestored: true, noAttachedProcessor: true})
  await page.context().unroute('**/call-effects/models/hand_landmarker.task')
  console.log('PASS Model download failure keeps the original camera and sender alive')
  assert.deepEqual(errors, [])
  console.log('PASS No uncaught browser errors')
  await mkdir(path.join(root, 'test-results/call-effects'), {recursive: true})
  await page.screenshot({path: path.join(root, 'test-results/call-effects/pipeline.png')})
  await page.goto(`http://127.0.0.1:${server.address().port}/panel`)
  await page.getByRole('heading', {name: 'In the moment'}).waitFor()
  await page.getByRole('button', {name: 'Send a heart', exact: true}).click()
  assert.equal(await page.locator('[data-kind="heart"]').count(), 1)
  await page.getByRole('button', {name: 'Try Snap', exact: true}).click()
  await page.getByRole('button', {name: 'Return instantly', exact: true}).waitFor()
  await page.getByRole('button', {name: 'Return instantly', exact: true}).click()
  assert.equal(await page.getByRole('button', {name: 'Try Snap', exact: true}).count(), 1)
  await page.screenshot({path: path.join(root, 'test-results/call-effects/desktop.png')})
  await page.setViewportSize({width: 390, height: 844})
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  const panelBox = await page.getByRole('dialog').boundingBox()
  assert.ok(panelBox.x >= 0 && panelBox.width <= 390 && panelBox.height <= 844)
  await page.getByLabel('Gentle motion', {exact: false}).check()
  await page.getByRole('button', {name: 'Close effects', exact: true}).focus()
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.getByLabel('Gentle motion', {exact: false}).evaluate(el => document.activeElement === el), true)
  await page.screenshot({path: path.join(root, 'test-results/call-effects/mobile.png')})
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  console.log('PASS Real effects panel fits mobile and desktop, connects controls, traps focus, supports Escape and gentle motion')
  await page.goto(`http://127.0.0.1:${server.address().port}/panel?voice`)
  await page.getByText('Turn on your camera to use gestures and Snap.').waitFor()
  assert.equal(await page.getByRole('switch', {name: 'Camera effects'}).isDisabled(), true)
  await page.getByRole('button', {name: 'Send a thumbs up', exact: true}).click()
  assert.equal(await page.locator('[data-kind="thumbs-up"]').count(), 1)
  console.log('PASS Voice calls keep manual reactions available without enabling a camera')
  assert.deepEqual(errors, [])
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
