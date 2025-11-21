'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface TranslationExerciseProps {
  exerciseId: string
  prompt: string
  correctAnswer: string
  spanishText?: string
  englishText?: string
  direction?: 'en_to_es' | 'es_to_en' | null
  courseDeckId?: string
  onComplete?: (isCorrect: boolean, xpEarned: number) => void
  previewMode?: boolean
}

interface ExerciseResult {
  is_correct: boolean
  correct_answer?: string
  xp_earned: number
}

export default function TranslationExercise({
  exerciseId,
  prompt,
  correctAnswer,
  spanishText,
  englishText,
  direction,
  courseDeckId,
  onComplete,
  previewMode = false
}: TranslationExerciseProps) {
  const [userTranslation, setUserTranslation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userTranslation.trim()) return

    setIsSubmitting(true)

    try {
      if (previewMode) {
        // Mock response in preview mode - simulate correct/incorrect based on actual answer
        const isCorrect = correctAnswer && userTranslation.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
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
        // Real API call in non-preview mode
        const response = await fetch(`/api/exercises/${exerciseId}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: userTranslation.trim() })
        })

        if (!response.ok) {
          throw new Error('Failed to validate exercise')
        }

        const data = await response.json()
        setResult(data)

        if (onComplete) {
          onComplete(data.is_correct, data.xp_earned || 0)
        }
      }
    } catch (error) {
      console.error('Error validating exercise:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDirectionLabel = () => {
    return '✏️ Translation Exercise'
  }

  const getTextToTranslate = () => {
    if (direction === 'en_to_es' && englishText) return englishText
    if (direction === 'es_to_en' && spanishText) return spanishText
    return prompt.replace(/^Translate to [^:]+:\s*/, '').replace('Translate from English.', '').replace('Translate:', '').replace(/^["']|["']$/g, '').trim()
  }

  return (
    <div className="bg-white border border-sepia-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-sepia-900 mb-2">{getDirectionLabel()}</h3>
        <div className="p-3 bg-gray-50 rounded-md border">
          <p className="text-sepia-800 font-medium">{getTextToTranslate()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`translation-${exerciseId}`} className="block text-sm font-medium text-sepia-700 mb-2">
            Your translation:
          </label>
          <textarea
            id={`translation-${exerciseId}`}
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
            disabled={isSubmitting || !!result}
            className="w-full p-3 border border-sepia-200 rounded-md focus:ring-2 focus:ring-sepia-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
            rows={3}
            placeholder="Enter your translation here..."
          />
        </div>

        {!result && (
          <button
            type="submit"
            disabled={!userTranslation.trim() || isSubmitting}
            className="w-full bg-sepia-700 text-white py-2 px-4 rounded-md hover:bg-sepia-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Checking...
              </>
            ) : (
              'Submit Translation'
            )}
          </button>
        )}

        {result && (
          <div className={`p-4 rounded-md ${result.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.is_correct ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                {result.is_correct ? 'Correct!' : 'Close, but not quite right'}
              </span>
            </div>

            {!result.is_correct && (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-red-700">Your answer:</span>
                  <p className="text-red-600 bg-red-100 p-2 rounded">{userTranslation}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-green-700">Correct answer:</span>
                  <p className="text-green-600 bg-green-100 p-2 rounded">{correctAnswer}</p>
                </div>
              </div>
            )}

            {result.xp_earned > 0 && (
              <p className="text-sm text-green-700 mt-2">
                +{result.xp_earned} XP earned!
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}