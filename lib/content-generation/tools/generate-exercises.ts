/**
 * Exercise Generation Tool (STUB)
 *
 * TODO: Implement real exercise generation with:
 * - Pedagogical exercise patterns
 * - Distractor generation algorithms
 * - Difficulty calibration
 * - Exercise type specialization
 *
 * For now: LLM-based generation stub
 */

import { z } from 'zod'

// Input schema
const ExerciseInputSchema = z.object({
  readingText: z.string(),
  vocabularyItems: z.array(z.string()),
  grammarConcepts: z.array(z.string()),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['es', 'la']).default('es'),
  exerciseTypes: z
    .array(z.enum(['translation', 'multiple_choice', 'fill_blank']))
    .default(['translation', 'multiple_choice', 'fill_blank']),
  exercisesPerType: z.number().default(3),
})

// Output schema
const ExerciseSchema = z.object({
  type: z.enum(['translation', 'multiple_choice', 'fill_blank']),
  prompt: z.string(),
  correct_answer: z.string(),
  options: z.array(z.string()).optional(), // For multiple_choice
  explanation: z.string(),
  difficulty_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  targets_vocabulary: z.array(z.string()).optional(),
  targets_grammar: z.array(z.string()).optional(),
})

export const ExerciseOutputSchema = z.object({
  lessonId: z.string(),
  exercises: z.array(ExerciseSchema),
  status: z.enum(['completed', 'failed']),
  metadata: z.object({
    exerciseCount: z.number(),
    byType: z.record(z.string(), z.number()),
    executionTime: z.number(),
    cost: z.number(),
  }),
})

export type ExerciseInput = z.infer<typeof ExerciseInputSchema>
export type Exercise = z.infer<typeof ExerciseSchema>
export type ExerciseOutput = z.infer<typeof ExerciseOutputSchema>

/**
 * Generate Exercises (STUB)
 *
 * Currently returns empty array - will be LLM-powered in future
 */
export async function generateExercises(
  input: ExerciseInput
): Promise<ExerciseOutput> {
  const startTime = Date.now()

  console.log('🎯 Exercise generation (STUB - returns empty)')
  console.log(`📄 Text length: ${input.readingText.length} chars`)
  console.log(`📝 Vocabulary items: ${input.vocabularyItems.length}`)
  console.log(`📊 Grammar concepts: ${input.grammarConcepts.length}`)
  console.log(
    `🎲 Types: ${input.exerciseTypes.join(', ')} (${input.exercisesPerType} each)`
  )

  // TODO: Implement real exercise generation
  // For now, return empty array (stub)
  const exercises: Exercise[] = []

  const executionTime = Date.now() - startTime

  // Count exercises by type
  const byType: Record<string, number> = {}
  input.exerciseTypes.forEach((type) => {
    byType[type] = 0
  })

  return {
    lessonId: '', // Will be set by workflow
    exercises,
    status: 'completed',
    metadata: {
      exerciseCount: exercises.length,
      byType,
      executionTime,
      cost: 0, // No LLM calls in stub
    },
  }
}

/**
 * LLM Prompt for future implementation
 *
 * This will be used when we integrate exercise generation system
 */
export const EXERCISE_GENERATION_PROMPT = `You are an expert language teacher creating exercises for language learners.

Reading text:
{readingText}

Vocabulary to practice:
{vocabularyItems}

Grammar concepts to practice:
{grammarConcepts}

Target CEFR Level: {targetLevel}
Language: {language}
Exercise types needed: {exerciseTypes}
Exercises per type: {exercisesPerType}

Task: Generate exercises that practice the vocabulary and grammar from the lesson.

Exercise types:
1. **translation**: Translate a sentence from target language to English or vice versa
2. **multiple_choice**: Choose the correct word/form from 4 options
3. **fill_blank**: Fill in the missing word in a sentence

For each exercise, provide:
1. type: One of the exercise types
2. prompt: The exercise question/prompt
3. correct_answer: The correct answer
4. options: Array of 4 options (for multiple_choice only) - first option should be correct
5. explanation: Why this is the correct answer (brief, helpful)
6. difficulty_level: CEFR level (optional, useful for mixed-level practice)
7. targets_vocabulary: Which vocabulary words this exercises (optional)
8. targets_grammar: Which grammar concepts this exercises (optional)

Guidelines:
- Create exercises that actually use the vocabulary and grammar provided
- Mix difficulty levels slightly (mostly at target level, some +1 level)
- Make distractors (wrong options) plausible but clearly wrong
- Ensure prompts are clear and unambiguous
- Provide helpful explanations that teach, not just confirm
- For fill_blank, use "_____" to indicate the blank
- For translation, prefer sentences that sound natural
- Create exercises in a logical progression (easier first)
- Balance coverage across vocabulary and grammar concepts

Return a JSON array of exercise objects following the Exercise schema.`
