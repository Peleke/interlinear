'use client'

import { useState, useMemo } from 'react'
import { tokenizeText } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import type { Token } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [savedWords] = useState<Set<string>>(new Set()) // TODO: Load from database

  // Tokenize text once when text changes
  const tokens = useMemo(() => tokenizeText(text), [text])

  const handleWordClick = (token: Token) => {
    setSelectedTokenId(token.id === selectedTokenId ? null : token.id)
    console.log('Clicked word:', token.cleanText, token)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
        >
          ← Edit Text
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
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

      {/* Debug info - show selected word */}
      {selectedTokenId && (
        <div className="mt-4 p-3 bg-sepia-50 rounded-md border border-sepia-200 text-sm text-sepia-700">
          Selected: <span className="font-semibold">{tokens.find(t => t.id === selectedTokenId)?.cleanText}</span>
          {' '} (ID: {selectedTokenId})
        </div>
      )}
    </div>
  )
}
