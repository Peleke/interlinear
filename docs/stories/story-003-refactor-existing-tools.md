# STORY 003: Refactor Existing Tools for Language Routing

**Story ID**: STORY-003
**Points**: 2
**Priority**: High
**Epic**: EPIC-LANG-001
**Security Impact**: Low - Internal refactoring, no new attack surfaces
**Performance Impact**: <100ms additional routing overhead

## User Story

**As a** developer maintaining the codebase
**I want** existing vocabulary/grammar tools to use language processors
**So that** new languages work through the same API

## Technical Implementation

### File-by-File Specification

#### 1. Enhanced Vocabulary Extraction (`lib/content-generation/tools/extract-vocabulary.ts`)

**MODIFY EXISTING FILE - 220 lines → 180 lines (simplified through abstraction)**

```typescript
import { z } from 'zod';
import { createLanguageProcessor, Language, LanguageSchema, VocabOptions, VocabOptionsSchema } from '../interfaces/language-processor';
import { ProcessingError } from '../interfaces/language-processor';

// Input validation schema
const ExtractVocabularyInputSchema = z.object({
  text: z.string().min(1).max(10000),
  language: LanguageSchema,
  maxItems: z.number().min(1).max(100).default(20),
  includeFrequency: z.boolean().default(true),
  includeMorphology: z.boolean().default(false),
  difficultyFilter: z.enum(['basic', 'intermediate', 'advanced']).optional()
});

type ExtractVocabularyInput = z.infer<typeof ExtractVocabularyInputSchema>;

// Legacy interface for backward compatibility
export interface LegacyVocabOptions {
  maxItems?: number;
  includeFrequency?: boolean;
  includeMorphology?: boolean;
}

/**
 * Extract vocabulary from text using language-specific processing
 *
 * BACKWARD COMPATIBLE: Maintains existing function signature for Spanish
 * NEW: Accepts language parameter for multi-language support
 */
export async function extractVocabulary(
  text: string,
  language: Language = 'es', // Default to Spanish for backward compatibility
  options: LegacyVocabOptions = {}
): Promise<VocabCandidate[]> {
  const startTime = Date.now();

  try {
    // Validate and normalize input
    const input = ExtractVocabularyInputSchema.parse({
      text,
      language,
      maxItems: options.maxItems ?? 20,
      includeFrequency: options.includeFrequency ?? true,
      includeMorphology: options.includeMorphology ?? false
    });

    // Get language-specific processor
    const processor = await createLanguageProcessor(input.language);

    // Extract vocabulary using processor
    const vocabulary = await processor.extractVocabulary(input.text, {
      maxItems: input.maxItems,
      difficultyFilter: input.difficultyFilter,
      includeFrequency: input.includeFrequency,
      includeMorphology: input.includeMorphology
    });

    // Log performance metrics
    logVocabularyMetrics(input.language, Date.now() - startTime, vocabulary.length, true);

    return vocabulary;

  } catch (error) {
    logVocabularyMetrics(language, Date.now() - startTime, 0, false, error.message);

    // Re-throw ProcessingError with additional context
    if (error instanceof ProcessingError || error.code) {
      throw error;
    }

    // Wrap unexpected errors
    throw new Error(`Vocabulary extraction failed: ${error.message}`);
  }
}

/**
 * LEGACY FUNCTION: Maintains exact compatibility with existing Spanish-only code
 * This ensures zero breaking changes for existing implementations
 */
export async function extractSpanishVocabCandidates(
  text: string,
  maxItems: number = 20
): Promise<VocabCandidate[]> {
  return await extractVocabulary(text, 'es', { maxItems });
}

/**
 * Enhanced function for new implementations with full language support
 */
export async function extractVocabularyForLanguage(
  text: string,
  language: Language,
  options: VocabOptions
): Promise<VocabCandidate[]> {
  return await extractVocabulary(text, language, options);
}

// Type exports for backward compatibility
export { VocabCandidate } from '../interfaces/language-processor';

// Utility functions
function logVocabularyMetrics(
  language: Language,
  processingTimeMs: number,
  vocabularyCount: number,
  success: boolean,
  errorMessage?: string
): void {
  // TODO: Implement database logging
  const metrics = {
    language,
    processingTimeMs,
    vocabularyCount,
    success,
    errorMessage,
    timestamp: new Date().toISOString()
  };

  console.log('Vocabulary extraction metrics:', metrics);

  // Future: Save to database for monitoring
  // await saveVocabularyMetrics(metrics);
}

// Health check function for monitoring
export async function checkVocabularyExtractionHealth(): Promise<Record<Language, boolean>> {
  const results: Partial<Record<Language, boolean>> = {};

  for (const language of ['es', 'la'] as Language[]) {
    try {
      const testText = language === 'es' ? 'El gato come pescado.' : 'Caesar Galliam vincit.';
      const vocab = await extractVocabulary(testText, language, { maxItems: 3 });
      results[language] = vocab.length > 0;
    } catch {
      results[language] = false;
    }
  }

  return results as Record<Language, boolean>;
}

/**
 * Batch vocabulary extraction for multiple texts
 * Optimized for performance with parallel processing
 */
export async function extractVocabularyBatch(
  requests: Array<{ text: string; language: Language; options: VocabOptions }>
): Promise<Array<{ success: boolean; vocabulary?: VocabCandidate[]; error?: string }>> {

  // Process in parallel with controlled concurrency
  const concurrencyLimit = 5;
  const results: Array<{ success: boolean; vocabulary?: VocabCandidate[]; error?: string }> = [];

  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);

    const batchResults = await Promise.all(
      batch.map(async (request) => {
        try {
          const vocabulary = await extractVocabulary(request.text, request.language, request.options);
          return { success: true, vocabulary };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

// Export configuration for monitoring
export const VOCABULARY_EXTRACTION_CONFIG = {
  maxTextLength: 10000,
  maxVocabularyItems: 100,
  defaultLanguage: 'es' as Language,
  supportedLanguages: ['es', 'la'] as Language[],
  cacheEnabled: true,
  cacheTTLSeconds: 3600
};
```

