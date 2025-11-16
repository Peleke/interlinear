'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AudioButton } from '@/components/tutor/AudioButton'
import { AudioTooltip } from './AudioTooltip'
import { Card, CardContent } from '@/components/ui/card'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
}

interface AssessmentChatProps {
  goals: string[]
  customGoal?: string
  onComplete: (assessment: { level: string; conversationHistory: Message[] }) => void
}

export function AssessmentChat({ goals, customGoal, onComplete }: AssessmentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showAudioTooltip, setShowAudioTooltip] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if user has seen audio tooltip before
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('hasSeenOnboardingAudioTooltip')
    if (!hasSeenTooltip && messages.length > 0 && messages[0].role === 'ai') {
      setShowAudioTooltip(true)
    }
  }, [messages])

  // Handle tooltip dismissal
  const handleTooltipDismiss = () => {
    setShowAudioTooltip(false)
    localStorage.setItem('hasSeenOnboardingAudioTooltip', 'true')
  }

  // Initialize conversation with first AI message
  useEffect(() => {
    const initConversation = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goals,
            customGoal,
            messages: []
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API error:', response.status, errorText)
          throw new Error(`Failed to start conversation: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          throw new Error('Server returned invalid response (not JSON)')
        }

        const data = await response.json()
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'ai',
          content: data.message
        }
        setMessages([aiMessage])
      } catch (error) {
        console.error('Init error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to start assessment. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    initConversation()
  }, [goals, customGoal])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals,
          customGoal,
          messages: updatedMessages
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.message
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const response = await fetch('/api/onboarding/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: messages.map(m => ({ role: m.role, content: m.content })),
          goals,
          customGoal
        })
      })

      if (!response.ok) throw new Error('Assessment failed')

      const data = await response.json()
      onComplete({
        level: data.level,
        conversationHistory: messages
      })
    } catch (error) {
      console.error('Assessment error:', error)
      toast.error('Failed to complete assessment. Please try again.')
      setCompleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const userTurnCount = messages.filter(m => m.role === 'user').length
  const canComplete = userTurnCount >= 3

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

              {/* Audio button for AI messages */}
              {message.role === 'ai' && (
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <AudioButton
                      text={message.content}
                      messageId={message.id}
                    />
                    {/* Show tooltip only on first AI message */}
                    {message.id === messages[0]?.id && (
                      <AudioTooltip
                        show={showAudioTooltip}
                        onDismiss={handleTooltipDismiss}
                      />
                    )}
                  </div>
                </div>
              )}
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

      {/* Turn Counter */}
      <div className="flex items-center justify-between text-sm text-sepia-600">
        <span>Conversation turns: {userTurnCount}/5</span>
        {canComplete && !completing && (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Ready to complete assessment
          </span>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu respuesta en español..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-sepia-300 rounded-lg focus:outline-none focus:border-sepia-700 transition-colors resize-none"
          disabled={loading || completing}
        />

        <div className="flex gap-2">
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || completing}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              !input.trim() || loading || completing
                ? 'bg-sepia-200 text-sepia-400 cursor-not-allowed'
                : 'bg-sepia-700 text-white hover:bg-sepia-800'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </button>

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                completing
                  ? 'bg-green-200 text-green-600 cursor-wait'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Assessment
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
        <div className="w-3 h-3 rounded-full bg-sepia-700"></div>
        <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
      </div>
      <p className="text-center text-sm text-sepia-600">
        Step 2 of 3: Level Assessment
      </p>
    </div>
  )
}
