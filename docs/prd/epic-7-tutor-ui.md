# Epic 7: Tutor Mode UI & Error Feedback

**Status**: 🚧 In Progress
**Priority**: P0 - Critical (Killer Feature)
**Sprint**: 4-Day MVP Launch (Day 3)
**Estimated Effort**: 8 hours

---

## Overview

Build the user interface for AI Tutor Mode, including dialog interface, error playback with corrections, and professor overview. This is the "holy shit" moment that makes users freak out.

**Key Features**:
- Chat-style conversation interface with real-time feedback
- Voice input via Web Speech API for speaking practice
- Error highlighting with detailed explanations
- Professor overview with text analysis
- Mobile-first responsive design

---

## User Stories

### 7.1: Route and Page Structure
**As a** developer
**I want** proper page routing and layout structure
**So that** tutor mode is accessible from library texts

**Acceptance Criteria**:
- [ ] Dynamic route `/tutor/[textId]` created
- [ ] Page fetches library text data on mount
- [ ] Loading state while text loads
- [ ] Error state if text not found
- [ ] Proper TypeScript types for all components
- [ ] Navigation back to library from tutor page

**Implementation**: `app/tutor/[textId]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LibraryText } from '@/types/library'
import { ProfessorOverview as ProfessorOverviewType } from '@/lib/tutor-tools'
import { ProfessorOverview } from '@/components/tutor/ProfessorOverview'
import { LevelSelector } from '@/components/tutor/LevelSelector'
import { DialogView } from '@/components/tutor/DialogView'
import { ErrorPlayback } from '@/components/tutor/ErrorPlayback'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface TutorPageProps {
  params: { textId: string }
}

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

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

  // Fetch library text
  useEffect(() => {
    async function fetchText() {
      try {
        const response = await fetch(`/api/library/${params.textId}`)
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
  }, [params.textId])

  // Start dialog session
  const handleStartDialog = async () => {
    if (!selectedLevel) return

    try {
      setLoading(true)
      const response = await fetch('/api/tutor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textId: params.textId,
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
      {!dialogActive && !showErrors && (
        <ProfessorOverview textId={params.textId} />
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
```

**File Location**: `app/tutor/[textId]/page.tsx`

---

### 7.2: Professor Overview Component
**As a** language learner
**I want** a high-level summary of what to focus on
**So that** I understand the text's learning objectives before practicing

**Acceptance Criteria**:
- [ ] Collapsible card displays overview
- [ ] Shows text summary (2-3 sentences)
- [ ] Lists grammar concepts
- [ ] Lists vocabulary themes
- [ ] Lists syntax patterns
- [ ] Loading skeleton while generating
- [ ] Cached after first load
- [ ] Expand/collapse animation

**Implementation**: `components/tutor/ProfessorOverview.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfessorOverviewType {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}

interface ProfessorOverviewProps {
  textId: string
}

export function ProfessorOverview({ textId }: ProfessorOverviewProps) {
  const [overview, setOverview] = useState<ProfessorOverviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    async function fetchOverview() {
      try {
        const response = await fetch('/api/tutor/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textId })
        })

        if (!response.ok) throw new Error('Failed to load overview')

        const data = await response.json()
        setOverview(data.overview)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [textId])

  if (loading) {
    return (
      <Card className="mb-6 bg-sepia-50 border-sepia-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            <BookOpen className="h-5 w-5" />
            Professor's Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 animate-pulse">
          <div className="h-4 bg-sepia-200 rounded w-full"></div>
          <div className="h-4 bg-sepia-200 rounded w-5/6"></div>
          <div className="h-4 bg-sepia-200 rounded w-4/6"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || !overview) {
    return (
      <Card className="mb-6 bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-700 text-sm">
            {error || 'Could not load overview'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-sepia-50 border-sepia-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            <BookOpen className="h-5 w-5" />
            Professor's Overview
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-semibold text-sepia-900 mb-2">Summary</h3>
            <p className="text-sepia-700 leading-relaxed">{overview.summary}</p>
          </div>

          {/* Grammar Concepts */}
          <div>
            <h3 className="font-semibold text-sepia-900 mb-2">
              Key Grammar Concepts
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sepia-700">
              {overview.grammarConcepts.map((concept, idx) => (
                <li key={idx}>{concept}</li>
              ))}
            </ul>
          </div>

          {/* Vocabulary Themes */}
          <div>
            <h3 className="font-semibold text-sepia-900 mb-2">
              Vocabulary Themes
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sepia-700">
              {overview.vocabThemes.map((theme, idx) => (
                <li key={idx}>{theme}</li>
              ))}
            </ul>
          </div>

          {/* Syntax Patterns */}
          <div>
            <h3 className="font-semibold text-sepia-900 mb-2">
              Notable Syntax Patterns
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sepia-700">
              {overview.syntaxPatterns.map((pattern, idx) => (
                <li key={idx}>{pattern}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
```

