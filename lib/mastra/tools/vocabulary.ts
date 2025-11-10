/**
 * Vocabulary Extraction Tool
 * Extracts vocabulary items from reading text with CEFR level detection
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { VocabularyOutputSchema } from '../types';

export const extractVocabularyTool = createTool({
  id: 'extract-vocabulary',
  description: 'Extract vocabulary items from text with CEFR levels and translations',
  inputSchema: z.object({
    readingText: z.string(),
    targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    maxItems: z.number().default(15),
  }),
  outputSchema: VocabularyOutputSchema,
  execute: async ({ context }) => {
    const { readingText, targetCEFRLevel, maxItems } = context;

    // This will be called by Mastra with LLM integration
    // The prompt is defined in the workflow step
    return {
      vocabulary: [], // Populated by LLM
    };
  },
});

/**
 * Prompt template for vocabulary extraction
 */
export const VOCABULARY_PROMPT = `You are an expert language teacher creating vocabulary lists for language learners.

Reading text:
{readingText}

Target CEFR Level: {targetCEFRLevel}

Task: Extract {maxItems} important vocabulary words from the text that are most useful for a {targetCEFRLevel} level learner.

For each word, provide:
1. The word in the target language
2. English translation
3. Clear definition in English
4. CEFR level (A1-C2) - be accurate about difficulty
5. Whether this is likely "new" vocabulary for this level (true/false)
6. An example sentence using the word (optional)

Guidelines:
- Focus on words that appear in the text
- Prioritize words slightly above or at the target level
- Include key verbs, nouns, and useful expressions
- Mark words above the target level as "new" (is_new: true)
- Avoid extremely common words (unless target is A1)
- Provide natural, helpful translations

Return a JSON array of vocabulary items.`;