#### 2. Enhanced Grammar Identification (`lib/content-generation/tools/identify-grammar.ts`)

**MODIFY EXISTING FILE - 80 lines → 120 lines (enhanced functionality)**

```typescript
import { z } from 'zod';
import {
  createLanguageProcessor,
  Language,
  LanguageSchema,
  GrammarConcept,
  GrammarOptions,
  GrammarOptionsSchema
} from '../interfaces/language-processor';

// Input validation
const IdentifyGrammarInputSchema = z.object({
  text: z.string().min(1).max(10000),
  language: LanguageSchema,
  maxConcepts: z.number().min(1).max(20).default(10),
  complexityLevel: z.enum(['basic', 'intermediate', 'advanced', 'all']).default('all'),
  includeExamples: z.boolean().default(true)
});

/**
 * Identify grammar concepts in text using language-specific processing
 *
 * ENHANCED: Now supports multiple languages with consistent interface
 */
export async function identifyGrammar(
  text: string,
  language: Language,
  options: Partial<GrammarOptions> = {}
): Promise<GrammarConcept[]> {
  const startTime = Date.now();

  try {
    // Validate input
    const input = IdentifyGrammarInputSchema.parse({
      text,
      language,
      ...options
    });

    // Get language processor
    const processor = await createLanguageProcessor(input.language);

    // Extract grammar concepts
    const concepts = await processor.identifyGrammar(input.text, {
      maxConcepts: input.maxConcepts,
      complexityLevel: input.complexityLevel,
      includeExamples: input.includeExamples
    });

    // Log metrics
    logGrammarMetrics(input.language, Date.now() - startTime, concepts.length, true);

    return concepts;

  } catch (error) {
    logGrammarMetrics(language, Date.now() - startTime, 0, false, error.message);
    throw new Error(`Grammar identification failed: ${error.message}`);
  }
}

/**
 * LEGACY FUNCTION: Spanish-only grammar identification for backward compatibility
 */
export async function identifySpanishGrammar(
  text: string,
  options: { maxConcepts?: number; includeExamples?: boolean } = {}
): Promise<GrammarConcept[]> {
  return await identifyGrammar(text, 'es', {
    maxConcepts: options.maxConcepts,
    includeExamples: options.includeExamples,
    complexityLevel: 'all'
  });
}

/**
 * Batch grammar identification for multiple texts
 */
export async function identifyGrammarBatch(
  requests: Array<{ text: string; language: Language; options: GrammarOptions }>
): Promise<Array<{ success: boolean; concepts?: GrammarConcept[]; error?: string }>> {

  const concurrencyLimit = 3; // Grammar analysis is more expensive
  const results: Array<{ success: boolean; concepts?: GrammarConcept[]; error?: string }> = [];

  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);

    const batchResults = await Promise.all(
      batch.map(async (request) => {
        try {
          const concepts = await identifyGrammar(request.text, request.language, request.options);
          return { success: true, concepts };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Grammar concept filtering and sorting utilities
 */
export function filterGrammarByComplexity(
  concepts: GrammarConcept[],
  targetComplexity: 'basic' | 'intermediate' | 'advanced'
): GrammarConcept[] {
  return concepts.filter(concept => concept.complexity === targetComplexity);
}

export function sortGrammarByCategory(concepts: GrammarConcept[]): Record<string, GrammarConcept[]> {
  return concepts.reduce((groups, concept) => {
    const category = concept.category || 'other';
    groups[category] = groups[category] || [];
    groups[category].push(concept);
    return groups;
  }, {} as Record<string, GrammarConcept[]>);
}

/**
 * Grammar concept validation for quality assurance
 */
export function validateGrammarConcepts(concepts: GrammarConcept[]): {
  valid: boolean;
  issues: string[]
} {
  const issues: string[] = [];

  for (const concept of concepts) {
    // Check required fields
    if (!concept.id) issues.push(`Missing ID for concept: ${concept.name}`);
    if (!concept.name) issues.push('Concept missing name');
    if (!concept.description) issues.push(`Missing description for: ${concept.name}`);

    // Check examples quality
    if (concept.examples) {
      for (const example of concept.examples) {
        if (!example.text) issues.push(`Empty example text for: ${concept.name}`);
        if (!example.explanation) issues.push(`Missing explanation for example in: ${concept.name}`);
      }
    }

    // Check complexity level
    const validComplexity = ['basic', 'intermediate', 'advanced'];
    if (!validComplexity.includes(concept.complexity)) {
      issues.push(`Invalid complexity level for: ${concept.name}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// Utility functions
