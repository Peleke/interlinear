# Story 4.1: ElevenLabs TTS API Integration

## Story
**As a** developer
**I want to** integrate ElevenLabs text-to-speech API
**So that** users can hear authentic Spanish pronunciation

## Priority
**P0 - Day 2 AM, Hour 1**

## Acceptance Criteria
- [ ] API route at `/api/tts/synthesize`
- [ ] Accepts text input and returns audio URL
- [ ] Uses ElevenLabs streaming API for efficiency
- [ ] Supports Spanish voice selection
- [ ] API key stored in environment variable
- [ ] Returns error for rate limits/failures
- [ ] Audio caching strategy (optional optimization)
- [ ] TypeScript types for API response

## Technical Details

### ElevenLabs API Specifications

**Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`

**Authentication:** API key in `xi-api-key` header

**Rate Limits:**
- Free tier: 10,000 characters/month
- Paid tier: 30,000+ characters/month

**Registration:** https://elevenlabs.io/sign-up

**Recommended Spanish Voices:**
- `EXAVITQu4vr4xnSDxMaL` - Sarah (Spanish Female)
- `VR6AewLTigWG4xSOukaG` - Arnold (Spanish Male)
- `pNInz6obpgDQGcFmaJgB` - Adam (Multilingual)

### Implementation (`app/api/tts/synthesize/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const API_KEY = process.env.ELEVENLABS_API_KEY
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - Spanish Female

export interface TTSRequest {
  text: string
  voiceId?: string
}

export interface TTSResponse {
  success: boolean
  audioUrl?: string
  error?: string
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    const body: TTSRequest = await request.json()
    const { text, voiceId = DEFAULT_VOICE_ID } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text parameter required' },
        { status: 400 }
      )
    }

    // Check text length (conservative limit for free tier)
    if (text.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    const url = `${ELEVENLABS_API_URL}/${voiceId}/stream`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }

      throw new Error(`ElevenLabs API returned ${response.status}`)
    }

    // Stream audio directly to client
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to synthesize speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

### Voice Settings Explanation

```typescript
voice_settings: {
  stability: 0.5,          // 0-1: Lower = more expressive, Higher = more stable
  similarity_boost: 0.75,  // 0-1: How closely to match the original voice
  style: 0.0,             // 0-1: Exaggeration of the style (0 for natural)
  use_speaker_boost: true // Enhance clarity and consistency
}
```

### Environment Variables

Add to `.env.local`:
```bash
ELEVENLABS_API_KEY=your-api-key-here
```

### Client-Side Usage Example

```typescript
async function synthesizeSpeech(text: string): Promise<Blob> {
  const response = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'TTS failed')
  }

  return await response.blob()
}

// Play audio
const audioBlob = await synthesizeSpeech('Hola mundo')
const audioUrl = URL.createObjectURL(audioBlob)
const audio = new Audio(audioUrl)
audio.play()
```

### Error Handling

1. **Missing API Key** → 500 error
2. **Empty Text** → 400 error
3. **Text Too Long** → 400 error (>5000 chars)
4. **Invalid API Key** → 401 error
5. **Rate Limit** → 429 error
6. **Network Error** → 500 error with details

### Optimization: Audio Caching

**Optional Strategy:**
```typescript
// Cache synthesized audio in localStorage
const AUDIO_CACHE_PREFIX = 'tts_cache_'

function getCacheKey(text: string): string {
  // Hash text for shorter key
  return `${AUDIO_CACHE_PREFIX}${btoa(text).substring(0, 20)}`
}

function getCachedAudio(text: string): Blob | null {
  const key = getCacheKey(text)
  const cached = localStorage.getItem(key)

  if (!cached) return null

  // Convert base64 back to Blob
  const byteString = atob(cached)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }

  return new Blob([arrayBuffer], { type: 'audio/mpeg' })
}
```

### Testing

**Manual Test:**
```bash
curl -X POST http://localhost:3000/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola, ¿cómo estás?"}' \
  --output test.mp3

# Play the audio
mpv test.mp3  # or any audio player
```

## Architecture References
- `/docs/architecture/backend-architecture.md` - API routes
- `/docs/architecture/external-apis.md` - ElevenLabs integration
- `/docs/prd/user-stories.md` - US-401

## Definition of Done
- [ ] API route created and functional
- [ ] Streams audio from ElevenLabs
- [ ] API key secured in environment
- [ ] Error handling complete
- [ ] TypeScript types defined
- [ ] Voice settings optimized for Spanish
- [ ] Character limit enforced
- [ ] Manual testing complete
