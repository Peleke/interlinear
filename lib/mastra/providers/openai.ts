/**
 * OpenAI Provider Configuration
 * Configures OpenAI GPT-4o-mini for content generation
 */

import { OpenAI } from '@mastra/core';

// Cost per 1M tokens (GPT-4o-mini pricing as of Nov 2024)
const COST_PER_INPUT_TOKEN = 0.150 / 1_000_000;  // $0.150 per 1M input tokens
const COST_PER_OUTPUT_TOKEN = 0.600 / 1_000_000; // $0.600 per 1M output tokens

/**
 * Calculate cost for a generation based on token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = inputTokens * COST_PER_INPUT_TOKEN;
  const outputCost = outputTokens * COST_PER_OUTPUT_TOKEN;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Create OpenAI provider instance
 * Uses GPT-4o-mini for cost-effective generation
 */
export function createOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new OpenAI({
    apiKey,
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
  });
}

/**
 * Default model configuration for different generation types
 */
export const MODEL_CONFIG = {
  vocabulary: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
  },
  grammar: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 1500,
  },
  exercises: {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 3000,
  },
} as const;
