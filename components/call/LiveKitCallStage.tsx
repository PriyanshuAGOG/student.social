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
  Check,
  ChevronLeft,
  Copy,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  PhoneOff,
  Search,
  Settings2,
  UserPlus,
  X,
} from 'lucide-react'
import { callService } from '@/lib/appwrite/calls'

interface LiveKitCallStageProps {
  sessionId: string
  roomTitle?: string
  mediaType?: 'voice' | 'video'
  callState?: 'outgoing_ringing' | 'incoming_ringing' | 'connecting' | 'active' | 'reconnecting' | 'ended' | 'idle'
  direction?: 'incoming' | 'outgoing'
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

interface InviteCandidate {
  userId: string
  name: string
  username?: string
  avatar?: string | null
  invited?: boolean
}

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

export function LiveKitCallStage({
  sessionId,
  roomTitle = 'Student.social call',
  mediaType = 'video',
  callState = 'connecting',
  direction,
  onClose,
}: LiveKitCallStageProps) {
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(mediaType === 'video')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteQuery, setInviteQuery] = useState('')
  const [inviteCandidates, setInviteCandidates] = useState<InviteCandidate[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(false)
  const [invitingUserId, setInvitingUserId] = useState('')
  const [supportsAudioOutputSelection, setSupportsAudioOutputSelection] = useState(false)
  const [videoFit, setVideoFit] = useState<'fit' | 'fill'>('fit')
  const [copied, setCopied] = useState(false)
  const [e2eeOptions, setE2eeOptions] = useState<E2EEOptions | undefined>()
  const callShellRef = useRef<HTMLDivElement | null>(null)
  const e2eeWorkerRef = useRef<Worker | null>(null)
  const leaveInFlightRef = useRef(false)
  const reportedDiagnosticsRef = useRef(new Set<string>())
  const autoJoinAttemptedRef = useRef(false)

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
    setInviteOpen(false)
    setInviteQuery('')
    setInviteCandidates([])
    setVideoFit('fit')
    setE2eeOptions(undefined)
    e2eeWorkerRef.current?.terminate()
    e2eeWorkerRef.current = null
    leaveInFlightRef.current = false
    reportedDiagnosticsRef.current.clear()
    autoJoinAttemptedRef.current = false
  }, [sessionId, mediaType])

  useEffect(() => {
    setSupportsAudioOutputSelection(typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype)
  }, [])

  useEffect(() => {
    if (!inviteOpen || !isJoined) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoadingInvites(true)
      void callService.getInviteCandidates(sessionId, inviteQuery).then((payload: any) => {
        if (!cancelled) setInviteCandidates(Array.isArray(payload?.candidates) ? payload.candidates : [])
      }).catch((cause: any) => {
        if (!cancelled) setError(cause?.message || 'Unable to load people for this call')
      }).finally(() => {
        if (!cancelled) setIsLoadingInvites(false)
      })
    }, inviteQuery ? 250 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [inviteOpen, inviteQuery, isJoined, sessionId])

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

  useEffect(() => {
    if (!isJoined || !callShellRef.current) return
    const root = callShellRef.current
    const configuredVideos = new Map<HTMLVideoElement, () => void>()

    const syncVideoFrame = (video: HTMLVideoElement) => {
      const source = video.dataset.source
      const fit = source === 'screen_share' ? 'contain' : videoFit === 'fill' ? 'cover' : 'contain'
      video.style.setProperty('position', 'absolute', 'important')
      video.style.setProperty('inset', '0', 'important')
      video.style.setProperty('width', '100%', 'important')
      video.style.setProperty('height', '100%', 'important')
      video.style.setProperty('max-width', '100%', 'important')
      video.style.setProperty('max-height', '100%', 'important')
      video.style.setProperty('object-fit', fit, 'important')
      video.style.setProperty('object-position', '50% 50%', 'important')
      if (video.videoWidth && video.videoHeight) {
        video.dataset.peerFrame = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape'
      }
    }

    const configureVideos = () => {
      root.querySelectorAll<HTMLVideoElement>('video.lk-participant-media-video').forEach((video) => {
        syncVideoFrame(video)
        if (configuredVideos.has(video)) return
        const handleGeometryChange = () => syncVideoFrame(video)
        configuredVideos.set(video, handleGeometryChange)
        video.addEventListener('loadedmetadata', handleGeometryChange)
        video.addEventListener('resize', handleGeometryChange)
      })
    }

    configureVideos()
    const observer = new MutationObserver(configureVideos)
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      configuredVideos.forEach((handler, video) => {
        video.removeEventListener('loadedmetadata', handler)
        video.removeEventListener('resize', handler)
      })
    }
  }, [isJoined, videoFit])

  const markSession = useCallback(async (action: 'join' | 'leave' | 'end') => {
    await fetch(`/api/calls/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    }).catch(() => undefined)
  }, [sessionId])

  const reportCallIssue = useCallback((kind: string, message: string) => {
    const roomId = tokenPayload?.session?.roomId
    const key = `${kind}:${message}`
    if (!roomId || reportedDiagnosticsRef.current.has(key)) return
    reportedDiagnosticsRef.current.add(key)
    void fetch('/api/calls/diagnostics', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSessionId: sessionId,
        roomId,
        metrics: {
          kind,
          mediaType: effectiveMediaType,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          orientation: window.screen.orientation?.type || 'unknown',
          online: navigator.onLine,
        },
        logs: [{ level: 'error', message: message.slice(0, 500), timestamp: new Date().toISOString() }],
      }),
    }).catch(() => undefined)
  }, [effectiveMediaType, sessionId, tokenPayload?.session?.roomId])

  const joinCall = useCallback(async () => {
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
  }, [sessionId])

  useEffect(() => {
    if (autoJoinAttemptedRef.current || isJoined || isJoining) return
    autoJoinAttemptedRef.current = true
    void joinCall()
  }, [isJoined, isJoining, joinCall])

  const leaveCall = useCallback(async (endForEveryone = false) => {
    if (leaveInFlightRef.current) return
    leaveInFlightRef.current = true
    const shouldEndForEveryone = endForEveryone || (direction === 'outgoing' && callState === 'outgoing_ringing')
    await markSession(shouldEndForEveryone ? 'end' : 'leave')
    setIsJoined(false)
    setTokenPayload(null)
    setE2eeOptions(undefined)
    e2eeWorkerRef.current?.terminate()
    e2eeWorkerRef.current = null
    onClose()
  }, [callState, direction, markSession, onClose])

  const handleDisconnected = useCallback(() => {
    if (leaveInFlightRef.current) return
    void leaveCall(false)
  }, [leaveCall])

  const inviteParticipant = async (candidate: InviteCandidate) => {
    setInvitingUserId(candidate.userId)
    setError(null)
    try {
      await callService.inviteParticipant(sessionId, candidate.userId)
      setInviteCandidates((current) => current.map((entry) => entry.userId === candidate.userId ? { ...entry, invited: true } : entry))
    } catch (cause: any) {
      setError(cause?.message || 'Unable to invite this person')
    } finally {
      setInvitingUserId('')
    }
  }

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const retryJoin = () => {
    autoJoinAttemptedRef.current = true
    setError(null)
    void joinCall()
  }

  const waitingForAnswer = direction === 'outgoing' && callState === 'outgoing_ringing'

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
        <div className="relative flex h-full flex-col items-center justify-between px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex w-full items-center justify-between">
            <button type="button" onClick={() => void leaveCall(false)} className="peer-call-icon-button" aria-label="Cancel call">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/45"><LockKeyhole className="h-3 w-3" /> Private call</span>
            <span className="size-11" aria-hidden="true" />
          </div>
          <div className="relative flex flex-col items-center text-center">
            <CallIdentity title={roomTitle} />
            <h1 className="mt-7 max-w-[min(90vw,34rem)] truncate text-2xl font-semibold tracking-[-0.03em] md:text-4xl">{roomTitle}</h1>
            <p className="mt-2 text-sm text-white/50">{error ? 'Could not connect' : waitingForAnswer ? 'Calling…' : 'Connecting securely…'}</p>
            {error ? <p className="mt-4 max-w-sm rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : <LoaderCircle className="mt-6 h-5 w-5 animate-spin text-[#8fbdb7]" aria-label="Connecting" />}
          </div>
          <div className="flex min-h-20 items-center justify-center">
            {error ? (
              <button type="button" onClick={retryJoin} className="h-12 rounded-full bg-[#8fbdb7] px-6 text-sm font-semibold text-[#182826]">Try again</button>
            ) : (
              <button type="button" onClick={() => void leaveCall(false)} className="grid size-14 place-items-center rounded-full bg-[#a7595c] text-white shadow-[0_12px_34px_rgba(89,35,42,.34)]" aria-label="End call"><PhoneOff className="h-5 w-5" /></button>
            )}
          </div>
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
          onConnected={() => {
            if (!waitingForAnswer) void markSession('join')
          }}
          onDisconnected={handleDisconnected}
          onEncryptionError={(encryptionError) => {
            const message = `Call encryption failed: ${encryptionError.message}`
            setError(message)
            reportCallIssue('encryption', message)
          }}
          onMediaDeviceFailure={(_, kind) => {
            const message = `Unable to use the selected ${kind || 'media'} device. Check browser permissions.`
            setError(message)
            reportCallIssue('media-device', message)
          }}
          className="peer-call-room relative flex h-full min-h-0 flex-col"
          data-video-fit={videoFit}
          data-lk-theme="default"
        >
          <ConnectionStateToast />
          <StartAudio label="Tap to enable call audio" className="peer-start-audio" />

          <header className="peer-call-live-header pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-[max(.75rem,env(safe-area-inset-top))] md:px-7 md:pb-10 md:pt-6">
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
              {isVideoCall ? (
                <button
                  type="button"
                  onClick={() => setVideoFit((current) => current === 'fit' ? 'fill' : 'fit')}
                  className="peer-call-icon-button"
                  aria-label={videoFit === 'fit' ? 'Fill tiles with video' : 'Show the complete camera frame'}
                  aria-pressed={videoFit === 'fill'}
                  title={videoFit === 'fit' ? 'Fill tiles' : 'Fit full frame'}
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              ) : null}
              <button type="button" onClick={() => { setSettingsOpen(false); setInviteOpen(true) }} className="peer-call-icon-button" aria-label="Add participant">
                <UserPlus className="h-5 w-5" />
              </button>
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

          {waitingForAnswer ? (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-[#242724]/95 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] backdrop-blur-xl">
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <CallIdentity title={roomTitle} />
                <h2 className="mt-7 max-w-[min(90vw,34rem)] truncate text-2xl font-semibold tracking-[-0.03em] md:text-4xl">{roomTitle}</h2>
                <p className="mt-2 text-sm text-white/50">Ringing…</p>
              </div>
              <button type="button" onClick={() => void leaveCall(false)} className="grid size-14 place-items-center rounded-full bg-[#a7595c] text-white shadow-[0_12px_34px_rgba(89,35,42,.34)]" aria-label="End call"><PhoneOff className="h-5 w-5" /></button>
            </div>
          ) : null}

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
                  {supportsAudioOutputSelection ? <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-white/35">Speaker</p>
                    <MediaDeviceSelect kind="audiooutput" />
                  </div> : null}
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

          {inviteOpen ? (
            <>
              <button type="button" className="absolute inset-0 z-30 bg-black/35 backdrop-blur-[2px]" onClick={() => setInviteOpen(false)} aria-label="Close participant invite" />
              <aside className="peer-call-settings absolute bottom-0 right-0 top-0 z-40 w-full max-w-sm overflow-y-auto border-l border-white/[0.08] bg-[#292c28]/98 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Add to call</h2>
                    <p className="mt-1 text-xs text-white/45">Invite another Student.social member</p>
                  </div>
                  <button type="button" onClick={() => setInviteOpen(false)} className="peer-call-icon-button" aria-label="Close participant invite"><X className="h-5 w-5" /></button>
                </div>
                <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 text-white/60 focus-within:border-[#8fbdb7]/40">
                  <Search className="h-4 w-4" />
                  <input value={inviteQuery} onChange={(event) => setInviteQuery(event.target.value)} placeholder="Search name or username" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" aria-label="Search people to invite" />
                </label>
                <div className="mt-4 space-y-2">
                  {isLoadingInvites ? <div className="flex items-center justify-center py-10 text-white/45"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading people</div> : null}
                  {!isLoadingInvites && inviteCandidates.length === 0 ? <p className="py-10 text-center text-sm text-white/40">No people found.</p> : null}
                  {!isLoadingInvites ? inviteCandidates.map((candidate) => (
                    <div key={candidate.userId} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
                      <CallIdentity title={candidate.name} size="small" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{candidate.name}</p>
                        {candidate.username ? <p className="truncate text-xs text-white/40">@{candidate.username}</p> : null}
                      </div>
                      <button type="button" onClick={() => void inviteParticipant(candidate)} disabled={invitingUserId === candidate.userId} className="h-9 rounded-full bg-[#8fbdb7] px-3 text-xs font-semibold text-[#182826] disabled:opacity-55">
                        {invitingUserId === candidate.userId ? 'Inviting…' : candidate.invited ? 'Ring again' : 'Invite'}
                      </button>
                    </div>
                  )) : null}
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