**File Location**: `components/tutor/ProfessorOverview.tsx`

---

### 7.3: Level Selector Component
**As a** language learner
**I want to** select my CEFR proficiency level
**So that** the AI adjusts conversation difficulty appropriately

**Acceptance Criteria**:
- [ ] Displays A1-C2 level buttons
- [ ] Shows description for each level
- [ ] Visual feedback on selection
- [ ] Clear indication of selected level
- [ ] Keyboard accessible

**Implementation**: `components/tutor/LevelSelector.tsx`

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface LevelSelectorProps {
  selectedLevel: CEFRLevel | null
  onSelectLevel: (level: CEFRLevel) => void
}

const LEVELS: Array<{
  level: CEFRLevel
  label: string
  description: string
}> = [
  {
    level: 'A1',
    label: 'A1 - Beginner',
    description: 'Basic phrases, simple questions'
  },
  {
    level: 'A2',
    label: 'A2 - Elementary',
    description: 'Common expressions, simple conversations'
  },
  {
    level: 'B1',
    label: 'B1 - Intermediate',
    description: 'Familiar topics, personal interests'
  },
  {
    level: 'B2',
    label: 'B2 - Upper Intermediate',
    description: 'Complex topics, detailed explanations'
  },
  {
    level: 'C1',
    label: 'C1 - Advanced',
    description: 'Nuanced discussions, abstract concepts'
  },
  {
    level: 'C2',
    label: 'C2 - Proficient',
    description: 'Near-native fluency, all contexts'
  }
]

