/**
 * Extract Vocabulary Tool
 *
 * Uses NLP.js for Spanish analysis + GPT-4 for example generation
 *
 * Phase 1: NLP.js extracts candidates with:
 * - Tokenization, stemming, POS tagging
 * - Frequency analysis
 * - Stop word filtering
 * - Dictionary API keys (normalized forms)
 *
 * Phase 2: GPT-4 generates:
 * - Example sentences from reading
 * - Contextual English translations
 *
 * @see docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md
 */

import { z } from 'zod'
import { generateText } from 'ai'
import { model } from '../mastra.config'
import { extractSpanishVocabCandidates, analyzeSpanish } from './spanish-nlp-helper'

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
  readingText: z.string().describe('Spanish reading text to extract vocabulary from'),
  targetLevel: z
    .enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .describe('Target CEFR level for vocabulary'),
  maxItems: z.number().default(20).describe('Maximum number of vocabulary items to extract'),
})

export const extractVocabularyOutputSchema = z.array(vocabularyItemSchema)

export type ExtractVocabularyInput = z.infer<typeof extractVocabularyInputSchema>
export type ExtractVocabularyOutput = z.infer<typeof extractVocabularyOutputSchema>

/**
 * Extract vocabulary items from Spanish reading text
 *
 * Uses hybrid NLP.js + GPT-4 approach:
 * 1. NLP.js extracts candidates (fast, free, accurate)
 * 2. GPT-4 generates examples and translations (smart, contextual)
 */
export async function extractVocabulary(
  input: ExtractVocabularyInput
): Promise<ExtractVocabularyOutput> {
  const { readingText, targetLevel, maxItems } = input

  // PHASE 1: NLP.js Pre-processing (Fast, Local, Free)
  console.log('📊 Phase 1: NLP.js analysis...')

  const nlpCandidates = extractSpanishVocabCandidates(readingText, maxItems * 2) // Get 2x for filtering

  console.log(`✅ NLP.js extracted ${nlpCandidates.length} candidates`)

  // Take top N by frequency
  const topCandidates = nlpCandidates.slice(0, maxItems)

  // PHASE 2: GPT-4 Example Generation (Smart, Contextual, Costs $$)
  console.log('🤖 Phase 2: GPT-4 example generation...')

  const vocabularyItems: VocabularyItem[] = []

  // Generate examples and translations for each candidate
  for (const candidate of topCandidates) {
    try {
      const exampleResult = await generateExampleAndTranslation({
        word: candidate.word,
        readingText,
        targetLevel,
      })

      if (exampleResult) {
        vocabularyItems.push({
          word: candidate.word,
          english_translation: exampleResult.translation,
          part_of_speech: exampleResult.partOfSpeech,
          difficulty_level: exampleResult.difficultyLevel,
          example_sentence: exampleResult.example,
          appears_in_reading: true, // Verified by NLP.js
          frequency: candidate.frequency,
          normalized_form: candidate.stem, // For dictionary API lookups
        })
      }
    } catch (error) {
      console.error(`Failed to generate example for ${candidate.word}:`, error)
      // Continue with next word
    }
  }

  console.log(`✅ Generated examples for ${vocabularyItems.length} items`)

  return vocabularyItems
}

/**
 * Generate example sentence and translation using GPT-4
 * Focused task: just examples and translations, not vocabulary selection
 */
async function generateExampleAndTranslation(params: {
  word: string
  readingText: string
  targetLevel: string
}): Promise<{
  example: string
  translation: string
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'
  difficultyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
} | null> {
  const { word, readingText, targetLevel } = params

  const prompt = `You are a Spanish language teacher creating vocabulary examples.

WORD: "${word}"
TARGET LEVEL: ${targetLevel}
READING TEXT:
${readingText}

TASK:
1. Find a sentence FROM THE READING that uses "${word}"
2. Provide an accurate English translation for "${word}"
3. Identify the part of speech
4. Classify CEFR difficulty level

IMPORTANT:
- Example sentence MUST be an exact quote from the reading
- If word appears multiple times, choose the clearest example
- Translation should match how the word is used in context

Respond in JSON format only.`

  try {
    const result = await generateText({
      model,
      prompt,
      temperature: 0, // Deterministic for consistency
    })

    // Parse JSON response
    const parsed = JSON.parse(result.text)

    // Validate the word actually appears in the example
    if (!parsed.example.toLowerCase().includes(word.toLowerCase())) {
      console.warn(`Generated example doesn't contain word: ${word}`)
      return null
    }

    return {
      example: parsed.example,
      translation: parsed.translation,
      partOfSpeech: parsed.partOfSpeech || 'other',
      difficultyLevel: parsed.difficultyLevel || targetLevel,
    }
  } catch (error) {
    console.error(`GPT-4 generation failed for ${word}:`, error)
    return null
  }
}

/**
 * Validate vocabulary item against Merriam-Webster Spanish-English API
 * (To be implemented after Merriam-Webster integration)
 */
export async function validateWithDictionary(word: string): Promise<boolean> {
  // TODO: Story 7.6 - Implement Merriam-Webster API validation
  // For now, return true (NLP.js validation is sufficient)
  return true
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
