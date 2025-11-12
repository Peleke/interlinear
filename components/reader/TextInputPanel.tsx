'use client'

import { useEffect } from 'react'

interface TextInputPanelProps {
  text: string
  language: 'es' | 'la'
  onTextChange: (text: string) => void
  onRenderClick: () => void
}

const WORD_LIMIT = 2000
const SESSION_KEY = 'interlinear_text'

export function TextInputPanel({
  text,
  language,
  onTextChange,
  onRenderClick,
}: TextInputPanelProps) {
  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved && !text) {
      onTextChange(saved)
    }
  }, [])

  // Save to session storage on change
  useEffect(() => {
    if (text) {
      sessionStorage.setItem(SESSION_KEY, text)
    }
  }, [text])

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const charCount = text.length
  const isOverLimit = wordCount > WORD_LIMIT

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="text-input"
          className="block text-lg font-serif text-sepia-900 mb-2"
        >
          {language === 'la' ? 'Paste your Latin text here' : 'Paste your Spanish text here'}
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={language === 'la'
            ? "Paste your Latin text here...\n\nFor example:\nGallia est omnis divisa in partes tres..."
            : "Pega tu texto en español aquí...\n\nFor example:\nEl español es un idioma hermoso y melodioso..."}
          className="w-full h-96 px-4 py-3 text-lg font-serif border-2 border-sepia-300 rounded-lg focus:border-sepia-600 focus:ring-2 focus:ring-sepia-200 resize-none bg-white"
          aria-describedby="text-stats text-limit-warning"
        />
      </div>

      {/* Stats */}
      <div
        id="text-stats"
        className="flex items-center justify-between text-sm text-sepia-600"
      >
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount}{' '}
          characters
        </span>

        {isOverLimit && (
          <span
            id="text-limit-warning"
            className="text-amber-600 font-medium"
            role="alert"
          >
            ⚠️ Text is quite long ({wordCount} words). Consider shorter passages
            for better performance.
          </span>
        )}
      </div>

      {/* Render Button */}
      <button
        onClick={onRenderClick}
        disabled={!text.trim()}
        className="w-full py-3 px-6 bg-sepia-700 text-white font-serif text-lg rounded-lg hover:bg-sepia-800 disabled:bg-sepia-300 disabled:cursor-not-allowed transition-colors"
      >
        Render Interactive Text →
      </button>
    </div>
  )
}
