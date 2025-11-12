import { describe, it, expect, beforeAll } from 'vitest';
import { SpanishNLPProcessor } from '../../lib/content-generation/tools/spanish-nlp-processor';
import { LatinLanguageProcessor } from '../../lib/content-generation/tools/latin-language-processor';
import {
  languageProcessorFactory,
  createLanguageProcessor
} from '../../lib/content-generation/tools/language-processor-factory';
import type {
  VocabOptions,
  GrammarOptions,
  ExerciseContext
} from '../../lib/content-generation/interfaces/language-processor';

/**
 * Integration tests for language processors
 * Tests the actual implementations, not mocks
 */
describe('Language Processor Integration Tests', () => {
  beforeAll(() => {
    // Set NODE_ENV to test for mock responses in Latin processor
    process.env.NODE_ENV = 'test';
  });

  describe('Spanish Processor Integration', () => {
    let processor: SpanishNLPProcessor;
    const testText = 'El gato come pescado en la cocina mientras la mujer prepara la comida.';

    beforeAll(async () => {
      processor = await createLanguageProcessor('es');
    });

    it('should validate Spanish text successfully', async () => {
      const result = await processor.validateInput(testText);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // May have warnings about language detection
    });

    it('should detect non-Spanish text', async () => {
      const englishText = 'The cat eats fish in the kitchen while the woman prepares food.';
      const result = await processor.validateInput(englishText);

      expect(result.warnings.some(w => w.includes('may not be Spanish'))).toBe(true);
    });

    it('should extract vocabulary with proper structure', async () => {
      const options: VocabOptions = {
        maxItems: 5,
        includeFrequency: true,
        includeMorphology: true
      };

      const vocab = await processor.extractVocabulary(testText, options);

      expect(vocab).toHaveLength(5);
      expect(vocab[0]).toHaveProperty('word');
      expect(vocab[0]).toHaveProperty('lemma');
      expect(vocab[0]).toHaveProperty('definition');
      expect(vocab[0]).toHaveProperty('partOfSpeech');
      expect(vocab[0]).toHaveProperty('frequency');
      expect(vocab[0]).toHaveProperty('difficulty');

      // Check morphology is included
      expect(vocab[0]).toHaveProperty('morphology');
      if (vocab[0].morphology) {
        expect(vocab[0].morphology).toHaveProperty('stem');
        expect(vocab[0].morphology).toHaveProperty('normalized');
      }
    });

    it('should identify grammar concepts', async () => {
      const options: GrammarOptions = {
        maxConcepts: 3,
        complexityLevel: 'basic',
        includeExamples: true
      };

      const concepts = await processor.identifyGrammar(testText, options);

      expect(concepts).toHaveLength(3);
      expect(concepts[0]).toHaveProperty('id');
      expect(concepts[0]).toHaveProperty('name');
      expect(concepts[0]).toHaveProperty('description');
      expect(concepts[0]).toHaveProperty('complexity');
      expect(concepts[0]).toHaveProperty('examples');
      expect(concepts[0]).toHaveProperty('category');
    });

    it('should generate exercises', async () => {
      // First get some vocab and grammar for context
      const vocab = await processor.extractVocabulary(testText, { maxItems: 3 });
      const grammar = await processor.identifyGrammar(testText, { maxConcepts: 2 });

      const context: ExerciseContext = {
        originalText: testText,
        vocabulary: vocab,
        grammarConcepts: grammar,
        exerciseTypes: ['translation', 'multiple_choice'],
        maxExercises: 4,
        targetDifficulty: 'basic'
      };

      const exercises = await processor.generateExercises(context);

      expect(exercises).toHaveLength(4);
      expect(exercises[0]).toHaveProperty('id');
      expect(exercises[0]).toHaveProperty('type');
      expect(exercises[0]).toHaveProperty('question');
      expect(exercises[0]).toHaveProperty('correctAnswer');
      expect(exercises[0]).toHaveProperty('explanation');
      expect(exercises[0]).toHaveProperty('difficulty');
      expect(exercises[0]).toHaveProperty('metadata');

      // Check metadata structure
      expect(exercises[0].metadata).toHaveProperty('grammarFocus');
      expect(exercises[0].metadata).toHaveProperty('vocabularyFocus');
      expect(exercises[0].metadata).toHaveProperty('estimatedTime');
    });

    it('should estimate processing time reasonably', async () => {
      const time = await processor.estimateProcessingTime(testText);

      expect(time).toBeGreaterThan(500); // At least 500ms
      expect(time).toBeLessThan(10000);  // Less than 10 seconds for reasonable text
    });

    it('should pass health check', async () => {
      const isHealthy = await processor.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Latin Processor Integration', () => {
    let processor: LatinLanguageProcessor;
    const testText = 'Marcus in via ambulat et rosam pulchram videt dum ad forum festinat.';

    beforeAll(async () => {
      processor = await createLanguageProcessor('la');
    });

    it('should validate Latin text successfully', async () => {
      const result = await processor.validateInput(testText);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect Medieval Latin indicators', async () => {
      const medievalText = 'Dominus vobiscum et sancta ecclesia benedictus sit.';
      const result = await processor.validateInput(medievalText);

      expect(result.warnings.some(w => w.includes('Medieval/Church Latin'))).toBe(true);
    });

    it('should extract vocabulary with Latin-specific morphology', async () => {
      const options: VocabOptions = {
        maxItems: 3,
        includeFrequency: true,
        includeMorphology: true
      };

      const vocab = await processor.extractVocabulary(testText, options);

      expect(vocab).toHaveLength(3);
      expect(vocab[0]).toHaveProperty('word');
      expect(vocab[0]).toHaveProperty('lemma');
      expect(vocab[0]).toHaveProperty('definition');
      expect(vocab[0]).toHaveProperty('partOfSpeech');

      // Check Latin-specific morphology
      if (vocab[0].morphology) {
        expect(vocab[0].morphology).toHaveProperty('case');
        expect(vocab[0].morphology).toHaveProperty('number');
        expect(vocab[0].morphology).toHaveProperty('gender');
      }
    });

    it('should identify Latin grammar concepts', async () => {
      const options: GrammarOptions = {
        maxConcepts: 2,
        complexityLevel: 'intermediate',
        includeExamples: true
      };

      const concepts = await processor.identifyGrammar(testText, options);

      expect(concepts).toHaveLength(2);
      expect(concepts[0]).toHaveProperty('id');
      expect(concepts[0]).toHaveProperty('name');
      expect(concepts[0]).toHaveProperty('description');
      expect(concepts[0].complexity).toBe('intermediate');
    });

    it('should generate Latin-specific exercises', async () => {
      // Mock some vocab and grammar for context
      const mockVocab = [
        {
          word: 'Marcus',
          lemma: 'Marcus',
          definition: 'Marcus (a Roman name)',
          partOfSpeech: 'noun',
          frequency: 75,
          difficulty: 'basic' as const
        }
      ];

      const mockGrammar = [
        {
          id: 'nominative_subject',
          name: 'Nominative Case Subject',
          description: 'The nominative case is used for the subject of the sentence',
          complexity: 'basic' as const,
          examples: [],
          category: 'cases'
        }
      ];

      const context: ExerciseContext = {
        originalText: testText,
        vocabulary: mockVocab,
        grammarConcepts: mockGrammar,
        exerciseTypes: ['declension_practice', 'parsing'],
        maxExercises: 2,
        targetDifficulty: 'basic'
      };

      const exercises = await processor.generateExercises(context);

      expect(exercises).toHaveLength(2);
      expect(exercises.some(ex => ex.type === 'declension_practice')).toBe(true);
      expect(exercises.some(ex => ex.type === 'parsing')).toBe(true);
    });

    it('should have higher processing time than Spanish (LLM-based)', async () => {
      const spanishProcessor = await createLanguageProcessor('es');

      const latinTime = await processor.estimateProcessingTime(testText);
      const spanishTime = await spanishProcessor.estimateProcessingTime(testText);

      expect(latinTime).toBeGreaterThan(spanishTime);
      expect(latinTime).toBeGreaterThan(2000); // At least 2 seconds for LLM processing
    });

    it('should pass health check with mock responses', async () => {
      const isHealthy = await processor.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Cross-Language Factory Integration', () => {
    it('should create different processor types correctly', async () => {
      const spanishProcessor = await createLanguageProcessor('es');
      const latinProcessor = await createLanguageProcessor('la');

      expect(spanishProcessor.language).toBe('es');
      expect(latinProcessor.language).toBe('la');
      expect(spanishProcessor).not.toBe(latinProcessor);

      // Check capabilities
      expect(spanishProcessor.capabilities.vocabulary).toBe(true);
      expect(latinProcessor.capabilities.vocabulary).toBe(true);

      // Check custom exercise types are different
      expect(spanishProcessor.capabilities.customExerciseTypes)
        .toContain('conjugation');
      expect(spanishProcessor.capabilities.customExerciseTypes)
        .toContain('subjunctive_practice');

      expect(latinProcessor.capabilities.customExerciseTypes)
        .toContain('declension_practice');
      expect(latinProcessor.capabilities.customExerciseTypes)
        .toContain('case_identification');
    });

    it('should maintain processor instances in cache', async () => {
      // Clear cache first
      languageProcessorFactory.clearCache();

      const processor1 = await createLanguageProcessor('es');
      const processor2 = await createLanguageProcessor('es');
      const processor3 = await createLanguageProcessor('la');

      // Same language should return same instance
      expect(processor1).toBe(processor2);

      // Different languages should be different instances
      expect(processor1).not.toBe(processor3);

      // Cache should have 2 languages
      expect(languageProcessorFactory.getCacheSize()).toBe(2);
      expect(languageProcessorFactory.getActiveLanguages()).toContain('es');
      expect(languageProcessorFactory.getActiveLanguages()).toContain('la');
    });

    it('should handle processor health checks across languages', async () => {
      // Create both processors
      await createLanguageProcessor('es');
      await createLanguageProcessor('la');

      const healthResults = await languageProcessorFactory.healthCheck();

      expect(healthResults.es).toBe(true);
      expect(healthResults.la).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid input gracefully - Spanish', async () => {
      const processor = await createLanguageProcessor('es');

      await expect(processor.extractVocabulary('', { maxItems: 5 }))
        .rejects.toThrow('Text cannot be empty');
    });

    it('should handle invalid input gracefully - Latin', async () => {
      const processor = await createLanguageProcessor('la');

      const tooLongText = 'a'.repeat(10001);
      await expect(processor.extractVocabulary(tooLongText, { maxItems: 5 }))
        .rejects.toThrow('exceeds maximum length');
    });

    it('should throw proper ProcessingError with metadata', async () => {
      const processor = await createLanguageProcessor('es');

      try {
        await processor.extractVocabulary('', { maxItems: 5 });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('language');
        expect(error).toHaveProperty('processingType');
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.language).toBe('es');
        expect(error.processingType).toBe('vocabulary');
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete Spanish processing within reasonable time', async () => {
      const processor = await createLanguageProcessor('es');
      const testText = 'Un texto corto para probar el rendimiento del procesador.';

      const start = Date.now();
      const vocab = await processor.extractVocabulary(testText, { maxItems: 5 });
      const end = Date.now();

      expect(vocab.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should provide reasonable time estimates', async () => {
      const spanishProcessor = await createLanguageProcessor('es');
      const latinProcessor = await createLanguageProcessor('la');

      const shortText = 'Text breve.';
      const longText = 'This is a much longer text with many more words to process and analyze for vocabulary extraction and grammar identification purposes.';

      const spanishShort = await spanishProcessor.estimateProcessingTime(shortText);
      const spanishLong = await spanishProcessor.estimateProcessingTime(longText);
      const latinShort = await latinProcessor.estimateProcessingTime(shortText);
      const latinLong = await latinProcessor.estimateProcessingTime(longText);

      // Longer text should take more time
      expect(spanishLong).toBeGreaterThan(spanishShort);
      expect(latinLong).toBeGreaterThan(latinShort);

      // Latin should generally take longer (LLM-based)
      expect(latinShort).toBeGreaterThan(spanishShort);
      expect(latinLong).toBeGreaterThan(spanishLong);
    });
  });
});