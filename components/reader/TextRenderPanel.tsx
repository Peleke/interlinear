'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { tokenizeText } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import type { Token } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [savedWords] = useState<Set<string>>(new Set()) // TODO: Load from database

  // Tokenize text once when text changes
  const tokens = useMemo(() => tokenizeText(text), [text])

  // Handle word click with debouncing
  const handleWordClick = useCallback((token: Token) => {
    // If clicking same word, close sidebar
    if (token.id === selectedTokenId) {
      setSelectedTokenId(null)
      setLookupWord(null)
      return
    }

    // Otherwise, select new word and trigger lookup
    setSelectedTokenId(token.id)
    setLookupWord(token.cleanText)
  }, [selectedTokenId])

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

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 lg:mb-0 lg:absolute lg:top-0 lg:left-0 lg:right-0">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      {/* Main Reading Panel */}
      <div className={`flex-1 transition-all duration-300 ${lookupWord ? 'lg:mr-96' : ''}`}>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96 mt-16 lg:mt-0">
          <p className="text-lg font-serif text-ink leading-relaxed">
            {tokens.map((token) => (
              <ClickableWord
                key={token.id}
                token={token}
                isSelected={token.id === selectedTokenId}
                isSaved={savedWords.has(token.cleanText)}
                onClick={handleWordClick}
              />
            ))}
          </p>
        </div>
      </div>

      {/* Definition Sidebar */}
      <DefinitionSidebar
        word={lookupWord}
        onClose={handleSidebarClose}
      />
    </div>
  )
}
