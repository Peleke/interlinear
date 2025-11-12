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

  console.log(`📊 Phase 1: ${language.toUpperCase()} vocabulary extraction...`)
  console.log(`📄 Reading text length: ${readingText.length} chars`)
  console.log(`🎯 Target: ${maxItems} items, language: ${language}`)

  let vocabularyItems: VocabularyItem[] = []

  if (language === 'la') {
    // Latin: Use LLM-based processing for sophisticated morphological analysis
    console.log('🏛️  Using LLM for Latin morphological analysis...')

    try {
      // Import Latin processor dynamically to avoid Spanish NLP dependencies
      const { LatinLanguageProcessor } = await import('./latin-language-processor')
      const processor = new LatinLanguageProcessor()

      // Use the LLM-based vocabulary extraction
      const latinVocab = await processor.extractVocabulary(readingText, {
        maxItems,
        includeFrequency: true,
        includeMorphology: true,
        difficultyFilter: mapTargetLevelToDifficulty(targetLevel)
      })

      console.log(`✅ Latin LLM extracted ${latinVocab.length} vocabulary items`)

      // Convert to existing VocabularyItem format for compatibility
      vocabularyItems = latinVocab.map(vocab => ({
        word: vocab.word,
        english_translation: vocab.definition,
        part_of_speech: vocab.partOfSpeech,
        difficulty_level: targetLevel,
        example_sentence: findExampleInReading(vocab.word, readingText),
        appears_in_reading: true,
        frequency: vocab.frequency || 1,
        normalized_form: vocab.lemma,
      }))

    } catch (error) {
      console.error('❌ Latin LLM processing failed:', error instanceof Error ? error.message : error)

      // Fallback: Basic Latin tokenization + dictionary lookup
      console.log('🔄 Falling back to basic Latin tokenization...')
      const basicTokens = readingText.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, maxItems)
        .map(word => ({ word, frequency: 1, stem: word }))

      await processWithDictionary(basicTokens, readingText, targetLevel, language, vocabularyItems)
    }

  } else {
    // Spanish: Use fast NLP.js processing
    console.log('🚀 Using NLP.js for Spanish analysis...')

    const nlpCandidates = extractSpanishVocabCandidates(readingText, maxItems * 2)

    console.log(`✅ NLP.js extracted ${nlpCandidates.length} candidates`)
    if (nlpCandidates.length > 0) {
      console.log(`📝 Sample candidates:`, nlpCandidates.slice(0, 5).map(c => `${c.word} (${c.frequency}x)`))
    } else {
      console.warn('⚠️  NLP.js returned 0 candidates! Checking tokenization...')
      const testTokens = extractSpanishVocabCandidates('hola mundo', 5)
      console.log('🧪 Test tokenization result:', testTokens)
    }

    const topCandidates = nlpCandidates.slice(0, maxItems)
    await processWithDictionary(topCandidates, readingText, targetLevel, language, vocabularyItems)
  }

  console.log(`✅ Final result: ${vocabularyItems.length} vocabulary items extracted`)
  return vocabularyItems
}

// Helper function for dictionary-based processing (used by both Spanish and Latin fallback)
async function processWithDictionary(
  candidates: Array<{word: string, frequency: number, stem?: string}>,
  readingText: string,
  targetLevel: string,
  language: string,
  vocabularyItems: VocabularyItem[]
) {
  console.log('📚 Phase 2: Dictionary API lookup...')
  console.log(`🔄 Processing ${candidates.length} candidates in batches of 10...`)

  const BATCH_SIZE = 10

  // Process in batches
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(candidates.length / BATCH_SIZE)}...`)

    // Parallel lookup for batch
    const lookupPromises = batch.map(async (candidate) => {
      try {
        const dictData = await DictionaryRouter.lookup(candidate.word, language)

        if (dictData.found && dictData.definitions.length > 0) {
          const example = findExampleInReading(candidate.word, readingText)

          return {
            word: candidate.word,
            english_translation: dictData.definitions[0].meanings[0] || 'unknown',
            part_of_speech: mapPartOfSpeech(dictData.definitions[0].partOfSpeech),
            difficulty_level: targetLevel,
            example_sentence: example,
            appears_in_reading: true,
            frequency: candidate.frequency,
            normalized_form: candidate.stem || candidate.word,
          }
        }
        return null
      } catch (error) {
        console.warn(`⚠️  Dictionary lookup failed for ${candidate.word}:`, error instanceof Error ? error.message : error)
        return null
      }
    })

    const batchResults = await Promise.all(lookupPromises)
    const validItems = batchResults.filter((item): item is VocabularyItem => item !== null)
    vocabularyItems.push(...validItems)

    console.log(`✅ Batch complete: ${validItems.length}/${batch.length} successful`)

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`✅ Dictionary lookup completed: ${vocabularyItems.length}/${candidates.length} items successfully resolved`)
}

// Helper function to map CEFR levels to difficulty
function mapTargetLevelToDifficulty(targetLevel: string): 'basic' | 'intermediate' | 'advanced' | undefined {
  switch (targetLevel) {
    case 'A1':
    case 'A2':
      return 'basic'
    case 'B1':
    case 'B2':
      return 'intermediate'
    case 'C1':
    case 'C2':
      return 'advanced'
    default:
      return undefined
  }
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
