'use client'

import { useState } from 'react'
import type { VocabularyEntry } from '@/types'

interface VocabularyCardProps {
  entry: VocabularyEntry
  onDelete: (id: string) => Promise<void>
}

export function VocabularyCard({ entry, onDelete }: VocabularyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(entry.id)
    } catch (err) {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="border border-sepia-200 rounded-lg hover:border-gold-300 transition-colors">
      {/* Card Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex justify-between items-center gap-4 text-left hover:bg-sepia-50 transition-colors rounded-lg"
        aria-expanded={isExpanded}
        aria-label={`${entry.word} - ${isExpanded ? 'Collapse' : 'Expand'} definition`}
      >
        <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <h3 className="text-xl font-serif text-sepia-900">{entry.word}</h3>
          <div className="flex items-center gap-2 text-xs text-sepia-500">
            <span>{entry.click_count}× clicked</span>
            <span>•</span>
            <span>{formatDate(entry.last_seen)}</span>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <svg
          className={`w-5 h-5 text-sepia-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Definition Section */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-sepia-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Definition */}
            <div className="flex-1">
              {entry.definition && entry.definition.found && (
                <div className="space-y-2">
                  {/* Pronunciation */}
                  {entry.definition.pronunciations && entry.definition.pronunciations.length > 0 && (
                    <div className="text-sm text-sepia-600 font-mono">
                      {entry.definition.pronunciations[0].text}
                    </div>
                  )}

                  {/* Meanings */}
                  {entry.definition.definitions && entry.definition.definitions.map((def, idx) => (
                    <div key={idx}>
                      <div className="text-xs uppercase tracking-wide text-sepia-500 mb-1">
                        {def.partOfSpeech}
                      </div>
                      <ol className="list-decimal list-inside text-sm text-sepia-700 space-y-1">
                        {def.meanings.map((meaning, mIdx) => (
                          <li key={mIdx}>{meaning}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}

              {!entry.definition && (
                <p className="text-sm text-sepia-500 italic">No definition available</p>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-sepia-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              aria-label="Delete word"
            >
              {isDeleting ? (
                <div className="animate-spin h-5 w-5 border-2 border-sepia-300 border-t-sepia-600 rounded-full" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
