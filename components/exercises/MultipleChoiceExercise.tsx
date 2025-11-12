'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface MultipleChoiceExerciseProps {
  exerciseId: string
  prompt: string
  choices: string[]
  correctAnswer: string
  spanishText?: string
  englishText?: string
  courseDeckId?: string
  onComplete?: (isCorrect: boolean, xpEarned: number) => void
  previewMode?: boolean
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
  const [selectedChoice, setSelectedChoice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChoice.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/exercises/${exerciseId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: selectedChoice })
      })

      if (!response.ok) {
        throw new Error('Failed to validate exercise')
      }

      const data = await response.json()
      setResult(data)

      if (onComplete) {
        onComplete(data.is_correct, data.xp_earned || 0)
      }
    } catch (error) {
      console.error('Error validating exercise:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChoiceClick = (choice: string) => {
    if (result) return // Prevent changes after submission
    setSelectedChoice(choice)
  }

  return (
    <div className="bg-white border border-sepia-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-sepia-900 mb-4">{prompt}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleChoiceClick(choice)}
              disabled={isSubmitting || !!result}
              className={`
                w-full p-3 text-left border rounded-md transition-colors
                ${selectedChoice === choice
                  ? 'border-sepia-400 bg-sepia-50'
                  : 'border-sepia-200 hover:border-sepia-300'
                }
                ${result ?
                  (choice === correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : selectedChoice === choice && choice !== correctAnswer
                    ? 'border-red-500 bg-red-50'
                    : ''
                  ) : ''
                }
                disabled:opacity-50
              `}
            >
              {choice}
              {result && choice === correctAnswer && (
                <CheckCircle className="inline ml-2 h-4 w-4 text-green-600" />
              )}
              {result && selectedChoice === choice && choice !== correctAnswer && (
                <XCircle className="inline ml-2 h-4 w-4 text-red-600" />
              )}
            </button>
          ))}
        </div>

        {!result && (
          <button
            type="submit"
            disabled={!selectedChoice || isSubmitting}
            className="w-full bg-sepia-700 text-white py-2 px-4 rounded-md hover:bg-sepia-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Checking...
              </>
            ) : (
              'Submit Answer'
            )}
          </button>
        )}

        {result && (
          <div className={`p-4 rounded-md ${result.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {result.is_correct ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                {result.is_correct ? 'Correct!' : 'Incorrect'}
              </span>
              {!result.is_correct && (
                <span className="text-red-700">
                  The correct answer was: "{correctAnswer}"
                </span>
              )}
            </div>

            {result.xp_earned > 0 && (
              <p className="text-sm text-green-700 mt-1">
                +{result.xp_earned} XP earned!
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}