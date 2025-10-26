'use client'

import { useState, useEffect } from 'react'
import { DictionaryCache } from '@/lib/dictionary-cache'
import type { DictionaryResponse } from '@/types'

interface DefinitionSidebarProps {
  word: string | null
  onClose: () => void
  onDefinitionLoaded?: (definition: DictionaryResponse) => void
}

export function DefinitionSidebar({ word, onClose, onDefinitionLoaded }: DefinitionSidebarProps) {
  const [data, setData] = useState<DictionaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheHit, setCacheHit] = useState(false)

  useEffect(() => {
    if (!word) {
      setData(null)
      setError(null)
      setCacheHit(false)
      return
    }

    // Create AbortController for fetch cancellation
    const controller = new AbortController()

    const fetchDefinition = async () => {
      setLoading(true)
      setError(null)
      setCacheHit(false)

      try {
        // Check cache first
        const cached = DictionaryCache.get(word)

        if (cached) {
          console.log('Cache hit:', word)
          setData(cached)
          setCacheHit(true)
          setLoading(false)
          onDefinitionLoaded?.(cached)
          return
        }

        // Cache miss - fetch from API
        console.log('Cache miss:', word)
        const response = await fetch(
          `/api/dictionary/${encodeURIComponent(word)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch definition')
        }

        const result: DictionaryResponse = await response.json()
        setData(result)

        // Store in cache if successful
        if (result.found) {
          DictionaryCache.set(word, result)
          onDefinitionLoaded?.(result)
        }
      } catch (err) {
        // Ignore abort errors (user clicked another word)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()

    // Cleanup: abort fetch if word changes before response
    return () => controller.abort()
  }, [word])

  if (!word) return null

  return (
    <>
      {/* Backdrop - mobile only */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl
          lg:relative lg:shadow-lg

          /* Mobile: bottom drawer */
          bottom-0 left-0 right-0 rounded-t-2xl
          max-h-[80vh] lg:max-h-none

          /* Desktop: right sidebar */
          lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto
          lg:w-96 lg:rounded-none

          /* Animation */
          transform transition-transform duration-300
          ${word ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}

          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-sepia-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif text-sepia-900">Definition</h2>
            {cacheHit && (
              <div className="text-xs text-sepia-500 flex items-center gap-1" title="Loaded from cache">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
                Cached
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sepia-100 rounded-md transition-colors"
            aria-label="Close definition"
          >
            <svg className="w-5 h-5 text-sepia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
              <span className="ml-3 text-sepia-600">Loading definition...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error loading definition</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && data && !data.found && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium">Word not found: &quot;{word}&quot;</p>
              </div>

              {data.suggestions && data.suggestions.length > 0 && (
                <div>
                  <p className="text-sm text-sepia-600 mb-2">Did you mean:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="px-3 py-1 bg-sepia-100 hover:bg-sepia-200 text-sepia-800 rounded-md text-sm transition-colors"
                        onClick={() => {/* TODO: handle suggestion click */}}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && data && data.found && (
            <div className="space-y-6">
              {/* Word Header */}
              <div>
                <h3 className="text-3xl font-serif text-sepia-900 mb-2">{data.word}</h3>

                {/* Pronunciation */}
                {data.pronunciations && data.pronunciations.length > 0 && (
                  <div className="flex items-center gap-3 text-sepia-600">
                    <span className="text-sm font-mono">{data.pronunciations[0].text}</span>
                    {data.pronunciations[0].audio && (
                      <button
                        className="p-1 hover:bg-sepia-100 rounded transition-colors"
                        onClick={() => {
                          const audio = new Audio(data.pronunciations![0].audio!)
                          audio.play()
                        }}
                        aria-label="Play pronunciation"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Definitions */}
              {data.definitions && data.definitions.map((def, idx) => (
                <div key={idx}>
                  <div className="text-xs uppercase tracking-wide text-sepia-500 mb-2">
                    {def.partOfSpeech}
                  </div>
                  <ol className="list-decimal list-inside space-y-2">
                    {def.meanings.map((meaning, mIdx) => (
                      <li key={mIdx} className="text-sepia-800 leading-relaxed">
                        {meaning}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
