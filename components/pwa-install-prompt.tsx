'use client'

import { Download, RefreshCw, Share2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const INSTALL_DISMISSED_KEY = 'student-social-install-dismissed'
const IOS_DISMISSED_KEY = 'student-social-ios-install-dismissed'
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

type Banner =
  | { kind: 'install'; event: BeforeInstallPromptEvent }
  | { kind: 'ios' }
  | { kind: 'web-update'; worker: ServiceWorker }
  | { kind: 'apk-update'; release: AndroidRelease }

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
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

export default function PWAInstallPrompt() {
  const [banner, setBanner] = useState<Banner | null>(null)

  const showInstallFallback = useCallback(() => {
    if (isStandalone() || getAndroidWrapperVersion() !== null) return

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIos && sessionStorage.getItem(IOS_DISMISSED_KEY) !== 'true') {
      setBanner({ kind: 'ios' })
    }
  }, [])

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (isStandalone() || getAndroidWrapperVersion() !== null) return
      if (sessionStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return
      setBanner({ kind: 'install', event: event as BeforeInstallPromptEvent })
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
    fallbackTimer = setTimeout(showInstallFallback, 900)

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener(SW_UPDATE_READY_EVENT, handleWebUpdate)
    }
  }, [showInstallFallback])

  useEffect(() => {
    const currentVersion = getAndroidWrapperVersion()
    if (currentVersion === null) return

    const controller = new AbortController()
    fetch('/mobile/app-release.json', { cache: 'no-store', signal: controller.signal })
      .then((response) => (response.ok ? response.json() as Promise<AndroidRelease> : null))
      .then((release) => {
        if (!release || release.versionCode <= currentVersion) return
        const dismissedVersion = Number.parseInt(sessionStorage.getItem(APK_UPDATE_DISMISSED_KEY) ?? '', 10)
        if (dismissedVersion === release.versionCode) return
        setBanner({ kind: 'apk-update', release })
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn('Could not check for an Android app update.', error)
        }
      })

    return () => controller.abort()
  }, [])

  const dismiss = () => {
    if (!banner) return
    if (banner.kind === 'install') sessionStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    if (banner.kind === 'ios') sessionStorage.setItem(IOS_DISMISSED_KEY, 'true')
    if (banner.kind === 'web-update') sessionStorage.setItem(SW_UPDATE_DISMISSED_KEY, 'true')
    if (banner.kind === 'apk-update') {
      sessionStorage.setItem(APK_UPDATE_DISMISSED_KEY, String(banner.release.versionCode))
    }
    setBanner(null)
  }

  const install = async () => {
    if (banner?.kind !== 'install') return
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
  const Icon = isUpdate ? RefreshCw : banner.kind === 'ios' ? Share2 : Download
  const title = banner.kind === 'install'
    ? 'Take Student.social with you'
    : banner.kind === 'ios'
      ? 'Add Student.social to your Home Screen'
      : banner.kind === 'web-update'
        ? 'A fresh version is ready'
        : `Student.social ${banner.release.versionName} is ready`
  const description = banner.kind === 'install'
    ? 'Install the app for a focused, full-screen experience and faster return to your learning.'
    : banner.kind === 'ios'
      ? 'Tap Share, then choose “Add to Home Screen”. It opens and feels like a native app.'
      : banner.kind === 'web-update'
        ? 'Update now to get the latest improvements without losing your place.'
        : banner.release.notes?.[0] ?? 'Download the latest signed Android build, then install it over this version.'

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-[120] mx-auto max-w-xl overflow-hidden rounded-[1.35rem] border border-[#d8d0c3] bg-[#f7f2e9]/[.98] text-[#25241f] shadow-[0_22px_60px_rgba(25,24,21,.24)] backdrop-blur-xl"
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#34382f] text-[#f7f2e9] shadow-sm">
          <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13px] font-semibold tracking-[-.01em] sm:text-sm">{title}</p>
          <p className="mt-1 max-w-md text-[11px] leading-[1.45] text-[#68645b] sm:text-xs">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {banner.kind === 'install' ? (
              <button type="button" onClick={install} className="min-h-9 rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">
                Install app
              </button>
            ) : null}
            {banner.kind === 'web-update' ? (
              <button type="button" onClick={applyWebUpdate} className="min-h-9 rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">
                Update now
              </button>
            ) : null}
            {banner.kind === 'apk-update' ? (
              <a href={banner.release.apkUrl} className="inline-flex min-h-9 items-center rounded-full bg-[#34382f] px-4 text-[11px] font-semibold text-[#f7f2e9] transition hover:bg-[#272a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a] focus-visible:ring-offset-2">
                Download update
              </a>
            ) : null}
            <button type="button" onClick={dismiss} className="min-h-9 rounded-full px-3 text-[11px] font-semibold text-[#68645b] transition hover:bg-[#ebe4d9] hover:text-[#25241f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a]">
              {banner.kind === 'ios' ? 'Got it' : 'Not now'}
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-full text-[#777167] transition hover:bg-[#ebe4d9] hover:text-[#25241f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f876a]">
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </aside>
  )
}
