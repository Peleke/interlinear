'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, BookmarkPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ErrorDetail {
  errorText: string
  correction: string
  explanation: string
  category: 'grammar' | 'vocabulary' | 'syntax'
}

interface TurnCorrection {
  hasErrors: boolean
  correctedText: string
  errors: ErrorDetail[]
}

interface MessageCorrectionProps {
  correction: TurnCorrection
}

export function MessageCorrection({ correction }: MessageCorrectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { hasErrors, correctedText, errors } = correction

  // No errors - show positive feedback
  if (!hasErrors) {
    return (
      <div className="flex items-center gap-2 mt-1 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>¡Perfecto!</span>
      </div>
    )
  }

  // Has errors - show collapsible correction
  return (
    <Card className="mt-2 border-l-4 border-l-amber-500 bg-amber-50/50">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-amber-100/50 transition-colors rounded"
        aria-expanded={isExpanded}
        aria-label={`${errors.length} correction${errors.length > 1 ? 's' : ''} available`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            {errors.length} correction{errors.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-amber-600 bg-white px-2 py-0.5 rounded-full">
            Click to review
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2">
          {/* Corrected Version */}
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs font-medium text-amber-800 mb-1">
              Corrected:
            </p>
            <p className="text-sm text-gray-700 italic">
              {correctedText}
            </p>
          </div>

          {/* Individual Errors */}
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <ErrorDetailComponent key={idx} error={error} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Individual Error Display with Flashcard Save
function ErrorDetailComponent({ error }: { error: ErrorDetail }) {
  const [saving, setSaving] = useState(false)
  const [decks, setDecks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')

  useEffect(() => {
    loadDecks()
  }, [])

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/flashcards/decks')
      if (!response.ok) return

      const data = await response.json()
      setDecks(data.decks || [])

      // Auto-select "Tutor Corrections" deck if it exists
      const tutorDeck = data.decks.find((d: any) =>
        d.name.toLowerCase().includes('tutor') || d.name.toLowerCase().includes('correction')
      )
      if (tutorDeck) {
        setSelectedDeckId(tutorDeck.id)
      } else if (data.decks.length > 0) {
        setSelectedDeckId(data.decks[0].id)
      }
    } catch (error) {
      console.error('Failed to load decks:', error)
    }
  }

  const saveAsFlashcard = async () => {
    if (!selectedDeckId) {
      toast.error('Please select a deck first')
      return
    }

    try {
      setSaving(true)

      // Create a basic card (can be enhanced to cloze later)
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: selectedDeckId,
          card_type: 'basic',
          front: error.errorText,
          back: error.correction,
          notes: `${error.category}: ${error.explanation}`,
          source: 'tutor_session'
        })
      })

      if (!response.ok) throw new Error('Failed to save flashcard')

      toast.success('Flashcard saved!')
    } catch (err) {
      console.error('Save flashcard error:', err)
      toast.error('Failed to save flashcard')
    } finally {
      setSaving(false)
    }
  }

  const categoryColors = {
    grammar: 'bg-red-100 text-red-800 border-red-200',
    vocabulary: 'bg-blue-100 text-blue-800 border-blue-200',
    syntax: 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const categoryIcons = {
    grammar: '📝',
    vocabulary: '📚',
    syntax: '🔧'
  }

  return (
    <div className={`p-2 rounded border ${categoryColors[error.category]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{categoryIcons[error.category]}</span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 bg-white rounded">
              {error.category}
            </span>
            <span className="text-xs line-through opacity-70">
              {error.errorText}
            </span>
            <span className="text-xs">→</span>
            <span className="text-xs font-medium">
              {error.correction}
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {error.explanation}
          </p>

          {/* Save to Flashcard */}
          {decks.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                {decks.map(deck => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={saveAsFlashcard}
                disabled={saving}
                size="sm"
                variant="outline"
                className="h-6 text-xs"
              >
                <BookmarkPlus className="h-3 w-3 mr-1" />
                {saving ? 'Saving...' : 'Save as Card'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
