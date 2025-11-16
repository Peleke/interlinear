'use client'

import { useState, useEffect } from 'react'
import { Volume2, X } from 'lucide-react'

interface AudioTooltipProps {
  show: boolean
  onDismiss: () => void
}

export function AudioTooltip({ show, onDismiss }: AudioTooltipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      // Small delay to allow message to render first
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [show])

  useEffect(() => {
    if (visible) {
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div className="absolute -top-2 -right-2 z-50">
      {/* Tooltip bubble */}
      <div className="relative bg-blue-600 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px] animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center gap-2">
          <Volume2 className="h-3 w-3 flex-shrink-0" />
          <span className="font-medium">
            🔊 Click to hear AI responses!
          </span>
          <button
            onClick={() => {
              setVisible(false)
              onDismiss()
            }}
            className="ml-1 p-0.5 hover:bg-blue-700 rounded transition-colors flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Arrow pointing to audio button */}
        <div className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
      </div>
    </div>
  )
}