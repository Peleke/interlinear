# Story 4.3: Sentence Highlighting During Playback

## Story
**As a** user
**I want** sentences to highlight as they're being read aloud
**So that** I can follow along visually with the audio

## Priority
**P1 - Day 2 AM, Hour 3**

## Acceptance Criteria
- [ ] Sentences highlight during TTS playback
- [ ] Highlight moves from sentence to sentence
- [ ] Visual indicator distinct from word selection
- [ ] Highlight color matches design system
- [ ] Smooth transitions between sentences
- [ ] Auto-scroll to keep current sentence visible
- [ ] Highlight clears when playback stops
- [ ] Works with variable playback speeds

## Technical Details

### Sentence Timing Strategy

**Approach**: Estimate sentence timing based on character count and playback rate

```typescript
interface SentenceTiming {
  sentenceId: number
  startTime: number
  duration: number
}

function calculateSentenceTiming(
  sentences: Sentence[],
  totalDuration: number
): SentenceTiming[] {
  const totalChars = sentences.reduce((sum, s) => sum + s.text.length, 0)
  const timings: SentenceTiming[] = []

  let currentTime = 0

  sentences.forEach((sentence) => {
    const charRatio = sentence.text.length / totalChars
    const duration = totalDuration * charRatio

    timings.push({
      sentenceId: sentence.id,
      startTime: currentTime,
      duration,
    })

    currentTime += duration
  })

  return timings
}
```

### Implementation (`components/reader/TextRenderPanel.tsx`)

```typescript
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { tokenizeText, getSentences } from '@/lib/tokenize'
import { ClickableWord } from './ClickableWord'
import { DefinitionSidebar } from './DefinitionSidebar'
import { AudioPlayer } from './AudioPlayer'
import type { Token, Sentence } from '@/types'

interface TextRenderPanelProps {
  text: string
  onEditClick: () => void
}

export function TextRenderPanel({ text, onEditClick }: TextRenderPanelProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [savedWords] = useState<Set<string>>(new Set())
  const [activeSentenceId, setActiveSentenceId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Tokenize text once when text changes
  const tokens = useMemo(() => tokenizeText(text), [text])
  const sentences = useMemo(() => getSentences(tokens), [tokens])

  // Handle audio playback state
  const handlePlaybackChange = useCallback((
    playing: boolean,
    currentTime: number,
    duration: number
  ) => {
    setIsPlaying(playing)

    if (!playing) {
      setActiveSentenceId(null)
      return
    }

    // Calculate which sentence is currently playing
    const timings = calculateSentenceTiming(sentences, duration)
    const currentSentence = timings.find(
      (t) => currentTime >= t.startTime && currentTime < t.startTime + t.duration
    )

    setActiveSentenceId(currentSentence?.sentenceId ?? null)
  }, [sentences])

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceId === null) return

    const sentenceElement = document.querySelector(
      `[data-sentence-id="${activeSentenceId}"]`
    )

    if (sentenceElement) {
      sentenceElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeSentenceId])

  const handleWordClick = useCallback((token: Token) => {
    // If playing audio, don't allow word clicks
    if (isPlaying) return

    if (token.id === selectedTokenId) {
      setSelectedTokenId(null)
      setLookupWord(null)
      return
    }

    setSelectedTokenId(token.id)
    setLookupWord(token.cleanText)
  }, [selectedTokenId, isPlaying])

  const handleSidebarClose = useCallback(() => {
    setSelectedTokenId(null)
    setLookupWord(null)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lookupWord) {
        handleSidebarClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [lookupWord, handleSidebarClose])

  // Group tokens by sentence for rendering
  const sentenceGroups = useMemo(() => {
    const groups: { [key: number]: Token[] } = {}

    tokens.forEach((token) => {
      if (!groups[token.sentenceId]) {
        groups[token.sentenceId] = []
      }
      groups[token.sentenceId].push(token)
    })

    return groups
  }, [tokens])

  return (
    <div className="flex flex-col lg:flex-row gap-4 relative">
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif text-sepia-900">Interactive Reading</h2>
          <button
            onClick={onEditClick}
            className="px-4 py-2 text-sepia-700 border border-sepia-700 rounded-md hover:bg-sepia-50 transition-colors"
          >
            ← Edit Text
          </button>
        </div>

        {/* Audio Player */}
        <div className="mb-4">
          <AudioPlayer
            text={text}
            onPlaybackChange={handlePlaybackChange}
          />
        </div>

        {/* Main Reading Panel */}
        <div className={`transition-all duration-300 ${lookupWord ? 'lg:pr-4' : ''}`}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
            <div className="text-lg font-serif text-ink leading-relaxed space-y-2">
              {Object.entries(sentenceGroups).map(([sentenceId, sentenceTokens]) => (
                <span
                  key={sentenceId}
                  data-sentence-id={sentenceId}
                  className={`inline-block transition-all duration-300 ${
                    activeSentenceId === parseInt(sentenceId)
                      ? 'bg-gold-100 px-2 py-1 rounded shadow-sm'
                      : ''
                  }`}
                >
                  {sentenceTokens.map((token) => (
                    <ClickableWord
                      key={token.id}
                      token={token}
                      isSelected={token.id === selectedTokenId}
                      isSaved={savedWords.has(token.cleanText)}
                      onClick={handleWordClick}
                      disabled={isPlaying}
                    />
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Definition Sidebar */}
      <DefinitionSidebar
        word={lookupWord}
        onClose={handleSidebarClose}
      />
    </div>
  )
}

function calculateSentenceTiming(
  sentences: Sentence[],
  totalDuration: number
): { sentenceId: number; startTime: number; duration: number }[] {
  const totalChars = sentences.reduce((sum, s) => sum + s.text.length, 0)
  const timings: { sentenceId: number; startTime: number; duration: number }[] = []

  let currentTime = 0

  sentences.forEach((sentence) => {
    const charRatio = sentence.text.length / totalChars
    const duration = totalDuration * charRatio

    timings.push({
      sentenceId: sentence.id,
      startTime: currentTime,
      duration,
    })

    currentTime += duration
  })

  return timings
}
```