function logGrammarMetrics(
  language: Language,
  processingTimeMs: number,
  conceptCount: number,
  success: boolean,
  errorMessage?: string
): void {
  const metrics = {
    language,
    processingTimeMs,
    conceptCount,
    success,
    errorMessage,
    timestamp: new Date().toISOString()
  };

  console.log('Grammar identification metrics:', metrics);

  // Future: Database logging
  // await saveGrammarMetrics(metrics);
}

// Health check
export async function checkGrammarIdentificationHealth(): Promise<Record<Language, boolean>> {
  const results: Partial<Record<Language, boolean>> = {};

  for (const language of ['es', 'la'] as Language[]) {
    try {
      const testText = language === 'es'
        ? 'El niño que estudia mucho aprende rápidamente.'
        : 'Caesar qui Galliam vincit imperator est.';

      const concepts = await identifyGrammar(testText, language, { maxConcepts: 3 });
      results[language] = concepts.length > 0;
    } catch {
      results[language] = false;
    }
  }

  return results as Record<Language, boolean>;
}

// Export types and constants
export { GrammarConcept, GrammarOptions } from '../interfaces/language-processor';

export const GRAMMAR_IDENTIFICATION_CONFIG = {
  maxTextLength: 10000,
  maxConcepts: 20,
  defaultComplexityLevel: 'all',
  supportedLanguages: ['es', 'la'] as Language[],
  cacheEnabled: true,
  cacheTTLSeconds: 3600
};
```

#### 3. Enhanced Exercise Generation (`lib/content-generation/tools/generate-exercises.ts`)

**MODIFY EXISTING FILE - 100 lines → 250 lines (significantly enhanced)**

```typescript
import { z } from 'zod';
import {
  createLanguageProcessor,
  Language,
  LanguageSchema,
  Exercise,
  ExerciseType,
  ExerciseContext,
  VocabCandidate,
  GrammarConcept
} from '../interfaces/language-processor';

// Enhanced input validation
const GenerateExercisesInputSchema = z.object({
  text: z.string().min(1).max(10000),
  language: LanguageSchema,
  vocabulary: z.array(z.any()).max(50), // VocabCandidate array
  grammarConcepts: z.array(z.any()).max(20), // GrammarConcept array
  targetDifficulty: z.enum(['basic', 'intermediate', 'advanced']).default('intermediate'),
  exerciseTypes: z.array(z.enum(['translation', 'fill_blank', 'multiple_choice', 'parsing', 'matching'])).min(1),
  maxExercises: z.number().min(1).max(20).default(10)
});

/**
 * Generate exercises using language-specific processing
 *
 * ENHANCED: Full multi-language support with type safety
 */