export function LevelSelector({ selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <Card className="bg-sepia-50 border-sepia-200">
      <CardHeader>
        <CardTitle className="text-sepia-900">Select Your Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEVELS.map(({ level, label, description }) => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              className={`h-auto flex-col items-start p-4 ${
                selectedLevel === level
                  ? 'bg-sepia-700 text-white border-sepia-700'
                  : 'border-sepia-300 hover:bg-sepia-100'
              }`}
              onClick={() => onSelectLevel(level)}
            >
              <span className="font-semibold text-base mb-1">{label}</span>
              <span className="text-xs font-normal opacity-80">
                {description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**File Location**: `components/tutor/LevelSelector.tsx`

---

### 7.4: Dialog View Component
**As a** language learner
**I want to** converse with AI in a chat-style interface
**So that** I can practice writing Spanish in context

**Acceptance Criteria**:
- [ ] Chat-style message list
- [ ] AI messages on left, user messages on right
- [ ] Text input at bottom
- [ ] Voice input button (Web Speech API)
- [ ] Send button submits response
- [ ] Loading indicator during AI response
- [ ] Auto-scroll to bottom on new messages
- [ ] "End Dialog" button always visible
- [ ] Conversation history maintained

**Implementation**: `components/tutor/DialogView.tsx`

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInput } from './VoiceInput'

interface DialogMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
}

interface DialogViewProps {
  sessionId: string
  initialMessages: DialogMessage[]
  onMessagesUpdate: (messages: DialogMessage[]) => void
  onEnd: () => void
}

export function DialogView({
  sessionId,
  initialMessages,
  onMessagesUpdate,
  onEnd
}: DialogViewProps) {
  const [messages, setMessages] = useState<DialogMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update parent messages
  useEffect(() => {
    onMessagesUpdate(messages)
  }, [messages, onMessagesUpdate])

  // Send user response
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: DialogMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      turnNumber: messages.length + 1
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userResponse: userMessage.content
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      const aiMessage: DialogMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.aiMessage,
        turnNumber: data.turnNumber
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Send error:', error)
      // Could show error toast here
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript)
    setVoiceActive(false)
  }

  return (
    <div className="space-y-4">
      {/* Messages Container */}
      <Card className="bg-white border-sepia-200">
        <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'ai'
                    ? 'bg-sepia-100 text-sepia-900'
                    : 'bg-sepia-700 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-sepia-100 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sepia-600" />
                <span className="text-sepia-600 text-sm">
                  El tutor está pensando...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu respuesta en español..."
            className="min-h-[80px] resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onActiveChange={setVoiceActive}
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
          <Button
            onClick={onEnd}
            variant="outline"
            disabled={loading}
          >
            Terminar Dialog
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**File Location**: `components/tutor/DialogView.tsx`

---

### 7.5: Voice Input Component
**As a** language learner
**I want to** practice speaking Spanish aloud
**So that** I can work on pronunciation while writing

**Acceptance Criteria**:
- [ ] Microphone button activates voice recognition
- [ ] Visual feedback when listening (pulsing icon)
- [ ] Web Speech API configured for Spanish (es-ES)
- [ ] Transcript appended to text input
- [ ] Graceful fallback if API unavailable
- [ ] Error handling for recognition failures
- [ ] Works on Chrome/Edge (full support)

**Implementation**: `components/tutor/VoiceInput.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onActiveChange?: (active: boolean) => void
  disabled?: boolean
  language?: string
}

export function VoiceInput({
  onTranscript,
  onActiveChange,
  disabled = false,
  language = 'es-ES'
}: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setSupported(true)
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.lang = language
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.maxAlternatives = 1

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          onTranscript(transcript)
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setListening(false)
          onActiveChange?.(false)
        }

        recognitionInstance.onend = () => {
          setListening(false)
          onActiveChange?.(false)
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [language, onTranscript, onActiveChange])

  const startListening = () => {
    if (recognition && !listening) {
      try {
        recognition.start()
        setListening(true)
        onActiveChange?.(true)
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognition && listening) {
      recognition.stop()
      setListening(false)
      onActiveChange?.(false)
    }
  }

  if (!supported) {
    return null // Hide button if not supported
  }

  return (
    <Button
      type="button"
      variant={listening ? 'default' : 'outline'}
      size="icon"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      className={listening ? 'animate-pulse' : ''}
      title={listening ? 'Stop listening' : 'Start voice input'}
    >
      {listening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}
```

**File Location**: `components/tutor/VoiceInput.tsx`

---

### 7.6: Error Playback Component
**As a** language learner
**I want to** see my mistakes highlighted after conversation
**So that** I can learn from specific errors with context

**Acceptance Criteria**:
- [ ] Displays full conversation transcript
- [ ] User messages with errors have red underline
- [ ] Click error shows detailed tooltip
- [ ] Tooltip shows: error text, correction, explanation
- [ ] "Save as flashcard" button per error
- [ ] Clear visual distinction between correct/incorrect
- [ ] No errors message if conversation was perfect

**Implementation**: `components/tutor/ErrorPlayback.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { ErrorTooltip } from './ErrorTooltip'

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

  // Highlight errors in message content
  const highlightErrors = (message: DialogMessage) => {
    if (message.role !== 'user') return message.content

    const messageErrors = getErrorsForTurn(message.turnNumber)
    if (messageErrors.length === 0) return message.content

    let highlighted = message.content

    // Replace each error with marked version
    messageErrors.forEach((error, idx) => {
      const errorSpan = `<mark class="bg-red-100 border-b-2 border-red-500 cursor-pointer hover:bg-red-200" data-error-idx="${idx}">${error.errorText}</mark>`
      highlighted = highlighted.replace(error.errorText, errorSpan)
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
      {/* Summary Card */}
      <Card className="bg-sepia-50 border-sepia-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sepia-900">
            {errors.length === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                ¡Perfecto! No errors detected
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Found {errors.length} {errors.length === 1 ? 'error' : 'errors'} to review
              </>
            )}
          </CardTitle>
        </CardHeader>
        {errors.length > 0 && (
          <CardContent>
            <p className="text-sepia-700 text-sm">
              Click on underlined text to see corrections and explanations.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Transcript with Error Highlighting */}
      <Card className="bg-white border-sepia-200">
        <CardHeader>
          <CardTitle className="text-sepia-900">Conversation Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
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
```

**File Location**: `components/tutor/ErrorPlayback.tsx`

---

### 7.7: Error Tooltip Component
**As a** language learner
**I want** detailed feedback on each error
**So that** I understand exactly what I did wrong and how to fix it

**Acceptance Criteria**:
- [ ] Modal overlay displays error details
- [ ] Shows original error text
- [ ] Shows correction
- [ ] Shows explanation in Spanish
- [ ] "Save as flashcard" button functional
- [ ] Close button dismisses modal
- [ ] Click outside closes modal

**Implementation**: `components/tutor/ErrorTooltip.tsx`

```typescript
'use client'

import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

interface ErrorTooltipProps {
  error: ErrorAnalysis
  onClose: () => void
  onSave: () => void
}

export function ErrorTooltip({ error, onClose, onSave }: ErrorTooltipProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-sepia-900">Error Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Your Error */}
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700">Tu error:</h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-900 font-medium">{error.errorText}</p>
            </div>
          </div>

          {/* Correction */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">Corrección:</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-900 font-medium">{error.correction}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sepia-700">Explicación:</h4>
            <div className="bg-sepia-50 border border-sepia-200 rounded-lg p-3">
              <p className="text-sepia-900 leading-relaxed">
                {error.explanation}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button onClick={() => { onSave(); onClose(); }}>
            <Save className="mr-2 h-4 w-4" />
            Guardar como flashcard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**File Location**: `components/tutor/ErrorTooltip.tsx`

---

## Technical Specification

### Component Dependencies

```json
{
  "dependencies": {
    "lucide-react": "^0.263.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-textarea": "^1.0.0"
  }
}
```

### TypeScript Types

```typescript
// types/tutor.ts
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface DialogMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  turnNumber: number
}

export interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

export interface ProfessorOverview {
  summary: string
  grammarConcepts: string[]
  vocabThemes: string[]
  syntaxPatterns: string[]
}
```

### File Structure

```
app/tutor/[textId]/
  page.tsx                      # Main tutor page

components/tutor/
  ProfessorOverview.tsx         # Overview card
  LevelSelector.tsx             # CEFR level selection
  DialogView.tsx                # Chat interface
  VoiceInput.tsx                # Web Speech API
  ErrorPlayback.tsx             # Error review
  ErrorTooltip.tsx              # Error detail modal

types/
  tutor.ts                      # TypeScript interfaces
```

---

## UI/UX Specifications

### Color Scheme (Existing Sepia Palette)
- AI messages: `bg-sepia-100 text-sepia-900`
- User messages (correct): `bg-green-50 border-green-200`
- User messages (errors): `bg-red-50 border-red-200`
- Error highlight: `bg-red-100 border-b-2 border-red-500`
- Input area: `bg-white border-sepia-200`
- Buttons: `bg-sepia-700 text-white`

### Typography
- Messages: `whitespace-pre-wrap` (preserves line breaks)
- Headings: `font-serif text-sepia-900`
- Body: `font-sans text-sepia-700`
- Error text: `font-medium`

### Spacing
- Message padding: `p-4`
- Message gap: `space-y-4`
- Container max-width: `max-w-4xl`
- Card padding: `p-6`

### Animations
- Message scroll: `smooth` behavior
- Loading pulse: `animate-pulse`
- Voice active: `animate-pulse` on button
- Expand/collapse: CSS transitions
- Modal: Fade in/out

### Mobile Responsiveness
- Full-width on mobile (`max-w-4xl` on desktop)
- Touch-friendly buttons (`min-h-[44px]`)
- Textarea auto-resize
- Voice button prominent on mobile
- Grid cols: `grid-cols-2 md:grid-cols-3`

---

## Web Speech API Integration

### Browser Support
- **Chrome/Edge**: Full support ✅
- **Safari iOS**: Partial (requires user gesture each time)
- **Firefox**: Limited support
- **Fallback**: Hide voice button if unavailable

### Implementation Details

```typescript
// Check support
const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition

// Configure for Spanish
recognition.lang = 'es-ES'
recognition.continuous = false
recognition.interimResults = false
recognition.maxAlternatives = 1

// Handle result
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  onTranscript(transcript)
}

