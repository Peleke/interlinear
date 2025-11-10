/**
 * Mastra Types
 * Shared types for AI content generation workflows
 */

import { z } from 'zod';

// ============================================================================
// Generation Types
// ============================================================================

export type GenerationType = 'vocabulary' | 'grammar' | 'exercises' | 'complete';
export type GenerationStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Input Schemas
// ============================================================================

export const VocabularyInputSchema = z.object({
  lessonId: z.string(), // TEXT id from lessons table (custom IDs from YAML)
  readingText: z.string().min(50),
  targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  maxItems: z.number().min(5).max(20).default(15),
});

export const GrammarInputSchema = z.object({
  lessonId: z.string(), // TEXT id from lessons table (custom IDs from YAML)
  readingText: z.string().min(50),
  targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  maxConcepts: z.number().min(3).max(10).default(5),
});

export const ExercisesInputSchema = z.object({
  lessonId: z.string(), // TEXT id from lessons table (custom IDs from YAML)
  readingText: z.string().min(50),
  vocabularyItems: z.array(z.string()),
  grammarConcepts: z.array(z.string()),
  targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  exerciseTypes: z.array(z.enum(['translation', 'multiple_choice', 'fill_blank'])).default(['translation', 'multiple_choice', 'fill_blank']),
  exercisesPerType: z.number().min(2).max(5).default(3),
});

export type VocabularyInput = z.infer<typeof VocabularyInputSchema>;
export type GrammarInput = z.infer<typeof GrammarInputSchema>;
export type ExercisesInput = z.infer<typeof ExercisesInputSchema>;

// ============================================================================
// Output Schemas
// ============================================================================

export const VocabularyItemSchema = z.object({
  word: z.string(),
  translation: z.string(),
  definition: z.string(),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  is_new: z.boolean(),
  example_sentence: z.string().optional(),
});

export const GrammarConceptSchema = z.object({
  concept_name: z.string(),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_from_text: z.string(),
  explanation: z.string(),
  additional_examples: z.array(z.string()).optional(),
});

export const ExerciseSchema = z.object({
  type: z.enum(['translation', 'multiple_choice', 'fill_blank']),
  prompt: z.string(),
  correct_answer: z.string(),
  options: z.array(z.string()).optional(), // For multiple choice
  explanation: z.string(),
  difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
});

export const VocabularyOutputSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema),
});

export const GrammarOutputSchema = z.object({
  grammar_concepts: z.array(GrammarConceptSchema),
});

export const ExercisesOutputSchema = z.object({
  exercises: z.array(ExerciseSchema),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type GrammarConcept = z.infer<typeof GrammarConceptSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type VocabularyOutput = z.infer<typeof VocabularyOutputSchema>;
export type GrammarOutput = z.infer<typeof GrammarOutputSchema>;
export type ExercisesOutput = z.infer<typeof ExercisesOutputSchema>;

// ============================================================================
// Generation Result
// ============================================================================

export interface GenerationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  costUSD?: number;
  generationId?: string;
}

// ============================================================================
// Workflow State
// ============================================================================

export interface WorkflowState {
  lessonId: string;
  currentStep: 'vocabulary' | 'grammar' | 'exercises' | 'complete';
  vocabularyData?: VocabularyOutput;
  grammarData?: GrammarOutput;
  exercisesData?: ExercisesOutput;
  totalCost: number;
  totalTokens: number;
}

// ============================================================================
// Checkpoint
// ============================================================================

export interface WorkflowCheckpoint {
  workflowId: string;
  lessonId: string;
  step: 'vocabulary' | 'grammar' | 'exercises';
  state: WorkflowState;
  timestamp: Date;
}
