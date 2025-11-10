/**
 * Hybrid Latin Analysis Service
 *
 * Orchestrates:
 * 1. Lewis & Short dictionary lookup (local)
 * 2. CLTK morphological analysis (microservice)
 * 3. Translation caching (TODO: DB when ready)
 *
 * FAST AF with smart fallbacks and caching
 */

import { LatinDictionaryService } from './LatinDictionaryService';
import type {
  LatinAnalysisResult,
  LatinWordAnalysis,
  LatinAnalysisOptions,
  DictionaryEntry,
} from '@/types/latin';

interface CLTKAnalyzeResponse {
  success: boolean;
  words: LatinWordAnalysis[];
  raw_text: string;
  error?: string;
}

export class LatinAnalysisService {
  private dictionaryService: LatinDictionaryService;
  private cltkBaseUrl: string;
  private cache: Map<string, LatinAnalysisResult>;

  constructor(cltkBaseUrl = 'http://localhost:8000') {
    this.dictionaryService = new LatinDictionaryService();
    this.cltkBaseUrl = cltkBaseUrl;
    this.cache = new Map();
  }

  /**
   * Initialize services (load dictionary)
   */
  async initialize(): Promise<void> {
    await this.dictionaryService.initialize();
  }

  /**
   * Analyze a single Latin word with full context
   */
  async analyzeWord(
    word: string,
    options: LatinAnalysisOptions = {}
  ): Promise<LatinAnalysisResult> {
    const {
      includeMorphology = true,
      includeDictionary = true,
      cacheResults = true,
    } = options;

    // Check cache
    const cacheKey = `${word}:${includeMorphology}:${includeDictionary}`;
    if (cacheResults && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Start with base result
    const result: LatinAnalysisResult = {
      form: word,
      lemma: null,
      pos: null,
      morphology: null,
      dictionary: null,
      index: 0,
    };

    // Run dictionary and morphology in parallel for speed
    const [morphologyResult, dictionaryResult] = await Promise.allSettled([
      includeMorphology ? this.getMorphology(word) : Promise.resolve(null),
      includeDictionary ? this.getDictionaryEntry(word) : Promise.resolve(null),
    ]);

    // Extract morphology if successful
    if (morphologyResult.status === 'fulfilled' && morphologyResult.value) {
      result.lemma = morphologyResult.value.lemma;
      result.pos = morphologyResult.value.pos;
      result.morphology = morphologyResult.value.morphology;
    }

    // Extract dictionary if successful
    if (dictionaryResult.status === 'fulfilled' && dictionaryResult.value) {
      result.dictionary = dictionaryResult.value;
    }

    // If morphology gave us a lemma, try dictionary lookup with lemma too
    if (result.lemma && !result.dictionary) {
      const lemmaDict = await this.getDictionaryEntry(result.lemma);
      if (lemmaDict) {
        result.dictionary = lemmaDict;
      }
    }

    // Cache result
    if (cacheResults) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Analyze multiple words (e.g., a sentence)
   */
  async analyzeText(
    text: string,
    options: LatinAnalysisOptions = {}
  ): Promise<LatinAnalysisResult[]> {
    const { includeMorphology = true } = options;

    // Get morphology for all words at once (more efficient)
    let morphologyResults: LatinWordAnalysis[] = [];
    if (includeMorphology) {
      try {
        const response = await this.callCLTKService(text);
        if (response.success) {
          morphologyResults = response.words;
        }
      } catch (error) {
        console.error('CLTK service error:', error);
        // Continue with empty morphology results
      }
    }

    // Build results with dictionary lookups in parallel
    const results = await Promise.all(
      morphologyResults.map(async (wordAnalysis) => {
        const dictionary = await this.getDictionaryEntry(
          wordAnalysis.lemma || wordAnalysis.form
        );

        return {
          form: wordAnalysis.form,
          lemma: wordAnalysis.lemma,
          pos: wordAnalysis.pos,
          morphology: wordAnalysis.morphology,
          dictionary,
          index: wordAnalysis.index,
        };
      })
    );

    return results;
  }

  /**
   * Get morphological analysis from CLTK service
   */
  private async getMorphology(word: string): Promise<LatinWordAnalysis | null> {
    try {
      const response = await this.callCLTKService(word);
      if (response.success && response.words.length > 0) {
        return response.words[0];
      }
      return null;
    } catch (error) {
      console.error('CLTK morphology error:', error);
      return null;
    }
  }

  /**
   * Get dictionary entry from Lewis & Short
   */
  private async getDictionaryEntry(word: string): Promise<DictionaryEntry | null> {
    const entry = await this.dictionaryService.lookup(word);
    if (!entry) return null;

    return {
      language: 'latin',
      word: entry.word,
      definitions: entry.definitions,
      examples: entry.examples,
      etymology: entry.etymology,
    };
  }

  /**
   * Call CLTK microservice - FAST with fetch
   */
  private async callCLTKService(text: string): Promise<CLTKAnalyzeResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(`${this.cltkBaseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          include_morphology: true,
          include_dependencies: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CLTK service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CLTK service timeout');
      }
      throw error;
    }
  }

  /**
   * Check if CLTK service is healthy
   */
  async isServiceHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.cltkBaseUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return false;

      const data = await response.json();
      return data.status === 'healthy' && data.cltk_ready === true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let latinAnalysisService: LatinAnalysisService | null = null;

export function getLatinAnalysisService(): LatinAnalysisService {
  if (!latinAnalysisService) {
    latinAnalysisService = new LatinAnalysisService(
      process.env.NEXT_PUBLIC_CLTK_SERVICE_URL || 'http://localhost:8000'
    );
  }
  return latinAnalysisService;
}
