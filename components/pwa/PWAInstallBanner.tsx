'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
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

      // Show banner after 3 seconds for testing (was 30 seconds)
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 3000)

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
    if (!deferredPrompt) return

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
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner || !deferredPrompt) return null

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

        <div className="text-sm text-sepia-600 mb-4">
          • Instant access to Word of the Day
          • Push notifications for new words
          • Works offline with saved content
          • No app store required!
        </div>

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
      </div>
    </div>
  )
}