'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Theater, X, Send, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Volume2, BookmarkPlus, Play } from 'lucide-react'
import { RoleSelector } from './RoleSelector'
import { LevelSelector } from '@/components/tutor/LevelSelector'
import { FlashcardSaveModal } from '@/components/shared/FlashcardSaveModal'
import type { CEFRLevel, TurnCorrection } from '@/types/tutor'

interface DialogExchange {
  id: string
  sequence_order: number
  speaker: string
  spanish: string
  english: string
}

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
  correction?: TurnCorrection
}

interface DialogRoleplayPanelProps {
  dialogId: string
  context: string
  setting?: string
  exchanges: DialogExchange[]
  courseDeckId?: string
  language?: 'es' | 'la'
  onClose: () => void
}

type RoleplayStage = 'selection' | 'active' | 'review'

export function DialogRoleplayPanel({
  dialogId,
  context,
  setting,
  exchanges,
  courseDeckId,
  language = 'es',
  onClose
}: DialogRoleplayPanelProps) {
  // DEBUG: Log courseDeckId prop
  console.log('[DialogRoleplayPanel] courseDeckId prop:', courseDeckId, 'language:', language)
  const [stage, setStage] = useState<RoleplayStage>('selection')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [oppositeCharacter, setOppositeCharacter] = useState('')
  const [professorReview, setProfessorReview] = useState<any>(null)
  const [isGeneratingReview, setIsGeneratingReview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // DEBUG: Log courseDeckId and language on mount and changes
  useEffect(() => {
    console.log('[DialogRoleplayPanel] courseDeckId prop:', courseDeckId, 'type:', typeof courseDeckId)
    console.log('[DialogRoleplayPanel] language prop:', language)
  }, [courseDeckId, language])

  // Extract unique speakers from exchanges
  const speakers = Array.from(new Set(exchanges.map(e => e.speaker)))

  const canStartRoleplay = selectedRole && selectedLevel
  const canSend = userInput.trim().length > 0 && !isSending

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartRoleplay = async () => {
    if (!canStartRoleplay) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/tutor/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogId,
          selectedRole,
          level: selectedLevel,
          language
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start roleplay session')
      }

      const data = await response.json()
      setSessionId(data.sessionId)
      setOppositeCharacter(data.oppositeCharacter)

      // Add first AI message
      setMessages([{
        id: '1',
        role: 'ai',
        content: data.aiMessage,
        turnNumber: 1
      }])

      setStage('active')
    } catch (error) {
      console.error('Start roleplay error:', error)
      alert('Failed to start roleplay. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSend || !sessionId) return

    setIsSending(true)
    const userMessage = userInput.trim()
    const currentTurn = messages.length + 1

    // Optimistically add user message
    const userMsg: Message = {
      id: `user-${currentTurn}`,
      role: 'user',
      content: userMessage,
      turnNumber: currentTurn
    }
    setMessages(prev => [...prev, userMsg])
    setUserInput('')

    try {
      const response = await fetch('/api/tutor/dialog/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userResponse: userMessage,
          language
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process turn')
      }

      const data = await response.json()

      // Update user message with correction
      setMessages(prev => prev.map(msg =>
        msg.id === userMsg.id
          ? { ...msg, correction: data.correction }
          : msg
      ))

      // Add AI response
      setMessages(prev => [...prev, {
        id: `ai-${data.turnNumber}`,
        role: 'ai',
        content: data.aiMessage,
        turnNumber: data.turnNumber
      }])

      // Check if should end
      if (data.shouldEnd) {
        setTimeout(() => handleEndSession(true), 2000)
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleEndSession = async (auto = false) => {
    if (!auto && !showEndConfirm) {
      setShowEndConfirm(true)
      return
    }

    setShowEndConfirm(false)
    setIsGeneratingReview(true)

    try {
      // Collect all errors from messages
      const allErrors = messages
        .filter(msg => msg.correction?.hasErrors)
        .flatMap(msg =>
          msg.correction!.errors.map(err => ({
            turn: msg.turnNumber,
            errorText: err.errorText,
            correction: err.correction,
            explanation: err.explanation,
            category: err.category
          }))
        )

      // Generate professor review
      const response = await fetch('/api/tutor/dialog/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          level: selectedLevel,
          errors: allErrors,
          language
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate review')
      }

      const reviewData = await response.json()
      setProfessorReview(reviewData)
      setStage('review')
    } catch (error) {
      console.error('Generate review error:', error)
      alert('Failed to generate professor review. Please try again.')
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-sepia-300 shadow-lg bg-white">
      <CardHeader className="bg-sepia-100 border-b border-sepia-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Theater className="h-6 w-6 text-sepia-700" />
            <CardTitle className="text-sepia-900">
              {stage === 'active' ? 'Dialog Practice' : 'Practice This Dialog'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sepia-600 hover:text-sepia-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 overflow-y-auto flex-1 bg-white">
        {stage === 'selection' && (
          <div className="space-y-6">
            {/* Context display */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Context:</p>
              <p className="text-sm text-blue-800 mb-3">{context}</p>
              {setting && (
                <>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Setting:</p>
                  <p className="text-sm text-blue-800">{setting}</p>
                </>
              )}
            </div>

            {/* Role selection */}
            <RoleSelector
              speakers={speakers}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />

            {/* Level selection */}
            <LevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleStartRoleplay}
                disabled={!canStartRoleplay || isLoading}
                className="flex-1 bg-sepia-700 hover:bg-sepia-800 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Roleplay'
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-sepia-300 text-sepia-700 hover:bg-sepia-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {stage === 'active' && (
          <div className="space-y-4">
            {/* Message history */}
            <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 border-blue-300' : 'bg-white border-sepia-200'} border-2 rounded-lg p-3`}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {msg.role === 'ai' ? oppositeCharacter : `You (${selectedRole})`}
                    </p>
                    <p className="text-sm text-gray-900">{msg.content}</p>

                    {msg.role === 'ai' && (
                      <AIMessageActions
                        messageId={msg.id}
                        content={msg.content}
                        courseDeckId={courseDeckId}
                      />
                    )}

                    {msg.correction && (
                      <CorrectionFeedback correction={msg.correction} courseDeckId={courseDeckId} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type your line as ${selectedRole}... (Press Enter to send)`}
                className="resize-none"
                rows={3}
                disabled={isSending}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!canSend}
                  className="flex-1 bg-sepia-700 hover:bg-sepia-800 text-white"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleEndSession()}
                  variant={isGeneratingReview ? "default" : "outline"}
                  disabled={isGeneratingReview}
                  className={`transition-all duration-200 ${
                    isGeneratingReview
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg scale-105 border-red-600'
                      : 'border-red-500 bg-white text-red-700 hover:bg-red-50'
                  }`}
                >
                  {isGeneratingReview ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span className="font-medium">
                        {language === 'la' ? 'Processing...' : 'Procesando...'}
                      </span>
                    </>
                  ) : (
                    language === 'la' ? 'End Dialog' : 'Terminar Diálogo'
                  )}
                </Button>
              </div>
            </form>

            {/* End confirmation modal */}
            {showEndConfirm && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4 bg-white">
                  <CardHeader className="bg-white">
                    <CardTitle>End Dialog Practice?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 bg-white">
                    {isGeneratingReview ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-sepia-700" />
                        <p className="text-sm text-gray-700">Professor is reviewing your practice...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700">
                          Are you sure you want to end now? You can continue practicing to get more feedback.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowEndConfirm(false)}
                            variant="outline"
                            className="flex-1 bg-white"
                          >
                            Keep Practicing
                          </Button>
                          <Button
                            onClick={() => handleEndSession(true)}
                            disabled={isGeneratingReview}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isGeneratingReview ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generating Review...
                              </>
                            ) : (
                              'End & Review'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {stage === 'review' && (
          <div className="space-y-6">
            {isGeneratingReview ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-sepia-600 mb-4" />
                <p className="text-sepia-700 font-medium">Generating your personalized review...</p>
                <p className="text-sm text-sepia-500 mt-2">Professor is analyzing your performance</p>
              </div>
            ) : professorReview ? (
              <>
                {/* Rating Badge */}
                <div className="flex justify-center">
                  <div className={`px-6 py-3 rounded-full text-center ${
                    professorReview.rating === 'Excelente' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                    professorReview.rating === 'Muy Bien' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                    professorReview.rating === 'Bien' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                    'bg-orange-100 text-orange-800 border-2 border-orange-300'
                  }`}>
                    <p className="text-2xl font-bold">{professorReview.rating}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Overall Assessment</p>
                  <p className="text-sm text-blue-800">{professorReview.summary}</p>
                </div>

                {/* Error Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{professorReview.errorBreakdown.grammar}</p>
                    <p className="text-xs text-red-600 font-medium">Grammar</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{professorReview.errorBreakdown.vocabulary}</p>
                    <p className="text-xs text-purple-600 font-medium">Vocabulary</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{professorReview.errorBreakdown.syntax}</p>
                    <p className="text-xs text-indigo-600 font-medium">Syntax</p>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-3">Strengths 💪</p>
                  <ul className="space-y-2">
                    {professorReview.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-3">Focus Areas 🎯</p>
                  <ul className="space-y-2">
                    {professorReview.improvements.map((improvement: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Error Playback Transcript - Story 10.6 */}
                {messages.some(msg => msg.correction?.hasErrors) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Error Playback 🔊</p>
                    <div className="space-y-3">
                      {messages
                        .filter(msg => msg.correction?.hasErrors)
                        .flatMap(msg =>
                          msg.correction!.errors.map((err, errIdx) => (
                            <ErrorPlayback
                              key={`${msg.id}-${errIdx}`}
                              turnNumber={msg.turnNumber}
                              errorText={err.errorText}
                              correction={err.correction}
                              explanation={err.explanation}
                              category={err.category}
                            />
                          ))
                        )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      // Reset to selection stage for another try
                      setStage('selection')
                      setMessages([])
                      setUserInput('')
                      setProfessorReview(null)
                      setSessionId(null)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Practice Again
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-sepia-600 py-8">
                <p>No review data available</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AIMessageActions({ messageId, content, courseDeckId }: { messageId: string, content: string, courseDeckId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const playAudio = async () => {
    try {
      setIsPlaying(true)

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })

      if (!response.ok) throw new Error('Failed to synthesize audio')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
    }
  }

  const saveToFlashcard = async () => {
    if (!courseDeckId) {
      alert('Course deck not available. Please ensure you accessed this lesson from a course.')
      return
    }

    setIsSaving(true)

    try {
      console.log('Saving flashcard with deck_id:', courseDeckId)
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: courseDeckId,
          card_type: 'basic',
          front: content,
          back: '(Dialog practice phrase)',
          source: 'dialog_roleplay',
          source_id: null // Message ID is not a valid UUID, set to null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save flashcard')
      }

      setIsSaved(true)
    } catch (error) {
      console.error('Save flashcard error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save flashcard'
      alert(`Error: ${errorMessage}. Make sure you're viewing this from a course lesson.`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
      <button
        onClick={playAudio}
        disabled={isPlaying}
        className="p-1 text-sepia-700 hover:bg-sepia-100 rounded transition-colors disabled:opacity-50"
        title="Play audio"
      >
        {isPlaying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Volume2 className="h-3 w-3" />
        )}
      </button>

      {courseDeckId && (
        <button
          onClick={saveToFlashcard}
          disabled={isSaved || isSaving}
          className="p-1 text-sepia-700 hover:bg-sepia-100 rounded transition-colors disabled:opacity-50"
          title={isSaved ? 'Saved to deck' : 'Save to flashcard deck'}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isSaved ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <BookmarkPlus className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  )
}

function CorrectionFeedback({ correction, courseDeckId }: { correction: TurnCorrection, courseDeckId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedErrors, setSavedErrors] = useState<Set<number>>(new Set())
  const [savingError, setSavingError] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedError, setSelectedError] = useState<{
    errorText: string
    correction: string
    explanation: string
    category: string
    idx: number
  } | null>(null)

  // DEBUG: Log when corrections are displayed
  console.log('[CorrectionFeedback] hasErrors:', correction.hasErrors, 'courseDeckId:', courseDeckId, 'errorsCount:', correction.errors?.length)

  const saveToFlashcard = async (errorText: string, correction: string, idx: number) => {
    if (!courseDeckId) {
      alert('Course deck not available')
      return
    }

    setSavingError(idx)

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: courseDeckId,
          card_type: 'basic',
          front: errorText,
          back: correction,
          source: 'dialog_roleplay',
          source_id: `error_${idx}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save flashcard')
      }

      setSavedErrors(prev => new Set(prev).add(idx))
    } catch (error) {
      console.error('Save flashcard error:', error)
      alert('Failed to save flashcard. Please try again.')
    } finally {
      setSavingError(null)
    }
  }

  const handleMobileSave = (err: any, idx: number) => {
    setSelectedError({
      errorText: err.errorText,
      correction: err.correction,
      explanation: err.explanation,
      category: err.category,
      idx
    })
    setShowModal(true)
  }

  const handleModalSave = () => {
    if (selectedError) {
      // Mark as saved
      setSavedErrors(prev => new Set(prev).add(selectedError.idx))
    }
    setShowModal(false)
    setSelectedError(null)
  }

  if (!correction.hasErrors) {
    return (
      <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
        <CheckCircle className="h-3 w-3" />
        <span>No errors detected</span>
        {/* DEBUG: Show courseDeckId status */}
        <span className="text-gray-500 text-[10px] ml-2">
          (Deck: {courseDeckId ? 'Available' : 'Missing'})
        </span>
      </div>
    )
  }

  return (
    <div className="mt-2 border-t border-gray-200 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 w-full"
      >
        <AlertCircle className="h-3 w-3" />
        <span>{correction.errors.length} error{correction.errors.length > 1 ? 's' : ''} detected</span>
        {isExpanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {correction.errors.map((err, idx) => (
            <div key={idx} className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p><strong>Error:</strong> {err.errorText}</p>
                  <p className="text-green-700"><strong>Correction:</strong> {err.correction}</p>
                  <p className="text-gray-600 italic">{err.explanation}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 rounded text-[10px] font-semibold">
                    {err.category}
                  </span>
                </div>
                {courseDeckId && (
                  <>
                    {/* Desktop/Tablet: Show full button (md and up) */}
                    <button
                      onClick={() => saveToFlashcard(err.errorText, err.correction, idx)}
                      disabled={savedErrors.has(idx) || savingError === idx}
                      className="hidden md:block p-1 text-sepia-700 hover:bg-sepia-100 rounded transition-colors disabled:opacity-50"
                      title={savedErrors.has(idx) ? 'Saved to deck' : 'Save to flashcard deck'}
                    >
                      {savingError === idx ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : savedErrors.has(idx) ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <BookmarkPlus className="h-3 w-3" />
                      )}
                    </button>

                    {/* Mobile: Show icon only (below md) */}
                    <button
                      onClick={() => handleMobileSave(err, idx)}
                      disabled={savedErrors.has(idx)}
                      className="md:hidden p-1 text-sepia-700 hover:bg-sepia-100 rounded-full transition-colors disabled:opacity-50"
                      title={savedErrors.has(idx) ? 'Saved to deck' : 'Save to flashcard'}
                    >
                      {savedErrors.has(idx) ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <BookmarkPlus className="h-3 w-3" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Flashcard Save Modal */}
      {selectedError && (
        <FlashcardSaveModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedError(null)
          }}
          onSave={handleModalSave}
          saveData={{
            front: selectedError.errorText,
            back: selectedError.correction,
            source: 'dialog_roleplay',
            sourceId: `error_${selectedError.idx}`,
            deckId: courseDeckId
          }}
          errorText={selectedError.errorText}
          correction={selectedError.correction}
          explanation={selectedError.explanation}
          category={selectedError.category as 'grammar' | 'vocabulary' | 'syntax'}
        />
      )}
    </div>
  )
}

function ErrorPlayback({
  turnNumber,
  errorText,
  correction,
  explanation,
  category
}: {
  turnNumber: number
  errorText: string
  correction: string
  explanation: string
  category: string
}) {
  const [playingError, setPlayingError] = useState(false)
  const [playingCorrection, setPlayingCorrection] = useState(false)

  const playAudio = async (text: string, isError: boolean) => {
    const setter = isError ? setPlayingError : setPlayingCorrection

    try {
      setter(true)

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error('Failed to synthesize audio')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setter(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Audio playback error:', error)
      setter(false)
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">Turn {turnNumber}</span>
        <span className="text-[10px] px-2 py-0.5 bg-gray-200 rounded font-semibold text-gray-700">
          {category}
        </span>
      </div>

      {/* Original Error */}
      <div className="bg-red-50 border border-red-200 rounded p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-900 mb-1">❌ What you said:</p>
            <p className="text-sm text-red-800">{errorText}</p>
          </div>
          <button
            onClick={() => playAudio(errorText, true)}
            disabled={playingError}
            className="p-1.5 text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
            title="Play audio"
          >
            {playingError ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Correction */}
      <div className="bg-green-50 border border-green-200 rounded p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-900 mb-1">✅ Should be:</p>
            <p className="text-sm text-green-800">{correction}</p>
          </div>
          <button
            onClick={() => playAudio(correction, false)}
            disabled={playingCorrection}
            className="p-1.5 text-green-700 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
            title="Play audio"
          >
            {playingCorrection ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded p-2">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Why:</p>
        <p className="text-xs text-blue-800 italic">{explanation}</p>
      </div>
    </div>
  )
}
