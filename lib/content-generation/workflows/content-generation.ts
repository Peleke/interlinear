/**
 * Content Generation Workflow
 *
 * Orchestrates vocabulary, grammar, and exercise generation using the new
 * language processor architecture with factory pattern.
 *
 * Architecture:
 * - Uses LanguageProcessorFactory to get appropriate processor (Spanish NLP.js or Latin LLM)
 * - Each processor implements the same interface with language-specific capabilities
 * - Spanish: Fast NLP.js-based processing with dictionary APIs
 * - Latin: LLM-based processing for complex morphological analysis
 *
 * Flow:
 * 1. Extract vocabulary using language-specific processor - IMPLEMENTED
 * 2. Identify grammar concepts using processor capabilities - IMPLEMENTED
 * 3. Generate exercises based on processor's custom exercise types - IMPLEMENTED
 * 4. Return unified results with processor-specific metadata
 *
 * Benefits:
 * - Language-agnostic workflow logic
 * - Processor-specific optimizations (NLP.js vs LLM)
 * - Extensible for future languages
 * - Comprehensive error handling and cost tracking
 *
 * @see docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md
 * @see lib/content-generation/interfaces/language-processor.ts
 */

import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'
import {
  extractVocabulary,
  extractVocabularyInputSchema,
  extractVocabularyOutputSchema,
} from '../tools/extract-vocabulary'
import {
  identifyGrammar,
  GrammarOutputSchema,
} from '../tools/identify-grammar'
import {
  generateExercises,
  ExerciseOutputSchema,
} from '../tools/generate-exercises'

/**
 * Workflow input schema
 */
import { createLanguageProcessor } from '../tools/language-processor-factory'

/**
 * Helper function to map CEFR levels to processor difficulty levels
 */
function mapCEFRToDifficulty(cefrLevel: string): 'basic' | 'intermediate' | 'advanced' | undefined {
  switch (cefrLevel) {
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
      return undefined // No filter
  }
}

/**
 * Helper function to map processor difficulty to CEFR levels
 */
function mapDifficultyToCEFR(difficulty: 'basic' | 'intermediate' | 'advanced'): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
  switch (difficulty) {
    case 'basic': return 'A2'
    case 'intermediate': return 'B1'
    case 'advanced': return 'C1'
    default: return 'A2'
  }
}
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
  grammar: GrammarOutputSchema.shape.grammar_concepts.optional(),
  exercises: ExerciseOutputSchema.shape.exercises.optional(),
  status: z.enum(['completed', 'suspended', 'failed']),
  metadata: z.object({
    vocabularyCount: z.number(),
    grammarCount: z.number().optional(),
    exerciseCount: z.number().optional(),
    executionTime: z.number().describe('Execution time in milliseconds'),
    cost: z.number().optional().describe('Estimated cost in USD'),
  }),
})

export type ContentGenerationInput = z.infer<typeof contentGenerationInputSchema>
export type ContentGenerationOutput = z.infer<typeof contentGenerationOutputSchema>

/**
 * Step 1: Extract Vocabulary
 */
