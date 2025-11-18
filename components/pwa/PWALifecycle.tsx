'use client'

import { useEffect, useState } from 'react'
import { InstallPrompt } from './InstallPrompt'

export function PWALifecycle() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // next-pwa handles service worker registration automatically
    // We just need to handle the install prompt
    console.log('PWALifecycle mounted - install prompt logic active')

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show our custom install prompt
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismissInstall = () => {
    setShowInstallPrompt(false)
    // Store dismissal to avoid showing again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Check if user previously dismissed and it hasn't been 7 days
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  return (
    <>
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={handleInstall}
          onDismiss={handleDismissInstall}
        />
      )}
    </>
  )
}