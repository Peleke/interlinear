/**
 * Extract Vocabulary Tool
 *
 * Uses NLP.js for analysis + Dictionary APIs for translations
 *
 * Phase 1: NLP.js extracts candidates with:
 * - Tokenization, stemming, POS tagging
 * - Frequency analysis
 * - Stop word filtering
 * - Dictionary API keys (normalized forms)
 *
 * Phase 2: Dictionary API lookup:
 * - Spanish: Merriam-Webster API
 * - Latin: Latin Dictionary API
 * - Get translations, POS, pronunciations
 * - Extract example sentences from reading (simple string search)
 *
 * @see docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md
 */

import { z } from 'zod'
import { extractSpanishVocabCandidates, analyzeSpanish } from './spanish-nlp-helper'
import { DictionaryRouter } from '@/lib/services/dictionary-router'

/**
 * Zod schemas for vocabulary extraction
 */

export const vocabularyItemSchema = z.object({
  word: z.string().describe('Spanish word or phrase'),
  english_translation: z.string().describe('English translation'),
  part_of_speech: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'other'])
    .describe('Part of speech'),
  difficulty_level: z
    .enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .describe('CEFR difficulty level'),
  example_sentence: z.string().describe('Example sentence FROM THE READING'),
  appears_in_reading: z.boolean().describe('Confirmed to appear in reading text'),
  frequency: z.number().describe('How many times word appears in reading'),
  normalized_form: z.string().describe('Dictionary lookup key (normalized/stemmed)'),
})

export type VocabularyItem = z.infer<typeof vocabularyItemSchema>

export const extractVocabularyInputSchema = z.object({
  readingText: z.string().describe('Reading text to extract vocabulary from'),
  targetLevel: z
    .enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .describe('Target CEFR level for vocabulary'),
  maxItems: z.number().default(20).describe('Maximum number of vocabulary items to extract'),
  language: z.enum(['es', 'la']).default('es').describe('Source language of reading text'),
})

export const extractVocabularyOutputSchema = z.array(vocabularyItemSchema)

export type ExtractVocabularyInput = z.infer<typeof extractVocabularyInputSchema>
export type ExtractVocabularyOutput = z.infer<typeof extractVocabularyOutputSchema>

/**
 * Extract vocabulary items from reading text
 *
 * Uses hybrid NLP.js + Dictionary API approach:
 * 1. NLP.js extracts candidates (fast, free, accurate)
 * 2. Dictionary API lookup (MW for Spanish, Latin Dict for Latin)
 * 3. Simple string search for examples in reading text
 */
export async function extractVocabulary(
  input: ExtractVocabularyInput
): Promise<ExtractVocabularyOutput> {
  const { readingText, targetLevel, maxItems, language = 'es' } = input

  // PHASE 1: NLP.js Pre-processing (Fast, Local, Free)
  console.log('📊 Phase 1: NLP.js analysis...')

  const nlpCandidates = extractSpanishVocabCandidates(readingText, maxItems * 2) // Get 2x for filtering

  console.log(`✅ NLP.js extracted ${nlpCandidates.length} candidates`)

  // Take top N by frequency
  const topCandidates = nlpCandidates.slice(0, maxItems)

  // PHASE 2: Dictionary API Lookup (Fast, Accurate, Cheap)
  console.log('📚 Phase 2: Dictionary API lookup...')

  const vocabularyItems: VocabularyItem[] = []

  // Look up each candidate in dictionary
  for (const candidate of topCandidates) {
    try {
      // Dictionary API lookup via router
      const dictData = await DictionaryRouter.lookup(candidate.word, language)

      if (dictData.found && dictData.definitions.length > 0) {
        // Extract example sentence from reading (simple string search)
        const example = findExampleInReading(candidate.word, readingText)

        vocabularyItems.push({
          word: candidate.word,
          english_translation: dictData.definitions[0].meanings[0] || 'unknown',
          part_of_speech: mapPartOfSpeech(dictData.definitions[0].partOfSpeech),
          difficulty_level: targetLevel, // Use target level (no CEFR classification)
          example_sentence: example,
          appears_in_reading: true, // Verified by NLP.js
          frequency: candidate.frequency,
          normalized_form: candidate.stem, // For dictionary API lookups
        })
      }
    } catch (error) {
      console.error(`Dictionary lookup failed for ${candidate.word}:`, error)
      // Continue with next word
    }
  }

  console.log(`✅ Dictionary lookup completed for ${vocabularyItems.length} items`)

  return vocabularyItems
}

/**
 * Find example sentence in reading (simple string search)
 */
function findExampleInReading(word: string, reading: string): string {
  // Split into sentences (handle Spanish punctuation ¿¡)
  const sentences = reading.match(/[^.!?¡¿]+[.!?]+/g) || []
  const wordLower = word.toLowerCase()

  // Find sentence containing word
  const found = sentences.find((s) => s.toLowerCase().includes(wordLower))

  return found?.trim() || ''
}

/**
 * Map dictionary part of speech to our enum
 */
function mapPartOfSpeech(
  pos?: string
): 'noun' | 'verb' | 'adjective' | 'adverb' | 'other' {
  if (!pos) return 'other'

  const normalized = pos.toLowerCase()

  // English terms
  if (normalized.includes('noun')) return 'noun'
  if (normalized.includes('verb')) return 'verb'
  if (normalized.includes('adj')) return 'adjective'
  if (normalized.includes('adv')) return 'adverb'

  // Spanish terms
  if (normalized.includes('sustantivo')) return 'noun'
  if (normalized.includes('verbo')) return 'verb'
  if (normalized.includes('adjetivo')) return 'adjective'
  if (normalized.includes('adverbio')) return 'adverb'

  // Latin terms
  if (normalized.includes('nomen')) return 'noun'
  if (normalized.includes('verbum')) return 'verb'

  return 'other'
}

/**
 * Validate vocabulary item against dictionary API
 */
export async function validateWithDictionary(
  word: string,
  language: 'es' | 'la' = 'es'
): Promise<boolean> {
  try {
    const result = await DictionaryRouter.lookup(word, language)
    return result.found
  } catch (error) {
    console.error('Dictionary validation failed:', error)
    return false
  }
}

/**
 * Helper: Get vocabulary statistics from reading
 */
export function getVocabularyStats(readingText: string) {
  const analysis = analyzeSpanish(readingText)

  return {
    totalWords: analysis.totalWords,
    uniqueWords: analysis.uniqueWordCount,
    contentWords: analysis.contentWords.length,
    topWords: analysis.contentWords.slice(0, 10),
  }
}
