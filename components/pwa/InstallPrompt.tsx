'use client'

import { X, Download, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

interface InstallPromptProps {
  onInstall: () => void
  onDismiss: () => void
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white border border-sepia-200 rounded-lg shadow-xl p-4 relative">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-sepia-50 rounded-full transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4 text-sepia-600" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-sepia-100 rounded-full">
            <Smartphone className="h-5 w-5 text-sepia-700" />
          </div>
          <div>
            <h3 className="font-semibold text-sepia-900 text-sm mb-1">
              Install Interlinear
            </h3>
            <p className="text-xs text-sepia-600 leading-relaxed">
              Get the full app experience with offline access and faster loading. Perfect for language learning on the go!
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 text-xs font-medium text-sepia-600 bg-sepia-50 hover:bg-sepia-100 rounded-md transition-colors"
          >
            Not now
          </button>
          <button
            onClick={onInstall}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-sepia-700 hover:bg-sepia-800 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Download className="h-3 w-3" />
            Install
          </button>
        </div>
      </div>
    </div>
  )
}