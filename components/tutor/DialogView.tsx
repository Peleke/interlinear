'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInput } from './VoiceInput'
import { MessageCorrection } from './MessageCorrection'
import { AudioButton } from './AudioButton'
import { FlashcardSaver } from './FlashcardSaver'
import { WordSaver } from './WordSaver'
import { toast } from 'sonner'

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

interface DialogViewProps {
  sessionId: string
  initialMessages: DialogMessage[]
  onMessagesUpdate: (messages: DialogMessage[]) => void
  onEnd: () => void
  language: 'es' | 'la'
}

export function DialogView({
  sessionId,
  initialMessages,
  onMessagesUpdate,
  onEnd,
  language
}: DialogViewProps) {
  const [messages, setMessages] = useState<DialogMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
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
          userResponse: userMessage.content,
          language
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      // Update user message with correction data
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id
          ? { ...msg, correction: data.correction }
          : msg
      ))

      const aiMessage: DialogMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.aiMessage,
        turnNumber: data.turnNumber
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle end dialog
  const handleEndDialog = async () => {
    setAnalyzing(true)
    try {
      await onEnd()
    } finally {
      setAnalyzing(false)
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
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'ai'
                      ? 'bg-sepia-100 text-sepia-900'
                      : 'bg-sepia-700 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Action buttons for AI messages */}
                {message.role === 'ai' && (
                  <div className="flex flex-col gap-1">
                    <AudioButton
                      text={message.content}
                      messageId={message.id}
                    />
                    <FlashcardSaver
                      defaultClozeText={message.content}
                      buttonLabel=""
                      buttonSize="icon"
                      buttonVariant="ghost"
                    />
                  </div>
                )}
              </div>

              {/* Show correction feedback for user messages */}
              {message.role === 'user' && message.correction && (
                <div className="max-w-[80%] w-full">
                  <MessageCorrection correction={message.correction} language={language} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-sepia-100 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sepia-600" />
                <span className="text-sepia-600 text-sm">
                  {language === 'la' ? 'The tutor is thinking...' : 'El tutor está pensando...'}
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
            disabled={!input.trim() || loading || analyzing}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {language === 'la' ? 'Send' : 'Enviar'}
          </Button>
          <Button
            onClick={handleEndDialog}
            variant="outline"
            disabled={loading || analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'la' ? 'Analyzing...' : 'Analizando...'}
              </>
            ) : (
              language === 'la' ? 'End Dialog' : 'Terminar Diálogo'
            )}
          </Button>
        </div>

        {/* Quick vocabulary extraction from last AI message */}
        {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
          <div className="flex gap-2 pt-2">
            <WordSaver
              sentence={messages[messages.length - 1].content}
              buttonSize="sm"
              buttonVariant="outline"
            />
            <FlashcardSaver
              defaultClozeText={messages[messages.length - 1].content}
              buttonLabel="Save Last Message"
              buttonSize="sm"
              buttonVariant="outline"
            />
          </div>
        )}
      </div>
    </div>
  )
}
