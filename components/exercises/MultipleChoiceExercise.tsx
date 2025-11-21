'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, BookmarkPlus } from 'lucide-react'

interface MultipleChoiceExerciseProps {
  exerciseId: string
  prompt: string
  choices?: string[] // Optional - can be passed directly (preview mode) or fetched from API
  correctAnswer?: string // Optional - for preview mode
  spanishText?: string
  englishText?: string
  courseDeckId?: string
  onComplete?: (isCorrect: boolean, xpEarned: number) => void
  previewMode?: boolean // Preview mode flag
}

interface ExerciseResult {
  is_correct: boolean
  correct_answer?: string
  xp_earned: number
}

export default function MultipleChoiceExercise({
  exerciseId,
  prompt,
  choices,
  correctAnswer,
  spanishText,
  englishText,
  courseDeckId,
  onComplete,
  previewMode = false
}: MultipleChoiceExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingFlashcard, setIsSavingFlashcard] = useState(false)
  const [flashcardSaved, setFlashcardSaved] = useState(false)
  const [showDeckModal, setShowDeckModal] = useState(false)
  const [decks, setDecks] = useState<any[]>([])
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [options, setOptions] = useState<string[]>([])

  // Set options - use passed choices (preview mode) or fetch from API (live mode)
  useState(() => {
    if (choices && choices.length > 0) {
      // Preview mode - use passed choices
      setOptions(choices)
    } else if (!previewMode) {
      // Live mode - fetch from API
      const fetchExerciseOptions = async () => {
        try {
          const response = await fetch(`/api/exercises/${exerciseId}`)
          if (response.ok) {
            const data = await response.json()
            // Handle both direct options array and nested choices structure
            const exerciseOptions = data.options?.choices || data.options || []
            setOptions(exerciseOptions)
          }
        } catch (error) {
          console.error('Failed to fetch exercise options:', error)
        }
      }

      fetchExerciseOptions()
    }
  })

  const handleSubmit = async () => {
    if (!selectedOption) return

    setIsSubmitting(true)

    try {
      if (previewMode) {
        // Mock response in preview mode - simulate correct/incorrect based on actual answer
        const isCorrect = correctAnswer && selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        const mockData = {
          is_correct: isCorrect || false,
          correct_answer: correctAnswer || 'No correct answer available',
          xp_earned: isCorrect ? 10 : 0
        }

        // Simulate network delay for realistic preview
        await new Promise(resolve => setTimeout(resolve, 500))

        setResult(mockData)

        if (onComplete) {
          onComplete(mockData.is_correct, mockData.xp_earned)
        }
      } else {
        // Real API call in live mode
        const response = await fetch(`/api/exercises/${exerciseId}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_answer: selectedOption })
        })

        if (!response.ok) {
          throw new Error('Validation failed')
        }

        const data = await response.json()
        setResult(data)

        if (onComplete) {
          onComplete(data.is_correct, data.xp_earned)
        }
      }
    } catch (error) {
      console.error('Exercise submission error:', error)
      if (!previewMode) {
        alert('Failed to submit answer. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setSelectedOption('')
    setResult(null)
    setFlashcardSaved(false)
  }

  const getOptionStyle = (option: string) => {
    if (!result) {
      return selectedOption === option
        ? 'border-sepia-700 bg-sepia-50'
        : 'border-sepia-200 hover:border-sepia-400 hover:bg-sepia-25'
    }

    if (option === result.correct_answer) {
      return 'border-green-500 bg-green-50 text-green-900'
    }

    if (option === selectedOption && !result.is_correct) {
      return 'border-red-500 bg-red-50 text-red-900'
    }

    return 'border-gray-300 bg-gray-50 text-gray-500 opacity-50'
  }

  const openDeckModal = async () => {
    if (courseDeckId) {
      await saveCardToDeck(courseDeckId)
      return
    }

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
    <div className="bg-white rounded-lg border-2 border-sepia-200 overflow-hidden">
      {/* Exercise Header - Fixed */}
      <div className="p-6 border-b border-sepia-200">
        <p className="text-sepia-700">{prompt}</p>
      </div>

      {/* Scrollable Content Area */}
      <div className="max-h-[60vh] overflow-y-auto">
        <div className="p-6">
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

          {/* Options */}
          {!result && options.length > 0 && (
            <div className="space-y-3 mb-4">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  disabled={isSubmitting}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors disabled:cursor-not-allowed ${getOptionStyle(option)}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button - Sticky Bottom */}
      {!result && (
        <div className="sticky bottom-0 bg-white border-t border-sepia-200 p-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOption}
            className="w-full px-6 py-3 bg-sepia-700 text-white font-medium rounded-lg hover:bg-sepia-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Check Answer</span>
            )}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div>
          {/* Scrollable Results Area */}
          <div className="max-h-[50vh] overflow-y-auto">
            <div className="p-6">
              {/* Show all options with styling based on result */}
              <div className="space-y-3 mb-4">
                {options.map((option) => (
                  <div
                    key={option}
                    className={`w-full p-4 border-2 rounded-lg transition-colors ${getOptionStyle(option)}`}
                  >
                    {option}
                    {option === result.correct_answer && ' ✓'}
                  </div>
                ))}
              </div>

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
                          Your answer: <span className="italic">{selectedOption}</span>
                        </p>
                        <p>
                          Correct answer:{' '}
                          <strong>{result.correct_answer}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons - Sticky Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-sepia-200 p-6">
            <div className="flex gap-2">
              {!result.is_correct && (
                <button
                  onClick={handleTryAgain}
                  className="flex-1 px-4 py-2 bg-white text-red-700 border-2 border-red-200 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Try Again
                </button>
              )}

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
        </div>
      )}

      {/* Deck Selection Modal - same as FillBlankExercise */}
      {showDeckModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-serif text-sepia-900 mb-4">
              Save to Flashcard Deck
            </h3>

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