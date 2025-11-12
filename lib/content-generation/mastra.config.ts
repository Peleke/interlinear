/**
 * Mastra Configuration for AI Content Generation
 *
 * This file configures the Mastra framework for LLM-powered content generation workflows.
 * Uses OpenAI GPT-4 for vocabulary extraction, grammar identification, and exercise generation.
 *
 * @see docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md for architecture details
 * @see https://mastra.ai/docs/getting-started/project-structure
 */

import { Mastra } from '@mastra/core'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenAI model provider configuration
 * This will be used directly in workflow steps
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Default model for content generation
 * Uses environment variable OPENAI_MODEL or defaults to gpt-4o-mini
 * Supports structured output (requires gpt-4o, gpt-4o-mini, or newer)
 */
export const model = openai(process.env.OPENAI_MODEL || 'gpt-4o-mini')

/**
 * Mastra instance for interlinear content generation
 *
 * Phase 1 (MVP): Simple tool-based workflow with suspend/resume for human review
 * Phase 2 (Future): Multi-agent specialization with memory
 *
 * @example
 * // Import in workflow files:
 * import { mastra, model } from '@/lib/content-generation/mastra.config'
 */
export const mastra = new Mastra({
  // Workflows will be registered here in Story 7.2
  // workflows: { contentGenerationWorkflow }

  // Agents will be added in Phase 2
  // agents: { vocabularySpecialist, grammarSpecialist, exerciseDesigner }
})

/**
 * Helper to get the default model instance
 */
export function getDefaultModel() {
  return model
}

/**
 * Export types for workflow definitions
 */
export type MastraInstance = typeof mastra
