/**
 * Mastra AI Content Generation
 * Public API for AI-powered lesson content generation
 */

import {
  executeWorkflow,
  resumeWorkflow,
} from './workflows/contentGeneration';
import {
  VocabularyInput,
  GrammarInput,
  ExercisesInput,
  GenerationResult,
  VocabularyOutput,
  GrammarOutput,
  ExercisesOutput,
} from './types';
import { calculateCost } from './providers/openai';

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate vocabulary from reading text
 *
 * @param input - Vocabulary generation parameters
 * @returns Generated vocabulary items with cost tracking
 *
 * @example
 * ```typescript
 * const result = await generateVocabulary({
 *   lessonId: 'uuid',
 *   readingText: 'La maison est grande...',
 *   targetCEFRLevel: 'B1',
 *   maxItems: 15,
 * });
 * ```
 */
export async function generateVocabulary(
  input: VocabularyInput
): Promise<GenerationResult<VocabularyOutput>> {
  try {
    const result = await executeWorkflow({
      lessonId: input.lessonId,
      readingText: input.readingText,
      targetCEFRLevel: input.targetCEFRLevel,
      startFrom: 'vocabulary',
    });

    const vocabularyData = result.steps.extractVocabulary?.output;
    const usage = result.steps.extractVocabulary?.usage;

    const cost = usage
      ? calculateCost(usage.inputTokens, usage.outputTokens)
      : 0;

    return {
      success: true,
      data: vocabularyData,
      tokensUsed: usage ? usage.inputTokens + usage.outputTokens : 0,
      costUSD: cost,
      generationId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate grammar concepts from reading text
 *
 * @param input - Grammar generation parameters
 * @returns Generated grammar concepts with cost tracking
 *
 * @example
 * ```typescript
 * const result = await generateGrammar({
 *   lessonId: 'uuid',
 *   readingText: 'La maison est grande...',
 *   targetCEFRLevel: 'B1',
 *   maxConcepts: 5,
 * });
 * ```
 */
export async function generateGrammar(
  input: GrammarInput
): Promise<GenerationResult<GrammarOutput>> {
  try {
    const result = await executeWorkflow({
      lessonId: input.lessonId,
      readingText: input.readingText,
      targetCEFRLevel: input.targetCEFRLevel,
      startFrom: 'grammar',
    });

    const grammarData = result.steps.identifyGrammar?.output;
    const usage = result.steps.identifyGrammar?.usage;

    const cost = usage
      ? calculateCost(usage.inputTokens, usage.outputTokens)
      : 0;

    return {
      success: true,
      data: grammarData,
      tokensUsed: usage ? usage.inputTokens + usage.outputTokens : 0,
      costUSD: cost,
      generationId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate exercises from vocabulary and grammar
 *
 * @param input - Exercise generation parameters
 * @returns Generated exercises with cost tracking
 *
 * @example
 * ```typescript
 * const result = await generateExercises({
 *   lessonId: 'uuid',
 *   readingText: 'La maison est grande...',
 *   vocabularyItems: ['maison', 'grande', 'jardin'],
 *   grammarConcepts: ['Present Tense', 'Adjective Agreement'],
 *   targetCEFRLevel: 'B1',
 *   exerciseTypes: ['translation', 'multiple_choice'],
 *   exercisesPerType: 3,
 * });
 * ```
 */
export async function generateExercises(
  input: ExercisesInput
): Promise<GenerationResult<ExercisesOutput>> {
  try {
    const result = await executeWorkflow({
      lessonId: input.lessonId,
      readingText: input.readingText,
      targetCEFRLevel: input.targetCEFRLevel,
      startFrom: 'exercises',
    });

    const exercisesData = result.steps.generateExercises?.output;
    const usage = result.steps.generateExercises?.usage;

    const cost = usage
      ? calculateCost(usage.inputTokens, usage.outputTokens)
      : 0;

    return {
      success: true,
      data: exercisesData,
      tokensUsed: usage ? usage.inputTokens + usage.outputTokens : 0,
      costUSD: cost,
      generationId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate complete lesson content (vocabulary + grammar + exercises)
 *
 * @param input - Complete lesson generation parameters
 * @returns All generated content with total cost tracking
 *
 * @example
 * ```typescript
 * const result = await generateCompleteLesson({
 *   lessonId: 'uuid',
 *   readingText: 'La maison est grande...',
 *   targetCEFRLevel: 'B1',
 * });
 * ```
 */
export async function generateCompleteLesson(input: {
  lessonId: string;
  readingText: string;
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}): Promise<GenerationResult<{
  vocabulary: VocabularyOutput;
  grammar: GrammarOutput;
  exercises: ExercisesOutput;
}>> {
  try {
    const result = await executeWorkflow({
      lessonId: input.lessonId,
      readingText: input.readingText,
      targetCEFRLevel: input.targetCEFRLevel,
    });

    const vocabularyData = result.steps.extractVocabulary?.output;
    const grammarData = result.steps.identifyGrammar?.output;
    const exercisesData = result.steps.generateExercises?.output;

    const vocabUsage = result.steps.extractVocabulary?.usage;
    const grammarUsage = result.steps.identifyGrammar?.usage;
    const exercisesUsage = result.steps.generateExercises?.usage;

    const totalInputTokens =
      (vocabUsage?.inputTokens || 0) +
      (grammarUsage?.inputTokens || 0) +
      (exercisesUsage?.inputTokens || 0);

    const totalOutputTokens =
      (vocabUsage?.outputTokens || 0) +
      (grammarUsage?.outputTokens || 0) +
      (exercisesUsage?.outputTokens || 0);

    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);

    return {
      success: true,
      data: {
        vocabulary: vocabularyData,
        grammar: grammarData,
        exercises: exercisesData,
      },
      tokensUsed: totalInputTokens + totalOutputTokens,
      costUSD: totalCost,
      generationId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resume a suspended workflow from a checkpoint
 *
 * @param workflowId - ID of the workflow to resume
 * @param fromStep - Step to resume from ('grammar' or 'exercises')
 * @returns Remaining generated content with cost tracking
 *
 * @example
 * ```typescript
 * // User approved vocabulary, now generate grammar
 * const result = await resumeFromCheckpoint(workflowId, 'grammar');
 * ```
 */
export async function resumeFromCheckpoint(
  workflowId: string,
  fromStep: 'grammar' | 'exercises'
): Promise<GenerationResult> {
  try {
    const result = await resumeWorkflow(workflowId, fromStep);

    // Calculate cost for resumed steps
    const usage = result.usage || { inputTokens: 0, outputTokens: 0 };
    const cost = calculateCost(usage.inputTokens, usage.outputTokens);

    return {
      success: true,
      data: result.output,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      costUSD: cost,
      generationId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Re-export types for consumers
// ============================================================================

export type {
  VocabularyInput,
  VocabularyOutput,
  VocabularyItem,
  GrammarInput,
  GrammarOutput,
  GrammarConcept,
  ExercisesInput,
  ExercisesOutput,
  Exercise,
  GenerationResult,
  GenerationType,
  GenerationStatus,
} from './types';
