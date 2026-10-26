import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Google's published test fixtures. Kept in ignored test output, never user media.
const fixtures = [
  ['portrait.jpg', '1782185108020964', 'a6f11efaa834706db23f275b6115058fa87fc7f14362681e6abe14e82749de3e'],
  ['right_hands.jpg', '1782185275057115', '4b5134daa4cb60465535239535f9f74c2842aba3aa5fd30bf04ef5678f93d87f'],
]
const destination = new URL('../test-results/call-effects/fixtures/', import.meta.url)
await mkdir(destination, {recursive: true})
for (const [file, generation, hash] of fixtures) {
  const response = await fetch(`https://storage.googleapis.com/mediapipe-assets/tasks/testdata/vision/${file}?generation=${generation}`, {signal: AbortSignal.timeout(30000)})
  if (!response.ok) throw new Error(`Fixture ${file} failed: ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (createHash('sha256').update(buffer).digest('hex') !== hash) throw new Error(`Fixture checksum changed: ${file}`)
  await writeFile(fileURLToPath(new URL(file, destination)), buffer)
}
console.log('Official model test fixtures downloaded and checksums verified.')
