/**
 * Content Generation Workflow
 * Orchestrates vocabulary, grammar, and exercise generation with checkpoints
 */

import { Workflow } from '@mastra/core';
import { createOpenAIProvider } from '../providers/openai';
import { extractVocabularyTool, VOCABULARY_PROMPT } from '../tools/vocabulary';
import { identifyGrammarTool, GRAMMAR_PROMPT } from '../tools/grammar';
import { generateExercisesTool, EXERCISES_PROMPT } from '../tools/exercises';
import {
  WorkflowState,
  VocabularyInput,
  GrammarInput,
  ExercisesInput,
} from '../types';

/**
 * Content Generation Workflow
 *
 * Generates lesson content in three steps with checkpoints:
 * 1. Vocabulary extraction
 * 2. Grammar identification
 * 3. Exercise generation
 *
 * Each step can be suspended and resumed independently.
 */
export const contentGenerationWorkflow = new Workflow({
  name: 'content-generation',
  triggerSchema: {
    lessonId: { type: 'string', description: 'Lesson ID' },
    readingText: { type: 'string', description: 'Reading text' },
    targetCEFRLevel: { type: 'string', description: 'Target CEFR level' },
    startFrom: { type: 'string', description: 'Step to start from', optional: true },
  },
});

/**
 * Step 1: Vocabulary Extraction
 * Checkpoint: After this step completes
 */
contentGenerationWorkflow.step('extractVocabulary', {
  description: 'Extract vocabulary items from reading text',
  when: (trigger) => !trigger.startFrom || trigger.startFrom === 'vocabulary',
})
  .then((step) =>
    step.tool({
      toolId: 'extract-vocabulary',
      params: (trigger) => ({
        readingText: trigger.readingText,
        targetCEFRLevel: trigger.targetCEFRLevel,
        maxItems: 15,
      }),
      systemPrompt: VOCABULARY_PROMPT,
    })
  )
  .checkpoint('vocabulary-complete'); // Save state here

/**
 * Step 2: Grammar Identification
 * Checkpoint: After this step completes
 */
contentGenerationWorkflow.step('identifyGrammar', {
  description: 'Identify grammar concepts from reading text',
  when: (trigger, context) => {
    if (trigger.startFrom === 'grammar') return true;
    if (trigger.startFrom === 'exercises') return false;
    return context.extractVocabulary?.completed;
  },
})
  .then((step) =>
    step.tool({
      toolId: 'identify-grammar',
      params: (trigger) => ({
        readingText: trigger.readingText,
        targetCEFRLevel: trigger.targetCEFRLevel,
        maxConcepts: 5,
      }),
      systemPrompt: GRAMMAR_PROMPT,
    })
  )
  .checkpoint('grammar-complete'); // Save state here

/**
 * Step 3: Exercise Generation
 * Checkpoint: After this step completes
 */
contentGenerationWorkflow.step('generateExercises', {
  description: 'Generate exercises for vocabulary and grammar',
  when: (trigger, context) => {
    if (trigger.startFrom === 'exercises') return true;
    return context.identifyGrammar?.completed;
  },
})
  .then((step) =>
    step.tool({
      toolId: 'generate-exercises',
      params: (trigger, context) => {
        const vocabularyItems = context.extractVocabulary?.output?.vocabulary?.map(
          (v: { word: string }) => v.word
        ) || [];
        const grammarConcepts = context.identifyGrammar?.output?.grammar_concepts?.map(
          (g: { concept_name: string }) => g.concept_name
        ) || [];

        return {
          readingText: trigger.readingText,
          vocabularyItems,
          grammarConcepts,
          targetCEFRLevel: trigger.targetCEFRLevel,
          exerciseTypes: ['translation', 'multiple_choice', 'fill_blank'],
          exercisesPerType: 3,
        };
      },
      systemPrompt: EXERCISES_PROMPT,
    })
  )
  .checkpoint('exercises-complete'); // Save state here

/**
 * Initialize the workflow with OpenAI provider
 */
export async function initializeContentGenerationWorkflow() {
  const openai = createOpenAIProvider();

  // Register tools with the workflow
  contentGenerationWorkflow.registerTool(extractVocabularyTool);
  contentGenerationWorkflow.registerTool(identifyGrammarTool);
  contentGenerationWorkflow.registerTool(generateExercisesTool);

  // Configure the LLM provider
  contentGenerationWorkflow.setProvider(openai);

  return contentGenerationWorkflow;
}

/**
 * Execute the workflow from a specific step
 */
export async function executeWorkflow(input: {
  lessonId: string;
  readingText: string;
  targetCEFRLevel: string;
  startFrom?: 'vocabulary' | 'grammar' | 'exercises';
}) {
  const workflow = await initializeContentGenerationWorkflow();

  return workflow.execute({
    lessonId: input.lessonId,
    readingText: input.readingText,
    targetCEFRLevel: input.targetCEFRLevel,
    startFrom: input.startFrom,
  });
}

/**
 * Resume workflow from a checkpoint
 */
export async function resumeWorkflow(
  workflowId: string,
  fromStep: 'grammar' | 'exercises'
) {
  const workflow = await initializeContentGenerationWorkflow();

  return workflow.resume(workflowId, {
    startFrom: fromStep,
  });
}
