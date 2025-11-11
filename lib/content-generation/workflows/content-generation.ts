/**
 * Content Generation Workflow
 *
 * Orchestrates vocabulary extraction with suspend/resume for human review
 *
 * Flow:
 * 1. Extract vocabulary from reading (NLP.js + Dictionary APIs)
 * 2. Return results for user review
 * 3. (Future) Grammar identification
 * 4. (Future) Exercise generation
 *
 * @see docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md
 */

import { Workflow } from '@mastra/core'
import { z } from 'zod'
import {
  extractVocabulary,
  extractVocabularyInputSchema,
  extractVocabularyOutputSchema
} from '../tools/extract-vocabulary'

/**
 * Workflow input schema
 */
export const contentGenerationInputSchema = z.object({
  lessonId: z.string().describe('Lesson ID for tracking'),
  readingText: z.string().describe('Reading text to analyze'),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe('Target CEFR level'),
  language: z.enum(['es', 'la']).default('es').describe('Source language'),
  userId: z.string().describe('User ID for tracking'),
  maxVocabularyItems: z.number().default(20).describe('Max vocabulary items to extract'),
})

/**
 * Workflow output schema
 */
export const contentGenerationOutputSchema = z.object({
  lessonId: z.string(),
  vocabulary: extractVocabularyOutputSchema,
  status: z.enum(['completed', 'suspended', 'failed']),
  metadata: z.object({
    vocabularyCount: z.number(),
    executionTime: z.number().describe('Execution time in milliseconds'),
    cost: z.number().optional().describe('Estimated cost in USD'),
  }),
})

export type ContentGenerationInput = z.infer<typeof contentGenerationInputSchema>
export type ContentGenerationOutput = z.infer<typeof contentGenerationOutputSchema>

/**
 * Content Generation Workflow
 *
 * Phase 1 (MVP): Vocabulary extraction only
 * Phase 2 (Future): Add grammar + exercises with suspend points
 */
export const contentGenerationWorkflow = new Workflow({
  name: 'content-generation',
  triggerSchema: contentGenerationInputSchema,
})
  .step({
    id: 'extract-vocabulary',
    description: 'Extract vocabulary from reading text using NLP.js + Dictionary APIs',
    execute: async ({ context, mastra }) => {
      const startTime = Date.now()

      console.log(`[Workflow] Extracting vocabulary for lesson ${context.lessonId}`)
      console.log(`[Workflow] Language: ${context.language}, Level: ${context.targetLevel}`)

      try {
        // Extract vocabulary using our tool
        const vocabulary = await extractVocabulary({
          readingText: context.readingText,
          targetLevel: context.targetLevel,
          maxItems: context.maxVocabularyItems,
          language: context.language,
        })

        const executionTime = Date.now() - startTime

        console.log(`[Workflow] Extracted ${vocabulary.length} vocabulary items in ${executionTime}ms`)

        // Estimate cost (Dictionary API: ~$0.0001 per word)
        const estimatedCost = vocabulary.length * 0.0001

        return {
          lessonId: context.lessonId,
          vocabulary,
          status: 'completed' as const,
          metadata: {
            vocabularyCount: vocabulary.length,
            executionTime,
            cost: estimatedCost,
          },
        }

      } catch (error) {
        console.error('[Workflow] Vocabulary extraction failed:', error)

        return {
          lessonId: context.lessonId,
          vocabulary: [],
          status: 'failed' as const,
          metadata: {
            vocabularyCount: 0,
            executionTime: Date.now() - startTime,
          },
        }
      }
    },
  })
  .commit()

/**
 * Helper to execute workflow
 */
export async function executeContentGeneration(
  input: ContentGenerationInput
): Promise<ContentGenerationOutput> {
  const result = await contentGenerationWorkflow.execute({
    triggerData: input,
  })

  return result as ContentGenerationOutput
}
