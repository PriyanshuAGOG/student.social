"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, MessageCircle, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { chatService, notificationService } from "@/lib/appwrite"
import { getActiveChatRoom } from "@/lib/chat-runtime"

type MessageNotice = {
  $id: string
  title: string
  body: string
  category: string
  ctaUrl: string
  actorAvatar?: string
  createdAt: string
}

function normalizeNotice(raw: any): MessageNotice {
  return {
    $id: String(raw?.$id || raw?.id || ''),
    title: String(raw?.actorName || raw?.title || 'New message'),
    body: String(raw?.body || raw?.message || 'Sent you a message'),
    category: String(raw?.category || raw?.type || ''),
    ctaUrl: String(raw?.ctaUrl || raw?.actionUrl || '/app/chat'),
    actorAvatar: raw?.actorAvatar || undefined,
    createdAt: String(raw?.createdAt || raw?.timestamp || raw?.$createdAt || new Date().toISOString()),
  }
}

function messageDestination(notice: MessageNotice): { roomId: string; messageId: string } {
  try {
    const url = new URL(notice.ctaUrl, window.location.origin)
    return {
      roomId: url.searchParams.get('room') || '',
      messageId: url.searchParams.get('message') || '',
    }
  } catch {
    return { roomId: '', messageId: '' }
  }
}

function playMessageTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32)
    gain.connect(context.destination)
    ;[523.25, 659.25].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      oscillator.start(context.currentTime + index * 0.08)
      oscillator.stop(context.currentTime + 0.3)
    })
    window.setTimeout(() => void context.close(), 450)
  } catch {
    // Audio feedback is an enhancement; browsers may block it before interaction.
  }
}

export function MessageNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  const [notices, setNotices] = useState<MessageNotice[]>([])
  const knownIdsRef = useRef(new Set<string>())
  const deliveredIdsRef = useRef(new Set<string>())
  const initializedRef = useRef(false)
  const authorizationRejectedRef = useRef(false)

  const acknowledgeDelivery = useCallback((notice: MessageNotice) => {
    const { roomId, messageId } = messageDestination(notice)
    if (!roomId || !messageId || deliveredIdsRef.current.has(messageId)) return
    deliveredIdsRef.current.add(messageId)
    void chatService.markRoomMessages(roomId, [messageId], 'delivered').catch(() => {
      deliveredIdsRef.current.delete(messageId)
    })
  }, [])

  const acceptNotice = useCallback((raw: any, announce: boolean) => {
    const notice = normalizeNotice(raw)
    if (!notice.$id || notice.category !== 'message') return
    acknowledgeDelivery(notice)
    if (knownIdsRef.current.has(notice.$id)) return
    knownIdsRef.current.add(notice.$id)
    if (!announce) return

    const { roomId } = messageDestination(notice)
    if (roomId && roomId === getActiveChatRoom()) return
    setNotices((current) => [notice, ...current.filter((item) => item.$id !== notice.$id)].slice(0, 3))
    playMessageTone()
    navigator.vibrate?.([55, 35, 85])
    window.dispatchEvent(new CustomEvent('student-social:notifications-changed'))
  }, [acknowledgeDelivery])

  const refreshInbox = useCallback(async (announce: boolean) => {
    if (!user?.$id || authorizationRejectedRef.current) return
    const response = await fetch('/api/notifications/inbox?limit=20&unreadOnly=true', {
      credentials: 'include',
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => null)
    if (response.status === 401) {
      authorizationRejectedRef.current = true
      window.dispatchEvent(new CustomEvent('student-social:session-expired'))
      return
    }
    if (!response.ok || !Array.isArray(payload?.data)) return
    const ordered = [...payload.data].reverse()
    ordered.forEach((notice) => acceptNotice(notice, announce))
  }, [acceptNotice, user?.$id])

  useEffect(() => {
    if (!user?.$id) return
    authorizationRejectedRef.current = false
    let cancelled = false
    let unsubscribe: () => void = () => undefined

    void refreshInbox(false).finally(() => {
      if (cancelled) return
      initializedRef.current = true
      unsubscribe = notificationService.subscribeToNotifications(user.$id, (notice) => {
        acceptNotice(notice, initializedRef.current)
      })
    })

    const interval = window.setInterval(() => void refreshInbox(initializedRef.current), 3000)
    const recover = () => void refreshInbox(initializedRef.current)
    window.addEventListener('focus', recover)
    window.addEventListener('online', recover)
    document.addEventListener('visibilitychange', recover)
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_MESSAGE_PUSH') recover()
    }
    navigator.serviceWorker?.addEventListener('message', onWorkerMessage)

    return () => {
      cancelled = true
      initializedRef.current = false
      unsubscribe()
      window.clearInterval(interval)
      window.removeEventListener('focus', recover)
      window.removeEventListener('online', recover)
      document.removeEventListener('visibilitychange', recover)
      navigator.serviceWorker?.removeEventListener('message', onWorkerMessage)
    }
  }, [acceptNotice, refreshInbox, user?.$id])

  const openNotice = async (notice: MessageNotice) => {
    setNotices((current) => current.filter((item) => item.$id !== notice.$id))
    void fetch(`/api/notifications/${encodeURIComponent(notice.$id)}/read`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => undefined)
    router.push(notice.ctaUrl)
  }

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[85] mx-auto flex w-full max-w-xl flex-col gap-2 px-3" aria-live="polite" aria-atomic="false">
        {notices.map((notice) => (
          <article key={notice.$id} className="pointer-events-auto overflow-hidden rounded-[1.35rem] border border-[#776858]/25 bg-[#f4eee4]/95 p-2.5 text-[#292622] shadow-[0_18px_55px_rgba(19,17,14,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[#282725]/95 dark:text-[#f6f0e6]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[#6f6a4f]/15 text-[#5f5a42] dark:bg-[#b7b08b]/15 dark:text-[#ded6aa]">
                {notice.actorAvatar ? <Image src={notice.actorAvatar} alt="" fill sizes="44px" unoptimized className="object-cover" /> : <MessageCircle className="h-5 w-5" />}
              </div>
              <button type="button" onClick={() => void openNotice(notice)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{notice.title}</span>
                  <span className="rounded-full bg-[#76556d]/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#76556d] dark:text-[#d7b6cd]">Message</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#625d55] dark:text-[#c9c2b7]">{notice.body}</p>
              </button>
              <button type="button" onClick={() => void openNotice(notice)} className="flex h-9 items-center gap-1 rounded-full bg-[#2e2b27] px-3 text-[11px] font-semibold text-[#faf3e8] dark:bg-[#eee5d8] dark:text-[#272521]" aria-label={`Open message from ${notice.title}`}>
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setNotices((current) => current.filter((item) => item.$id !== notice.$id))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6f685e] hover:bg-black/5 dark:text-[#c8c0b5] dark:hover:bg-white/10" aria-label="Dismiss message notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