export async function generateExercises(
  text: string,
  language: Language,
  vocabulary: VocabCandidate[],
  grammarConcepts: GrammarConcept[],
  options: {
    targetDifficulty?: 'basic' | 'intermediate' | 'advanced';
    exerciseTypes?: ExerciseType[];
    maxExercises?: number;
  } = {}
): Promise<Exercise[]> {
  const startTime = Date.now();

  try {
    // Validate input
    const input = GenerateExercisesInputSchema.parse({
      text,
      language,
      vocabulary,
      grammarConcepts,
      targetDifficulty: options.targetDifficulty ?? 'intermediate',
      exerciseTypes: options.exerciseTypes ?? ['translation', 'multiple_choice', 'fill_blank'],
      maxExercises: options.maxExercises ?? 10
    });

    // Get language processor
    const processor = await createLanguageProcessor(input.language);

    // Create exercise context
    const context: ExerciseContext = {
      vocabulary: input.vocabulary,
      grammarConcepts: input.grammarConcepts,
      originalText: input.text,
      targetDifficulty: input.targetDifficulty,
      exerciseTypes: input.exerciseTypes,
      maxExercises: input.maxExercises
    };

    // Generate exercises
    const exercises = await processor.generateExercises(context);

    // Post-process exercises
    const processedExercises = await postProcessExercises(exercises, input.language);

    // Log metrics
    logExerciseMetrics(input.language, Date.now() - startTime, exercises.length, true);

    return processedExercises;

  } catch (error) {
    logExerciseMetrics(language, Date.now() - startTime, 0, false, error.message);
    throw new Error(`Exercise generation failed: ${error.message}`);
  }
}

/**
 * LEGACY FUNCTION: Spanish-only exercise generation for backward compatibility
 */
export async function generateSpanishExercises(context: ExerciseContext): Promise<Exercise[]> {
  return await generateExercises(
    context.originalText,
    'es',
    context.vocabulary,
    context.grammarConcepts,
    {
      targetDifficulty: context.targetDifficulty,
      exerciseTypes: context.exerciseTypes,
      maxExercises: context.maxExercises
    }
  );
}

/**
 * Generate exercises by type with fine-grained control
 */
export async function generateExercisesByType(
  language: Language,
  exerciseType: ExerciseType,
  context: Partial<ExerciseContext>
): Promise<Exercise[]> {

  const fullContext: ExerciseContext = {
    vocabulary: context.vocabulary || [],
    grammarConcepts: context.grammarConcepts || [],
    originalText: context.originalText || '',
    targetDifficulty: context.targetDifficulty || 'intermediate',
    exerciseTypes: [exerciseType],
    maxExercises: context.maxExercises || 5
  };

  const processor = await createLanguageProcessor(language);
  return await processor.generateExercises(fullContext);
}

/**
 * Batch exercise generation for multiple lessons
 */
