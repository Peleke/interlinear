/**
 * Content Generation Supervisor Agent
 * Orchestrates vocabulary, grammar, and exercise generation tools
 */
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { extractVocabulary } from "../tools/vocabulary";
import { identifyGrammar } from "../tools/grammar";
import { generateExercises } from "../tools/exercises";

// System prompt for supervisor
const SUPERVISOR_SYSTEM_PROMPT = `You are a content generation supervisor for language learning lessons.

Your job is to coordinate the creation of comprehensive lesson content from a reading text.

WORKFLOW:
1. FIRST: Extract vocabulary items using extract_vocabulary tool
2. SECOND: Identify grammar concepts using identify_grammar tool
3. THIRD: Generate exercises using generate_exercises tool with the vocabulary and grammar from steps 1 and 2

IMPORTANT:
- Execute steps in order (vocabulary → grammar → exercises)
- Pass results from earlier steps to later steps
- Return a final JSON summary of all generated content
- Ensure all content matches the target CEFR level

After all tools complete, synthesize the results into a single JSON response with this structure:
{
  "vocabulary": [/* vocabulary items */],
  "grammar": [/* grammar concepts */],
  "exercises": {
    "vocabularyExercises": [/* exercises */],
    "grammarExercises": [/* exercises */]
  },
  "metadata": {
    "targetLevel": "string",
    "readingWordCount": number,
    "totalVocabularyItems": number,
    "totalGrammarConcepts": number,
    "totalExercises": number
  }
}`;

/**
 * Create the content generation supervisor agent
 */
export function createContentSupervisor() {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0, // Deterministic orchestration
  });

  // Create agent with all three tools
  const agent = createReactAgent({
    llm,
    tools: [extractVocabulary, identifyGrammar, generateExercises],
    messageModifier: SUPERVISOR_SYSTEM_PROMPT,
  });

  return agent;
}

/**
 * Generate complete lesson content from reading text
 */
export async function generateLessonContent(
  readingText: string,
  targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
) {
  const supervisor = createContentSupervisor();

  const userMessage = `Generate complete lesson content for this reading at ${targetLevel} level:

${readingText}

Execute the workflow:
1. Extract vocabulary
2. Identify grammar concepts
3. Generate exercises using the extracted vocabulary and grammar

Return the final synthesized JSON with all content.`;

  const result = await supervisor.invoke({
    messages: [{ role: "user", content: userMessage }]
  });

  // Extract final message content
  const messages = result.messages;
  const finalMessage = messages[messages.length - 1];

  return {
    content: finalMessage.content,
    messages: result.messages, // Full conversation for debugging
  };
}
