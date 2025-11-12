import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  languageProcessorFactory,
  createLanguageProcessor,
  checkProcessorHealth
} from '../../lib/content-generation/tools/language-processor-factory';
import { Language } from '../../lib/content-generation/interfaces/language-processor';

// Mock the processor classes since we haven't implemented them yet
vi.mock('../../lib/content-generation/tools/spanish-nlp-processor', () => {
  return {
    SpanishNLPProcessor: class {
      language = 'es' as const;
      capabilities = {
        vocabulary: true,
        grammar: true,
        exercises: true,
        morphology: true,
        syntaxAnalysis: true
      };

      async validateInput() {
        return { isValid: true, errors: [], warnings: [] };
      }

      async extractVocabulary() {
        return [];
      }

      async identifyGrammar() {
        return [];
      }

      async generateExercises() {
        return [];
      }

      async estimateProcessingTime() {
        return 1000;
      }

      async isHealthy() {
        return true;
      }
    }
  };
});

vi.mock('../../lib/content-generation/tools/latin-language-processor', () => {
  return {
    LatinLanguageProcessor: class {
      language = 'la' as const;
      capabilities = {
        vocabulary: true,
        grammar: true,
        exercises: true,
        morphology: true,
        syntaxAnalysis: true
      };

      async validateInput() {
        return { isValid: true, errors: [], warnings: [] };
      }

      async extractVocabulary() {
        return [];
      }

      async identifyGrammar() {
        return [];
      }

      async generateExercises() {
        return [];
      }

      async estimateProcessingTime() {
        return 2000;
      }

      async isHealthy() {
        return true;
      }
    }
  };
});

describe('LanguageProcessorFactory', () => {
  beforeEach(() => {
    // Clear cache before each test
    languageProcessorFactory.clearCache();
  });

  describe('createLanguageProcessor', () => {
    it('should return Spanish processor for es language', async () => {
      const processor = await createLanguageProcessor('es');

      expect(processor.language).toBe('es');
      expect(processor.capabilities.vocabulary).toBe(true);
    });

    it('should return Latin processor for la language', async () => {
      const processor = await createLanguageProcessor('la');

      expect(processor.language).toBe('la');
      expect(processor.capabilities.vocabulary).toBe(true);
    });

    it('should throw error for unsupported language', async () => {
      await expect(createLanguageProcessor('fr' as Language))
        .rejects.toThrow('Unsupported language: fr');
    });

    it('should cache processor instances', async () => {
      const processor1 = await createLanguageProcessor('es');
      const processor2 = await createLanguageProcessor('es');

      expect(processor1).toBe(processor2);
      expect(languageProcessorFactory.getCacheSize()).toBe(1);
    });

    it('should create separate instances for different languages', async () => {
      const spanishProcessor = await createLanguageProcessor('es');
      const latinProcessor = await createLanguageProcessor('la');

      expect(spanishProcessor).not.toBe(latinProcessor);
      expect(spanishProcessor.language).toBe('es');
      expect(latinProcessor.language).toBe('la');
      expect(languageProcessorFactory.getCacheSize()).toBe(2);
    });
  });

  describe('health checks', () => {
    it('should perform health check on all cached processors', async () => {
      // Create some processors
      await createLanguageProcessor('es');
      await createLanguageProcessor('la');

      const healthResults = await checkProcessorHealth();

      expect(healthResults.es).toBe(true);
      expect(healthResults.la).toBe(true);
    });

    it('should handle health check failures gracefully', async () => {
      // Create a processor
      await createLanguageProcessor('es');

      // Mock health check failure
      const processor = await languageProcessorFactory.getProcessor('es');
      vi.spyOn(processor, 'isHealthy').mockRejectedValue(new Error('Health check failed'));

      const healthResults = await checkProcessorHealth();

      expect(healthResults.es).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should refresh processor when requested', async () => {
      const processor1 = await createLanguageProcessor('es');

      await languageProcessorFactory.refreshProcessor('es');
      const processor2 = await createLanguageProcessor('es');

      // Should be different instances after refresh
      expect(processor1).not.toBe(processor2);
    });

    it('should clear all cached processors', async () => {
      await createLanguageProcessor('es');
      await createLanguageProcessor('la');

      expect(languageProcessorFactory.getCacheSize()).toBe(2);

      languageProcessorFactory.clearCache();

      expect(languageProcessorFactory.getCacheSize()).toBe(0);
    });

    it('should track active languages', async () => {
      await createLanguageProcessor('es');
      await createLanguageProcessor('la');

      const activeLanguages = languageProcessorFactory.getActiveLanguages();

      expect(activeLanguages).toContain('es');
      expect(activeLanguages).toContain('la');
      expect(activeLanguages).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should throw if processor fails health check during creation', async () => {
      // Mock the SpanishNLPProcessor to fail health check
      const { SpanishNLPProcessor } = await import('../../lib/content-generation/tools/spanish-nlp-processor');
      vi.spyOn(SpanishNLPProcessor.prototype, 'isHealthy').mockResolvedValue(false);

      await expect(createLanguageProcessor('es'))
        .rejects.toThrow('Language processor for es failed health check');
    });

    it('should create ProcessingError with correct properties', async () => {
      try {
        await createLanguageProcessor('invalid' as Language);
      } catch (error: any) {
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.language).toBe('invalid');
        expect(error.processingType).toBe('vocabulary');
        expect(error.retryable).toBe(false);
      }
    });
  });
});

describe('Language Interface Validation', () => {
  it('should validate VocabOptions schema', async () => {
    const { VocabOptionsSchema } = await import('../../lib/content-generation/interfaces/language-processor');

    const validOptions = {
      maxItems: 10,
      includeFrequency: true,
      includeMorphology: false
    };

    const result = VocabOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.maxItems).toBe(10);
      expect(result.data.includeFrequency).toBe(true);
      expect(result.data.includeMorphology).toBe(false);
    }
  });

  it('should reject invalid VocabOptions', async () => {
    const { VocabOptionsSchema } = await import('../../lib/content-generation/interfaces/language-processor');

    const invalidOptions = {
      maxItems: 200, // Too high
      includeFrequency: 'yes' // Wrong type
    };

    const result = VocabOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should validate Language schema', async () => {
    const { LanguageSchema } = await import('../../lib/content-generation/interfaces/language-processor');

    expect(LanguageSchema.safeParse('es').success).toBe(true);
    expect(LanguageSchema.safeParse('la').success).toBe(true);
    expect(LanguageSchema.safeParse('fr').success).toBe(false);
    expect(LanguageSchema.safeParse('invalid').success).toBe(false);
  });
});