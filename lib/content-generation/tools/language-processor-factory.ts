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

  // Clear all cached processors (useful for testing)
  public clearCache(): void {
    this.processors.clear();
  }

  // Get cached processor count (useful for monitoring)
  public getCacheSize(): number {
    return this.processors.size;
  }

  // List active languages (useful for monitoring)
  public getActiveLanguages(): Language[] {
    return Array.from(this.processors.keys());
  }
}

// Export factory instance
export const languageProcessorFactory = LanguageProcessorFactory.getInstance();

// Convenience function for getting processors
export async function createLanguageProcessor(language: Language): Promise<LanguageProcessor> {
  return await languageProcessorFactory.getProcessor(language);
}

// Health check helper
export async function checkProcessorHealth(): Promise<Record<Language, boolean>> {
  return await languageProcessorFactory.healthCheck();
}