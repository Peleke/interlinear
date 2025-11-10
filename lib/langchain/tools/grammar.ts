/**
 * Grammar Identification Tool
 * Identifies key grammar concepts from reading text
 */

import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Zod schema for grammar concepts
export const GrammarConceptSchema = z.object({
  concept_name: z.string(),
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  example_from_text: z.string(),
  explanation: z.string(),
  additional_examples: z.array(z.string()).optional(),
});

export const GrammarOutputSchema = z.object({
  grammar_concepts: z.array(GrammarConceptSchema),
});

/**
 * Prompt template for grammar identification
 */
const GRAMMAR_PROMPT = (readingText: string, targetLevel: string, maxConcepts: number) => `
You are an expert language teacher identifying grammar concepts for language learners.

Reading text:
${readingText}

Target CEFR Level: ${targetLevel}

Task: Identify up to ${maxConcepts} key grammar concepts that appear in the text and are relevant for a ${targetLevel} level learner.

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

Return ONLY a JSON object with this structure:
{
  "grammar_concepts": [
    {
      "concept_name": "Present Tense -er Verbs",
      "cefr_level": "A1",
      "example_from_text": "Je mange une pomme",
      "explanation": "Regular -er verbs in present tense follow a pattern: remove -er and add endings (-e, -es, -e, -ons, -ez, -ent)",
      "additional_examples": ["Tu parles français", "Nous aimons la musique"]
    }
  ]
}
`.trim();

/**
 * Grammar identification tool
 */
export const identifyGrammarTool = tool(
  async ({ readingText, targetLevel, maxConcepts = 5 }) => {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.6,
    });

    const prompt = GRAMMAR_PROMPT(readingText, targetLevel, maxConcepts);

    try {
      const result = await llm.invoke([
        { role: "system", content: "You are a grammar analysis expert. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ]);

      // Parse and validate the response
      const content = result.content.toString();
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = GrammarOutputSchema.parse(parsed);

      return JSON.stringify({
        grammar_concepts: validated.grammar_concepts,
        metadata: {
          total_identified: validated.grammar_concepts.length,
          target_level: targetLevel
        }
      });
    } catch (error) {
      console.error('Grammar identification error:', error);
      throw new Error(`Failed to identify grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: "identify_grammar",
    description: "Identify key grammar concepts from reading text with CEFR levels and explanations. Returns a JSON string with grammar concepts array.",
    schema: z.object({
      readingText: z.string().describe("The reading text to analyze for grammar"),
      targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe("Target CEFR level for grammar selection"),
      maxConcepts: z.number().default(5).describe("Maximum number of grammar concepts to identify"),
    }),
  }
);
