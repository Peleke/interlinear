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
