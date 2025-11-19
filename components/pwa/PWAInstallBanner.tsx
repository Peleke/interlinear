'use client'

import { useEffect, useState, useCallback } from 'react'
import { Share, X, Download, Smartphone } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  platforms?: string[]
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

const STORAGE_KEY = 'pwa-install-banner-dismissed-v1'

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  // Exclude Chrome/Firefox/Opera on iOS which still report WebKit
  const isSafari = iOS && webkit && !/(CriOS|FxiOS|OPiOS|mercury)/.test(ua)
  return isSafari
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // Standard check
    const dm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
    // iOS fallback
    const navStandalone = (window.navigator as any).standalone === true
    return !!dm || !!navStandalone
  } catch {
    return false
  }
}

export function PWAInstallBanner(): JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    setIsIOS(isIOSSafari())

    // Check installed state
    setIsInstalled(getIsStandalone())

    // If already dismissed or installed, don't show
    if (dismissed || getIsStandalone()) {
      return
    }

    // iOS: we can't use beforeinstallprompt — show iOS UI
    if (isIOSSafari()) {
      setShowBanner(true)
      return
    }

    // Non-iOS: listen for beforeinstallprompt
    function onBeforeInstallPrompt(e: Event) {
      // Prevent the browser from showing the native prompt immediately
      try {
        ;(e as any).preventDefault?.()
      } catch {}
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)

    // Also listen for appinstalled to hide banner if it was installed via other means
    function onAppInstalled() {
      setIsInstalled(true)
      setShowBanner(false)
    }
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
    // Note: intentionally not putting `isIOS` or `dismissed` in dependency list to avoid re-registering
    // this effect unnecessarily — the initial mount detection is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dismiss and persist
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setDismissed(true)
    setShowBanner(false)
  }, [])

  // Trigger the install prompt for non-iOS
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      // Optionally inspect the result:
      // const choice = await deferredPrompt.userChoice
    } catch {
      // ignore errors, but hide the banner
    } finally {
      setShowBanner(false)
    }
  }, [deferredPrompt])

  if (dismissed || isInstalled || !showBanner) return null

  // --- iOS UI ---
  if (isIOS) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-50">
        <div className="mx-auto max-w-lg rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Smartphone size={28} />
          </div>
          <div className="flex-1 text-sm leading-tight">
            <div className="font-medium">Install this app on iOS</div>
            <div className="mt-1">
              Open the <strong>Share</strong> menu <Share className="inline-block ml-1 mr-1" size={14} /> and
              choose <strong>"Add to Home Screen"</strong>.
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Tip: Make sure you're using Safari and not private browsing.
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              aria-label="Dismiss"
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-black/5"
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Non-iOS UI (uses beforeinstallprompt) ---
  return (
    <div className="fixed bottom-4 inset-x-4 z-50">
      <div className="mx-auto max-w-md rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/5 p-3 flex items-center gap-3">
        <div className="flex-shrink-0">
          <Download size={20} />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-medium">Install this app</div>
          <div className="text-xs text-gray-600">For the best experience, install this app to your device.</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className="rounded px-3 py-1 bg-slate-900 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Install
          </button>
          <button
            aria-label="Dismiss"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-black/5"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallBanner