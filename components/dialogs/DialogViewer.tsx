'use client'

import { useState, useRef } from 'react'
import { MessageCircle, Eye, EyeOff, Volume2, Play, Loader2, BookmarkPlus, CheckCircle } from 'lucide-react'

interface DialogExchange {
  id: string
  sequence_order: number
  speaker: string
  spanish: string
  english: string
}

interface DialogViewerProps {
  context: string
  setting?: string
  exchanges: DialogExchange[]
  courseDeckId?: string
}

export default function DialogViewer({ context, setting, exchanges, courseDeckId }: DialogViewerProps) {
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [revealedExchanges, setRevealedExchanges] = useState<Set<string>>(new Set())
  const [loadingAudio, setLoadingAudio] = useState<Set<string>>(new Set())
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [playingAll, setPlayingAll] = useState(false)
  const [savedFlashcards, setSavedFlashcards] = useState<Set<string>>(new Set())
  const [savingFlashcard, setSavingFlashcard] = useState<string | null>(null)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  const toggleExchange = (exchangeId: string) => {
    setRevealedExchanges(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exchangeId)) {
        newSet.delete(exchangeId)
      } else {
        newSet.add(exchangeId)
      }
      return newSet
    })
  }

  const toggleAllTranslations = () => {
    if (showAllTranslations) {
      // Hide all
      setShowAllTranslations(false)
      setRevealedExchanges(new Set())
    } else {
      // Show all
      setShowAllTranslations(true)
      setRevealedExchanges(new Set(exchanges.map(e => e.id)))
    }
  }

  const playAudio = async (exchangeId: string, text: string) => {
    try {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current.get(playingAudio)
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      setLoadingAudio(prev => new Set(prev).add(exchangeId))

      // Fetch audio from TTS API (note: cache has known bugs)
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to synthesize audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audio.onended = () => {
        setPlayingAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      audioRefs.current.set(exchangeId, audio)

      await audio.play()
      setPlayingAudio(exchangeId)
    } catch (error) {
      console.error('Audio playback error:', error)
    } finally {
      setLoadingAudio(prev => {
        const newSet = new Set(prev)
        newSet.delete(exchangeId)
        return newSet
      })
    }
  }

  const playAllAudio = async () => {
    setPlayingAll(true)

    for (const exchange of exchanges) {
      try {
        // Highlight current exchange
        setPlayingAudio(exchange.id)

        // Fetch and play audio
        const response = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: exchange.spanish }),
        })

        if (!response.ok) continue

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        // Wait for audio to finish playing
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.play()
        })

        // Pause between exchanges (300ms)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error('Audio playback error:', error)
      }
    }

    setPlayingAudio(null)
    setPlayingAll(false)
  }

  const saveToFlashcard = async (exchangeId: string, spanish: string, english: string) => {
    if (!courseDeckId) {
      alert('Course deck not available')
      return
    }

    setSavingFlashcard(exchangeId)

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: courseDeckId,
          card_type: 'basic',
          front: spanish,
          back: english,
          source: 'lesson_dialog',
          source_id: exchangeId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save flashcard')
      }

      setSavedFlashcards(prev => new Set(prev).add(exchangeId))

      // Optional: You can add a toast notification library here
      // For now, we'll use the checkmark as visual feedback
    } catch (error) {
      console.error('Save flashcard error:', error)
      alert('Failed to save flashcard. Please try again.')
    } finally {
      setSavingFlashcard(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border-2 border-sepia-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sepia-700" />
            <h3 className="text-xl font-serif text-sepia-900">Dialog</h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={playAllAudio}
              disabled={playingAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-sepia-700 hover:bg-sepia-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Playing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Play All</span>
                </>
              )}
            </button>

            <button
              onClick={toggleAllTranslations}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-sepia-700 hover:text-sepia-900 hover:bg-sepia-100 rounded transition-colors"
            >
              {showAllTranslations ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Hide All</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Show All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Context */}
        <div className="p-3 bg-sepia-50 rounded border border-sepia-200">
          <p className="text-sm font-medium text-sepia-700 mb-1">Context:</p>
          <p className="text-sm text-sepia-900">{context}</p>
          {setting && (
            <>
              <p className="text-sm font-medium text-sepia-700 mt-2 mb-1">Setting:</p>
              <p className="text-sm text-sepia-900">{setting}</p>
            </>
          )}
        </div>
      </div>

      {/* Dialog exchanges */}
      <div className="space-y-4">
        {exchanges.map((exchange) => {
          const isRevealed = revealedExchanges.has(exchange.id)
          const isLoadingAudio = loadingAudio.has(exchange.id)
          const isPlaying = playingAudio === exchange.id

          return (
            <div
              key={exchange.id}
              className="group transition-all"
            >
              <div className={`p-4 rounded-lg border-2 transition-colors ${
                isPlaying
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                  : isRevealed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-sepia-200'
              }`}>
                {/* Header with speaker and action buttons */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-sepia-600 uppercase tracking-wide">
                    {exchange.speaker}
                  </p>

                  <div className="flex items-center gap-1">
                    {/* Audio button */}
                    <button
                      onClick={() => playAudio(exchange.id, exchange.spanish)}
                      disabled={isLoadingAudio || isPlaying}
                      className="p-1.5 text-sepia-700 hover:bg-sepia-100 rounded transition-colors disabled:opacity-50"
                      title="Play audio"
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-blue-600' : ''}`} />
                      )}
                    </button>

                    {/* Flashcard button */}
                    {courseDeckId && (
                      <button
                        onClick={() => saveToFlashcard(exchange.id, exchange.spanish, exchange.english)}
                        disabled={savedFlashcards.has(exchange.id) || savingFlashcard === exchange.id}
                        className="p-1.5 text-sepia-700 hover:bg-sepia-100 rounded transition-colors disabled:opacity-50"
                        title={savedFlashcards.has(exchange.id) ? 'Saved to deck' : 'Save to flashcard deck'}
                      >
                        {savingFlashcard === exchange.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : savedFlashcards.has(exchange.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Spanish text (clickable to reveal) */}
                <div
                  onClick={() => toggleExchange(exchange.id)}
                  className="cursor-pointer"
                >
                  <p className="font-serif text-lg text-sepia-900 mb-2">
                    {exchange.spanish}
                  </p>

                  {/* English translation (toggleable) */}
                  {isRevealed && (
                    <p className="text-sm text-sepia-600 italic pt-2 border-t border-green-200">
                      {exchange.english}
                    </p>
                  )}

                  {/* Click hint (only when not revealed) */}
                  {!isRevealed && (
                    <p className="text-xs text-sepia-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to reveal translation
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Click on any line to reveal its English translation. Try to understand the Spanish first!
        </p>
      </div>
    </div>
  )
}
