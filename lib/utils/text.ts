import { Token } from '@/types'

/**
 * Extract the sentence containing a specific word from tokenized text
 * Handles Spanish punctuation: ¿? ¡!
 */
export function extractSentence(tokens: Token[], wordIndex: number): string {
  // Spanish sentence terminators
  const sentenceEnd = /[.!?]/
  const spanishQuestionOpen = '¿'
  const spanishExclamationOpen = '¡'

  // Find sentence start (look backward)
  let startIdx = 0
  for (let i = wordIndex - 1; i >= 0; i--) {
    const token = tokens[i]
    if (sentenceEnd.test(token.text)) {
      startIdx = i + 1
      break
    }
    // Spanish opening punctuation also marks sentence start
    if (token.text === spanishQuestionOpen || token.text === spanishExclamationOpen) {
      startIdx = i
      break
    }
  }

  // Find sentence end (look forward)
  let endIdx = tokens.length - 1
  for (let i = wordIndex; i < tokens.length; i++) {
    const token = tokens[i]
    if (sentenceEnd.test(token.text)) {
      endIdx = i
      break
    }
  }

  // Extract and join tokens
  return tokens
    .slice(startIdx, endIdx + 1)
    .map(t => t.text)
    .join('')
    .trim()
}

/**
 * Calculate word count from text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Extract first N characters as excerpt
 */
export function createExcerpt(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
