/**
 * Dictionary Router
 * Routes dictionary lookups based on language
 *
 * Supported:
 * - Spanish (es): Merriam-Webster Spanish-English API
 * - Latin (la): Latin Dictionary API (integration point)
 */

export interface DictionaryDefinition {
  partOfSpeech: string
  meanings: string[]
}

export interface DictionaryPronunciation {
  text: string
  audio?: string
}

export interface DictionaryResponse {
  word: string
  found: boolean
  language: 'es' | 'la'
  definitions: DictionaryDefinition[]
  pronunciations?: DictionaryPronunciation[]
  suggestions?: string[]

  // Source metadata
  source: 'merriam-webster' | 'latin-dict'

  // Cache metadata (MW specific)
  mw_id?: string
  mw_data?: any
}

export class DictionaryRouter {
  /**
   * Main lookup method with language routing
   */
  static async lookup(
    word: string,
    language: 'es' | 'la' = 'es'
  ): Promise<DictionaryResponse> {
    const cleanWord = word.toLowerCase().trim()

    switch (language) {
      case 'es':
        return await this.lookupSpanish(cleanWord)

      case 'la':
        return await this.lookupLatin(cleanWord)

      default:
        throw new Error(`Unsupported language: ${language}`)
    }
  }

  /**
   * Get base URL for API calls (handles server-side vs client-side)
   */
  private static getBaseUrl(): string {
    // Server-side: use environment variable or construct from runtime
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
    // Client-side: use relative URLs
    return ''
  }

  /**
   * Spanish lookup via Merriam-Webster API
   */
  private static async lookupSpanish(word: string): Promise<DictionaryResponse> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/api/dictionary/${encodeURIComponent(word)}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        // Try to get error details from response
        let errorDetail = `${response.status}`
        try {
          const errorBody = await response.text()
          errorDetail += ` - ${errorBody.substring(0, 200)}`
        } catch {
          // Ignore error parsing error
        }
        throw new Error(`MW API failed: ${errorDetail}`)
      }

      const mwData = await response.json()

      return {
        word: mwData.word,
        found: mwData.found,
        language: 'es',
        definitions: mwData.definitions || [],
        pronunciations: mwData.pronunciations || [],
        suggestions: mwData.suggestions || [],
        source: 'merriam-webster',
        mw_id: mwData.definitions?.[0]?.id,
        mw_data: mwData,
      }
    } catch (error) {
      console.error(`Dictionary lookup failed for ${word}:`, error)
      // Return empty result instead of throwing
      return {
        word,
        found: false,
        language: 'es',
        definitions: [],
        source: 'merriam-webster',
      }
    }
  }

  /**
   * Latin lookup via Latin Analysis API (Lewis & Short + CLTK)
   */
  private static async lookupLatin(word: string): Promise<DictionaryResponse> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/api/latin/analyze?word=${encodeURIComponent(word)}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Latin API failed: ${response.status}`)
      }

      const latinData = await response.json()

      // Adapt Latin API response to DictionaryResponse format
      if (!latinData.dictionary || latinData.dictionary.definitions.length === 0) {
        return {
          word: latinData.form || word,
          found: false,
          language: 'la',
          definitions: [],
          source: 'latin-dict',
        }
      }

      return {
        word: latinData.dictionary.word,
        found: true,
        language: 'la',
        definitions: [{
          partOfSpeech: latinData.pos || 'unknown',
          meanings: latinData.dictionary.definitions,
        }],
        pronunciations: [],
        source: 'latin-dict',
      }
    } catch (error) {
      console.error(`Latin lookup failed for ${word}:`, error)
      // Return empty result instead of throwing
      return {
        word,
        found: false,
        language: 'la',
        definitions: [],
        source: 'latin-dict',
      }
    }
  }
}
