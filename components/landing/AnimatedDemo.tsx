'use client'

import { useState, useEffect } from 'react'

export function AnimatedDemo() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDefinition, setShowDefinition] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setShowDefinition(true), 500)
      setTimeout(() => {
        setShowDefinition(false)
        setIsAnimating(false)
      }, 3000)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative max-w-2xl mx-auto p-8 bg-gradient-to-br from-sepia-50 to-parchment rounded-2xl shadow-xl">
      <div className="font-serif text-2xl text-ink leading-relaxed text-center">
        <span className="text-sepia-500">I want to </span>
        <span
          className={`relative inline-block cursor-pointer transition-all duration-300 ${
            isAnimating ? 'text-crimson font-semibold' : 'text-ink hover:text-crimson'
          }`}
        >
          learn
          {showDefinition && (
            <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-white border-2 border-gold rounded-lg shadow-2xl z-10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="text-sm font-sans text-left space-y-2">
                <div className="font-semibold text-crimson">learn</div>
                <div className="text-xs text-sepia-500 italic">/lɜːrn/</div>
                <div className="text-sepia-700">
                  <span className="font-medium">verb:</span> to acquire knowledge or skill
                </div>
                <div className="flex items-center gap-2 text-xs text-gold-700">
                  <span>🔊</span>
                  <span>Click to hear pronunciation</span>
                </div>
                <div className="text-xs text-sepia-400 pt-2 border-t border-sepia-100">
                  ✓ Added to vocabulary
                </div>
              </div>
            </div>
          )}
        </span>
        <span className="text-sepia-500"> Spanish fluently.</span>
      </div>
      <div className="mt-6 text-center text-sm text-sepia-500 font-sans">
        ← Click any word to see it in action
      </div>
    </div>
  )
}
