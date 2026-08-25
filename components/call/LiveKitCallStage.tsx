'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ConnectionState,
  ConnectionStateToast,
  LiveKitRoom,
  MediaDeviceSelect,
  RoomAudioRenderer,
  StartAudio,
  VideoConference,
} from '@livekit/components-react'
import { ExternalE2EEKeyProvider, isE2EESupported, type E2EEOptions } from 'livekit-client'
import {
  Camera,
  CameraOff,
  Check,
  ChevronLeft,
  Copy,
  LoaderCircle,
  LockKeyhole,
  Mic,
  MicOff,
  PhoneOff,
  Settings2,
  ShieldCheck,
  Users,
  Video,
  X,
} from 'lucide-react'

interface LiveKitCallStageProps {
  sessionId: string
  roomTitle?: string
  mediaType?: 'voice' | 'video'
  onClose: () => void
}

interface TokenPayload {
  token: string
  url: string
  identity: string
  roomName: string
  canEndForEveryone?: boolean
  encryption: {
    algorithm: 'livekit-e2ee-v1'
    key: string
    keyVersion: number
  }
  session?: {
    $id?: string
    roomId?: string
    mediaType?: 'voice' | 'video'
    state?: string
  }
}

const CALL_FEATURES = [
  'End-to-end encrypted media',
  'Screen sharing and in-call chat',
  'Adaptive quality on weaker networks',
]

function CallIdentity({ title, size = 'large' }: { title: string; size?: 'small' | 'large' }) {
  const initial = title.trim().charAt(0).toUpperCase() || 'P'
  const dimension = size === 'large' ? 'h-28 w-28 text-4xl md:h-36 md:w-36 md:text-5xl' : 'h-10 w-10 text-sm'

  return (
    <div className={`relative flex ${dimension} shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(145deg,#4c7772,#293d3a)] font-semibold text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)]`}>
      <span>{initial}</span>
      {size === 'large' ? <span className="absolute inset-[-10px] -z-10 rounded-full border border-[#8fbdb7]/20" /> : null}
    </div>
  )
}

function LobbyControl({
  active,
  icon,
  inactiveIcon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  inactiveIcon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group flex min-w-20 flex-col items-center gap-2 rounded-2xl px-2 py-1 text-xs font-medium text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fbdb7]"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-full border transition md:h-14 md:w-14 ${active ? 'border-white/12 bg-white/10 text-white group-hover:bg-white/15' : 'border-white/8 bg-white text-[#10211b]'}`}>
        {active ? icon : inactiveIcon}
      </span>
      {label}
    </button>
  )
}

