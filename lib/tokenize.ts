import type { Token, Sentence } from '@/types'

export function tokenizeText(text: string): Token[] {
  const tokens: Token[] = []
  let currentIndex = 0

  // Split by whitespace while preserving the whitespace
  const rawTokens = text.split(/(\s+)/)

  rawTokens.forEach((rawToken) => {
    if (rawToken.length === 0) return

    // Determine if this is a word or just whitespace
    const isWord = /\S/.test(rawToken)

    // Remove punctuation for clean text (used for API calls)
    // Preserve Unicode letters (\p{L}) and numbers (\p{N})
    const cleanText = rawToken.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()

    tokens.push({
      id: `word-${currentIndex}`,
      text: rawToken,
      cleanText: isWord ? cleanText : '',
      index: currentIndex,
      sentenceId: 0, // Will be set by sentence detection
      isWord,
    })

    currentIndex++
  })

  // Detect sentence boundaries
  return detectSentences(tokens)
}

function detectSentences(tokens: Token[]): Token[] {
  let sentenceId = 0
  let buffer = ''

  return tokens.map((token) => {
    buffer += token.text

    // Sentence ends with . ! ? followed by whitespace or end of text
    const endsWithPunctuation = /[.!?]\s*$/.test(buffer)

    if (endsWithPunctuation) {
      const updatedToken = { ...token, sentenceId }
      sentenceId++
      buffer = ''
      return updatedToken
    }

    return { ...token, sentenceId }
  })
}

export function getSentence(tokens: Token[], sentenceId: number): string {
  return tokens
    .filter((t) => t.sentenceId === sentenceId)
    .map((t) => t.text)
    .join('')
}

export function getWordTokens(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.isWord)
}

export function getSentences(tokens: Token[]): Sentence[] {
  const sentenceMap = new Map<number, Token[]>()

  // Group tokens by sentenceId
  tokens.forEach((token) => {
    const existing = sentenceMap.get(token.sentenceId) || []
    existing.push(token)
    sentenceMap.set(token.sentenceId, existing)
  })

  // Convert to Sentence objects
  return Array.from(sentenceMap.entries()).map(([id, sentenceTokens]) => ({
    id,
    tokens: sentenceTokens,
    text: sentenceTokens.map((t) => t.text).join(''),
  }))
}
