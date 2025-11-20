'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TutorialTooltipProps {
  targetElementId: string
  message: string
  step: number
  totalSteps: number
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  showProgress?: boolean
  showNext?: boolean
  showPrevious?: boolean
  showSkip?: boolean
  pulseTarget?: boolean
  spotlightMode?: boolean
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onDismiss?: () => void
}

export function TutorialTooltip({
  targetElementId,
  message,
  step,
  totalSteps,
  placement = 'auto',
  variant = 'blue',
  showProgress = true,
  showNext = true,
  showPrevious = false,
  showSkip = true,
  pulseTarget = false,
  spotlightMode = false,
  onNext,
  onPrevious,
  onSkip,
  onDismiss
}: TutorialTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const [isVisible, setIsVisible] = useState(false)

  // Calculate position relative to target element
  useEffect(() => {
    const updatePosition = () => {
      const targetElement = document.getElementById(targetElementId)
      if (!targetElement) return

      const rect = targetElement.getBoundingClientRect()
      const tooltipWidth = 320 // Approximate tooltip width
      const tooltipHeight = 160 // Approximate tooltip height
      const offset = 12 // Distance from target element

      let x = 0
      let y = 0
      let finalPlacement: 'top' | 'bottom' | 'left' | 'right' = 'top'

      if (placement === 'auto') {
        // Auto-calculate best placement
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Check space availability
        const spaceTop = rect.top
        const spaceBottom = viewportHeight - rect.bottom
        const spaceLeft = rect.left
        const spaceRight = viewportWidth - rect.right

        // Prefer bottom, then top, then right, then left
        if (spaceBottom >= tooltipHeight + offset) {
          finalPlacement = 'bottom'
        } else if (spaceTop >= tooltipHeight + offset) {
          finalPlacement = 'top'
        } else if (spaceRight >= tooltipWidth + offset) {
          finalPlacement = 'right'
        } else {
          finalPlacement = 'left'
        }
      } else {
        finalPlacement = placement
      }

      // Calculate position based on final placement
      switch (finalPlacement) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.top - tooltipHeight - offset
          break
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.bottom + offset
          break
        case 'left':
          x = rect.left - tooltipWidth - offset
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
        case 'right':
          x = rect.right + offset
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
      }

      // Keep tooltip in viewport
      x = Math.max(16, Math.min(x, window.innerWidth - tooltipWidth - 16))
      y = Math.max(16, Math.min(y, window.innerHeight - tooltipHeight - 16))

      setPosition({ x, y })
      setActualPlacement(finalPlacement)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    // Add pulse effect to target element
    if (pulseTarget) {
      const targetElement = document.getElementById(targetElementId)
      if (targetElement) {
        targetElement.classList.add('tutorial-pulse')
      }
    }

    // Show tooltip after calculation
    setTimeout(() => setIsVisible(true), 100)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)

      // Remove pulse effect
      const targetElement = document.getElementById(targetElementId)
      if (targetElement) {
        targetElement.classList.remove('tutorial-pulse')
      }
    }
  }, [targetElementId, placement, pulseTarget])

  const gradientClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-pink-500'
  }

  const pointerClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white'
  }

  if (!isVisible) return null

  return (
    <>
      {/* Spotlight overlay for discovery mode */}
      {spotlightMode && (
        <div className="fixed inset-0 z-50 bg-black/75 transition-all duration-300">
          <div
            className="absolute rounded-lg transition-all duration-300"
            style={{
              left: position.x - 20,
              top: position.y - 20,
              width: '320px',
              height: '160px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-50 w-80 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200",
          "transition-all duration-300 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          left: position.x,
          top: position.y
        }}
      >
        {/* Gradient header */}
        <div className={cn(
          "h-2 rounded-t-xl bg-gradient-to-r",
          gradientClasses[variant]
        )} />

        {/* Pointer */}
        <div className={cn(
          "absolute w-0 h-0",
          pointerClasses[actualPlacement]
        )} />

        {/* Content */}
        <div className="p-4">
          {/* Progress indicator */}
          {showProgress && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i + 1 === step
                        ? `bg-gradient-to-r ${gradientClasses[variant]}`
                        : i + 1 < step
                        ? "bg-green-400"
                        : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {step}/{totalSteps}
              </span>
            </div>
          )}

          {/* Message */}
          <p className="text-gray-900 font-medium leading-relaxed mb-4">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {showPrevious && onPrevious && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  className="text-xs"
                >
                  Back
                </Button>
              )}
              {showNext && onNext && (
                <Button
                  size="sm"
                  onClick={onNext}
                  className={cn(
                    "text-xs bg-gradient-to-r text-white hover:opacity-90 transition-opacity",
                    gradientClasses[variant],
                    step === totalSteps && variant === 'red' && "animate-pulse"
                  )}
                >
                  {step === totalSteps ? "Let's Go!" : "Next"}
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {showSkip && onSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Skip
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// CSS for pulse animation (add to globals.css)
const pulseStyles = `
.tutorial-pulse {
  animation: tutorial-pulse 2s infinite;
}

@keyframes tutorial-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}
`