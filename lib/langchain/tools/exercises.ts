/**
 * Exercise Generation Tool
 * Generates interactive exercises from vocabulary and grammar concepts
 */
import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Zod schema for exercise types
const ExerciseSchema = z.object({
  type: z.enum(['fill-blank', 'multiple-choice', 'matching', 'translation']),
  question: z.string(),
  correctAnswer: z.string(),
  options: z.array(z.string()).optional(),
  explanation: z.string(),
  difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const ExercisesOutputSchema = z.object({
  vocabularyExercises: z.array(ExerciseSchema),
  grammarExercises: z.array(ExerciseSchema),
  totalExercises: z.number(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExercisesOutput = z.infer<typeof ExercisesOutputSchema>;

// System prompt for exercise generation
const EXERCISE_GENERATION_PROMPT = `You are an expert language learning exercise designer.

Given vocabulary items and grammar concepts from a reading, generate diverse interactive exercises.

EXERCISE TYPES:
1. fill-blank: Sentence with one word missing, student fills it in
2. multiple-choice: Question with 4 options, only 1 correct
3. matching: Match Spanish words/phrases to English translations
4. translation: Translate a sentence or phrase

REQUIREMENTS:
- Mix exercise types for engagement
- Use vocabulary and grammar from the reading
- Provide clear explanations for each answer
- Match difficulty to target CEFR level
- Make distractors (wrong answers) plausible but clearly incorrect

Return JSON matching this schema:
{
  vocabularyExercises: [
    {
      type: "fill-blank" | "multiple-choice" | "matching" | "translation",
      question: "string",
      correctAnswer: "string",
      options: ["string"] (for multiple-choice only),
      explanation: "string",
      difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    }
  ],
  grammarExercises: [/* same structure */],
  totalExercises: number
}`;

/**
 * Tool for generating exercises from vocabulary and grammar concepts
 */
export const generateExercises = tool(
  async ({ vocabularyItems, grammarConcepts, targetLevel, readingText }) => {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7, // Slightly creative for exercise variety
    });

    const userPrompt = `
READING TEXT:
${readingText}

VOCABULARY ITEMS (${vocabularyItems.length} items):
${vocabularyItems.map((item: any) =>
  `- ${item.spanish} (${item.english}) - ${item.partOfSpeech}`
).join('\n')}

GRAMMAR CONCEPTS (${grammarConcepts.length} concepts):
${grammarConcepts.map((concept: any) =>
  `- ${concept.concept}: ${concept.explanation}`
).join('\n')}

TARGET LEVEL: ${targetLevel}

Generate 6-8 exercises total:
- 3-4 vocabulary exercises
- 3-4 grammar exercises
- Mix of exercise types
- All at ${targetLevel} difficulty
`;

    const result = await llm.invoke([
      { role: "system", content: EXERCISE_GENERATION_PROMPT },
      { role: "user", content: userPrompt }
    ]);

    // Parse and validate with Zod
    try {
      const content = result.content as string;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      const parsed = JSON.parse(jsonStr);
      const validated = ExercisesOutputSchema.parse(parsed);

      return JSON.stringify(validated, null, 2);
    } catch (error) {
      console.error('Exercise generation validation failed:', error);
      throw new Error(`Failed to generate valid exercises: ${error}`);
    }
  },
  {
    name: "generate_exercises",
    description: "Generate interactive exercises from vocabulary items and grammar concepts for a specific CEFR level",
    schema: z.object({
      vocabularyItems: z.array(z.any()).describe("Array of vocabulary items extracted from the reading"),
      grammarConcepts: z.array(z.any()).describe("Array of grammar concepts identified in the reading"),
      targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe("Target CEFR proficiency level"),
      readingText: z.string().describe("The original reading text for context"),
    }),
  }
);
