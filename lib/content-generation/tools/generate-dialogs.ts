/**
 * Dialog Generation Tool
 *
 * LLM-powered conversational dialog generation for language learning
 * Generates realistic dialogs with context, speakers, and translations
 *
 * Uses GPT-4 with structured output to generate dialogs
 * from provided content (reading text, vocabulary, lesson theme)
 */

import { z } from 'zod'
import { generateObject } from 'ai'
import { model } from '../mastra.config'

// Input schema
const DialogInputSchema = z.object({
  content: z.string().describe('Content to base dialog on (reading text, lesson theme, vocabulary)'),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  language: z.enum(['es', 'la']).default('es'),
  dialogCount: z.number().default(2).describe('Number of dialogs to generate'),
  turnsPerDialog: z.number().default(6).describe('Number of conversation turns per dialog'),
  complexity: z.enum(['simple', 'intermediate', 'advanced']).default('intermediate'),
})

// Output schema
const DialogTurnSchema = z.object({
  speaker: z.string().describe('Speaker name (e.g., "María", "Juan")'),
  text: z.string().describe('Dialog text in target language'),
  translation: z.string().describe('English translation'),
})

const DialogSchema = z.object({
  context: z.string().describe('Dialog context/scenario (e.g., "At a café", "Planning a trip")'),
  setting: z.string().describe('Physical setting description'),
  turns: z.array(DialogTurnSchema).describe('Array of conversation turns'),
  vocabulary_used: z.array(z.string()).optional().describe('Key vocabulary words used'),
  grammar_points: z.array(z.string()).optional().describe('Grammar concepts demonstrated'),
})

export const DialogOutputSchema = z.object({
  dialogs: z.array(DialogSchema),
  status: z.enum(['completed', 'failed']),
  metadata: z.object({
    dialogCount: z.number(),
    executionTime: z.number(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
})

export type DialogInput = z.infer<typeof DialogInputSchema>
export type DialogTurn = z.infer<typeof DialogTurnSchema>
export type Dialog = z.infer<typeof DialogSchema>
export type DialogOutput = z.infer<typeof DialogOutputSchema>

/**
 * Generate Dialogs with LLM
 *
 * Uses GPT-4 with structured output to generate conversational dialogs
 */
export async function generateDialogs(
  input: DialogInput
): Promise<DialogOutput> {
  const startTime = Date.now()

  console.log('🎯 Generating dialogs with LLM')
  console.log(`📄 Content length: ${input.content.length} chars`)
  console.log(`🗣️  Dialog count: ${input.dialogCount}, Turns per dialog: ${input.turnsPerDialog}`)
  console.log(`🎯 Level: ${input.targetLevel}, Language: ${input.language}, Complexity: ${input.complexity}`)

  try {
    const prompt = buildPrompt(input)

    console.log('📝 Dialog prompt length:', prompt.length, 'chars')
    console.log('🤖 Calling generateObject for dialogs...')

    // Add timeout wrapper to prevent hanging
    const result = await Promise.race([
      generateObject({
        model,
        schema: z.object({
          dialogs: z.array(DialogSchema),
        }),
        prompt,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dialog generation timeout after 2 minutes')), 120000)
      )
    ])

    const executionTime = Date.now() - startTime

    console.log(`✅ Generated ${result.object.dialogs.length} dialogs in ${executionTime}ms`)
    console.log(`📊 Token usage: ${result.usage?.promptTokens || 0} prompt + ${result.usage?.completionTokens || 0} completion`)

    return {
      dialogs: result.object.dialogs,
      status: 'completed',
      metadata: {
        dialogCount: result.object.dialogs.length,
        executionTime,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
    }
  } catch (error) {
    console.error('❌ Dialog generation failed:', error)

    return {
      dialogs: [],
      status: 'failed',
      metadata: {
        dialogCount: 0,
        executionTime: Date.now() - startTime,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  }
}

/**
 * Build prompt for dialog generation
 */
function buildPrompt(input: DialogInput): string {
  const { content, dialogCount, turnsPerDialog, targetLevel, language, complexity } = input

  const languageName = language === 'es' ? 'Spanish' : 'Latin'

  const complexityInstructions = {
    simple: 'Use basic vocabulary and simple sentence structures. Conversations should be straightforward and practical.',
    intermediate: 'Use varied vocabulary and natural conversation patterns. Include some idiomatic expressions.',
    advanced: 'Use sophisticated vocabulary and complex grammatical structures. Include cultural references and nuanced expressions.',
  }

  return `You are an expert ${languageName} language teacher creating realistic conversational dialogs for ${targetLevel} level learners.

Content to base dialogs on:
${content}

Task: Generate ${dialogCount} conversational dialogs with ${turnsPerDialog} turns each.

IMPORTANT: Return ONLY valid JSON. Do not include any extra text, symbols, or formatting outside the JSON structure.

Dialog Requirements:
- Create realistic, natural conversations that ${targetLevel} learners would encounter
- Each dialog should have a clear context/scenario (e.g., "At a restaurant", "Meeting a friend")
- Use 2-3 different speakers per dialog with realistic ${languageName} names
- ${complexityInstructions[complexity]}
- Base conversations on the provided content when possible
- Include vocabulary and grammar appropriate for ${targetLevel} level

For each dialog turn:
- Provide the speaker's name
- Write natural, conversational ${languageName} (not overly formal unless context requires it)
- Include accurate English translations
- Ensure the conversation flows naturally (greetings, questions, responses, closing)

Guidelines:
- Make dialogs practical and useful for real-world situations
- Vary the contexts across different dialogs (don't repeat scenarios)
- Include common conversational phrases and expressions
- Ensure cultural authenticity (use appropriate greetings, politeness levels, etc.)
- Conversations should sound natural, not stilted or textbook-like
- Include some back-and-forth (questions and answers, reactions, follow-ups)
- End conversations naturally (don't cut off abruptly)

Generate exactly ${dialogCount} dialogs, each with ${turnsPerDialog} conversation turns.`
}
