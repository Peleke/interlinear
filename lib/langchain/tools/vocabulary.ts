/**
 * Vocabulary Extraction Tool
 * Extracts vocabulary items from reading text using LLM
 */

import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Zod schema for vocabulary items
export const VocabularyItemSchema = z.object({
  word: z.string(),
  translation: z.string(),
  definition: z.string(),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  is_new: z.boolean(),
  example_sentence: z.string().optional(),
});

export const VocabularyOutputSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema),
});

/**
 * Prompt template for vocabulary extraction
 */
const VOCABULARY_PROMPT = (readingText: string, targetLevel: string, maxItems: number) => `
You are an expert language teacher creating vocabulary lists for language learners.

Reading text:
${readingText}

Target CEFR Level: ${targetLevel}

Task: Extract ${maxItems} important vocabulary words from the text that are most useful for a ${targetLevel} level learner.

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

Return ONLY a JSON object with this structure:
{
  "vocabulary": [
    {
      "word": "aventura",
      "translation": "adventure",
      "definition": "an exciting or unusual experience",
      "cefr_level": "A2",
      "is_new": false,
      "example_sentence": "La aventura comenzó en la montaña."
    }
  ]
}
`.trim();

/**
 * Vocabulary extraction tool
 */
export const extractVocabularyTool = tool(
  async ({ readingText, targetLevel, maxItems = 15 }) => {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const prompt = VOCABULARY_PROMPT(readingText, targetLevel, maxItems);

    try {
      const result = await llm.invoke([
        { role: "system", content: "You are a vocabulary extraction expert. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ]);

      // Parse and validate the response
      const content = result.content.toString();
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = VocabularyOutputSchema.parse(parsed);

      // Content grounding: verify words appear in reading
      const verifiedItems = validated.vocabulary.filter(item =>
        readingText.toLowerCase().includes(item.word.toLowerCase())
      );

      return JSON.stringify({
        vocabulary: verifiedItems,
        metadata: {
          total_extracted: validated.vocabulary.length,
          verified: verifiedItems.length,
          filtered: validated.vocabulary.length - verifiedItems.length
        }
      });
    } catch (error) {
      console.error('Vocabulary extraction error:', error);
      throw new Error(`Failed to extract vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: "extract_vocabulary",
    description: "Extract vocabulary items from reading text with CEFR levels and translations. Returns a JSON string with vocabulary array.",
    schema: z.object({
      readingText: z.string().describe("The reading text to extract vocabulary from"),
      targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe("Target CEFR level for vocabulary selection"),
      maxItems: z.number().default(15).describe("Maximum number of vocabulary items to extract"),
    }),
  }
);
