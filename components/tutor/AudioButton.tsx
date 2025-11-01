'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, Loader2, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AudioButtonProps {
  text: string
  messageId: string
}

export function AudioButton({ text, messageId }: AudioButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const generateAndPlayAudio = async () => {
    // If audio already cached, just play it
    if (audioUrl && audioRef.current) {
      if (playing) {
        audioRef.current.pause()
        setPlaying(false)
      } else {
        audioRef.current.play()
        setPlaying(true)
      }
      return
    }

    // Generate new audio
    try {
      setLoading(true)

      const response = await fetch('/api/tutor/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      // Create audio element and play
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => setPlaying(false)
      audio.onpause = () => setPlaying(false)
      audio.onplay = () => setPlaying(true)

      await audio.play()
      setPlaying(true)
    } catch (error) {
      console.error('Audio generation failed:', error)
      toast.error('Failed to generate audio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (loading) return
    generateAndPlayAudio()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="h-8 w-8 p-0"
      title="Play audio"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-sepia-600" />
      ) : playing ? (
        <Pause className="h-4 w-4 text-blue-600 animate-pulse" />
      ) : (
        <Volume2 className="h-4 w-4 text-sepia-600 hover:text-blue-600" />
      )}
    </Button>
  )
}
