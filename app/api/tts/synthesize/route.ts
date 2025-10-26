import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const API_KEY = process.env.ELEVENLABS_API_KEY
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah - Spanish Female

export interface TTSRequest {
  text: string
  voiceId?: string
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    const body: TTSRequest = await request.json()
    const { text, voiceId = DEFAULT_VOICE_ID } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text parameter required' },
        { status: 400 }
      )
    }

    // Check text length (conservative limit for free tier)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Inject natural pauses after sentence-ending punctuation
    const textWithPauses = text
      .replace(/([.!?])\s+/g, '$1 <break time="0.5s" /> ')
      .replace(/([.!?])$/g, '$1 <break time="0.5s" />')

    const url = `${ELEVENLABS_API_URL}/${voiceId}/stream`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: textWithPauses,
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
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
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
        error: 'Failed to synthesize speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
