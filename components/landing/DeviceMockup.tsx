'use client'

import { useState, useEffect } from 'react'

export function DeviceMockup() {
  const [activeScreen, setActiveScreen] = useState<'reader' | 'course' | 'vocab'>('reader')

  useEffect(() => {
    const screens: Array<'reader' | 'course' | 'vocab'> = ['reader', 'course', 'vocab']
    let currentIndex = 0

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % screens.length
      setActiveScreen(screens[currentIndex])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      {/* Device Frame */}
      <div className="relative mx-auto max-w-[500px]">
        {/* Device Shadow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-300/20 to-crimson-200/20 blur-3xl translate-y-8" />

        {/* Device Container */}
        <div className="relative bg-gradient-to-b from-sepia-900 to-ink rounded-3xl p-4 shadow-2xl border-4 border-sepia-800">
          {/* Screen */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-inner">
            {/* Status Bar */}
            <div className="bg-parchment px-4 py-2 flex justify-between items-center text-xs text-sepia-500 border-b border-sepia-200">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-sepia-400 rounded-full" />
                <div className="w-1 h-1 bg-sepia-400 rounded-full" />
                <div className="w-1 h-1 bg-sepia-400 rounded-full" />
              </div>
            </div>

            {/* Screen Content */}
            <div className="relative h-[400px] bg-gradient-to-b from-parchment to-sepia-50">
              {/* Reader Screen */}
              <div className={`absolute inset-0 p-6 transition-opacity duration-500 ${activeScreen === 'reader' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-sepia-500">
                    <div className="w-6 h-6 bg-gold-100 rounded-full flex items-center justify-center">📖</div>
                    <span className="font-semibold">Interactive Reader</span>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-ink font-serif">
                    <p>
                      Me gusta <span className="relative inline-block">
                        <span className="px-1 bg-gold-100 text-crimson font-semibold cursor-pointer rounded">leer</span>
                        <span className="absolute left-0 top-full mt-1 w-40 p-2 bg-white border border-gold shadow-lg rounded text-xs z-10">
                          <div className="font-bold text-crimson">leer</div>
                          <div className="text-sepia-600 mt-1">verb: to read</div>
                        </span>
                      </span> libros en español.
                    </p>
                    <p className="text-sepia-500">
                      La lectura es una forma excelente de aprender vocabulario nuevo.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="px-2 py-1 bg-gold-100 text-gold-800 rounded text-xs">✓ 12 words tracked</div>
                  </div>
                </div>
              </div>

              {/* Course Screen */}
              <div className={`absolute inset-0 p-6 transition-opacity duration-500 ${activeScreen === 'course' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-sepia-500">
                    <div className="w-6 h-6 bg-crimson-100 rounded-full flex items-center justify-center">📚</div>
                    <span className="font-semibold">Spanish for Beginners</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-lg border border-sepia-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-ink">Lesson 1: Greetings</div>
                        <div className="text-green-600 text-xl">✓</div>
                      </div>
                      <div className="w-full bg-sepia-100 rounded-full h-1">
                        <div className="bg-green-600 h-1 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-gold-50 to-parchment rounded-lg border-2 border-gold shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-ink">Lesson 2: Family</div>
                        <div className="text-crimson text-sm">In Progress</div>
                      </div>
                      <div className="w-full bg-sepia-100 rounded-full h-1">
                        <div className="bg-crimson h-1 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-sepia-200 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-sepia-600">Lesson 3: Food</div>
                        <div className="text-sepia-400 text-xl">🔒</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vocabulary Screen */}
              <div className={`absolute inset-0 p-6 transition-opacity duration-500 ${activeScreen === 'vocab' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-sepia-500">
                    <div className="w-6 h-6 bg-gold-100 rounded-full flex items-center justify-center">📊</div>
                    <span className="font-semibold">Your Vocabulary</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { word: 'leer', def: 'to read', count: 12 },
                      { word: 'libro', def: 'book', count: 8 },
                      { word: 'aprender', def: 'to learn', count: 6 },
                      { word: 'hablar', def: 'to speak', count: 4 }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-sepia-200 shadow-sm">
                        <div>
                          <div className="font-semibold text-ink">{item.word}</div>
                          <div className="text-xs text-sepia-500">{item.def}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-sepia-400">{item.count}x</div>
                          <button className="w-6 h-6 bg-gold-100 rounded-full text-xs">🔊</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center pt-2">
            <div className="w-20 h-1 bg-sepia-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Screen Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        <button
          onClick={() => setActiveScreen('reader')}
          className={`w-2 h-2 rounded-full transition-all ${activeScreen === 'reader' ? 'bg-crimson w-6' : 'bg-sepia-300'}`}
          aria-label="Show reader"
        />
        <button
          onClick={() => setActiveScreen('course')}
          className={`w-2 h-2 rounded-full transition-all ${activeScreen === 'course' ? 'bg-crimson w-6' : 'bg-sepia-300'}`}
          aria-label="Show courses"
        />
        <button
          onClick={() => setActiveScreen('vocab')}
          className={`w-2 h-2 rounded-full transition-all ${activeScreen === 'vocab' ? 'bg-crimson w-6' : 'bg-sepia-300'}`}
          aria-label="Show vocabulary"
        />
      </div>
    </div>
  )
}
