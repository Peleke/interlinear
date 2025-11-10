/**
 * Exercise Generation Tool
 * Generates exercises (translation, multiple choice, fill-blank) from lesson content
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { ExercisesOutputSchema } from '../types';

export const generateExercisesTool = createTool({
  id: 'generate-exercises',
  description: 'Generate exercises for vocabulary and grammar practice',
  inputSchema: z.object({
    readingText: z.string(),
    vocabularyItems: z.array(z.string()),
    grammarConcepts: z.array(z.string()),
    targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    exerciseTypes: z.array(z.enum(['translation', 'multiple_choice', 'fill_blank'])),
    exercisesPerType: z.number().default(3),
  }),
  outputSchema: ExercisesOutputSchema,
  execute: async ({ context }) => {
    const {
      readingText,
      vocabularyItems,
      grammarConcepts,
      targetCEFRLevel,
      exerciseTypes,
      exercisesPerType,
    } = context;

    // This will be called by Mastra with LLM integration
    return {
      exercises: [], // Populated by LLM
    };
  },
});

/**
 * Prompt template for exercise generation
 */
export const EXERCISES_PROMPT = `You are an expert language teacher creating exercises for language learners.

Reading text:
{readingText}

Vocabulary to practice:
{vocabularyItems}

Grammar concepts to practice:
{grammarConcepts}

Target CEFR Level: {targetCEFRLevel}
Exercise types needed: {exerciseTypes}
Exercises per type: {exercisesPerType}

Task: Generate {totalExercises} exercises that practice the vocabulary and grammar from the lesson.

Exercise types:
1. **translation**: Translate a sentence from target language to English or vice versa
2. **multiple_choice**: Choose the correct word/form from 4 options
3. **fill_blank**: Fill in the missing word in a sentence

For each exercise, provide:
1. type: One of the exercise types
2. prompt: The exercise question/prompt
3. correct_answer: The correct answer
4. options: Array of 4 options (for multiple_choice only)
5. explanation: Why this is the correct answer (brief, helpful)
6. difficulty: CEFR level (optional, useful for mixed-level practice)

Guidelines:
- Create exercises that actually use the vocabulary and grammar provided
- Mix difficulty levels slightly (mostly at target level, some +1 level)
- Make distractors (wrong options) plausible but clearly wrong
- Ensure prompts are clear and unambiguous
- Provide helpful explanations that teach, not just confirm
- For fill_blank, use "_____" to indicate the blank
- For translation, prefer sentences that sound natural
- Create exercises in a logical progression (easier first)

Return a JSON array of exercise objects.`;
