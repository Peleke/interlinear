'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Detect iOS Safari
const isIOSSafari = () => {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  const isSafari = iOS && webkit && !/(CriOS|FxiOS|OPiOS|mercury)/.test(ua)
  return isSafari
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS on mount
    setIsIOS(isIOSSafari())

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }

      // Check if dismissed recently (within 7 days)
      const dismissedAt = localStorage.getItem('pwa-install-dismissed')
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
        if (daysSince < 7) return
      }

      // Show banner immediately for testing
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 100)

      return () => clearTimeout(timer)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      checkInstalled()
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check on mount
    checkInstalled()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      // iOS-specific instructions (no automatic install available)
      return // Do nothing - the UI will show the iOS instructions
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice

        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true)
        }

        setShowBanner(false)
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Installation failed:', error)
      }
    } else {
      // Show manual instructions for browsers that don't support automatic install
      alert('To install this app:\n\n• Chrome: Click the three dots menu → "Install Interlinear"\n• Firefox: Look for install icon in address bar\n• Edge: Click the three dots menu → "Install this site as an app"')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-sepia-200 p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-sepia-400 hover:text-sepia-600 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-sepia-700 rounded-lg flex items-center justify-center text-white">
            <Smartphone size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-sepia-900">Install Interlinear</h3>
            <p className="text-sm text-sepia-600">Get the app for quick access</p>
          </div>
        </div>

        <ul className="text-sm text-sepia-600 mb-4 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-sepia-700 mt-0.5">•</span>
            <span>Instant access to Word of the Day</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sepia-700 mt-0.5">•</span>
            <span>Push notifications for new words</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sepia-700 mt-0.5">•</span>
            <span>Works offline with saved content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sepia-700 mt-0.5">•</span>
            <span>No app store required!</span>
          </li>
        </ul>

        {isIOS ? (
          // iOS-specific UI with step-by-step instructions
          <div className="space-y-3">
            <div className="bg-sepia-50 rounded-md p-3 border border-sepia-200">
              <h4 className="font-medium text-sepia-900 mb-2 flex items-center gap-2">
                <Share size={16} />
                Install on iPhone/iPad
              </h4>
              <ol className="text-sm text-sepia-700 space-y-1 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button in Safari's toolbar</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top-right corner</li>
                <li>The app will appear on your home screen!</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 bg-sepia-700 hover:bg-sepia-800 text-white px-4 py-2 rounded-md transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        ) : (
          // Standard PWA install for other browsers
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-sepia-700 hover:bg-sepia-800 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sepia-600 hover:text-sepia-800 transition-colors"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}