### Updated ClickableWord Component

```typescript
interface ClickableWordProps {
  token: Token
  isSelected: boolean
  isSaved: boolean
  onClick: (token: Token) => void
  disabled?: boolean // New prop
}

export function ClickableWord({
  token,
  isSelected,
  isSaved,
  onClick,
  disabled = false,
}: ClickableWordProps) {
  if (!token.isWord) {
    return <span>{token.text}</span>
  }

  return (
    <span
      id={token.id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick(token)}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(token)
        }
      }}
      className={`
        inline-block transition-all duration-150
        ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-sepia-100 hover:scale-105'}
        ${
          isSelected
            ? 'bg-gold-200 text-sepia-900 font-semibold shadow-sm'
            : isSaved
            ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
            : 'text-sepia-800'
        }
        px-0.5 rounded
      `}
      aria-label={`Word: ${token.cleanText}${isSaved ? ' (saved)' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      {token.text}
    </span>
  )
}
```

### Updated AudioPlayer Component

```typescript
interface AudioPlayerProps {
  text: string
  onPlaybackChange?: (playing: boolean, currentTime: number, duration: number) => void
  onError?: (error: string) => void
}

export function AudioPlayer({ text, onPlaybackChange, onError }: AudioPlayerProps) {
  // ... existing state

  // Update parent component on playback changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && onPlaybackChange) {
        onPlaybackChange(
          isPlaying,
          audioRef.current.currentTime,
          audioRef.current.duration
        )
      }
    }, 100) // Update every 100ms for smooth highlighting

    return () => clearInterval(interval)
  }, [isPlaying, onPlaybackChange])

  // ... rest of component
}
```

### Design System Colors

```css
--gold-100: #fef3c7  /* Sentence highlight background */
--gold-200: #f4e4c1  /* Word selection background */
```

### Visual States

1. **Idle**: No highlight, words clickable
2. **Playing**: Current sentence highlighted (gold-100), words not clickable
3. **Paused**: Highlight remains on last sentence
4. **Stopped**: Highlight clears, words clickable again

### Performance Optimization

- **Sentence grouping**: Pre-compute in useMemo to avoid re-renders
- **Timing calculation**: Simple character-based estimation (fast)
- **Scroll throttling**: smooth scroll built into browser
- **Update interval**: 100ms balance between smoothness and performance

### Edge Cases

1. **Very short sentences**: May flash by quickly at normal speed
2. **Very long sentences**: Remain highlighted for extended period
3. **Empty text**: No highlighting, player disabled
4. **Single sentence**: Highlight entire text during playback
5. **Playback rate change**: Timing automatically adjusts

## Architecture References
- `/docs/architecture/components.md` - Sentence highlighting
- `/docs/prd/design-system.md` - Highlight colors
- `/docs/prd/user-stories.md` - US-403

## Definition of Done
- [ ] Sentences highlight during playback
- [ ] Highlight timing synced with audio
- [ ] Auto-scroll to active sentence
- [ ] Smooth transitions (300ms)
- [ ] Words disabled during playback
- [ ] Highlight clears on stop
- [ ] Works at all playback speeds
- [ ] TypeScript fully typed
- [ ] Accessible with ARIA
