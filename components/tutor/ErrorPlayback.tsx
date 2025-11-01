'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { ErrorTooltip } from './ErrorTooltip'
import { AudioButton } from './AudioButton'

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

interface ErrorPlaybackProps {
  sessionId: string
  messages: DialogMessage[]
  errors: ErrorAnalysis[]
}

export function ErrorPlayback({
  sessionId,
  messages,
  errors
}: ErrorPlaybackProps) {
  const [selectedError, setSelectedError] = useState<ErrorAnalysis | null>(null)

  // Find errors for a specific turn
  const getErrorsForTurn = (turnNumber: number): ErrorAnalysis[] => {
    return errors.filter(e => e.turn === turnNumber)
  }

  // Check if message has errors
  const hasErrors = (message: DialogMessage): boolean => {
    if (message.role !== 'user') return false
    return getErrorsForTurn(message.turnNumber).length > 0
  }

  // Escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // Highlight errors in message content
  const highlightErrors = (message: DialogMessage) => {
    if (message.role !== 'user') return message.content

    const messageErrors = getErrorsForTurn(message.turnNumber)
    if (messageErrors.length === 0) return message.content

    let highlighted = message.content

    // Sort errors by length (longest first) to avoid nested replacements
    const sortedErrors = [...messageErrors]
      .map((error, idx) => ({ error, idx }))
      .sort((a, b) => b.error.errorText.length - a.error.errorText.length)

    // Replace each error with marked version using regex global flag
    sortedErrors.forEach(({ error, idx }) => {
      const escapedText = escapeRegex(error.errorText)
      const regex = new RegExp(escapedText, 'g')
      const errorSpan = `<mark class="bg-red-100 border-b-2 border-red-500 cursor-pointer hover:bg-red-200" data-error-idx="${idx}">${error.errorText}</mark>`
      highlighted = highlighted.replace(regex, errorSpan)
    })

    return highlighted
  }

  const handleSaveFlashcard = async (error: ErrorAnalysis) => {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: error.errorText,
          back: error.correction,
          notes: error.explanation,
          source: 'tutor_session',
          sourceId: sessionId
        })
      })

      if (response.ok) {
        // Could show success toast
        console.log('Flashcard saved')
      }
    } catch (error) {
      console.error('Failed to save flashcard:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Transcript with Error Highlighting */}
      <Card className="bg-white border-sepia-200">
        <CardHeader>
          <CardTitle className="text-sepia-900">Conversation Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'ai'
                      ? 'bg-sepia-100 text-sepia-900'
                      : hasErrors(message)
                      ? 'bg-red-50 text-sepia-900 border-2 border-red-200'
                      : 'bg-green-50 text-sepia-900 border-2 border-green-200'
                  }`}
                >
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: highlightErrors(message)
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName === 'MARK') {
                        const errorIdx = parseInt(
                          target.getAttribute('data-error-idx') || '0'
                        )
                        const messageErrors = getErrorsForTurn(message.turnNumber)
                        setSelectedError(messageErrors[errorIdx])
                      }
                    }}
                  />
                </div>

                {/* Audio button for AI messages */}
                {message.role === 'ai' && (
                  <AudioButton
                    text={message.content}
                    messageId={message.id}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Error Tooltip Modal */}
      {selectedError && (
        <ErrorTooltip
          error={selectedError}
          onClose={() => setSelectedError(null)}
          onSave={() => handleSaveFlashcard(selectedError)}
        />
      )}
    </div>
  )
}
