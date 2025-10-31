export interface Token {
  id: string // Format: word-{index}
  text: string // The actual word (including punctuation)
  cleanText: string // Word without punctuation for API lookups
  index: number // Position in original text
  sentenceId: number // Which sentence this belongs to
  isWord: boolean // true for words, false for pure whitespace/punctuation
}

export interface Sentence {
  id: number
  tokens: Token[]
  text: string
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

export interface VocabularyEntry {
  id: string
  user_id: string
  word: string
  definition: DictionaryResponse | null
  click_count: number
  first_seen: string
  last_seen: string
  created_at: string
  updated_at: string
  source_text_id?: string | null
  original_sentence?: string | null
}

export interface VocabularyCreateInput {
  word: string
  definition?: DictionaryResponse
}

export interface VocabularyStats {
  totalWords: number
  recentWords: number
  topWords: { word: string; count: number }[]
}
