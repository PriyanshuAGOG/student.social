'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ConnectionState,
  ConnectionStateToast,
  ControlBar,
  LiveKitRoom,
  MediaDeviceSelect,
  RoomAudioRenderer,
  VideoConference,
} from '@livekit/components-react'
import { Camera, CameraOff, Copy, Maximize2, Mic, MicOff, PhoneOff, Settings, ShieldCheck, Sparkles, Users, X } from 'lucide-react'

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
  session?: {
    $id?: string
    roomId?: string
    mediaType?: 'voice' | 'video'
    state?: string
  }
}

const callTips = [
  'Use headphones for clearer audio and fewer echoes.',
  'Screen share is available from the in-call control bar.',
  'Your mic/camera choices are applied before joining.',
]

export function LiveKitCallStage({ sessionId, roomTitle = 'PeerSpark call', mediaType = 'video', onClose }: LiveKitCallStageProps) {
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(mediaType === 'video')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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
  }, [sessionId, mediaType])

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
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to prepare the call room')
      }
      setTokenPayload(payload)
      setIsJoined(true)
      await markSession('join')
    } catch (err: any) {
      setError(err?.message || 'Unable to join the call')
    } finally {
      setIsJoining(false)
    }
  }

  const leaveCall = useCallback(async (endForEveryone = false) => {
    await markSession(endForEveryone ? 'end' : 'leave')
    setIsJoined(false)
    setTokenPayload(null)
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
    <div className="fixed inset-0 z-[80] overflow-hidden bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label={`${roomTitle} call`}> 
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.24),transparent_32%)]" />
      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles className="h-4 w-4" /> PeerSpark Live
            </div>
            <h2 className="truncate text-lg font-semibold md:text-2xl">{roomTitle}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-white/10 px-2 py-1">{isVideoCall ? 'Video call' : 'Voice call'}</span>
              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-200">{isJoined ? 'Connected room' : 'Lobby'}</span>
              <span className="hidden rounded-full bg-white/10 px-2 py-1 md:inline">Room {sessionId.slice(0, 18)}…</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyInvite} className="rounded-full border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Copy call invite link" title="Copy invite link">
              <Copy className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="rounded-full border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Open call settings" title="Call settings">
              <Settings className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => leaveCall(false)} className="rounded-full border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label="Close call screen" title="Close call">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {copied && (
          <div className="absolute right-4 top-20 z-10 rounded-full border border-emerald-300/30 bg-emerald-400/20 px-4 py-2 text-sm text-emerald-100 shadow-xl backdrop-blur">
            Invite link copied
          </div>
        )}

        {!isJoined || !tokenPayload ? (
          <main className="grid flex-1 place-items-center p-4 md:p-8">
            <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-200">Ready room</p>
                    <h3 className="text-2xl font-semibold md:text-4xl">Join without leaving chat</h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    {isVideoCall ? <Camera className="h-8 w-8 text-cyan-200" /> : <Mic className="h-8 w-8 text-cyan-200" />}
                  </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22),transparent_48%)]" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/10 text-3xl font-semibold shadow-2xl">
                      {isVideoCall && !cameraEnabled ? <CameraOff className="h-10 w-10 text-slate-300" /> : roomTitle.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-medium">{cameraEnabled && isVideoCall ? 'Camera will start on join' : isVideoCall ? 'Camera is off' : 'Voice-only room'}</p>
                      <p className="text-sm text-slate-300">Microphone is {micEnabled ? 'enabled' : 'muted'} before joining.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => setMicEnabled((enabled) => !enabled)} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${micEnabled ? 'border-white/10 bg-white/10 hover:bg-white/20' : 'border-red-300/30 bg-red-500/20 text-red-100'}`} aria-pressed={micEnabled}>
                    {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />} {micEnabled ? 'Mic on' : 'Muted'}
                  </button>
                  {isVideoCall && (
                    <button type="button" onClick={() => setCameraEnabled((enabled) => !enabled)} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${cameraEnabled ? 'border-white/10 bg-white/10 hover:bg-white/20' : 'border-red-300/30 bg-red-500/20 text-red-100'}`} aria-pressed={cameraEnabled}>
                      {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />} {cameraEnabled ? 'Camera on' : 'Camera off'}
                    </button>
                  )}
                  <button type="button" onClick={joinCall} disabled={isJoining} className="ml-auto rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 disabled:opacity-60">
                    {isJoining ? 'Preparing room…' : `Join ${isVideoCall ? 'video' : 'voice'} call`}
                  </button>
                </div>
                {error && <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</p>}
              </section>

              <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200"><ShieldCheck className="h-6 w-6" /></div>
                  <div>
                    <h3 className="text-xl font-semibold">Call checklist</h3>
                    <p className="text-sm text-slate-300">Professional in-page calling with LiveKit media rooms.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {callTips.map((tip) => (
                    <div key={tip} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">{tip}</div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                  <div className="mb-2 flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> Invite peers</div>
                  Share the copied link with room members; they join this same chat page and receive the full call UI.
                </div>
              </aside>
            </div>
          </main>
        ) : (
          <LiveKitRoom
            token={tokenPayload.token}
            serverUrl={tokenPayload.url}
            connect
            audio={micEnabled}
            video={isVideoCall && cameraEnabled}
            onDisconnected={() => void leaveCall(false)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[1fr_320px]">
              <main className="min-h-0 p-3 md:p-5">
                <div className="h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 shadow-2xl">
                  <VideoConference />
                </div>
              </main>
              <aside className={`${settingsOpen ? 'block' : 'hidden lg:block'} border-t border-white/10 bg-white/10 p-4 backdrop-blur-xl lg:border-l lg:border-t-0`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Call settings</h3>
                    <p className="text-xs text-slate-300">Devices, status, and room controls.</p>
                  </div>
                  <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-full p-2 hover:bg-white/10 lg:hidden" aria-label="Close call settings"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Connection</p>
                    <div className="flex items-center gap-2 text-emerald-100"><ConnectionStateToast /><ConnectionState /></div>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Microphone</p>
                    <MediaDeviceSelect kind="audioinput" />
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Speaker</p>
                    <MediaDeviceSelect kind="audiooutput" />
                  </div>
                  {isVideoCall && (
                    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Camera</p>
                      <MediaDeviceSelect kind="videoinput" />
                    </div>
                  )}
                  <ControlBar variation="minimal" controls={{ microphone: true, camera: isVideoCall, screenShare: true, chat: true, leave: false }} />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void leaveCall(false)} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-medium hover:bg-white/20">
                      <Maximize2 className="h-4 w-4" /> Minimize
                    </button>
                    <button type="button" onClick={() => void leaveCall(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-3 py-3 text-sm font-semibold text-white hover:bg-red-400">
                      <PhoneOff className="h-4 w-4" /> End
                    </button>
                  </div>
                </div>
              </aside>
            </div>
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>
    </div>
  )
}
