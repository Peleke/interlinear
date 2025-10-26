'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { tokenizeText, getSentences } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import { AudioPlayer } from './AudioPlayer'
import type { Token, Sentence } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [savedWords] = useState<Set<string>>(new Set()) // TODO: Load from database
  const [activeSentenceId, setActiveSentenceId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Tokenize text once when text changes
  const tokens = useMemo(() => tokenizeText(text), [text])
  const sentences = useMemo(() => getSentences(tokens), [tokens])

  // Calculate sentence timing based on character ratios
  const calculateSentenceTiming = useCallback((
    totalDuration: number
  ): { sentenceId: number; startTime: number; duration: number }[] => {
    const totalChars = sentences.reduce((sum, s) => sum + s.text.length, 0)
    const timings: { sentenceId: number; startTime: number; duration: number }[] = []
    let currentTime = 0

    sentences.forEach((sentence) => {
      const charRatio = sentence.text.length / totalChars
      const duration = totalDuration * charRatio

      timings.push({
        sentenceId: sentence.id,
        startTime: currentTime,
        duration,
      })

      currentTime += duration
    })

    return timings
  }, [sentences])

  // Handle audio playback state
  const handlePlaybackChange = useCallback((
    playing: boolean,
    currentTime: number,
    duration: number
  ) => {
    setIsPlaying(playing)

    if (!playing) {
      setActiveSentenceId(null)
      return
    }

    // Calculate which sentence is currently playing
    const timings = calculateSentenceTiming(duration)
    const currentSentence = timings.find(
      (t) => currentTime >= t.startTime && currentTime < t.startTime + t.duration
    )

    setActiveSentenceId(currentSentence?.sentenceId ?? null)
  }, [calculateSentenceTiming])

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceId === null) return

    const sentenceElement = document.querySelector(
      `[data-sentence-id="${activeSentenceId}"]`
    )

    if (sentenceElement) {
      sentenceElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeSentenceId])

  // Handle word click with debouncing
  const handleWordClick = useCallback((token: Token) => {
    // If playing audio, don't allow word clicks
    if (isPlaying) return

    // If clicking same word, close sidebar
    if (token.id === selectedTokenId) {
      setSelectedTokenId(null)
      setLookupWord(null)
      return
    }

    // Otherwise, select new word and trigger lookup
    setSelectedTokenId(token.id)
    setLookupWord(token.cleanText)
  }, [selectedTokenId, isPlaying])

  // Handle sidebar close
  const handleSidebarClose = useCallback(() => {
    setSelectedTokenId(null)
    setLookupWord(null)
  }, [])

  // Global Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lookupWord) {
        handleSidebarClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [lookupWord, handleSidebarClose])

  // Group tokens by sentence for rendering
  const sentenceGroups = useMemo(() => {
    const groups: { [key: number]: Token[] } = {}

    tokens.forEach((token) => {
      if (!groups[token.sentenceId]) {
        groups[token.sentenceId] = []
      }
      groups[token.sentenceId].push(token)
    })

    return groups
  }, [tokens])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      {/* Audio Player */}
      <AudioPlayer text={text} onPlaybackChange={handlePlaybackChange} />

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 relative">
        {/* Main Reading Panel */}
        <div className={`flex-1 transition-all duration-300 ${lookupWord ? 'lg:pr-4' : ''}`}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
            <div className="text-lg font-serif text-ink leading-relaxed space-y-2">
              {Object.entries(sentenceGroups).map(([sentenceId, sentenceTokens]) => (
                <span
                  key={sentenceId}
                  data-sentence-id={sentenceId}
                  className={`inline-block transition-all duration-300 ${
                    activeSentenceId === parseInt(sentenceId)
                      ? 'bg-gold-100 px-2 py-1 rounded shadow-sm'
                      : ''
                  }`}
                >
                  {sentenceTokens.map((token) => (
                    <ClickableWord
                      key={token.id}
                      token={token}
                      isSelected={token.id === selectedTokenId}
                      isSaved={savedWords.has(token.cleanText)}
                      onClick={handleWordClick}
                      disabled={isPlaying}
                    />
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Definition Sidebar */}
        <DefinitionSidebar
          word={lookupWord}
          onClose={handleSidebarClose}
        />
      </div>
    </div>
  )
}
