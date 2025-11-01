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
