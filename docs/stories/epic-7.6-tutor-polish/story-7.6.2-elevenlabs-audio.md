# Story 7.6.2: ElevenLabs Audio for AI Messages

**Epic**: 7.6 - Tutor Polish & Audio
**Status**: 🚧 Not Started
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**: None

---

## User Story

**As a** language learner
**I want to** hear AI tutor messages spoken aloud with proper Spanish pronunciation
**So that** I can learn correct pronunciation and improve my listening comprehension

---

## Acceptance Criteria

- [ ] Speaker icon button appears on each AI message
- [ ] Click button to generate and play audio
- [ ] Loading state while generating audio
- [ ] Audio plays in browser (no download required)
- [ ] Play/pause controls
- [ ] Spanish voice with natural accent
- [ ] Audio cached for replays (avoid regeneration)
- [ ] Error handling if generation fails
- [ ] Works on mobile and desktop
- [ ] Visual feedback (pulsing icon) while playing

---

## Technical Specification

### ElevenLabs API Integration

**Setup**:
1. Sign up at https://elevenlabs.io
2. Get API key
3. Add to `.env.local`: `ELEVENLABS_API_KEY=your_key_here`
4. Choose Spanish voice ID (e.g., "pNInz6obpgDQGcFmaJgB" - Adam)

**API Route**: `app/api/tutor/audio/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.length > 5000) {
      return NextResponse.json(
        { error: 'Invalid text length' },
        { status: 400 }
      )
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('ElevenLabs API error')
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer()

    // Return audio as response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
}
```

---

### AudioButton Component

**File**: `components/tutor/AudioButton.tsx`

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AudioButtonProps {
  text: string
  className?: string
}

export function AudioButton({ text, className }: AudioButtonProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl])

  const handlePlay = async () => {
    try {
      // If audio already loaded, just play/pause
      if (audioUrl && audioRef.current) {
        if (playing) {
          audioRef.current.pause()
          setPlaying(false)
        } else {
          await audioRef.current.play()
          setPlaying(true)
        }
        return
      }

      // Generate audio
      setLoading(true)
      setError(false)

      const response = await fetch('/api/tutor/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      // Create audio URL from blob
      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      // Create and play audio
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        setError(true)
        toast.error('Audio playback failed')
      }

      await audio.play()
      setPlaying(true)
    } catch (err) {
      console.error('Audio error:', err)
      setError(true)
      toast.error('Failed to generate audio')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={className}
      >
        <AlertCircle className="h-4 w-4 text-red-500" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handlePlay}
      disabled={loading}
      className={className}
      aria-label={playing ? 'Pause audio' : 'Play audio'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className={`h-4 w-4 ${playing ? 'text-blue-600 animate-pulse' : 'text-sepia-600'}`} />
      )}
    </Button>
  )
}
```

---

### Integration into DialogView

Update `components/tutor/DialogView.tsx`:

```typescript
import { AudioButton } from './AudioButton'

// In the message rendering:
{messages.map((message) => (
  <div key={message.id} ...>
    <div className={...}>
      <div className="flex items-start gap-2">
        <p className="whitespace-pre-wrap flex-1">{message.content}</p>

        {/* Add audio button for AI messages */}
        {message.role === 'ai' && (
          <AudioButton text={message.content} />
        )}
      </div>
    </div>

    {/* Correction feedback */}
    {message.role === 'user' && message.correction && (
      <MessageCorrection correction={message.correction} />
    )}
  </div>
))}
```

---

## Implementation Steps

1. **Set up ElevenLabs Account**
   - Create account
   - Get API key
   - Test voice IDs
   - Choose best Spanish voice

2. **Create API Route**
   - Implement `/api/tutor/audio`
   - Add rate limiting (10 requests/min)
   - Add error handling
   - Test with sample Spanish text

3. **Create AudioButton Component**
   - Build UI with loading/playing states
   - Implement audio generation and playback
   - Add caching logic
   - Handle errors gracefully

4. **Integrate into DialogView**
   - Add AudioButton to AI messages
   - Position button appropriately
   - Test on mobile and desktop

5. **Add Environment Variables**
   ```bash
   # .env.local
   ELEVENLABS_API_KEY=your_key_here
   ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB  # Spanish voice
   ```

---

## Testing Checklist

- [ ] API route generates audio successfully
- [ ] Audio plays in browser
- [ ] Play/pause works correctly
- [ ] Loading state shows during generation
- [ ] Cached audio replays instantly
- [ ] Error handling works (no API key, rate limit)
- [ ] Audio quality is good
- [ ] Spanish pronunciation is natural
- [ ] Mobile playback works
- [ ] Multiple audios can play sequentially

---

## Cost Analysis

**ElevenLabs Pricing**:
- Free tier: 10,000 characters/month
- Paid tier: $5/month for 30,000 characters

**Average Usage**:
- AI message: ~100 characters
- 10 messages/conversation
- 10 conversations/day = 1,000 chars/day = 30,000 chars/month

**Cost**: $5/month per active user (or free tier for light users)

---

## Voice Selection

**Recommended Spanish Voices**:
1. **Pablo** - Latin American Spanish, warm, conversational
2. **Matilda** - European Spanish, clear, educational
3. **Adam** - Multilingual, good for Spanish, professional

**Testing**: Generate samples with each voice, choose best for educational context

---

## Performance Optimization

**Caching Strategy**:
- Cache audio URLs in component state
- Store generated audio in browser memory
- Avoid regenerating same text
- Clear cache on unmount

**Future Enhancements** (ENHANCEMENTS.md):
- Server-side caching with Redis
- Pre-generate audio for common phrases
- Download audio button
- Speed control (0.5x, 1x, 1.5x)

---

## Success Criteria

**Story Complete When**:
- ✅ ElevenLabs API integrated
- ✅ Audio button on all AI messages
- ✅ Audio plays smoothly
- ✅ Loading and playing states work
- ✅ Caching prevents regeneration
- ✅ Error handling graceful
- ✅ Spanish pronunciation natural
- ✅ Tests passing
- ✅ Manually tested with real conversation

---

## Notes

**ProfessorOverview Fix**: When implementing, ensure all headings are in Spanish:
- "Summary" → "Resumen"
- "Grammar Concepts" → "Conceptos Gramaticales"
- "Vocabulary Themes" → "Temas de Vocabulario"
- "Syntax Patterns" → "Patrones de Sintaxis"

---

**Created**: 2025-10-31
**Author**: Claude (Dev Agent)
