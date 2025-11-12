# STORY 001: Language Processor Architecture Foundation

**Story ID**: STORY-001
**Points**: 3
**Priority**: Critical
**Epic**: EPIC-LANG-001
**Security Impact**: Medium - New abstraction layer for content processing
**Performance Impact**: Zero regression for Spanish, <100ms overhead for routing

## User Story

**As a** system architect
**I want** a language-agnostic processor interface
**So that** we can support multiple languages without code duplication

## Technical Implementation

### File-by-File Specification

#### 1. Core Interfaces (`lib/content-generation/interfaces/language-processor.ts`)

**NEW FILE - 120 lines**

```typescript
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
}
```

#### 2. Language Processor Factory (`lib/content-generation/tools/language-processor-factory.ts`)

**NEW FILE - 80 lines**

```typescript
import { Language, LanguageProcessor, ProcessingError } from '../interfaces/language-processor';
import { SpanishNLPProcessor } from './spanish-nlp-processor';
import { LatinLanguageProcessor } from './latin-language-processor';

// Singleton pattern for processor instances
class LanguageProcessorFactory {
  private static instance: LanguageProcessorFactory;
  private processors: Map<Language, LanguageProcessor> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): LanguageProcessorFactory {
    if (!LanguageProcessorFactory.instance) {
      LanguageProcessorFactory.instance = new LanguageProcessorFactory();
    }
    return LanguageProcessorFactory.instance;
  }

  public async getProcessor(language: Language): Promise<LanguageProcessor> {
    // Return cached processor if available
    if (this.processors.has(language)) {
      return this.processors.get(language)!;
    }

    // Create new processor instance
    const processor = await this.createProcessor(language);

    // Validate processor health before caching
    const isHealthy = await processor.isHealthy();
    if (!isHealthy) {
      throw new Error(`Language processor for ${language} failed health check`);
    }

    this.processors.set(language, processor);
    return processor;
  }

  private async createProcessor(language: Language): Promise<LanguageProcessor> {
    switch (language) {
      case 'es':
        return new SpanishNLPProcessor();

      case 'la':
        return new LatinLanguageProcessor();

      default:
        const error = new Error(`Unsupported language: ${language}`) as ProcessingError;
        error.code = 'INVALID_INPUT';
        error.language = language;
        error.processingType = 'vocabulary'; // Default
        error.retryable = false;
        throw error;
    }
  }

  // Health check all processors
  public async healthCheck(): Promise<Record<Language, boolean>> {
    const results: Partial<Record<Language, boolean>> = {};

    for (const [language, processor] of this.processors) {
      try {
        results[language] = await processor.isHealthy();
      } catch {
        results[language] = false;
      }
    }

    return results as Record<Language, boolean>;
  }

  // Force refresh of processor (useful for error recovery)
  public async refreshProcessor(language: Language): Promise<void> {
    this.processors.delete(language);
    await this.getProcessor(language);
  }
}

// Export factory instance
export const languageProcessorFactory = LanguageProcessorFactory.getInstance();

// Convenience function for getting processors
export async function createLanguageProcessor(language: Language): Promise<LanguageProcessor> {
  return await languageProcessorFactory.getProcessor(language);
}
```

#### 3. Spanish NLP Processor Wrapper (`lib/content-generation/tools/spanish-nlp-processor.ts`)

**NEW FILE - 150 lines**

