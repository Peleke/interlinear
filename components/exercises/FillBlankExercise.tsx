'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface FillBlankExerciseProps {
  exerciseId: string
  prompt: string
  spanishText?: string
  englishText?: string
  onComplete?: (isCorrect: boolean, xpEarned: number) => void
}

export default function FillBlankExercise({
  exerciseId,
  prompt,
  spanishText,
  englishText,
  onComplete
}: FillBlankExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    is_correct: boolean
    correct_answer?: string
    xp_earned: number
  } | null>(null)

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

          {!result.is_correct && (
            <button
              onClick={handleTryAgain}
              className="w-full px-4 py-2 bg-white text-red-700 border-2 border-red-200 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
