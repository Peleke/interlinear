# Story 4.2: Audio Player Component

## Story
**As a** user
**I want** an audio player UI to control text-to-speech playback
**So that** I can listen to Spanish text with play/pause/speed controls

## Priority
**P0 - Day 2 AM, Hour 2**

## Acceptance Criteria
- [ ] Audio player component in reading panel header
- [ ] Play/Pause button with loading state
- [ ] Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x)
- [ ] Progress bar showing playback position
- [ ] Time display (current / total duration)
- [ ] Visual feedback during synthesis
- [ ] Error display for TTS failures
- [ ] Keyboard shortcuts (Space = play/pause)
- [ ] Accessible controls with ARIA labels

## Technical Details

### Implementation (`components/reader/AudioPlayer.tsx`)

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  text: string
  onError?: (error: string) => void
}

export function AudioPlayer({ text, onError }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [error, setError] = useState<string | null>(null)

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
  }, [isPlaying])

  const synthesizeSpeech = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'TTS failed')
      }

      const audioBlob = await response.blob()
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
```

### Integration with TextRenderPanel

```typescript
'use client'

import { AudioPlayer } from './AudioPlayer'
// ... other imports

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  // ... existing state

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
        <button onClick={onEditClick}>← Edit Text</button>
      </div>

      {/* Audio Player */}
      <AudioPlayer text={text} />

      {/* Reading Panel */}
      <div className="flex gap-4">
        {/* ... clickable words ... */}
      </div>
    </div>
  )
}
```

### Accessibility Features

- **ARIA Labels**: All buttons have descriptive labels
- **Keyboard Navigation**: Tab through controls, Space for play/pause
- **Focus Indicators**: Default browser outline on focused elements
- **Disabled States**: Visual feedback for unavailable controls
- **Screen Reader**: Progress and time updates announced

### Visual States

1. **Idle**: Play button ready
2. **Loading**: Spinning icon while synthesizing
3. **Playing**: Pause button, active progress bar
4. **Paused**: Play button, progress maintained
5. **Error**: Red alert with error message

### Performance Considerations

- Audio URL cleanup on unmount prevents memory leaks
- Single audio element reused for efficiency
- Progress bar updates throttled by browser's `timeupdate` event
- Playback rate changes applied instantly without re-synthesis

## Architecture References
- `/docs/architecture/components.md` - AudioPlayer spec
- `/docs/prd/design-system.md` - Player styling
- `/docs/prd/user-stories.md` - US-402

## Definition of Done
- [ ] AudioPlayer component created
- [ ] Play/Pause functionality working
- [ ] Progress bar interactive
- [ ] Playback speed control (5 options)
- [ ] Time display formatted (MM:SS)
- [ ] Loading state during synthesis
- [ ] Error handling and display
- [ ] Keyboard shortcuts (Space)
- [ ] Accessible with ARIA
- [ ] TypeScript fully typed
