'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfessorOverview } from '@/components/tutor/ProfessorOverview'
import { LevelSelector } from '@/components/tutor/LevelSelector'
import { DialogView } from '@/components/tutor/DialogView'
import { ErrorPlayback } from '@/components/tutor/ErrorPlayback'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface TutorPageProps {
  params: Promise<{ textId: string }>
}

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface LibraryText {
  id: string
  title: string
  content: string
  language: string
}

interface DialogMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
}

interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

export default function TutorPage({ params }: TutorPageProps) {
  const router = useRouter()
  const [textId, setTextId] = useState<string>('')
  const [text, setText] = useState<LibraryText | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dialogActive, setDialogActive] = useState(false)
  const [messages, setMessages] = useState<DialogMessage[]>([])

  // Error playback state
  const [showErrors, setShowErrors] = useState(false)
  const [errors, setErrors] = useState<ErrorAnalysis[]>([])

  // Unwrap params promise
  useEffect(() => {
    params.then(p => setTextId(p.textId))
  }, [params])

  // Fetch library text
  useEffect(() => {
    if (!textId) return

    async function fetchText() {
      try {
        const response = await fetch(`/api/library/${textId}`)
        if (!response.ok) throw new Error('Text not found')

        const data = await response.json()
        setText(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load text')
      } finally {
        setLoading(false)
      }
    }

    fetchText()
  }, [textId])

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
          level: selectedLevel
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
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await fetch('/api/tutor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) throw new Error('Failed to analyze errors')

      const data = await response.json()
      setErrors(data.errors)
      setDialogActive(false)
      setShowErrors(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze conversation')
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
  }

  if (loading && !text) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-sepia-200 rounded w-3/4"></div>
          <div className="h-32 bg-sepia-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !text) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-serif text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error || 'Text not found'}</p>
          <Button
            onClick={() => router.push('/library')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/library')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
          <h1 className="text-3xl font-serif text-sepia-900">
            AI Tutor: {text.title}
          </h1>
        </div>
      </div>

      {/* Professor Overview */}
      {!dialogActive && !showErrors && textId && text && (
        <ProfessorOverview
          textId={textId}
          language={(text.language as 'es' | 'la') || 'es'}
        />
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
            {loading ? 'Starting...' : 'Start Dialog'}
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
        />
      )}

      {/* Error Playback */}
      {showErrors && (
        <div className="space-y-6">
          <ErrorPlayback
            sessionId={sessionId!}
            messages={messages}
            errors={errors}
          />
          <div className="flex gap-4">
            <Button onClick={handleRestart} variant="outline" className="flex-1">
              Start New Dialog
            </Button>
            <Button onClick={() => router.push('/library')} className="flex-1">
              Back to Library
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
