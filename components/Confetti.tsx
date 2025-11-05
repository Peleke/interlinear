'use client'

import { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      setShow(true)
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setShow(false)
        onComplete?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <DotLottieReact
        src="/assets/lottie/confetti.lottie"
        autoplay
        loop={false}
        className="w-full h-full"
      />
    </div>
  )
}
