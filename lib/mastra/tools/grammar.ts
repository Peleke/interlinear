/**
 * Grammar Concept Identification Tool
 * Identifies key grammar concepts from reading text
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { GrammarOutputSchema } from '../types';

export const identifyGrammarTool = createTool({
  id: 'identify-grammar',
  description: 'Identify key grammar concepts from text with CEFR levels',
  inputSchema: z.object({
    readingText: z.string(),
    targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    maxConcepts: z.number().default(5),
  }),
  outputSchema: GrammarOutputSchema,
  execute: async ({ context }) => {
    const { readingText, targetCEFRLevel, maxConcepts } = context;

    // This will be called by Mastra with LLM integration
    return {
      grammar_concepts: [], // Populated by LLM
    };
  },
});

/**
 * Prompt template for grammar identification
 */
export const GRAMMAR_PROMPT = `You are an expert language teacher identifying grammar concepts for language learners.

Reading text:
{readingText}

Target CEFR Level: {targetCEFRLevel}

Task: Identify up to {maxConcepts} key grammar concepts that appear in the text and are relevant for a {targetCEFRLevel} level learner.

For each grammar concept, provide:
1. Name of the grammar concept (e.g., "Present Perfect Tense", "Subjunctive Mood", "Reflexive Verbs")
2. CEFR level (A1-C2) - be accurate about when learners typically encounter this
3. An example from the text showing this grammar in use
4. Clear explanation in English of how this grammar works
5. Additional examples (optional) showing different uses

Guidelines:
- Focus on grammar actually present in the text
- Prioritize concepts at or slightly above the target level
- Explain patterns, not just rules
- Make explanations clear and practical
- Include both basic and advanced concepts if text supports it
- Avoid listing every possible grammar point - focus on the most instructive ones

Return a JSON array of grammar concepts.`;
