'use client'

import { useEffect, useState } from 'react'
import { ProfessorOverview } from '@/components/tutor/ProfessorOverview'
import { ProfessorReview } from '@/components/tutor/ProfessorReview'
import { LevelSelector } from '@/components/tutor/LevelSelector'
import { DialogView } from '@/components/tutor/DialogView'
import { ErrorPlayback } from '@/components/tutor/ErrorPlayback'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TutorPanelProps {
  textId: string | null
  language: 'es' | 'la'
}

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface DialogMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
  correction?: {
    hasErrors: boolean
    correctedText: string
    errors: Array<{
      errorText: string
      correction: string
      explanation: string
      category: 'grammar' | 'vocabulary' | 'syntax'
    }>
  }
}

interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
  category?: 'grammar' | 'vocabulary' | 'syntax'
}

export function TutorPanel({ textId, language }: TutorPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dialogActive, setDialogActive] = useState(false)
  const [messages, setMessages] = useState<DialogMessage[]>([])

  // Error playback state
  const [showErrors, setShowErrors] = useState(false)
  const [errors, setErrors] = useState<ErrorAnalysis[]>([])

  // Professor review state
  const [professorReview, setProfessorReview] = useState<any | null>(null)

  // Start dialog session
  const handleStartDialog = async () => {
    if (!selectedLevel || !textId) return

    try {
      setLoading(true)
      const response = await fetch('/api/tutor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textId: textId,
          level: selectedLevel,
          language: language
        })
      })

      if (!response.ok) throw new Error('Failed to start dialog')

      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages([{
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.aiMessage,
        turnNumber: data.turnNumber
      }])
      setDialogActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start dialog')
    } finally {
      setLoading(false)
    }
  }

  // End dialog and get errors
  const handleEndDialog = async () => {
    if (!sessionId || !selectedLevel) return

    try {
      setLoading(true)

      // Extract errors from per-turn corrections in messages
      const collectedErrors: ErrorAnalysis[] = []
      messages.forEach(msg => {
        if (msg.role === 'user' && msg.correction?.hasErrors) {
          msg.correction.errors.forEach(err => {
            collectedErrors.push({
              turn: msg.turnNumber,
              errorText: err.errorText,
              correction: err.correction,
              explanation: err.explanation,
              category: err.category
            })
          })
        }
      })

      setErrors(collectedErrors)

      // Generate professor review
      const reviewResponse = await fetch('/api/tutor/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          level: selectedLevel,
          language: language,
          errors: collectedErrors
        })
      })

      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json()
        setProfessorReview(reviewData.review)
      }

      setDialogActive(false)
      setShowErrors(true)

      // Show success toast
      const errorCount = collectedErrors.length
      if (errorCount === 0) {
        toast.success('¡Perfecto! No errors detected')
      } else {
        toast.success(
          `Analysis complete! Found ${errorCount} ${errorCount === 1 ? 'area' : 'areas'} for improvement`
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze conversation'
      setError(errorMessage)
      toast.error('Failed to analyze conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset and start new dialog
  const handleRestart = () => {
    setSessionId(null)
    setMessages([])
    setDialogActive(false)
    setShowErrors(false)
    setErrors([])
    setProfessorReview(null)
    setSelectedLevel(null)
  }

  if (!textId) {
    return (
      <div className="p-8 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-amber-900 mb-4">
            Save your text to the library first to use AI Tutor mode.
          </p>
          <p className="text-amber-700 text-sm">
            Click "Render Text" to save it, then return to the Tutor tab.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-xl font-serif text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => setError(null)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Professor Overview */}
      {!dialogActive && !showErrors && (
        <ProfessorOverview textId={textId} language={language} />
      )}

      {/* Level Selection (before dialog starts) */}
      {!dialogActive && !showErrors && (
        <div className="mb-8 space-y-6">
          <LevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
          <Button
            onClick={handleStartDialog}
            disabled={!selectedLevel || loading}
            className="w-full"
            size="lg"
          >
{loading ?
              (language === 'la' ? 'Starting...' : 'Iniciando...') :
              (language === 'la' ? 'Start Dialog' : 'Iniciar Diálogo')
            }
          </Button>
        </div>
      )}

      {/* Dialog Interface */}
      {dialogActive && sessionId && (
        <DialogView
          sessionId={sessionId}
          initialMessages={messages}
          onMessagesUpdate={setMessages}
          onEnd={handleEndDialog}
          language={language}
        />
      )}

      {/* Professor Review & Error Playback */}
      {showErrors && (
        <div className="space-y-6">
          {/* Professor Review (shown BEFORE transcript) */}
          {professorReview && (
            <ProfessorReview
              review={professorReview}
              errors={errors}
            />
          )}

          {/* Error Playback Transcript */}
          <ErrorPlayback
            sessionId={sessionId!}
            messages={messages}
            errors={errors}
          />

          <div className="flex gap-4">
            <Button onClick={handleRestart} variant="outline" className="flex-1">
              Start New Dialog
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