export function LiveKitCallStage({
  sessionId,
  roomTitle = 'Student.social call',
  mediaType = 'video',
  onClose,
}: LiveKitCallStageProps) {
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(mediaType === 'video')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [e2eeOptions, setE2eeOptions] = useState<E2EEOptions | undefined>()
  const callShellRef = useRef<HTMLDivElement | null>(null)
  const e2eeWorkerRef = useRef<Worker | null>(null)

  const effectiveMediaType = tokenPayload?.session?.mediaType || mediaType
  const isVideoCall = effectiveMediaType === 'video'
  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    url.searchParams.set('call', sessionId)
    return url.toString()
  }, [sessionId])

  useEffect(() => {
    setTokenPayload(null)
    setIsJoined(false)
    setError(null)
    setCameraEnabled(mediaType === 'video')
    setMicEnabled(true)
    setSettingsOpen(false)
    setE2eeOptions(undefined)
    e2eeWorkerRef.current?.terminate()
    e2eeWorkerRef.current = null
  }, [sessionId, mediaType])

  useEffect(() => () => {
    e2eeWorkerRef.current?.terminate()
    e2eeWorkerRef.current = null
  }, [])

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  useEffect(() => {
    if (!isJoined || !callShellRef.current) return
    const root = callShellRef.current
    const labelControls = () => {
      const labelToggle = (selector: string, activeLabel: string, inactiveLabel: string) => {
        root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
          button.setAttribute('aria-label', button.getAttribute('aria-pressed') === 'true' ? activeLabel : inactiveLabel)
        })
      }
      labelToggle('[data-lk-source="microphone"]', 'Mute microphone', 'Turn on microphone')
      labelToggle('[data-lk-source="camera"]', 'Turn off camera', 'Turn on camera')
      labelToggle('[data-lk-source="screen_share"]', 'Stop sharing screen', 'Share screen')
      labelToggle('.lk-chat-toggle', 'Close in-call chat', 'Open in-call chat')
      root.querySelectorAll<HTMLButtonElement>('.lk-disconnect-button').forEach((button) => button.setAttribute('aria-label', 'Leave call'))
    }
    labelControls()
    const observer = new MutationObserver(labelControls)
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] })
    return () => observer.disconnect()
  }, [isJoined])

  const markSession = useCallback(async (action: 'join' | 'leave' | 'end') => {
    await fetch(`/api/calls/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    }).catch(() => undefined)
  }, [sessionId])

  const joinCall = async () => {
    setIsJoining(true)
    setError(null)
    try {
      const response = await fetch(`/api/calls/sessions/${encodeURIComponent(sessionId)}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Unable to prepare the call')
      if (!payload?.encryption?.key) throw new Error('The encrypted call key was not provided')
      if (!isE2EESupported()) throw new Error('This browser cannot provide encrypted calls. Use a current browser release.')

      const keyProvider = new ExternalE2EEKeyProvider()
      await keyProvider.setKey(payload.encryption.key)
      const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url))
      e2eeWorkerRef.current?.terminate()
      e2eeWorkerRef.current = worker
      setE2eeOptions({ keyProvider, worker })
      setTokenPayload(payload)
      setIsJoined(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to join the call')
    } finally {
      setIsJoining(false)
    }
  }

  const leaveCall = useCallback(async (endForEveryone = false) => {
    await markSession(endForEveryone ? 'end' : 'leave')
    setIsJoined(false)
    setTokenPayload(null)
    setE2eeOptions(undefined)
    e2eeWorkerRef.current?.terminate()
    e2eeWorkerRef.current = null
    onClose()
  }, [markSession, onClose])

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      ref={callShellRef}
      className="peer-call-shell fixed inset-0 z-[80] overflow-hidden bg-[#242724] text-white"
      style={{ height: '100dvh', maxHeight: 'none', overflow: 'hidden' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${roomTitle} call`}
    >
      <div className="peer-call-ambient" aria-hidden="true" />

      {!isJoined || !tokenPayload ? (
        <div className="relative flex h-full flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between px-4 md:h-20 md:px-8">
            <button type="button" onClick={() => void leaveCall(false)} className="peer-call-icon-button" aria-label="Leave call lobby">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold text-white md:text-base">{roomTitle}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-white/45">
                <LockKeyhole className="h-3 w-3 text-[#8fbdb7]" /> Private call
              </p>
            </div>
            <button type="button" onClick={copyInvite} className="peer-call-icon-button" aria-label="Copy call invite">
              {copied ? <Check className="h-5 w-5 text-[#8fbdb7]" /> : <Copy className="h-5 w-5" />}
            </button>
          </header>

          <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1">
            <section className="relative flex min-h-0 items-center justify-center overflow-hidden px-5 pb-4 pt-2 md:px-10 lg:pb-10">
              <div className="peer-call-preview relative flex h-full max-h-[720px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#30342f] md:rounded-[36px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(143,189,183,0.18),transparent_34%),radial-gradient(circle_at_8%_92%,rgba(118,85,109,0.14),transparent_30%),linear-gradient(180deg,transparent_60%,rgba(0,0,0,0.28))]" />
                <div className="relative flex flex-col items-center px-5 text-center">
                  <CallIdentity title={roomTitle} />
                  <h1 className="mt-7 max-w-xl text-balance text-2xl font-semibold tracking-[-0.025em] md:text-4xl">{roomTitle}</h1>
                  <p className="mt-2 text-sm text-white/50 md:text-base">
                    {isVideoCall ? (cameraEnabled ? 'Your camera will turn on when you join' : 'You will join with your camera off') : 'A quiet voice room for learning together'}
                  </p>
                </div>
                <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-1.5 text-xs text-white/55 backdrop-blur-xl">
                  <Users className="h-3.5 w-3.5" /> Waiting room
                </div>
              </div>
            </section>

            <aside className="peer-call-lobby-panel flex shrink-0 flex-col justify-between border-t border-white/[0.07] bg-[#292c28]/96 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] backdrop-blur-2xl md:p-7 lg:border-l lg:border-t-0 lg:pb-7">
              <div className="hidden lg:block">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#8fbdb7]/20 bg-[#8fbdb7]/10 px-3 py-1.5 text-xs font-medium text-[#b9d8d4]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ready to join
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">Set up your space</h2>
                <p className="mt-2 text-sm leading-6 text-white/45">Choose how you enter. You can change devices, share your screen, or use chat once connected.</p>
                <div className="mt-7 space-y-3">
                  {CALL_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[#8fbdb7]"><Check className="h-3.5 w-3.5" /></span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-center justify-center gap-2 lg:justify-start">
                  <LobbyControl
                    active={micEnabled}
                    icon={<Mic className="h-5 w-5" />}
                    inactiveIcon={<MicOff className="h-5 w-5" />}
                    label={micEnabled ? 'Mic on' : 'Muted'}
                    onClick={() => setMicEnabled((enabled) => !enabled)}
                  />
                  {isVideoCall ? (
                    <LobbyControl
                      active={cameraEnabled}
                      icon={<Camera className="h-5 w-5" />}
                      inactiveIcon={<CameraOff className="h-5 w-5" />}
                      label={cameraEnabled ? 'Camera on' : 'Camera off'}
                      onClick={() => setCameraEnabled((enabled) => !enabled)}
                    />
                  ) : null}
                  <LobbyControl
                    active={settingsOpen}
                    icon={<Settings2 className="h-5 w-5" />}
                    inactiveIcon={<Settings2 className="h-5 w-5" />}
                    label="Devices"
                    onClick={() => setSettingsOpen((open) => !open)}
                  />
                </div>

                {settingsOpen ? (
                  <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white/55">
                    Device selection becomes available immediately after you join. Your browser will remember the choice for this session.
                  </div>
                ) : null}

                {error ? <p className="mb-4 rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}

                <button
                  type="button"
                  onClick={joinCall}
                  disabled={isJoining}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#8fbdb7] px-6 text-sm font-semibold text-[#182826] shadow-[0_12px_36px_rgba(63,111,107,0.25)] transition hover:bg-[#a2cac5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9d8d4] disabled:cursor-wait disabled:opacity-60"
                >
                  {isJoining ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isVideoCall ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isJoining ? 'Joining securely…' : `Join ${isVideoCall ? 'video' : 'voice'} call`}
                </button>
                <button type="button" onClick={() => void leaveCall(false)} className="mt-2 h-11 w-full rounded-full text-sm font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white">
                  Not now
                </button>
              </div>
            </aside>
          </main>
        </div>
      ) : (
        <LiveKitRoom
          token={tokenPayload.token}
          serverUrl={tokenPayload.url}
          connect
          audio={micEnabled}
          video={isVideoCall && cameraEnabled}
          options={{ adaptiveStream: true, dynacast: true, e2ee: e2eeOptions }}
          connectOptions={{ autoSubscribe: true, maxRetries: 8 }}
          onConnected={() => void markSession('join')}
          onDisconnected={() => void leaveCall(false)}
          onEncryptionError={(encryptionError) => setError(`Call encryption failed: ${encryptionError.message}`)}
          onMediaDeviceFailure={(_, kind) => setError(`Unable to use the selected ${kind || 'media'} device. Check browser permissions.`)}
          className="peer-call-room relative flex h-full min-h-0 flex-col"
          data-lk-theme="default"
        >
          <ConnectionStateToast />
          <StartAudio label="Tap to enable call audio" className="peer-start-audio" />

          <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-4 md:px-7 md:pt-6">
            <div className="pointer-events-auto flex min-w-0 items-center gap-3">
              <CallIdentity title={roomTitle} size="small" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold md:text-base">{roomTitle}</h1>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8fbdb7]" />
                  <ConnectionState />
                  <span aria-hidden>·</span>
                  <LockKeyhole className="h-3 w-3" />
                  Encrypted
                </div>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <button type="button" onClick={copyInvite} className="peer-call-icon-button" aria-label="Copy call invite">
                {copied ? <Check className="h-5 w-5 text-[#8fbdb7]" /> : <Copy className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="peer-call-icon-button" aria-label="Open call settings" aria-expanded={settingsOpen}>
                <Settings2 className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1">
            <VideoConference className="peer-call-conference" />
          </main>

          {settingsOpen ? (
            <>
              <button type="button" className="absolute inset-0 z-30 bg-black/35 backdrop-blur-[2px]" onClick={() => setSettingsOpen(false)} aria-label="Close call settings" />
              <aside className="peer-call-settings absolute bottom-0 right-0 top-0 z-40 w-full max-w-sm overflow-y-auto border-l border-white/[0.08] bg-[#292c28]/98 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Call settings</h2>
                    <p className="mt-1 text-xs text-white/45">Devices and room controls</p>
                  </div>
                  <button type="button" onClick={() => setSettingsOpen(false)} className="peer-call-icon-button" aria-label="Close call settings"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-5 text-sm">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-white/35">Microphone</p>
                    <MediaDeviceSelect kind="audioinput" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-white/35">Speaker</p>
                    <MediaDeviceSelect kind="audiooutput" />
                  </div>
                  {isVideoCall ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-white/35">Camera</p>
                      <MediaDeviceSelect kind="videoinput" />
                    </div>
                  ) : null}
                  <div className="border-t border-white/[0.08] pt-5">
                    <button type="button" onClick={() => void leaveCall(false)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] font-medium transition hover:bg-white/[0.1]">
                      <PhoneOff className="h-4 w-4" /> Leave call
                    </button>
                    {tokenPayload.canEndForEveryone ? (
                      <button type="button" onClick={() => void leaveCall(true)} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ea4335] font-semibold transition hover:bg-[#f04f41]">
                        <PhoneOff className="h-4 w-4" /> End for everyone
                      </button>
                    ) : null}
                  </div>
                </div>
              </aside>
            </>
          ) : null}

          {error ? <div className="absolute left-1/2 top-24 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-red-300/15 bg-red-500/90 px-4 py-3 text-center text-sm shadow-2xl" role="alert">{error}</div> : null}
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}

      {copied ? <div className="pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#18241f]/95 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl">Invite link copied</div> : null}
    </div>
  )
}
