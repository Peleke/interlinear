import { NextRequest, NextResponse } from 'next/server'

const MW_API_BASE = 'https://www.dictionaryapi.com/api/v3/references/spanish/json'
const API_KEY = process.env.MERRIAM_WEBSTER_API_KEY

interface MerriamWebsterEntry {
  meta: {
    id: string
    lang: string
    stems: string[]
    syns?: string[][]
    ants?: string[][]
  }
  hwi: {
    hw: string
    prs?: {
      mw: string
      sound?: {
        audio: string
      }
    }[]
  }
  fl?: string // part of speech
  shortdef: string[]
  def?: {
    sseq: any[][] // sense sequence
  }[]
}

export interface DictionaryResponse {
  word: string
  found: boolean
  definitions?: {
    partOfSpeech: string
    meanings: string[]
  }[]
  pronunciations?: {
    text: string
    audio?: string
  }[]
  suggestions?: string[]
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ word: string }> }
) {
  const { word } = await params
  const { searchParams } = new URL(request.url)
  const language = (searchParams.get('language') || 'es') as 'es' | 'la'

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Dictionary API key not configured' },
      { status: 500 }
    )
  }

  if (!word || word.trim().length === 0) {
    return NextResponse.json(
      { error: 'Word parameter required' },
      { status: 400 }
    )
  }

  // Only Spanish is supported via MW API currently
  // Latin will be routed through DictionaryRouter when API is ready
  if (language !== 'es') {
    return NextResponse.json(
      {
        word: word.toLowerCase().trim(),
        found: false,
        language,
        error: `Language '${language}' not yet supported via this endpoint`,
      } as DictionaryResponse,
      { status: 501 }
    )
  }

  const cleanWord = word.toLowerCase().trim()

  try {
    const url = `${MW_API_BASE}/${encodeURIComponent(cleanWord)}?key=${API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          word: cleanWord,
          found: false,
          error: 'Word not found',
        } as DictionaryResponse)
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'API key invalid or rate limit exceeded' },
          { status: 403 }
        )
      }

      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // Check if response is spelling suggestions (array of strings)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return NextResponse.json({
        word: cleanWord,
        found: false,
        suggestions: data,
      } as DictionaryResponse)
    }

    // Parse dictionary entries
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const entries = data as MerriamWebsterEntry[]

      const definitions = entries.map((entry) => ({
        partOfSpeech: entry.fl || 'unknown',
        meanings: entry.shortdef || [],
      }))

      const pronunciations = entries[0].hwi.prs?.map((pr) => ({
        text: pr.mw,
        audio: pr.sound?.audio
          ? `https://media.merriam-webster.com/audio/prons/es/me/mp3/${pr.sound.audio[0]}/${pr.sound.audio}.mp3`
          : undefined,
      }))

      return NextResponse.json({
        word: cleanWord,
        found: true,
        definitions,
        pronunciations,
      } as DictionaryResponse)
    }

    // No results found
    return NextResponse.json({
      word: cleanWord,
      found: false,
    } as DictionaryResponse)

  } catch (error) {
    console.error('Dictionary API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch dictionary data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