const extractVocabularyStep = createStep({
  id: 'extract-vocabulary',
  inputSchema: contentGenerationInputSchema,
  outputSchema: contentGenerationOutputSchema,
  execute: async ({ inputData }) => {
    const startTime = Date.now()

    console.log(`[Workflow] Extracting vocabulary for lesson ${inputData.lessonId}`)
    console.log(`[Workflow] Language: ${inputData.language}, Level: ${inputData.targetLevel}`)

    try {
      // Get the appropriate language processor
      const processor = await createLanguageProcessor(inputData.language)
      
      // Extract vocabulary using the processor (no difficulty filter - extract all)
      const vocabularyCandidates = await processor.extractVocabulary(inputData.readingText, {
        maxItems: inputData.maxVocabularyItems * 2, // Extract more candidates for better selection
        includeFrequency: true,
        includeMorphology: true,
        // No difficultyFilter - let's get all vocabulary and prioritize later
      })

      // Helper function to score vocabulary based on CEFR level and frequency
      const calculateVocabularyScore = (candidate: any, targetDifficulty?: 'basic' | 'intermediate' | 'advanced'): number => {
        let score = 0

        // Base score from frequency (higher frequency = more important)
        score += (candidate.frequency || 1) * 10

        // Bonus for difficulty level match
        if (targetDifficulty && candidate.difficulty) {
          if (candidate.difficulty === targetDifficulty) {
            score += 100 // Perfect match
          } else {
            // Partial bonus for adjacent levels
            const difficultyOrder = ['basic', 'intermediate', 'advanced']
            const targetIndex = difficultyOrder.indexOf(targetDifficulty)
            const candidateIndex = difficultyOrder.indexOf(candidate.difficulty)
            const distance = Math.abs(targetIndex - candidateIndex)

            if (distance === 1) {
              score += 50 // Adjacent level
            } else if (distance === 2) {
              score += 25 // Two levels apart
            }
          }
        } else {
          // No difficulty info - use frequency-based scoring
          score += 30 // Moderate bonus for having frequency data
        }

        // Bonus for having morphology data (indicates quality analysis)
        if (candidate.morphology) {
          score += 20
        }

        // Bonus for reasonable word length (not too short, not too long)
        const wordLength = candidate.word?.length || 0
        if (wordLength >= 3 && wordLength <= 12) {
          score += 15
        }

        return score
      }

      // Sort vocabulary by relevance to target CEFR level and frequency
      const sortedCandidates = vocabularyCandidates.sort((a, b) => {
        const targetDifficulty = mapCEFRToDifficulty(inputData.targetLevel)

        // Score based on difficulty match and frequency
        const scoreA = calculateVocabularyScore(a, targetDifficulty)
        const scoreB = calculateVocabularyScore(b, targetDifficulty)

        return scoreB - scoreA // Higher score first
      })

      // Take the top items after sorting, but don't filter by difficulty
      const topCandidates = sortedCandidates.slice(0, inputData.maxVocabularyItems)

      // Transform to the expected legacy format for compatibility
      const vocabulary = topCandidates.map(candidate => candidate.word)

      const executionTime = Date.now() - startTime

      console.log(`[Workflow] Extracted ${vocabulary.length} vocabulary items in ${executionTime}ms`)

      // Estimate cost based on processor type
      const estimatedCost = inputData.language === 'la' 
        ? vocabularyCandidates.length * 0.001  // Higher cost for LLM-based Latin processing
        : vocabularyCandidates.length * 0.0001 // Lower cost for NLP.js Spanish processing

      return {
        lessonId: inputData.lessonId,
        vocabulary,
        status: 'completed' as const,
        metadata: {
          vocabularyCount: vocabulary.length,
          executionTime,
          cost: estimatedCost,
          processorType: inputData.language === 'la' ? 'LLM' : 'NLP.js',
          vocabularyDetails: vocabularyCandidates, // Include full details for advanced use
        },
      }
    } catch (error) {
      console.error('[Workflow] Vocabulary extraction failed:', error)

      return {
        lessonId: inputData.lessonId,
        vocabulary: [],
        status: 'failed' as const,
        metadata: {
          vocabularyCount: 0,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  },
})

/**
 * Step 2: Identify Grammar (STUB)
 */
const identifyGrammarStep = createStep({
  id: 'identify-grammar',
  inputSchema: contentGenerationInputSchema,
  outputSchema: GrammarOutputSchema,
  execute: async ({ inputData }) => {
    const startTime = Date.now()
    
    console.log(`[Workflow] Identifying grammar for lesson ${inputData.lessonId}`)
    console.log(`[Workflow] Language: ${inputData.language}, Level: ${inputData.targetLevel}`)

    try {
      // Get the appropriate language processor
      const processor = await createLanguageProcessor(inputData.language)

      // Identify grammar using the processor
      const grammarConcepts = await processor.identifyGrammar(inputData.readingText, {
        maxConcepts: 5,
        complexityLevel: mapCEFRToDifficulty(inputData.targetLevel) || 'all',
        includeExamples: true
      })

      const executionTime = Date.now() - startTime

      console.log(`[Workflow] Grammar identification completed (${grammarConcepts.length} concepts) in ${executionTime}ms`)

      return {
        lessonId: inputData.lessonId,
        concepts: grammarConcepts.map(concept => ({
          name: concept.name,
          description: concept.description,
          examples: concept.examples.map(ex => ex.text),
          difficulty: concept.complexity
        })),
        status: 'completed',
        metadata: {
          conceptCount: grammarConcepts.length,
          executionTime,
          processorType: inputData.language === 'la' ? 'LLM' : 'NLP.js',
          detailedConcepts: grammarConcepts, // Include full details
        },
      }
    } catch (error) {
      console.error('[Workflow] Grammar identification failed:', error)

      return {
        lessonId: inputData.lessonId,
        concepts: [],
        status: 'failed',
        metadata: {
          conceptCount: 0,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  },
})

/**
 * Step 3: Generate Exercises (STUB)
 */
const generateExercisesStep = createStep({
  id: 'generate-exercises',
  inputSchema: z.object({
    lessonId: z.string(),
    readingText: z.string(),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    language: z.enum(['es', 'la']),
    vocabularyItems: z.array(z.string()),
    grammarConcepts: z.array(z.string()),
    // Optional: Include full vocabulary and grammar details if available
    vocabularyDetails: z.array(z.any()).optional(),
    grammarDetails: z.array(z.any()).optional(),
  }),
  outputSchema: ExerciseOutputSchema,
  execute: async ({ inputData }) => {
    const startTime = Date.now()
    
    console.log(`[Workflow] Generating exercises for lesson ${inputData.lessonId}`)
    console.log(`[Workflow] Language: ${inputData.language}, Level: ${inputData.targetLevel}`)

    try {
      // Get the appropriate language processor
      const processor = await createLanguageProcessor(inputData.language)

      // Prepare vocabulary data (use detailed data if available)
      const vocabularyData = inputData.vocabularyDetails || inputData.vocabularyItems.map(word => ({
        word,
        lemma: word,
        definition: `Definition for ${word}`,
        partOfSpeech: 'unknown',
        frequency: 50,
        difficulty: mapCEFRToDifficulty(inputData.targetLevel) || 'basic'
      }))

      // Prepare grammar data (use detailed data if available)  
      const grammarData = inputData.grammarDetails || inputData.grammarConcepts.map(concept => ({
        id: concept.toLowerCase().replace(/\s+/g, '_'),
        name: concept,
        description: `Grammar concept: ${concept}`,
        complexity: mapCEFRToDifficulty(inputData.targetLevel) || 'basic',
        examples: [],
        category: 'general'
      }))

      // Determine exercise types based on language and capabilities
      const exerciseTypes = processor.capabilities.customExerciseTypes || ['translation', 'multiple_choice', 'fill_blank']
      const selectedTypes = exerciseTypes.slice(0, 3) // Limit to 3 types

      // Create exercise context
      const exerciseContext = {
        originalText: inputData.readingText,
        vocabulary: vocabularyData,
        grammarConcepts: grammarData,
        exerciseTypes: selectedTypes,
        maxExercises: 9, // 3 per type
        targetDifficulty: mapCEFRToDifficulty(inputData.targetLevel) || 'basic'
      }

      // Generate exercises using the processor
      const exercises = await processor.generateExercises(exerciseContext)

      const executionTime = Date.now() - startTime

      console.log(`[Workflow] Exercise generation completed (${exercises.length} exercises) in ${executionTime}ms`)

      return {
        lessonId: inputData.lessonId,
        exercises: exercises.map(exercise => ({
          id: exercise.id,
          type: exercise.type,
          prompt: exercise.question,
          correct_answer: exercise.correctAnswer,
          options: exercise.distractors,
          explanation: exercise.explanation,
          difficulty: exercise.difficulty
        })),
        status: 'completed',
        metadata: {
          exerciseCount: exercises.length,
          exerciseTypes: selectedTypes,
          executionTime,
          processorType: inputData.language === 'la' ? 'LLM' : 'NLP.js',
          detailedExercises: exercises, // Include full details
        },
      }
    } catch (error) {
      console.error('[Workflow] Exercise generation failed:', error)

      return {
        lessonId: inputData.lessonId,
        exercises: [],
        status: 'failed',
        metadata: {
          exerciseCount: 0,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  },
})

/**
 * Content Generation Workflow
 *
 * Orchestrates all three content generation steps
 * - Vocabulary: WORKING (NLP.js + Dictionary APIs)
 * - Grammar: STUB (returns empty)
 * - Exercises: STUB (returns empty)
 */
export const contentGenerationWorkflow = createWorkflow({
  id: 'content-generation',
  inputSchema: contentGenerationInputSchema,
  outputSchema: contentGenerationOutputSchema,
})
  .then(extractVocabularyStep)
  .commit()

/**
 * Helper to execute workflow
 */
export async function executeContentGeneration(
  input: ContentGenerationInput
): Promise<ContentGenerationOutput> {
  const run = await contentGenerationWorkflow.createRunAsync()
  const result = await run.start({ inputData: input })

  // Mastra workflows return { status, steps, input, result }
  // The actual step output is in result.result
  const output = result?.result

  if (!output || !output.metadata) {
    console.error('[Workflow] Invalid output structure:', output)
    console.error('[Workflow] Full result:', JSON.stringify(result, null, 2))
    throw new Error('Workflow returned invalid result structure')
  }

  console.log('[Workflow] Successfully extracted output with', output.vocabulary.length, 'items')

  return output as ContentGenerationOutput
}
