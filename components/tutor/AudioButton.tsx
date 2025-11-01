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
  const playPromiseRef = useRef<Promise<void> | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateAndPlayAudio = async () => {
    // If audio already cached, toggle play/pause
    if (audioUrl && audioRef.current) {
      if (playing) {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          try {
            await playPromiseRef.current
          } catch (error) {
            // Ignore play errors when pausing
          }
        }
        audioRef.current.pause()
        setPlaying(false)
      } else {
        try {
          const playPromise = audioRef.current.play()
          playPromiseRef.current = playPromise
          await playPromise
          setPlaying(true)
        } catch (error) {
          console.error('Play failed:', error)
          setPlaying(false)
        } finally {
          playPromiseRef.current = null
        }
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Audio API error:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to generate audio')
      }

      const audioBlob = await response.blob()
      console.log('Audio blob received:', {
        size: audioBlob.size,
        type: audioBlob.type
      })

      // Clean up previous audio if it exists (save reference first!)
      const oldAudio = audioRef.current
      const oldUrl = audioUrl

      if (oldAudio) {
        oldAudio.pause()
        oldAudio.src = ''
      }
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }

      // Ensure the blob has the correct MIME type
      const typedBlob = new Blob([audioBlob], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(typedBlob)
      console.log('Audio URL created:', url)

      // Create NEW audio element BEFORE updating state
      const audio = new Audio()

      // Update refs/state - this won't affect the NEW audio element
      audioRef.current = audio
      setAudioUrl(url)

      // Set up event handlers before loading
      audio.onloadeddata = () => {
        console.log('Audio loaded, duration:', audio.duration)
      }
      
      audio.onerror = (e) => {
        console.error('Audio error:', e, audio.error)
        toast.error('Failed to load audio')
        setPlaying(false)
        setLoading(false)
      }

      audio.onended = () => {
        console.log('Audio ended')
        setPlaying(false)
        playPromiseRef.current = null
      }
      
      audio.onpause = () => {
        console.log('Audio paused')
        setPlaying(false)
      }
      
      audio.onplay = () => {
        console.log('Audio playing')
        setPlaying(true)
      }

      // Set source and load
      audio.src = url
      audio.load()

      // Wait for audio to be ready, then play
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => {
          console.log('Audio can play through')
          resolve()
        }
        audio.onerror = () => reject(new Error('Failed to load audio'))
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Audio load timeout')), 5000)
      })

      console.log('Attempting to play audio...')
      const playPromise = audio.play()
      playPromiseRef.current = playPromise
      await playPromise
      console.log('Audio play started successfully')
      setPlaying(true)
    } catch (error) {
      console.error('Audio generation/playback failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio'
      toast.error(errorMessage)
      setPlaying(false)
    } finally {
      playPromiseRef.current = null
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
