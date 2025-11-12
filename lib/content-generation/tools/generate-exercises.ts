/**
 * Exercise Generation Tool
 *
 * LLM-powered exercise generation for language learning
 * Supports: translation, multiple_choice, fill_blank
 *
 * Uses GPT-4 with structured output to generate exercises
 * from provided content (reading text, sentences, vocabulary)
 */

import { z } from 'zod'
import { generateObject } from 'ai'
import { model } from '../mastra.config'

// Input schema
const ExerciseInputSchema = z.object({
  content: z.string().describe('Content to generate exercises from (reading, sentence, or vocabulary list)'),
  type: z.enum(['translation', 'multiple_choice', 'fill_blank']).describe('Type of exercise to generate'),
  count: z.number().default(3).describe('Number of exercises to generate'),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  language: z.enum(['es', 'la']).default('es'),
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
  exercises: z.array(ExerciseSchema),
  status: z.enum(['completed', 'failed']),
  metadata: z.object({
    exerciseCount: z.number(),
    executionTime: z.number(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
})

export type ExerciseInput = z.infer<typeof ExerciseInputSchema>
export type Exercise = z.infer<typeof ExerciseSchema>
export type ExerciseOutput = z.infer<typeof ExerciseOutputSchema>

/**
 * Generate Exercises with LLM
 *
 * Uses GPT-4 with structured output to generate exercises
 */
export async function generateExercises(
  input: ExerciseInput
): Promise<ExerciseOutput> {
  const startTime = Date.now()

  console.log('🎯 Generating exercises with LLM')
  console.log(`📄 Content length: ${input.content.length} chars`)
  console.log(`🎲 Type: ${input.type}, Count: ${input.count}`)
  console.log(`🎯 Level: ${input.targetLevel}, Language: ${input.language}`)

  try {
    const prompt = buildPrompt(input)

    const result = await generateObject({
      model,
      schema: z.object({
        exercises: z.array(ExerciseSchema),
      }),
      prompt,
    })

    const executionTime = Date.now() - startTime

    console.log(`✅ Generated ${result.object.exercises.length} exercises in ${executionTime}ms`)
    console.log(`📊 Token usage: ${result.usage?.promptTokens || 0} prompt + ${result.usage?.completionTokens || 0} completion`)

    return {
      exercises: result.object.exercises,
      status: 'completed',
      metadata: {
        exerciseCount: result.object.exercises.length,
        executionTime,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
    }
  } catch (error) {
    console.error('❌ Exercise generation failed:', error)

    return {
      exercises: [],
      status: 'failed',
      metadata: {
        exerciseCount: 0,
        executionTime: Date.now() - startTime,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  }
}

/**
 * Build prompt for exercise generation
 */
function buildPrompt(input: ExerciseInput): string {
  const { content, type, count, targetLevel, language } = input

  const languageName = language === 'es' ? 'Spanish' : 'Latin'

  const typeInstructions = {
    translation: `Generate ${count} translation exercises. Each exercise should:
- Present a sentence in ${languageName} to translate to English, OR
- Present an English sentence to translate to ${languageName}
- Use vocabulary and grammar appropriate for ${targetLevel} level
- Provide the correct translation as the answer
- Include a brief explanation of key grammar/vocabulary points`,

    multiple_choice: `Generate ${count} multiple choice exercises. Each exercise should:
- Present a ${languageName} sentence with a blank (use "____")
- Provide 4 options to fill the blank
- Make the first option the correct answer
- Make other options plausible but clearly wrong (common mistakes)
- Include an explanation of why the correct answer is right`,

    fill_blank: `Generate ${count} fill-in-the-blank exercises. Each exercise should:
- Present a ${languageName} sentence with a blank (use "_____")
- The blank should test vocabulary or grammar from the content
- Provide the correct word/phrase as the answer
- Include an explanation of the grammar point or vocabulary meaning`,
  }

  return `You are an expert ${languageName} language teacher creating exercises for ${targetLevel} level learners.

Content to base exercises on:
${content}

Task: ${typeInstructions[type]}

Guidelines:
- Base exercises on the provided content when possible
- Ensure difficulty matches ${targetLevel} level
- Make exercises clear and unambiguous
- Provide helpful explanations that teach, not just confirm
- For multiple choice, ensure distractors are believable
- Use natural, authentic ${languageName}

Generate exactly ${count} ${type.replace('_', ' ')} exercises.`
}

/**
 * Legacy prompt template (kept for reference)
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
