import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const livekitUrl = required('NEXT_PUBLIC_LIVEKIT_URL')
const apiKey = required('LIVEKIT_API_KEY')
const apiSecret = required('LIVEKIT_API_SECRET')
const apiUrl = livekitUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
const e2eeMasterKey = (process.env.CALL_E2EE_MASTER_KEY || apiSecret).trim()
assert.ok(e2eeMasterKey.length >= 32, 'CALL_E2EE_MASTER_KEY (or LIVEKIT_API_SECRET) must be at least 32 characters')

const roomName = `peerspark_verify_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret)
const clientBundle = path.resolve('node_modules/livekit-client/dist/livekit-client.umd.js')
const e2eeWorker = path.resolve('node_modules/livekit-client/dist/livekit-client.e2ee.worker.js')

assert.ok(fs.existsSync(clientBundle), `LiveKit browser bundle was not found at ${clientBundle}`)
assert.ok(fs.existsSync(e2eeWorker), `LiveKit E2EE worker was not found at ${e2eeWorker}`)

const createToken = async (identity) => {
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: identity,
    ttl: '5m',
  })
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })
  return token.toJwt()
}

const e2eeKey = crypto
  .createHmac('sha256', e2eeMasterKey)
  .update(`student-social:call:e2ee:v1:${roomName}`)
  .digest('base64url')

let browser
let localServer
let roomCreated = false

try {
  await roomService.listRooms()
  await roomService.createRoom({ name: roomName, emptyTimeout: 60, maxParticipants: 2 })
  roomCreated = true

  const rooms = await roomService.listRooms([roomName])
  assert.equal(rooms.length, 1, 'Temporary LiveKit room was not visible after creation')

  localServer = http.createServer((request, response) => {
    if (request.url === '/livekit.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
      fs.createReadStream(clientBundle).pipe(response)
      return
    }
    if (request.url === '/e2ee-worker.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
      fs.createReadStream(e2eeWorker).pipe(response)
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<!doctype html><html><body><script src="/livekit.js"></script></body></html>')
  })

  await new Promise((resolve, reject) => {
    localServer.once('error', reject)
    localServer.listen(0, '127.0.0.1', resolve)
  })

  const address = localServer.address()
  assert.ok(address && typeof address === 'object', 'Local browser test server failed to start')
  const origin = `http://127.0.0.1:${address.port}`

  browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  })
  const context = await browser.newContext({ permissions: ['camera', 'microphone'] })
  const alice = await context.newPage()
  const bob = await context.newPage()
  await Promise.all([alice.goto(origin), bob.goto(origin)])

  const connectParticipant = async (page, identity, token) => {
    return page.evaluate(async ({ identity: participantIdentity, token: participantToken, url, key }) => {
      const livekit = globalThis.LivekitClient
      if (!livekit) throw new Error('LiveKit browser client did not load')
      if (!livekit.isE2EESupported()) throw new Error('Browser does not support LiveKit E2EE')

      const state = { remoteTrackKinds: [], messages: [], encryptionErrors: [] }
      const keyProvider = new livekit.ExternalE2EEKeyProvider()
      await keyProvider.setKey(key)
      const worker = new Worker('/e2ee-worker.js')
      const room = new livekit.Room({
        adaptiveStream: false,
        dynacast: true,
        e2ee: { keyProvider, worker },
      })

      globalThis.__livekitVerification = { room, state, worker }
      room.on(livekit.RoomEvent.TrackSubscribed, (track) => {
        state.remoteTrackKinds.push(track.kind)
      })
      room.on(livekit.RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
        state.messages.push({
          from: participant?.identity || 'unknown',
          topic: topic || '',
          body: new TextDecoder().decode(payload),
        })
      })
      room.on(livekit.RoomEvent.EncryptionError, (error) => {
        state.encryptionErrors.push(error?.message || String(error))
      })

      await room.connect(url, participantToken)
      // LiveKit's React integration performs this after connecting; mirror that
      // lifecycle here because the low-level Room API does not enable it solely
      // from constructor options.
      await room.setE2EEEnabled(true)
      await room.localParticipant.setMicrophoneEnabled(true)
      await room.localParticipant.setCameraEnabled(true)

      return {
        identity: participantIdentity,
        connected: room.state === livekit.ConnectionState.Connected,
        e2eeEnabled: room.isE2EEEnabled,
        localPublications: room.localParticipant.trackPublications.size,
      }
    }, { identity, token, url: livekitUrl, key: e2eeKey })
  }

  const aliceToken = await createToken('verify-alice')
  const bobToken = await createToken('verify-bob')
  const aliceResult = await connectParticipant(alice, 'verify-alice', aliceToken)
  const bobResult = await connectParticipant(bob, 'verify-bob', bobToken)

  assert.equal(aliceResult.connected, true, 'Alice did not connect')
  assert.equal(bobResult.connected, true, 'Bob did not connect')
  assert.equal(aliceResult.e2eeEnabled, true, 'Alice E2EE was not enabled')
  assert.equal(bobResult.e2eeEnabled, true, 'Bob E2EE was not enabled')
  assert.ok(aliceResult.localPublications >= 2, 'Alice did not publish camera and microphone')
  assert.ok(bobResult.localPublications >= 2, 'Bob did not publish camera and microphone')

  const hasEncryptedAudioAndVideo = () => {
    const verification = globalThis.__livekitVerification
    const participants = Array.from(verification.room.remoteParticipants.values())
    const publications = participants.flatMap((participant) => Array.from(participant.trackPublications.values()))
    const subscribedKinds = new Set(
      publications.filter((publication) => publication.isSubscribed && publication.isEncrypted).map((publication) => publication.kind),
    )
    return subscribedKinds.has('audio') && subscribedKinds.has('video') && verification.state.encryptionErrors.length === 0
  }

  await Promise.all([
    alice.waitForFunction(hasEncryptedAudioAndVideo, undefined, { timeout: 30_000 }),
    bob.waitForFunction(hasEncryptedAudioAndVideo, undefined, { timeout: 30_000 }),
  ])

  await alice.evaluate(async () => {
    const { room } = globalThis.__livekitVerification
    await room.localParticipant.publishData(new TextEncoder().encode('livekit-realtime-ok'), {
      reliable: true,
      topic: 'verification',
    })
  })

  await bob.waitForFunction(() => {
    const messages = globalThis.__livekitVerification?.state.messages || []
    return messages.some((message) => message.topic === 'verification' && message.body === 'livekit-realtime-ok')
  }, undefined, { timeout: 15_000 })

  const browserResult = await Promise.all([alice, bob].map((page) => page.evaluate(() => {
    const { room, state } = globalThis.__livekitVerification
    return {
      connected: room.state === globalThis.LivekitClient.ConnectionState.Connected,
      e2eeEnabled: room.isE2EEEnabled,
      remoteParticipants: room.remoteParticipants.size,
      encryptedRemotePublications: Array.from(room.remoteParticipants.values())
        .flatMap((participant) => Array.from(participant.trackPublications.values()))
        .filter((publication) => publication.isEncrypted && publication.isSubscribed).length,
      messagesReceived: state.messages.length,
      encryptionErrors: state.encryptionErrors.length,
    }
  })))

  assert.ok(browserResult.every((result) => result.connected), 'A browser participant disconnected unexpectedly')
  assert.ok(browserResult.every((result) => result.e2eeEnabled), 'E2EE was not active for every browser participant')
  assert.ok(browserResult.every((result) => result.remoteParticipants === 1), 'Participants did not discover each other')
  assert.ok(browserResult.every((result) => result.encryptedRemotePublications >= 2), 'Encrypted remote audio/video was not subscribed')
  assert.ok(browserResult.every((result) => result.encryptionErrors === 0), 'LiveKit reported an E2EE error')

  console.log(JSON.stringify({
    connected: true,
    projectHost: new URL(apiUrl).host,
    roomLifecycle: 'created-and-cleaned',
    participants: 2,
    encryptedAudio: true,
    encryptedVideo: true,
    realtimeData: true,
  }))
} finally {
  if (browser) await browser.close().catch(() => {})
  if (localServer) await new Promise((resolve) => localServer.close(resolve))
  if (roomCreated) await roomService.deleteRoom(roomName).catch(() => {})
}
