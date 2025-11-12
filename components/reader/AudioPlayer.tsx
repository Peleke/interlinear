'use client'

import { useState, useRef, useEffect } from 'react'
import { AudioCache } from '@/lib/audio-cache'

interface AudioPlayerProps {
  text: string
  language: 'es' | 'la'
  onPlaybackChange?: (playing: boolean, currentTime: number, duration: number) => void
  onError?: (error: string) => void
}

export function AudioPlayer({ text, language, onPlaybackChange, onError }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [error, setError] = useState<string | null>(null)
  const [cacheHit, setCacheHit] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  // Handle spacebar shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        handlePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update parent component on playback changes
  useEffect(() => {
    if (!onPlaybackChange) return

    const interval = setInterval(() => {
      if (audioRef.current) {
        onPlaybackChange(
          isPlaying,
          audioRef.current.currentTime,
          audioRef.current.duration || 0
        )
      }
    }, 100) // Update every 100ms for smooth highlighting

    return () => clearInterval(interval)
  }, [isPlaying, onPlaybackChange])

  const synthesizeSpeech = async () => {
    setIsLoading(true)
    setError(null)
    setCacheHit(false)

    try {
      // Check cache first
      const cachedAudio = await AudioCache.get(text)

      let audioBlob: Blob

      if (cachedAudio) {
        console.log('Cache hit for audio')
        setCacheHit(true)
        audioBlob = cachedAudio
      } else {
        // Cache miss - synthesize from API
        console.log('Cache miss for audio')
        const response = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'TTS failed')
        }

        audioBlob = await response.blob()

        // Store in cache
        await AudioCache.set(text, audioBlob)
      }

      const audioUrl = URL.createObjectURL(audioBlob)

      // Cleanup old audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }

      audioUrlRef.current = audioUrl

      // Create new audio element
      const audio = new Audio(audioUrl)
      audio.playbackRate = playbackRate

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      audio.addEventListener('error', () => {
        const err = 'Failed to play audio'
        setError(err)
        onError?.(err)
        setIsPlaying(false)
      })

      audioRef.current = audio
      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      await synthesizeSpeech()
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)

    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)

    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!text) {
    return (
      <div className="bg-white p-4 rounded-lg border border-sepia-200 shadow-sm">
        <p className="text-sepia-600 text-center text-sm">Enter text to enable audio playback</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-sepia-200 shadow-sm">
      {/* Play/Pause Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !text}
          className="p-3 bg-sepia-700 hover:bg-sepia-800 disabled:bg-sepia-300 text-white rounded-full transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!audioRef.current}
            className="w-full h-2 bg-sepia-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            aria-label="Seek audio position"
          />
          <div className="flex justify-between text-xs text-sepia-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Speed */}
        <div className="flex gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => handlePlaybackRateChange(rate)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackRate === rate
                  ? 'bg-sepia-700 text-white'
                  : 'bg-sepia-100 text-sepia-700 hover:bg-sepia-200'
              }`}
              aria-label={`Playback speed ${rate}x`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Loading/Cache Status */}
      {isLoading && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 text-center">
          Generating audio...
        </div>
      )}
      {cacheHit && !isLoading && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 text-center">
          ✓ Loaded from cache
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Keyboard Hint */}
      <div className="mt-2 text-xs text-sepia-500 text-center">
        Press <kbd className="px-1 py-0.5 bg-sepia-100 border border-sepia-300 rounded">Space</kbd> to play/pause
      </div>
    </div>
  )
}
