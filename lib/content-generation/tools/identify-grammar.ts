/**
 * Grammar Identification Tool
 *
 * LLM-powered grammar concept extraction for language learning
 * Identifies key grammar patterns and concepts in text
 *
 * Uses GPT-4 with structured output to extract grammar concepts
 */

import { z } from 'zod'
import { generateObject } from 'ai'
import { model } from '../mastra.config'

// Input schema
const GrammarInputSchema = z.object({
  content: z.string().describe('Content to extract grammar from'),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  language: z.enum(['es', 'la']).default('es'),
  maxConcepts: z.number().default(5),
})

// Output schema
const GrammarConceptSchema = z.object({
  name: z.string(), // e.g., "Present Perfect Tense"
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  explanation: z.string(),
  example_from_text: z.string(),
  additional_examples: z.array(z.string()).optional(),
})

export const GrammarOutputSchema = z.object({
  grammar_concepts: z.array(GrammarConceptSchema),
  status: z.enum(['completed', 'failed']),
  metadata: z.object({
    conceptCount: z.number(),
    executionTime: z.number(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
})

export type GrammarInput = z.infer<typeof GrammarInputSchema>
export type GrammarConcept = z.infer<typeof GrammarConceptSchema>
export type GrammarOutput = z.infer<typeof GrammarOutputSchema>

/**
 * Identify Grammar Concepts with LLM
 *
 * Uses GPT-4 with structured output to extract grammar concepts
 */
export async function identifyGrammar(
  input: GrammarInput
): Promise<GrammarOutput> {
  const startTime = Date.now()

  console.log('📊 Identifying grammar concepts with LLM')
  console.log(`📄 Content length: ${input.content.length} chars`)
  console.log(`🎯 Max: ${input.maxConcepts} concepts, Level: ${input.targetLevel}, Language: ${input.language}`)

  try {
    const prompt = buildPrompt(input)

    const result = await generateObject({
      model,
      schema: z.object({
        grammar_concepts: z.array(GrammarConceptSchema),
      }),
      prompt,
    })

    const executionTime = Date.now() - startTime

    console.log(`✅ Identified ${result.object.grammar_concepts.length} grammar concepts in ${executionTime}ms`)
    console.log(`📊 Token usage: ${result.usage?.promptTokens || 0} prompt + ${result.usage?.completionTokens || 0} completion`)

    return {
      grammar_concepts: result.object.grammar_concepts,
      status: 'completed',
      metadata: {
        conceptCount: result.object.grammar_concepts.length,
        executionTime,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
    }
  } catch (error) {
    console.error('❌ Grammar identification failed:', error)

    return {
      grammar_concepts: [],
      status: 'failed',
      metadata: {
        conceptCount: 0,
        executionTime: Date.now() - startTime,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  }
}

/**
 * Build prompt for grammar identification
 */
function buildPrompt(input: GrammarInput): string {
  const { content, targetLevel, language, maxConcepts } = input

  const languageName = language === 'es' ? 'Spanish' : 'Latin'

  return `You are an expert ${languageName} language teacher identifying grammar concepts for ${targetLevel} level learners.

Content to analyze:
${content}

Task: Identify up to ${maxConcepts} key grammar concepts that appear in this text and are relevant for a ${targetLevel} level learner.

For each grammar concept, provide:
1. Name of the grammar concept (e.g., "Present Perfect Tense", "Subjunctive Mood", "Reflexive Verbs")
2. CEFR level (A1-C2) - be accurate about when learners typically encounter this
3. Clear explanation in English of how this grammar works
4. An example from the text showing this grammar in use
5. (Optional) Additional examples showing different uses

Guidelines:
- Focus on grammar actually present in the text
- Prioritize concepts at or slightly above the target level (${targetLevel})
- Explain patterns, not just rules
- Make explanations clear and practical
- Include both basic and advanced concepts if text supports it
- Avoid listing every possible grammar point - focus on the most instructive ones

Identify the most important ${maxConcepts} grammar concepts from this text.`
}

/**
 * LLM Prompt for future implementation
 *
 * This will be used when we integrate Vector DB + LLM
 */
export const GRAMMAR_IDENTIFICATION_PROMPT = `You are an expert language teacher identifying grammar concepts for language learners.

Reading text:
{readingText}

Target CEFR Level: {targetLevel}
Language: {language}

Task: Identify up to {maxConcepts} key grammar concepts that appear in the text and are relevant for a {targetLevel} level learner.

For each grammar concept, provide:
1. Name of the grammar concept (e.g., "Present Perfect Tense", "Subjunctive Mood", "Reflexive Verbs")
2. CEFR level (A1-C2) - be accurate about when learners typically encounter this
3. Clear explanation in English of how this grammar works
4. An example from the text showing this grammar in use
5. Additional examples (optional) showing different uses

Guidelines:
- Focus on grammar actually present in the text
- Prioritize concepts at or slightly above the target level
- Explain patterns, not just rules
- Make explanations clear and practical
- Include both basic and advanced concepts if text supports it
- Avoid listing every possible grammar point - focus on the most instructive ones

Return a JSON array of grammar concepts following the GrammarConcept schema.`