// Handle errors
recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error)
  // Show error toast or fallback to text input
}
```

### Error Handling
- **not-allowed**: Microphone permission denied → Show permission prompt
- **no-speech**: No speech detected → Timeout, allow retry
- **network**: Network error → Retry or fallback to text
- **aborted**: User cancelled → Reset listening state

---

## Testing Checklist

### Functional Tests
- [ ] Can navigate to `/tutor/[textId]`
- [ ] Professor overview loads and displays
- [ ] Can select CEFR level (A1-C2)
- [ ] "Start Dialog" initiates conversation
- [ ] AI message appears after loading
- [ ] Can type response and send
- [ ] Voice input captures Spanish correctly (Chrome)
- [ ] Conversation scrolls to bottom automatically
- [ ] "End Dialog" triggers error analysis
- [ ] Errors highlighted in transcript (if present)
- [ ] Click error shows detailed tooltip
- [ ] Can save error as flashcard
- [ ] "Start New Dialog" resets state

### UI/UX Tests
- [ ] Loading states clear and informative
- [ ] Error states display properly
- [ ] Expand/collapse animation smooth
- [ ] Mobile: Touch targets adequate (44px)
- [ ] Mobile: Keyboard doesn't hide messages
- [ ] Mobile: Voice button visible and functional
- [ ] Tooltips readable on mobile
- [ ] Messages wrap properly on small screens

### Browser Compatibility
- [ ] Chrome: Full functionality
- [ ] Safari: Text input works (voice may not)
- [ ] Firefox: Text input works (voice may not)
- [ ] Mobile Safari: Keyboard handling correct
- [ ] Mobile Chrome: Voice input works

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces messages
- [ ] Focus management correct
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Error states announced

---

## Dependencies

- **Requires**: Epic 6 (AI Tutor Backend) completed
- **Integrates with**: Epic 8 (Flashcards) for save functionality
- **Blocks**: Full MVP launch

---

## Success Metrics

**Day 3 Complete When**:
- ✅ User can select text and start conversation
- ✅ Dialog interface works smoothly (text + voice)
- ✅ Error playback displays corrections clearly
- ✅ Professor overview provides useful summary
- ✅ UI is polished and mobile-friendly
- ✅ "Holy shit" demo ready for students
- ✅ All components properly typed with TypeScript
- ✅ Responsive design works on mobile and desktop

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| LLM response latency (3-5s) | Loading indicators, "AI is thinking..." message |
| Voice input browser compatibility | Feature detection, hide button if unavailable, always provide text input |
| Mobile keyboard hiding messages | Auto-scroll, fixed input position, iOS Safari testing |
| Error highlighting complexity | Use `dangerouslySetInnerHTML` with sanitization, data attributes for click handling |
| State management across components | Clear props flow, useEffect dependencies, parent state management |
| Conversation history memory | Store in parent state, pass as props, persist in messages array |

---

## Notes

- Uses existing shadcn/ui components (Card, Button, Dialog, Textarea)
- Web Speech API only for voice input (not synthesis)
- Error highlighting uses `<mark>` tags with CSS
- Flashcard save integration prepared for Epic 8
- Mobile-first responsive design
- Comprehensive TypeScript typing throughout
- Graceful degradation for unsupported features
