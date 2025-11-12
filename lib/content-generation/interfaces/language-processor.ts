import { z } from 'zod';

// Core language enumeration - extensible for future languages
export type Language = 'es' | 'la';

// Validation schema for language parameter
export const LanguageSchema = z.enum(['es', 'la']);

// Processing capability matrix
export interface ProcessingCapabilities {
  vocabulary: boolean;
  grammar: boolean;
  exercises: boolean;
  morphology: boolean;
  syntaxAnalysis: boolean;
  customExerciseTypes?: string[];
}

// Vocabulary extraction interfaces
export interface VocabOptions {
  maxItems: number;
  difficultyFilter?: 'basic' | 'intermediate' | 'advanced';
  includeFrequency: boolean;
  includeMorphology: boolean;
}

export const VocabOptionsSchema = z.object({
  maxItems: z.number().min(5).max(100),
  difficultyFilter: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  includeFrequency: z.boolean().default(true),
  includeMorphology: z.boolean().default(false)
});

export interface VocabCandidate {
  word: string;
  lemma?: string;
  definition: string;
  partOfSpeech: string;
  frequency?: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  morphology?: Record<string, any>;
  examples?: string[];
}

// Grammar concept interfaces
export interface GrammarOptions {
  maxConcepts: number;
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'all';
  includeExamples: boolean;
}

export const GrammarOptionsSchema = z.object({
  maxConcepts: z.number().min(1).max(20).default(10),
  complexityLevel: z.enum(['basic', 'intermediate', 'advanced', 'all']).default('all'),
  includeExamples: z.boolean().default(true)
});

export interface GrammarConcept {
  id: string;
  name: string;
  description: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  examples: Array<{
    text: string;
    translation?: string;
    explanation: string;
  }>;
  category: string;
}

// Exercise generation interfaces
export interface ExerciseContext {
  vocabulary: VocabCandidate[];
  grammarConcepts: GrammarConcept[];
  originalText: string;
  targetDifficulty: 'basic' | 'intermediate' | 'advanced';
  exerciseTypes: ExerciseType[];
  maxExercises: number;
}

export type ExerciseType = 'translation' | 'fill_blank' | 'multiple_choice' | 'parsing' | 'matching';

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  correctAnswer: string | string[];
  distractors?: string[];
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  metadata: {
    grammarFocus?: string[];
    vocabularyFocus?: string[];
    estimatedTime?: number;
  };
}

// Validation and error handling
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessingError extends Error {
  code: 'INVALID_INPUT' | 'PROCESSING_FAILED' | 'TIMEOUT' | 'API_ERROR';
  language: Language;
  processingType: 'vocabulary' | 'grammar' | 'exercises';
  retryable: boolean;
}

// Main processor interface
export interface LanguageProcessor {
  readonly language: Language;
  readonly capabilities: ProcessingCapabilities;

  // Input validation
  validateInput(text: string): Promise<ValidationResult>;

  // Core processing methods
  extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]>;
  identifyGrammar(text: string, options: GrammarOptions): Promise<GrammarConcept[]>;
  generateExercises(context: ExerciseContext): Promise<Exercise[]>;

  // Performance estimation
  estimateProcessingTime(text: string): Promise<number>;

  // Health check
  isHealthy(): Promise<boolean>;
}

// Abstract base class for common functionality
export abstract class BaseLanguageProcessor implements LanguageProcessor {
  abstract readonly language: Language;
  abstract readonly capabilities: ProcessingCapabilities;

  async validateInput(text: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Common validation logic
    if (!text || text.trim().length === 0) {
      errors.push('Text cannot be empty');
    }

    if (text.length > 10000) {
      errors.push('Text exceeds maximum length of 10,000 characters');
    }

    // Check for potentially problematic characters
    const suspiciousChars = /[<>{}[\]|\\]/g;
    if (suspiciousChars.test(text)) {
      warnings.push('Text contains characters that may affect processing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async estimateProcessingTime(text: string): Promise<number> {
    // Base implementation - override in subclasses
    const wordCount = text.split(/\s+/).length;
    return Math.max(1000, wordCount * 50); // 50ms per word minimum 1 second
  }

  async isHealthy(): Promise<boolean> {
    // Basic health check - override for more specific checks
    return true;
  }

  protected createProcessingError(
    message: string,
    code: ProcessingError['code'],
    processingType: ProcessingError['processingType'],
    retryable = false
  ): ProcessingError {
    const error = new Error(message) as ProcessingError;
    error.code = code;
    error.language = this.language;
    error.processingType = processingType;
    error.retryable = retryable;
    return error;
  }

  protected sanitizeInput(text: string): string {
    // Remove potential script tags and dangerous HTML
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim();
  }

  protected validateTextLength(text: string): void {
    if (text.length > 10000) {
      throw this.createProcessingError(
        'Text exceeds maximum allowed length',
        'INVALID_INPUT',
        'vocabulary'
      );
    }
  }

  // Abstract methods that must be implemented
  abstract extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]>;
  abstract identifyGrammar(text: string, options: GrammarOptions): Promise<GrammarConcept[]>;
  abstract generateExercises(context: ExerciseContext): Promise<Exercise[]>;
}