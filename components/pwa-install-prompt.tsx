'use client'

import { Download, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const INSTALL_DISMISSED_KEY = 'student-social-install-dismissed'
const SW_UPDATE_DISMISSED_KEY = 'student-social-sw-update-dismissed'
const APK_UPDATE_DISMISSED_KEY = 'student-social-apk-update-dismissed'
const ANDROID_WRAPPER_VERSION_KEY = 'student-social-android-version-code'
const SW_UPDATE_READY_EVENT = 'student-social:sw-update-ready'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface AndroidRelease {
  versionCode: number
  versionName: string
  apkUrl: string
  notes?: string[]
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { mobile?: boolean; platform?: string }
  standalone?: boolean
}

type Banner =
  | { kind: 'web-install'; event: BeforeInstallPromptEvent }
  | { kind: 'android-install'; release: AndroidRelease }
  | { kind: 'web-update'; worker: ServiceWorker }
  | { kind: 'apk-update'; release: AndroidRelease }

export function isAndroidMobileDevice(value: NavigatorWithUserAgentData): boolean {
  if (!/android/i.test(value.userAgent || '')) return false
  // Android browsers can expose stale desktop-like Client Hints after UA or
  // desktop-site mode changes, so require the Android UA plus touch capability.
  return value.maxTouchPoints > 0
}

function isStandalone() {
  const value = navigator as NavigatorWithUserAgentData
  return window.matchMedia('(display-mode: standalone)').matches || value.standalone === true
}

function getAndroidWrapperVersion() {
  const params = new URLSearchParams(window.location.search)
  const platform = params.get('platform')
  const versionCode = Number.parseInt(params.get('versionCode') ?? '', 10)

  if (platform === 'android-apk' && Number.isFinite(versionCode)) {
    localStorage.setItem(ANDROID_WRAPPER_VERSION_KEY, String(versionCode))
    return versionCode
  }

  const storedVersion = Number.parseInt(localStorage.getItem(ANDROID_WRAPPER_VERSION_KEY) ?? '', 10)
  return Number.isFinite(storedVersion) ? storedVersion : null
}

async function getAndroidRelease(signal: AbortSignal): Promise<AndroidRelease | null> {
  const response = await fetch('/mobile/app-release.json', { cache: 'no-store', signal })
  if (!response.ok) return null
  const release = await response.json() as AndroidRelease
  if (!Number.isInteger(release.versionCode) || !release.versionName || !release.apkUrl) return null
  const apkUrl = new URL(release.apkUrl, window.location.origin)
  if (apkUrl.protocol !== 'https:' || apkUrl.hostname !== 'studentssocial.vercel.app') return null
  return { ...release, apkUrl: apkUrl.toString() }
}

export default function PWAInstallPrompt() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const deferredWebInstall = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const androidMobile = isAndroidMobileDevice(navigator as NavigatorWithUserAgentData)
    const controller = new AbortController()

    const handleInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      deferredWebInstall.current = installEvent
      if (!androidMobile || isStandalone() || getAndroidWrapperVersion() !== null) return
      if (sessionStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return
      setBanner((current) => current ?? { kind: 'web-install', event: installEvent })
    }

    const handleInstalled = () => setBanner(null)
    const handleWebUpdate = (event: Event) => {
      if (sessionStorage.getItem(SW_UPDATE_DISMISSED_KEY) === 'true') return
      const worker = (event as CustomEvent<{ worker: ServiceWorker }>).detail.worker
      setBanner({ kind: 'web-update', worker })
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener(SW_UPDATE_READY_EVENT, handleWebUpdate)

    if (androidMobile && !isStandalone()) {
      void getAndroidRelease(controller.signal)
        .then((release) => {
          if (!release) return
          const currentVersion = getAndroidWrapperVersion()
          if (currentVersion !== null) {
            if (release.versionCode <= currentVersion) return
            const dismissedVersion = Number.parseInt(sessionStorage.getItem(APK_UPDATE_DISMISSED_KEY) ?? '', 10)
            if (dismissedVersion !== release.versionCode) setBanner({ kind: 'apk-update', release })
            return
          }
          if (sessionStorage.getItem(INSTALL_DISMISSED_KEY) !== 'true') {
            setBanner({ kind: 'android-install', release })
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          const webInstall = deferredWebInstall.current
          if (webInstall && sessionStorage.getItem(INSTALL_DISMISSED_KEY) !== 'true') {
            setBanner({ kind: 'web-install', event: webInstall })
          }
        })
    }

    return () => {
      controller.abort()
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener(SW_UPDATE_READY_EVENT, handleWebUpdate)
    }
  }, [])

  const dismiss = () => {
    if (!banner) return
    if (banner.kind === 'web-install' || banner.kind === 'android-install') {
      sessionStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    }
    if (banner.kind === 'web-update') sessionStorage.setItem(SW_UPDATE_DISMISSED_KEY, 'true')
    if (banner.kind === 'apk-update') sessionStorage.setItem(APK_UPDATE_DISMISSED_KEY, String(banner.release.versionCode))
    setBanner(null)
  }

  const installWebApp = async () => {
    if (banner?.kind !== 'web-install') return
    await banner.event.prompt()
    const choice = await banner.event.userChoice
    if (choice.outcome === 'accepted') setBanner(null)
  }

  const applyWebUpdate = () => {
    if (banner?.kind !== 'web-update') return
    sessionStorage.setItem('student-social-sw-reload', 'true')
    banner.worker.postMessage({ type: 'SKIP_WAITING' })
  }

  if (!banner) return null

  const isUpdate = banner.kind === 'web-update' || banner.kind === 'apk-update'
  const Icon = isUpdate ? RefreshCw : Download
  const title = banner.kind === 'web-install'
    ? 'Install Student.social'
    : banner.kind === 'android-install'
      ? 'Get the Student.social Android app'
      : banner.kind === 'web-update'
        ? 'A fresh version is ready'
        : `Student.social ${banner.release.versionName} is ready`
  const description = banner.kind === 'web-install'
    ? 'Install the focused mobile experience directly from your Android browser.'
    : banner.kind === 'android-install'
      ? 'Download the signed native app built for Android. It is not a browser wrapper.'
      : banner.kind === 'web-update'
        ? 'Update now to get the latest improvements without losing your place.'
        : banner.release.notes?.[0] ?? 'Download the latest signed Android build, then install it over this version.'

  const androidRelease = banner.kind === 'android-install' || banner.kind === 'apk-update' ? banner.release : null

  return (
    <aside aria-live="polite" className="fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-[120] mx-auto max-w-xl overflow-hidden rounded-[1.35rem] border border-[#d8d0c3] bg-[#f7f2e9]/[.98] text-[#25241f] shadow-[0_22px_60px_rgba(25,24,21,.24)] backdrop-blur-xl">
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#34382f] text-[#f7f2e9] shadow-sm"><Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /></div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13px] font-semibold tracking-[-.01em] sm:text-sm">{title}</p>
          <p className="mt-1 max-w-md text-[11px] leading-[1.45] text-[#68645b] sm:text-xs">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {banner.kind === 'web-install' ? <button type="button" onClick={installWebApp} className="min-h-9 rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">Install app</button> : null}
            {banner.kind === 'web-update' ? <button type="button" onClick={applyWebUpdate} className="min-h-9 rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">Update now</button> : null}
            {androidRelease ? <a href={androidRelease.apkUrl} download={`Student-social-${androidRelease.versionName}.apk`} className="inline-flex min-h-9 items-center rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">{banner.kind === 'apk-update' ? 'Download update' : 'Download Android app'}</a> : null}
            <button type="button" onClick={dismiss} className="min-h-9 rounded-full px-3 text-[11px] font-semibold text-[#68645b] transition hover:bg-[#ebe4d9] hover:text-[#25241f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a]">Not now</button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-full text-[#777167] transition hover:bg-[#ebe4d9] hover:text-[#25241f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a]"><X aria-hidden="true" className="size-4" /></button>
      </div>
    </aside>
  )
}