export async function generateExercisesBatch(
  requests: Array<{
    text: string;
    language: Language;
    vocabulary: VocabCandidate[];
    grammarConcepts: GrammarConcept[];
    options: any;
  }>
): Promise<Array<{ success: boolean; exercises?: Exercise[]; error?: string }>> {

  const concurrencyLimit = 2; // Exercise generation is expensive
  const results: Array<{ success: boolean; exercises?: Exercise[]; error?: string }> = [];

  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);

    const batchResults = await Promise.all(
      batch.map(async (request) => {
        try {
          const exercises = await generateExercises(
            request.text,
            request.language,
            request.vocabulary,
            request.grammarConcepts,
            request.options
          );
          return { success: true, exercises };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Post-processing for exercise quality and consistency
 */
async function postProcessExercises(exercises: Exercise[], language: Language): Promise<Exercise[]> {
  return exercises.map((exercise, index) => ({
    ...exercise,
    // Ensure unique IDs
    id: `${language}_${exercise.type}_${Date.now()}_${index}`,

    // Standardize metadata
    metadata: {
      ...exercise.metadata,
      language,
      generatedAt: new Date().toISOString(),
      estimatedTime: exercise.metadata.estimatedTime || getDefaultExerciseTime(exercise.type)
    }
  }));
}

/**
 * Exercise validation for quality assurance
 */
export function validateExercises(exercises: Exercise[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const exercise of exercises) {
    // Check required fields
    if (!exercise.id) issues.push('Exercise missing ID');
    if (!exercise.question) issues.push(`Exercise ${exercise.id}: Missing question`);
    if (!exercise.correctAnswer) issues.push(`Exercise ${exercise.id}: Missing correct answer`);
    if (!exercise.explanation) issues.push(`Exercise ${exercise.id}: Missing explanation`);

    // Type-specific validation
    if (exercise.type === 'multiple_choice') {
      if (!exercise.distractors || exercise.distractors.length < 2) {
        issues.push(`Exercise ${exercise.id}: Multiple choice needs at least 2 distractors`);
      }
    }

    // Difficulty validation
    const validDifficulty = ['basic', 'intermediate', 'advanced'];
    if (!validDifficulty.includes(exercise.difficulty)) {
      issues.push(`Exercise ${exercise.id}: Invalid difficulty level`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Exercise analytics and insights
 */
export function analyzeExerciseDistribution(exercises: Exercise[]): {
  byType: Record<ExerciseType, number>;
  byDifficulty: Record<string, number>;
  averageEstimatedTime: number;
  qualityScore: number;
} {
  const byType = exercises.reduce((acc, ex) => {
    acc[ex.type] = (acc[ex.type] || 0) + 1;
    return acc;
  }, {} as Record<ExerciseType, number>);

  const byDifficulty = exercises.reduce((acc, ex) => {
    acc[ex.difficulty] = (acc[ex.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageEstimatedTime = exercises.reduce((sum, ex) =>
    sum + (ex.metadata.estimatedTime || 0), 0) / exercises.length;

  const qualityScore = calculateQualityScore(exercises);

  return {
    byType,
    byDifficulty,
    averageEstimatedTime,
    qualityScore
  };
}

// Utility functions
function getDefaultExerciseTime(exerciseType: ExerciseType): number {
  const defaults = {
    'translation': 120,
    'fill_blank': 60,
    'multiple_choice': 45,
    'parsing': 90,
    'matching': 75
  };

  return defaults[exerciseType] || 60;
}

function calculateQualityScore(exercises: Exercise[]): number {
  // Simple quality heuristic - enhance based on requirements
  const hasVariety = new Set(exercises.map(e => e.type)).size > 1;
  const hasExplanations = exercises.every(e => e.explanation.length > 10);
  const hasDifficultyRange = new Set(exercises.map(e => e.difficulty)).size > 1;

  return (Number(hasVariety) + Number(hasExplanations) + Number(hasDifficultyRange)) / 3;
}

function logExerciseMetrics(
  language: Language,
  processingTimeMs: number,
  exerciseCount: number,
  success: boolean,
  errorMessage?: string
): void {
  const metrics = {
    language,
    processingTimeMs,
    exerciseCount,
    success,
    errorMessage,
    timestamp: new Date().toISOString()
  };

  console.log('Exercise generation metrics:', metrics);

  // Future: Database logging
  // await saveExerciseMetrics(metrics);
}

// Health check
export async function checkExerciseGenerationHealth(): Promise<Record<Language, boolean>> {
  const results: Partial<Record<Language, boolean>> = {};

  for (const language of ['es', 'la'] as Language[]) {
    try {
      const mockVocab: VocabCandidate[] = [
        { word: 'test', lemma: 'test', definition: 'test', partOfSpeech: 'noun' }
      ];
      const mockGrammar: GrammarConcept[] = [
        {
          id: 'test',
          name: 'test',
          description: 'test',
          complexity: 'basic',
          examples: [],
          category: 'test'
        }
      ];

      const exercises = await generateExercises(
        'test text',
        language,
        mockVocab,
        mockGrammar,
        { maxExercises: 1 }
      );

      results[language] = exercises.length > 0;
    } catch {
      results[language] = false;
    }
  }

  return results as Record<Language, boolean>;
}

// Export types and configuration
export { Exercise, ExerciseType, ExerciseContext } from '../interfaces/language-processor';

export const EXERCISE_GENERATION_CONFIG = {
  maxExercisesPerRequest: 20,
  supportedExerciseTypes: ['translation', 'fill_blank', 'multiple_choice', 'parsing', 'matching'] as ExerciseType[],
  defaultDifficulty: 'intermediate',
  supportedLanguages: ['es', 'la'] as Language[],
  qualityThreshold: 0.7,
  cacheEnabled: false // Exercises should be unique
};
```

### Database Migration

```sql
-- Migration to track tool refactoring performance
CREATE TABLE content_generation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name TEXT NOT NULL CHECK (tool_name IN ('extract_vocabulary', 'identify_grammar', 'generate_exercises')),
    language language_enum NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    item_count INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    text_length INTEGER,
    options_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_metrics_tool_lang ON content_generation_metrics(tool_name, language);
CREATE INDEX idx_content_metrics_created_at ON content_generation_metrics(created_at);
```

### Integration Testing

```typescript
// Test suite for refactored tools
describe('Refactored Content Generation Tools', () => {
  describe('extractVocabulary', () => {
    test('maintains Spanish backward compatibility', async () => {
      const spanishText = 'El perro come comida deliciosa.';

      // Old way should still work
      const oldResult = await extractSpanishVocabCandidates(spanishText, 10);

      // New way should produce identical results
      const newResult = await extractVocabulary(spanishText, 'es', { maxItems: 10 });

      expect(oldResult).toHaveLength(newResult.length);
      expect(oldResult[0]).toMatchObject(expect.objectContaining({
        word: expect.any(String),
        definition: expect.any(String)
      }));
    });

    test('supports Latin language', async () => {
      const latinText = 'Caesar Galliam vincit et gloriam quaerit.';
      const result = await extractVocabulary(latinText, 'la', { maxItems: 15 });

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContainEqual(expect.objectContaining({
        lemma: expect.any(String),
        morphology: expect.any(Object)
      }));
    });
  });

  describe('identifyGrammar', () => {
    test('Spanish grammar identification works', async () => {
      const text = 'El libro que leí ayer era muy interesante.';
      const concepts = await identifyGrammar(text, 'es');

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts[0]).toHaveProperty('name');
      expect(concepts[0]).toHaveProperty('description');
    });

    test('Latin grammar identification works', async () => {
      const text = 'Caesar, qui Galliam vincit, magnus imperator est.';
      const concepts = await identifyGrammar(text, 'la');

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts).toContainEqual(expect.objectContaining({
        category: expect.any(String),
        complexity: expect.any(String)
      }));
    });
  });

  describe('generateExercises', () => {
    test('generates exercises for both languages', async () => {
      const mockVocab: VocabCandidate[] = [
        { word: 'casa', lemma: 'casa', definition: 'house', partOfSpeech: 'noun' }
      ];
      const mockGrammar: GrammarConcept[] = [];

      for (const language of ['es', 'la'] as Language[]) {
        const exercises = await generateExercises(
          'test text',
          language,
          mockVocab,
          mockGrammar,
          { maxExercises: 3 }
        );

        expect(exercises.length).toBeGreaterThan(0);
        expect(exercises[0]).toHaveProperty('type');
        expect(exercises[0]).toHaveProperty('question');
        expect(exercises[0]).toHaveProperty('correctAnswer');
      }
    });
  });
});
```

### Performance Monitoring

```typescript
// Performance monitoring configuration
export const TOOL_PERFORMANCE_THRESHOLDS = {
  extractVocabulary: {
    es: 2000, // 2 seconds for Spanish
    la: 10000 // 10 seconds for Latin
  },
  identifyGrammar: {
    es: 3000,
    la: 12000
  },
  generateExercises: {
    es: 5000,
    la: 15000
  }
};

// Monitoring function
export async function monitorToolPerformance() {
  const healthChecks = await Promise.all([
    checkVocabularyExtractionHealth(),
    checkGrammarIdentificationHealth(),
    checkExerciseGenerationHealth()
  ]);

  return {
    vocabulary: healthChecks[0],
    grammar: healthChecks[1],
    exercises: healthChecks[2],
    timestamp: new Date().toISOString()
  };
}
```

### Acceptance Criteria

- [ ] **Backward Compatibility**: All existing Spanish functionality works unchanged
- [ ] **Language Routing**: Tools correctly route to language processors
- [ ] **Performance**: Spanish processing maintains existing speed
- [ ] **Error Handling**: Graceful failure with meaningful error messages
- [ ] **Validation**: All inputs validated and sanitized
- [ ] **Health Checks**: Tools can validate operational status
- [ ] **Monitoring**: Performance metrics logged for all operations
- [ ] **Testing**: Comprehensive test coverage for both languages

### Risk Mitigation

**Deployment Strategy**:
- Feature flags to enable/disable new routing
- Gradual rollout starting with Latin-only routes
- Monitoring dashboards for performance regression
- Rollback procedures for critical issues

**Backward Compatibility**:
- Maintain all existing function signatures
- Default parameters preserve Spanish behavior
- Legacy wrapper functions for existing integrations
- Comprehensive regression testing