```typescript
import {
  BaseLanguageProcessor,
  ProcessingCapabilities,
  VocabCandidate,
  VocabOptions,
  GrammarConcept,
  GrammarOptions,
  Exercise,
  ExerciseContext,
  ValidationResult
} from '../interfaces/language-processor';
import { extractSpanishVocabCandidates } from './spanish-nlp-helper';
import { identifySpanishGrammar } from './identify-grammar';
import { generateSpanishExercises } from './generate-exercises';

export class SpanishNLPProcessor extends BaseLanguageProcessor {
  readonly language = 'es' as const;
  readonly capabilities: ProcessingCapabilities = {
    vocabulary: true,
    grammar: true,
    exercises: true,
    morphology: true,
    syntaxAnalysis: true,
    customExerciseTypes: ['conjugation', 'subjunctive_practice', 'ser_estar']
  };

  async validateInput(text: string): Promise<ValidationResult> {
    const baseValidation = await super.validateInput(text);

    // Spanish-specific validation
    if (baseValidation.isValid) {
      // Check if text appears to be Spanish
      const spanishIndicators = /\b(el|la|los|las|un|una|en|de|que|y|o|con|por|para)\b/gi;
      const matches = text.match(spanishIndicators);

      if (!matches || matches.length < Math.max(1, text.split(/\s+/).length * 0.1)) {
        baseValidation.warnings.push('Text may not be Spanish - consider checking language setting');
      }
    }

    return baseValidation;
  }

  async extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]> {
    try {
      // Input validation
      const validation = await this.validateInput(text);
      if (!validation.isValid) {
        throw this.createProcessingError(
          `Invalid input: ${validation.errors.join(', ')}`,
          'INVALID_INPUT',
          'vocabulary'
        );
      }

      // Use existing Spanish NLP logic
      const candidates = await extractSpanishVocabCandidates(text, options.maxItems);

      // Transform to standard interface
      return candidates.map(candidate => ({
        word: candidate.word,
        lemma: candidate.lemma,
        definition: candidate.definition,
        partOfSpeech: candidate.partOfSpeech,
        frequency: candidate.frequency,
        difficulty: this.determineDifficulty(candidate),
        examples: candidate.examples || []
      }));

    } catch (error) {
      if (error.code) throw error; // Re-throw ProcessingError

      throw this.createProcessingError(
        `Spanish vocabulary extraction failed: ${error.message}`,
        'PROCESSING_FAILED',
        'vocabulary',
        true
      );
    }
  }

  async identifyGrammar(text: string, options: GrammarOptions): Promise<GrammarConcept[]> {
    try {
      // Use existing Spanish grammar identification
      const concepts = await identifySpanishGrammar(text, {
        maxConcepts: options.maxConcepts,
        includeExamples: options.includeExamples
      });

      return concepts.filter(concept =>
        options.complexityLevel === 'all' || concept.complexity === options.complexityLevel
      );

    } catch (error) {
      throw this.createProcessingError(
        `Spanish grammar identification failed: ${error.message}`,
        'PROCESSING_FAILED',
        'grammar',
        true
      );
    }
  }

  async generateExercises(context: ExerciseContext): Promise<Exercise[]> {
    try {
      // Use existing Spanish exercise generation
      const exercises = await generateSpanishExercises(context);

      // Ensure exercises have required metadata
      return exercises.map(exercise => ({
        ...exercise,
        metadata: {
          grammarFocus: exercise.metadata.grammarFocus || [],
          vocabularyFocus: exercise.metadata.vocabularyFocus || [],
          estimatedTime: exercise.metadata.estimatedTime || this.estimateExerciseTime(exercise)
        }
      }));

    } catch (error) {
      throw this.createProcessingError(
        `Spanish exercise generation failed: ${error.message}`,
        'PROCESSING_FAILED',
        'exercises',
        true
      );
    }
  }

  async estimateProcessingTime(text: string): Promise<number> {
    // Spanish processing is very fast with NLP.js
    const wordCount = text.split(/\s+/).length;
    return Math.max(500, wordCount * 20); // 20ms per word, minimum 500ms
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test with simple Spanish text
      const testText = "El gato come pescado.";
      const vocab = await this.extractVocabulary(testText, {
        maxItems: 5,
        includeFrequency: false,
        includeMorphology: false
      });

      return vocab.length > 0;
    } catch {
      return false;
    }
  }

  private determineDifficulty(candidate: any): 'basic' | 'intermediate' | 'advanced' {
    // Simple heuristic - enhance based on requirements
    if (candidate.frequency && candidate.frequency > 1000) return 'basic';
    if (candidate.frequency && candidate.frequency > 100) return 'intermediate';
    return 'advanced';
  }

  private estimateExerciseTime(exercise: Exercise): number {
    const baseTime = {
      'translation': 120,
      'fill_blank': 60,
      'multiple_choice': 45,
      'parsing': 90,
      'matching': 75
    };

    return baseTime[exercise.type] || 60;
  }
}

// Helper functions to maintain compatibility
async function identifySpanishGrammar(text: string, options: any): Promise<GrammarConcept[]> {
  // TODO: Implement or wrap existing grammar identification
  // This is a placeholder - implement based on existing identify-grammar.ts
  return [];
}

async function generateSpanishExercises(context: ExerciseContext): Promise<Exercise[]> {
  // TODO: Implement or wrap existing exercise generation
  // This is a placeholder - implement based on existing generate-exercises.ts
  return [];
}
```

### Security Implementation

**Input Sanitization**:
```typescript
// Add to BaseLanguageProcessor
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
```

**Rate Limiting**:
```typescript
// Add to factory
import rateLimit from 'express-rate-limit';

const processingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many processing requests, please try again later'
});
```

### Database Schema Updates

**Processing Metrics**:
```sql
-- Track processor performance and usage
CREATE TABLE language_processor_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language language_enum NOT NULL,
    processing_type TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processor_metrics_language_type ON language_processor_metrics(language, processing_type);
CREATE INDEX idx_processor_metrics_created_at ON language_processor_metrics(created_at);
```

### Testing Strategy

**Unit Tests**:
```typescript
// tests/language-processor-factory.test.ts
describe('LanguageProcessorFactory', () => {
  test('should return Spanish processor for es language', async () => {
    const processor = await createLanguageProcessor('es');
    expect(processor.language).toBe('es');
    expect(processor.capabilities.vocabulary).toBe(true);
  });

  test('should throw error for unsupported language', async () => {
    await expect(createLanguageProcessor('fr' as Language)).rejects.toThrow();
  });

  test('should cache processor instances', async () => {
    const processor1 = await createLanguageProcessor('es');
    const processor2 = await createLanguageProcessor('es');
    expect(processor1).toBe(processor2);
  });
});
```

### Acceptance Criteria

- [ ] **Factory Pattern**: `createLanguageProcessor('es')` returns functional Spanish processor
- [ ] **Interface Compliance**: All processors implement `LanguageProcessor` interface
- [ ] **Spanish Compatibility**: Existing Spanish functionality works through new architecture
- [ ] **Error Handling**: Graceful failure for invalid inputs and unsupported languages
- [ ] **Performance**: Spanish processing maintains existing speed (<2s)
- [ ] **Security**: All inputs validated and sanitized
- [ ] **Health Checks**: Processors can validate their operational status
- [ ] **Caching**: Processor instances are cached for performance

### Risk Mitigation

**Backward Compatibility**:
- Wrap existing Spanish functions without changing their internal logic
- Maintain identical API response formats
- Comprehensive regression testing

**Error Recovery**:
- Retry logic for transient failures
- Graceful degradation when processors are unhealthy
- Clear error messages for debugging

**Performance**:
- Lazy loading of processor instances
- Caching of frequently used processors
- Async initialization to avoid blocking

### Monitoring

**Key Metrics**:
- Processor initialization time by language
- Success/failure rates for each operation type
- Processing time distributions
- Cache hit rates for processor instances

**Alerts**:
- Processor health check failures
- Processing time exceeding thresholds
- High error rates for any language