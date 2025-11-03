'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, BookmarkPlus } from 'lucide-react'

interface FillBlankExerciseProps {
  exerciseId: string
  prompt: string
  spanishText?: string
  englishText?: string
  courseDeckId?: string
  onComplete?: (isCorrect: boolean, xpEarned: number) => void
}

interface ExerciseResult {
  is_correct: boolean
  correct_answer?: string
  xp_earned: number
}

export default function FillBlankExercise({
  exerciseId,
  prompt,
  spanishText,
  englishText,
  courseDeckId,
  onComplete
}: FillBlankExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingFlashcard, setIsSavingFlashcard] = useState(false)
  const [flashcardSaved, setFlashcardSaved] = useState(false)
  const [showDeckModal, setShowDeckModal] = useState(false)
  const [decks, setDecks] = useState<any[]>([])
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [result, setResult] = useState<ExerciseResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userAnswer.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/exercises/${exerciseId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answer: userAnswer })
      })

      if (!response.ok) {
        throw new Error('Validation failed')
      }

      const data = await response.json()
      setResult(data)

      if (onComplete) {
        onComplete(data.is_correct, data.xp_earned)
      }
    } catch (error) {
      console.error('Exercise submission error:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setUserAnswer('')
    setResult(null)
    setFlashcardSaved(false)
  }

  const openDeckModal = async () => {
    // If course deck is available, auto-save to it directly
    if (courseDeckId) {
      await saveCardToDeck(courseDeckId)
      return
    }

    // Otherwise, show deck selection modal
    try {
      const res = await fetch('/api/flashcards/decks')
      const { decks: userDecks } = await res.json()
      setDecks(userDecks || [])
      setShowDeckModal(true)
    } catch (error) {
      console.error('Load decks error:', error)
      alert('Failed to load decks. Please try again.')
    }
  }

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return

    setIsCreatingDeck(true)
    try {
      const res = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeckName,
          description: 'Custom lesson deck'
        })
      })
      const { deck } = await res.json()

      await saveCardToDeck(deck.id)
      setNewDeckName('')
    } catch (error) {
      console.error('Create deck error:', error)
      alert('Failed to create deck. Please try again.')
    } finally {
      setIsCreatingDeck(false)
    }
  }

  const saveCardToDeck = async (deckId: string) => {
    setIsSavingFlashcard(true)
    try {
      // Use spanish/english text if available, otherwise use prompt and correct answer
      const front = englishText || prompt
      const back = spanishText || result?.correct_answer || ''

      if (!back) {
        alert('No answer available to save')
        return
      }

      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: deckId,
          card_type: 'basic',
          front,
          back,
          notes: prompt,
          source: 'lesson_exercise',
          source_id: exerciseId
        })
      })

      setFlashcardSaved(true)
      setShowDeckModal(false)
    } catch (error) {
      console.error('Save flashcard error:', error)
      alert('Failed to save flashcard. Please try again.')
    } finally {
      setIsSavingFlashcard(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border-2 border-sepia-200 p-6">
      {/* Exercise Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-sepia-900 mb-2">
          ✏️ Translation Exercise
        </h4>
        <p className="text-sepia-700">{prompt}</p>
      </div>

      {/* Context (if provided) */}
      {(spanishText || englishText) && (
        <div className="mb-4 p-4 bg-sepia-50 rounded-lg border border-sepia-200">
          {spanishText && (
            <p className="font-serif text-lg text-sepia-900 mb-1">
              {spanishText}
            </p>
          )}
          {englishText && (
            <p className="text-sm text-sepia-600 italic">{englishText}</p>
          )}
        </div>
      )}

      {/* Answer Input Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="answer"
              className="block text-sm font-medium text-sepia-700 mb-2"
            >
              Your Answer:
            </label>
            <input
              id="answer"
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-sepia-200 rounded-lg focus:border-sepia-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Type your translation..."
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !userAnswer.trim()}
            className="w-full px-6 py-3 bg-sepia-700 text-white font-medium rounded-lg hover:bg-sepia-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Submit Answer</span>
            )}
          </button>
        </form>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`p-4 rounded-lg border-2 ${
            result.is_correct
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3 mb-3">
            {result.is_correct ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h5
                className={`text-lg font-semibold mb-1 ${
                  result.is_correct ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.is_correct ? '¡Correcto!' : 'Not quite'}
              </h5>
              {result.is_correct ? (
                <p className="text-green-800">
                  Great job! You earned{' '}
                  <strong>+{result.xp_earned} XP</strong>
                </p>
              ) : (
                <div className="text-red-800">
                  <p className="mb-2">
                    Your answer: <span className="italic">{userAnswer}</span>
                  </p>
                  <p>
                    Correct answer:{' '}
                    <strong>{result.correct_answer}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!result.is_correct && (
              <button
                onClick={handleTryAgain}
                className="flex-1 px-4 py-2 bg-white text-red-700 border-2 border-red-200 font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            )}

            {/* Send to Flashcard button - always available after result */}
            <button
                onClick={openDeckModal}
                disabled={flashcardSaved || isSavingFlashcard}
                className={`${result.is_correct ? 'flex-1' : 'flex-1'} px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  flashcardSaved
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200'
                    : isSavingFlashcard
                    ? 'bg-white text-sepia-700 border-2 border-sepia-300 opacity-50 cursor-wait'
                    : 'bg-white text-sepia-700 border-2 border-sepia-300 hover:bg-sepia-50'
                }`}
              >
                {flashcardSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Saved to Deck</span>
                  </>
                ) : isSavingFlashcard ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    <span>{courseDeckId ? 'Add to Course Deck' : 'Save to Flashcard'}</span>
                  </>
                )}
              </button>
          </div>
        </div>
      )}

      {/* Deck Selection Modal */}
      {showDeckModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-serif text-sepia-900 mb-4">
              Save to Flashcard Deck
            </h3>

            {/* Existing Decks */}
            {decks.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-sepia-700 mb-2">
                  Select a deck:
                </h4>
                <div className="space-y-2">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => saveCardToDeck(deck.id)}
                      disabled={isSavingFlashcard}
                      className="w-full text-left px-4 py-3 border-2 border-sepia-200 rounded-lg hover:border-sepia-400 hover:bg-sepia-50 transition-colors disabled:opacity-50"
                    >
                      <p className="font-medium text-sepia-900">{deck.name}</p>
                      {deck.description && (
                        <p className="text-sm text-sepia-600">
                          {deck.description}
                        </p>
                      )}
                      <p className="text-xs text-sepia-500 mt-1">
                        {deck.card_count || 0} cards
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Deck */}
            <div className="border-t border-sepia-200 pt-4">
              <h4 className="text-sm font-medium text-sepia-700 mb-2">
                Or create a new deck:
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Deck name..."
                  className="flex-1 px-3 py-2 border-2 border-sepia-200 rounded-lg focus:border-sepia-700 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateDeck()
                  }}
                />
                <button
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim() || isCreatingDeck}
                  className="px-4 py-2 bg-sepia-700 text-white font-medium rounded-lg hover:bg-sepia-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingDeck ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={() => setShowDeckModal(false)}
              className="w-full mt-4 px-4 py-2 border-2 border-sepia-200 text-sepia-700 font-medium rounded-lg hover:bg-sepia-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
