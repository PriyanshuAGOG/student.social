import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const version = '0.10.32'
const vendor = path.join(root, 'public/call-effects/vendor')
const models = path.join(root, 'public/call-effects/models')
const runtime = path.join(root, 'node_modules/@mediapipe/tasks-vision')
const pkg = JSON.parse(await readFile(path.join(runtime, 'package.json'), 'utf8'))
if (pkg.version !== version) throw new Error(`Expected MediaPipe ${version}, found ${pkg.version}`)
await mkdir(vendor, { recursive: true })
await mkdir(models, { recursive: true })
for (const file of ['vision_bundle.cjs', 'wasm/vision_wasm_internal.js', 'wasm/vision_wasm_internal.wasm', 'wasm/vision_wasm_nosimd_internal.js', 'wasm/vision_wasm_nosimd_internal.wasm']) {
  const destination = path.join(vendor, file.replace('.cjs', '.js'))
  await mkdir(path.dirname(destination), { recursive: true })
  await copyFile(path.join(runtime, file), destination)
}
// Apache-2.0 requires that redistributed runtime copies include the license.
let license
try { license = await readFile(path.join(root, 'public/call-effects/LICENSE.txt'), 'utf8') } catch {}
if (!license?.includes('Apache License')) {
  const response = await fetch('https://www.apache.org/licenses/LICENSE-2.0.txt', { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error('Could not retrieve the MediaPipe runtime license')
  const text = await response.text()
  if (!text.includes('Apache License') || !text.includes('Version 2.0')) throw new Error('Unexpected runtime license response')
  await writeFile(path.join(root, 'public/call-effects/LICENSE.txt'), text)
}
const sources = {
  'hand_landmarker.task': { url: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', sha256: 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1' },
  'selfie_segmenter.tflite': { url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite', sha256: '191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b' },
}
for (const [file, { url, sha256 }] of Object.entries(sources)) {
  const destination = path.join(models, file)
  let cached
  try { cached = await readFile(destination) } catch {}
  if (cached && createHash('sha256').update(cached).digest('hex') === sha256) continue
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`Could not download ${file}: ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (createHash('sha256').update(buffer).digest('hex') !== sha256) throw new Error(`Model checksum mismatch: ${file}`)
  await writeFile(destination, buffer)
}
const manifest = { runtimeVersion: version, runtimeSource: `https://www.npmjs.com/package/@mediapipe/tasks-vision/v/${version}`, models: [] }
for (const [file, { url: source }] of Object.entries(sources)) {
  const buffer = await readFile(path.join(models, file))
  manifest.models.push({ file, source, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') })
}
await writeFile(path.join(root, 'public/call-effects/assets.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`Local call-effects assets ready (MediaPipe ${version}). Frames never need to leave the browser for detection.`)
