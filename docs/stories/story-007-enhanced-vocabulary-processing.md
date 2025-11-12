# STORY 007: Enhanced Vocabulary Processing

**Story ID**: STORY-007
**Points**: 2
**Priority**: Medium
**Epic**: EPIC-LATIN-002
**Security Impact**: Low - Enhances existing secure vocabulary processing
**Performance Impact**: <1s additional processing for vocabulary enhancements

## User Story

**As a** Latin educator
**I want** detailed vocabulary analysis with inflection information
**So that** students understand word forms they encounter

## Technical Implementation

### File-by-File Specification

#### 1. Enhanced Latin Vocabulary Processor (`lib/content-generation/tools/latin-vocabulary-enhancer.ts`)

**NEW FILE - 700 lines**

```typescript
import { z } from 'zod';
import { VocabCandidate } from '../interfaces/language-processor';
import { latinDictionaryService } from '../../services/latin-dictionary';
import { llmIntegrationService } from '../services/llm-integration';

// Enhanced vocabulary analysis interface
export interface LatinVocabularyAnalysis extends VocabCandidate {
  // Morphological analysis
  morphology: LatinMorphologyData;

  // Frequency and usage data
  frequencyData: FrequencyAnalysis;

  // Pedagogical metadata
  pedagogicalInfo: PedagogicalMetadata;

  // Dictionary enrichments
  dictionaryData: DictionaryEnrichment;

  // Cultural and historical context
  culturalContext?: CulturalContext;
}

export interface LatinMorphologyData {
  lemma: string;
  inflectedForm: string;
  partOfSpeech: DetailedPartOfSpeech;
  morphologicalFeatures: MorphologicalFeatures;
  stemInformation: StemInfo;
  irregularForms?: IrregularFormData[];
}

export interface DetailedPartOfSpeech {
  major: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection';
  subcategory?: 'deponent' | 'defective' | 'impersonal' | 'irregular' | 'comparative' | 'superlative';
  declension?: number; // 1-5 for nouns and adjectives
  conjugation?: number; // 1-4 for verbs
}

export interface MorphologicalFeatures {
  // Nominal features
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'ablative' | 'vocative' | 'locative';
  number?: 'singular' | 'plural';
  gender?: 'masculine' | 'feminine' | 'neuter';

  // Verbal features
  person?: '1st' | '2nd' | '3rd';
  tense?: 'present' | 'imperfect' | 'future' | 'perfect' | 'pluperfect' | 'future_perfect';
  mood?: 'indicative' | 'subjunctive' | 'imperative' | 'infinitive' | 'participle' | 'gerund' | 'supine';
  voice?: 'active' | 'passive' | 'deponent';

  // Adjectival features
  degree?: 'positive' | 'comparative' | 'superlative';
}

export interface StemInfo {
  presentStem?: string;
  perfectStem?: string;
  participalStem?: string;
  nominalStem?: string;
  stemVariations?: string[];
}

export interface FrequencyAnalysis {
  corpusFrequency: number; // Frequency in classical Latin corpus
  pedagogicalFrequency: number; // Frequency in Latin textbooks
  relativeFrequency: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  frequencyRank?: number;
  usageContexts: string[]; // literary, colloquial, technical, etc.
}

export interface PedagogicalMetadata {
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  teachingPriority: number; // 1-10 scale
  commonMistakes: string[];
  teachingNotes: string[];
  relatedVocabulary: string[];
  etymologyInfo?: Etymology;
}

export interface DictionaryEnrichment {
  primaryDefinition: string;
  alternativeDefinitions: string[];
  usageExamples: UsageExample[];
  synonyms: string[];
  antonyms: string[];
  derivedWords: string[];
  compounds: string[];
}

export interface UsageExample {
  latin: string;
  english: string;
  source: string;
  context: string;
  grammaticalNote?: string;
}

export interface Etymology {
  origin: string;
  development: string[];
  cognates: string[];
  modernDerivatives: string[];
}

export interface CulturalContext {
  historicalPeriod: string;
  culturalSignificance: string;
  religiousConnections?: string;
  socialContext?: string;
  literaryUsage?: string[];
}

// Validation schemas
const LatinMorphologySchema = z.object({
  case: z.enum(['nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative', 'locative']).optional(),
  number: z.enum(['singular', 'plural']).optional(),
  gender: z.enum(['masculine', 'feminine', 'neuter']).optional(),
  person: z.enum(['1st', '2nd', '3rd']).optional(),
  tense: z.enum(['present', 'imperfect', 'future', 'perfect', 'pluperfect', 'future_perfect']).optional(),
  mood: z.enum(['indicative', 'subjunctive', 'imperative', 'infinitive', 'participle', 'gerund', 'supine']).optional(),
  voice: z.enum(['active', 'passive', 'deponent']).optional()
});

/**
 * Enhanced Latin Vocabulary Processor
 * Provides comprehensive analysis of Latin vocabulary with morphological, frequency, and pedagogical data
 */
export class LatinVocabularyEnhancer {
  private readonly frequencyCache: Map<string, FrequencyAnalysis> = new Map();
  private readonly morphologyCache: Map<string, LatinMorphologyData> = new Map();

  /**
   * Enhance basic vocabulary candidates with comprehensive Latin analysis
   */
  async enhanceVocabulary(
    basicVocabulary: VocabCandidate[],
    text: string,
    options: {
      includeCulturalContext?: boolean;
      includeEtymology?: boolean;
      maxEnhancementsPerWord?: number;
      prioritizeByFrequency?: boolean;
    } = {}
  ): Promise<LatinVocabularyAnalysis[]> {

    const {
      includeCulturalContext = true,
      includeEtymology = false,
      maxEnhancementsPerWord = 10,
      prioritizeByFrequency = true
    } = options;

    const enhanced: LatinVocabularyAnalysis[] = [];

    // Process vocabulary in batches for performance
    const batchSize = 5;
    for (let i = 0; i < basicVocabulary.length; i += batchSize) {
      const batch = basicVocabulary.slice(i, i + batchSize);

      const batchPromises = batch.map(async (vocab) => {
        try {
          return await this.enhanceSingleVocabulary(vocab, text, {
            includeCulturalContext,
            includeEtymology,
            maxEnhancementsPerWord
          });
        } catch (error) {
          console.error(`Failed to enhance vocabulary: ${vocab.lemma}`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter((result): result is LatinVocabularyAnalysis => result !== null);
      enhanced.push(...validResults);
    }

    // Sort by priority if requested
    if (prioritizeByFrequency) {
      enhanced.sort((a, b) => b.frequencyData.corpusFrequency - a.frequencyData.corpusFrequency);
    }

    return enhanced.slice(0, maxEnhancementsPerWord);
  }

  private async enhanceSingleVocabulary(
    vocab: VocabCandidate,
    text: string,
    options: {
      includeCulturalContext: boolean;
      includeEtymology: boolean;
      maxEnhancementsPerWord: number;
    }
  ): Promise<LatinVocabularyAnalysis> {

    // Parallel enhancement operations
    const [
      morphologyData,
      frequencyData,
      dictionaryData,
      pedagogicalInfo,
      culturalContext
    ] = await Promise.all([
      this.analyzeMorphology(vocab),
      this.analyzeFrequency(vocab.lemma || vocab.word),
      this.enrichWithDictionary(vocab),
      this.generatePedagogicalInfo(vocab, text),
      options.includeCulturalContext ? this.addCulturalContext(vocab) : Promise.resolve(undefined)
    ]);

    const enhanced: LatinVocabularyAnalysis = {
      ...vocab,
      morphology: morphologyData,
      frequencyData,
      pedagogicalInfo,
      dictionaryData,
      culturalContext
    };

    return enhanced;
  }

  /**
   * Advanced morphological analysis using LLM and rule-based processing
   */
  private async analyzeMorphology(vocab: VocabCandidate): Promise<LatinMorphologyData> {
    const cacheKey = `${vocab.word}-${vocab.lemma}`;
    if (this.morphologyCache.has(cacheKey)) {
      return this.morphologyCache.get(cacheKey)!;
    }

    const prompt = `
    Provide detailed morphological analysis for this Latin word:

    Word form: "${vocab.word}"
    Lemma: "${vocab.lemma || vocab.word}"
    Part of speech: "${vocab.partOfSpeech}"

    Provide comprehensive morphological analysis including:

    1. DETAILED PART OF SPEECH:
       - Major category (noun, verb, adjective, etc.)
       - Subcategory if applicable (deponent, irregular, etc.)
       - Declension (for nouns/adjectives) or Conjugation (for verbs)

    2. MORPHOLOGICAL FEATURES:
       - Case, number, gender (for nominals)
       - Person, number, tense, mood, voice (for verbs)
       - Degree (for adjectives)

    3. STEM INFORMATION:
       - Relevant stems (present, perfect, participial, etc.)
       - Stem variations if applicable

    4. IRREGULAR FORMS:
       - List any irregular forms for this lemma
       - Note any special morphological behavior

    Return as JSON:
    {
      "lemma": "dictionary form",
      "inflectedForm": "form as it appears",
      "partOfSpeech": {
        "major": "noun/verb/adjective/etc",
        "subcategory": "deponent/irregular/etc or null",
        "declension": 1-5 for nouns/adjectives or null,
        "conjugation": 1-4 for verbs or null
      },
      "morphologicalFeatures": {
        "case": "nominative/genitive/etc or null",
        "number": "singular/plural or null",
        "gender": "masculine/feminine/neuter or null",
        "person": "1st/2nd/3rd or null",
        "tense": "present/imperfect/etc or null",
        "mood": "indicative/subjunctive/etc or null",
        "voice": "active/passive/deponent or null",
        "degree": "positive/comparative/superlative or null"
      },
      "stemInformation": {
        "presentStem": "stem or null",
        "perfectStem": "stem or null",
        "participalStem": "stem or null",
        "nominalStem": "stem or null"
      },
      "irregularForms": [
        "list of irregular forms or empty array"
      ]
    }`;

    try {
      const response = await llmIntegrationService.generateCompletion({
        messages: [
          { role: 'system', content: 'You are an expert Latin morphologist providing detailed grammatical analysis.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        temperature: 0.1,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.content);

      const morphologyData: LatinMorphologyData = {
        lemma: parsed.lemma || vocab.lemma || vocab.word,
        inflectedForm: parsed.inflectedForm || vocab.word,
        partOfSpeech: parsed.partOfSpeech,
        morphologicalFeatures: parsed.morphologicalFeatures,
        stemInformation: parsed.stemInformation,
        irregularForms: parsed.irregularForms
      };

      this.morphologyCache.set(cacheKey, morphologyData);
      return morphologyData;

    } catch (error) {
      console.error('Morphological analysis failed:', error);

      // Fallback to basic morphology
      return {
        lemma: vocab.lemma || vocab.word,
        inflectedForm: vocab.word,
        partOfSpeech: {
          major: this.inferMajorPOS(vocab.partOfSpeech),
          subcategory: undefined,
          declension: undefined,
          conjugation: undefined
        },
        morphologicalFeatures: vocab.morphology || {},
        stemInformation: {},
        irregularForms: []
      };
    }
  }

  /**
   * Frequency analysis using corpus data and pedagogical frequency
   */
  private async analyzeFrequency(lemma: string): Promise<FrequencyAnalysis> {
    if (this.frequencyCache.has(lemma)) {
      return this.frequencyCache.get(lemma)!;
    }

    // Simple frequency heuristic based on common Latin words
    // In production, this would query actual corpus frequency data
    const commonWords = {
      // Very high frequency (top 100)
      'sum': 1000, 'habeo': 950, 'facio': 900, 'dico': 850, 'video': 800,
      'venio': 750, 'do': 700, 'eo': 650, 'possum': 600, 'volo': 550,

      // High frequency (top 500)
      'homo': 500, 'rex': 450, 'bellum': 400, 'urbs': 350, 'tempus': 300,
      'locus': 250, 'manus': 200, 'dies': 180, 'res': 160, 'corpus': 140,

      // Medium frequency (top 1000)
      'imperium': 120, 'civitas': 100, 'virtus': 80, 'gloria': 60, 'pax': 50,

      // Lower frequency
      'default': 25
    };

    const corpusFrequency = commonWords[lemma as keyof typeof commonWords] || commonWords.default;
    const pedagogicalFrequency = this.calculatePedagogicalFrequency(lemma, corpusFrequency);

    const frequencyData: FrequencyAnalysis = {
      corpusFrequency,
      pedagogicalFrequency,
      relativeFrequency: this.categorizeFrequency(corpusFrequency),
      usageContexts: this.inferUsageContexts(lemma)
    };

    this.frequencyCache.set(lemma, frequencyData);
    return frequencyData;
  }

  /**
   * Dictionary enrichment with comprehensive definition data
   */
  private async enrichWithDictionary(vocab: VocabCandidate): Promise<DictionaryEnrichment> {
    try {
      // Use existing dictionary service
      const dictEntry = await latinDictionaryService.lookup(vocab.lemma || vocab.word);

      if (dictEntry) {
        return {
          primaryDefinition: dictEntry.definition,
          alternativeDefinitions: dictEntry.alternativeDefinitions || [],
          usageExamples: dictEntry.examples?.map(ex => ({
            latin: ex.latin || '',
            english: ex.english || '',
            source: ex.source || 'Unknown',
            context: ex.context || '',
            grammaticalNote: ex.grammaticalNote
          })) || [],
          synonyms: dictEntry.synonyms || [],
          antonyms: dictEntry.antonyms || [],
          derivedWords: dictEntry.derivedWords || [],
          compounds: dictEntry.compounds || []
        };
      }
    } catch (error) {
      console.error('Dictionary enrichment failed:', error);
    }

    // Fallback enrichment
    return {
      primaryDefinition: vocab.definition,
      alternativeDefinitions: [],
      usageExamples: [],
      synonyms: [],
      antonyms: [],
      derivedWords: [],
      compounds: []
    };
  }

  /**
   * Generate pedagogical information and teaching recommendations
   */
  private async generatePedagogicalInfo(vocab: VocabCandidate, text: string): Promise<PedagogicalMetadata> {
    const prompt = `
    Generate pedagogical information for teaching this Latin vocabulary word:

    Word: "${vocab.word}" (lemma: "${vocab.lemma}")
    Definition: "${vocab.definition}"
    Part of speech: "${vocab.partOfSpeech}"
    Context: "${text.substring(0, 200)}..."

    Provide teaching recommendations including:

    1. DIFFICULTY LEVEL: basic/intermediate/advanced
    2. TEACHING PRIORITY: 1-10 scale (how important for Latin students)
    3. COMMON MISTAKES: typical student errors with this word
    4. TEACHING NOTES: helpful tips for instructors
    5. RELATED VOCABULARY: words that should be taught together
    6. ETYMOLOGY: basic origin information if helpful for learning

    Return as JSON:
    {
      "difficultyLevel": "basic/intermediate/advanced",
      "teachingPriority": 1-10,
      "commonMistakes": ["mistake 1", "mistake 2"],
      "teachingNotes": ["note 1", "note 2"],
      "relatedVocabulary": ["related word 1", "related word 2"],
      "etymology": {
        "origin": "basic origin",
        "development": ["development step 1"],
        "cognates": ["related word in other languages"],
        "modernDerivatives": ["English derivatives"]
      }
    }`;

    try {
      const response = await llmIntegrationService.generateCompletion({
        messages: [
          { role: 'system', content: 'You are an expert Latin pedagogy specialist.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        temperature: 0.2,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.content);

      return {
        difficultyLevel: parsed.difficultyLevel || 'intermediate',
        teachingPriority: parsed.teachingPriority || 5,
        commonMistakes: parsed.commonMistakes || [],
        teachingNotes: parsed.teachingNotes || [],
        relatedVocabulary: parsed.relatedVocabulary || [],
        etymologyInfo: parsed.etymology
      };

    } catch (error) {
      console.error('Pedagogical info generation failed:', error);

      // Fallback pedagogical info
      return {
        difficultyLevel: this.inferDifficultyLevel(vocab),
        teachingPriority: 5,
        commonMistakes: [],
        teachingNotes: [],
        relatedVocabulary: [],
        etymologyInfo: undefined
      };
    }
  }

  /**
   * Add cultural and historical context
   */
  private async addCulturalContext(vocab: VocabCandidate): Promise<CulturalContext | undefined> {
    // Only add cultural context for culturally significant words
    const culturalWords = ['imperium', 'consul', 'senator', 'gladiator', 'villa', 'forum', 'thermae', 'amphitheatrum'];

    if (!culturalWords.some(word => vocab.lemma?.includes(word) || vocab.word.includes(word))) {
      return undefined;
    }

    // In production, this would query a cultural database
    // For now, provide basic cultural context for key terms
    const culturalData = {
      'imperium': {
        historicalPeriod: 'Roman Republic and Empire',
        culturalSignificance: 'Supreme executive power held by consuls and emperors',
        socialContext: 'Central to Roman political structure'
      },
      'gladiator': {
        historicalPeriod: 'Roman Republic and Empire',
        culturalSignificance: 'Professional fighters in arena entertainment',
        socialContext: 'Often slaves or criminals, some achieved fame'
      }
    };

    const baseWord = vocab.lemma || vocab.word;
    const contextData = culturalData[baseWord as keyof typeof culturalData];

    if (contextData) {
      return {
        historicalPeriod: contextData.historicalPeriod,
        culturalSignificance: contextData.culturalSignificance,
        socialContext: contextData.socialContext
      };
    }

    return undefined;
  }

  // Utility methods
  private inferMajorPOS(partOfSpeech: string): 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' {
    const pos = partOfSpeech.toLowerCase();
    if (pos.includes('noun')) return 'noun';
    if (pos.includes('verb')) return 'verb';
    if (pos.includes('adjective')) return 'adjective';
    if (pos.includes('adverb')) return 'adverb';
    if (pos.includes('pronoun')) return 'pronoun';
    if (pos.includes('preposition')) return 'preposition';
    if (pos.includes('conjunction')) return 'conjunction';
    return 'noun'; // default
  }

  private calculatePedagogicalFrequency(lemma: string, corpusFrequency: number): number {
    // Pedagogical frequency might be higher than corpus frequency for teaching purposes
    const pedagogicalBoost = {
      // Words emphasized in teaching
      'sum': 1.5, 'habeo': 1.4, 'amo': 1.3, 'laudo': 1.3,
      'puella': 1.5, 'agricola': 1.4, 'nauta': 1.3
    };

    const boost = pedagogicalBoost[lemma as keyof typeof pedagogicalBoost] || 1.0;
    return Math.round(corpusFrequency * boost);
  }

  private categorizeFrequency(frequency: number): 'very_high' | 'high' | 'medium' | 'low' | 'very_low' {
    if (frequency >= 500) return 'very_high';
    if (frequency >= 200) return 'high';
    if (frequency >= 100) return 'medium';
    if (frequency >= 50) return 'low';
    return 'very_low';
  }

  private inferUsageContexts(lemma: string): string[] {
    // Basic context inference
    const contexts: Record<string, string[]> = {
      'imperium': ['political', 'official'],
      'bellum': ['military', 'historical'],
      'amor': ['literary', 'emotional'],
      'deus': ['religious', 'mythological'],
      'ars': ['cultural', 'intellectual'],
      'default': ['general']
    };

    return contexts[lemma] || contexts.default;
  }

  private inferDifficultyLevel(vocab: VocabCandidate): 'basic' | 'intermediate' | 'advanced' {
    const basicWords = ['sum', 'habeo', 'amo', 'laudo', 'puella', 'rosa', 'via'];
    const advancedWords = ['imperium', 'philosophia', 'rhetorica', 'architectura'];

    const word = vocab.lemma || vocab.word;
    if (basicWords.includes(word)) return 'basic';
    if (advancedWords.includes(word)) return 'advanced';
    return 'intermediate';
  }
}

// Export enhanced vocabulary types and processor
export { LatinVocabularyEnhancer, LatinVocabularyAnalysis };
```

#### 2. Vocabulary Analysis Database Schema (`supabase/migrations/20241112_enhanced_vocabulary.sql`)

**NEW FILE - Enhanced vocabulary storage**

```sql
-- Enhanced vocabulary table for Latin-specific data
CREATE TABLE enhanced_latin_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_vocabulary_id UUID REFERENCES lesson_vocabulary(id) ON DELETE CASCADE,

    -- Morphological data
    morphology_data JSONB NOT NULL,

    -- Frequency analysis
    corpus_frequency INTEGER,
    pedagogical_frequency INTEGER,
    relative_frequency TEXT CHECK (relative_frequency IN ('very_high', 'high', 'medium', 'low', 'very_low')),
    frequency_rank INTEGER,
    usage_contexts TEXT[],

    -- Pedagogical metadata
    difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
    teaching_priority INTEGER CHECK (teaching_priority >= 1 AND teaching_priority <= 10),
    common_mistakes TEXT[],
    teaching_notes TEXT[],
    related_vocabulary TEXT[],

    -- Dictionary enrichment
    alternative_definitions TEXT[],
    usage_examples JSONB, -- Array of example objects
    synonyms TEXT[],
    antonyms TEXT[],
    derived_words TEXT[],
    compounds TEXT[],

    -- Etymology
    etymology_data JSONB,

    -- Cultural context
    cultural_context JSONB,

    -- Quality and validation
    enhancement_quality_score DECIMAL(3,2),
    expert_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,

    -- Tracking
    enhanced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enhancement_version TEXT DEFAULT 'v1.0'
);

-- Vocabulary frequency corpus table
CREATE TABLE latin_frequency_corpus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lemma TEXT NOT NULL UNIQUE,

    -- Frequency data from different sources
    classical_frequency INTEGER DEFAULT 0,
    medieval_frequency INTEGER DEFAULT 0,
    pedagogical_frequency INTEGER DEFAULT 0,
    modern_frequency INTEGER DEFAULT 0,

    -- Corpus metadata
    total_occurrences INTEGER DEFAULT 0,
    corpus_size INTEGER DEFAULT 0,
    frequency_per_million DECIMAL(10,4),

    -- Usage patterns
    common_collocations TEXT[],
    typical_contexts TEXT[],
    register_levels TEXT[], -- formal, informal, literary, technical

    -- Source tracking
    corpus_sources TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Morphological patterns table
CREATE TABLE latin_morphological_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lemma TEXT NOT NULL,

    -- Pattern data
    declension_pattern INTEGER,
    conjugation_pattern INTEGER,
    irregular_forms JSONB,
    stem_variations JSONB,

    -- Morphological features
    principal_parts TEXT[],
    morphological_category TEXT,
    special_notes TEXT,

    -- Pedagogical information
    teaching_difficulty INTEGER CHECK (teaching_difficulty >= 1 AND teaching_difficulty <= 10),
    common_confusions TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary enhancement performance metrics
CREATE TABLE vocabulary_enhancement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Enhancement batch information
    lesson_id UUID REFERENCES lessons(id),
    vocabulary_count INTEGER NOT NULL,
    enhancement_type TEXT NOT NULL,

    -- Performance data
    total_processing_time_ms INTEGER NOT NULL,
    average_time_per_word DECIMAL(8,2),

    -- LLM usage
    llm_calls_made INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,

    -- Quality metrics
    enhancements_generated INTEGER NOT NULL,
    enhancements_validated INTEGER DEFAULT 0,
    average_quality_score DECIMAL(3,2),

    -- Success rates by enhancement type
    morphology_success_rate DECIMAL(3,2),
    frequency_success_rate DECIMAL(3,2),
    pedagogical_success_rate DECIMAL(3,2),
    dictionary_success_rate DECIMAL(3,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_enhanced_vocab_lesson_vocab ON enhanced_latin_vocabulary(lesson_vocabulary_id);
CREATE INDEX idx_enhanced_vocab_difficulty ON enhanced_latin_vocabulary(difficulty_level);
CREATE INDEX idx_enhanced_vocab_priority ON enhanced_latin_vocabulary(teaching_priority);
CREATE INDEX idx_enhanced_vocab_frequency ON enhanced_latin_vocabulary(relative_frequency);
CREATE INDEX idx_frequency_corpus_lemma ON latin_frequency_corpus(lemma);
CREATE INDEX idx_frequency_corpus_classical ON latin_frequency_corpus(classical_frequency DESC);
CREATE INDEX idx_morphological_patterns_lemma ON latin_morphological_patterns(lemma);
CREATE INDEX idx_enhancement_metrics_lesson ON vocabulary_enhancement_metrics(lesson_id);

-- Views for common queries
CREATE VIEW vocabulary_teaching_priority AS
SELECT
    lv.lesson_id,
    lv.word,
    lv.lemma,
    lv.definition,
    elv.teaching_priority,
    elv.difficulty_level,
    elv.corpus_frequency,
    elv.relative_frequency,
    ARRAY_LENGTH(elv.common_mistakes, 1) as mistake_count,
    ARRAY_LENGTH(elv.teaching_notes, 1) as note_count
FROM lesson_vocabulary lv
JOIN enhanced_latin_vocabulary elv ON lv.id = elv.lesson_vocabulary_id
WHERE elv.teaching_priority >= 7
ORDER BY elv.teaching_priority DESC, elv.corpus_frequency DESC;

CREATE VIEW frequency_analysis_summary AS
SELECT
    lfc.lemma,
    lfc.classical_frequency,
    lfc.pedagogical_frequency,
    lfc.frequency_per_million,
    COUNT(elv.id) as usage_in_lessons,
    AVG(elv.teaching_priority) as avg_teaching_priority
FROM latin_frequency_corpus lfc
LEFT JOIN enhanced_latin_vocabulary elv ON lfc.lemma = ANY(string_to_array(elv.morphology_data->>'lemma', ' '))
GROUP BY lfc.id
ORDER BY lfc.classical_frequency DESC;

-- Functions for data maintenance
CREATE OR REPLACE FUNCTION update_frequency_rank()
RETURNS TRIGGER AS $$
BEGIN
    -- Update frequency rank when classical_frequency changes
    UPDATE latin_frequency_corpus
    SET frequency_rank = (
        SELECT COUNT(*) + 1
        FROM latin_frequency_corpus lfc2
        WHERE lfc2.classical_frequency > NEW.classical_frequency
    )
    WHERE lemma = NEW.lemma;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_frequency_rank_trigger
    AFTER INSERT OR UPDATE OF classical_frequency ON latin_frequency_corpus
    FOR EACH ROW EXECUTE FUNCTION update_frequency_rank();
```

#### 3. Integration with Latin Language Processor (`lib/content-generation/tools/latin-language-processor.ts`)

**MODIFY EXISTING FILE - Add vocabulary enhancement integration**

```typescript
// Add to existing LatinLanguageProcessor class

import { LatinVocabularyEnhancer, LatinVocabularyAnalysis } from './latin-vocabulary-enhancer';

export class LatinLanguageProcessor extends BaseLanguageProcessor {
  // ... existing code ...

  private vocabularyEnhancer: LatinVocabularyEnhancer;

  constructor() {
    super();
    this.vocabularyEnhancer = new LatinVocabularyEnhancer();
  }

  async extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]> {
    const startTime = Date.now();

    try {
      // Get basic vocabulary extraction (existing logic)
      const basicVocabulary = await this.extractVocabularyWithLLM(text, options);

      // Enhance vocabulary if morphology is requested
      if (options.includeMorphology) {
        const enhanced = await this.vocabularyEnhancer.enhanceVocabulary(
          basicVocabulary,
          text,
          {
            includeCulturalContext: true,
            includeEtymology: false,
            maxEnhancementsPerWord: options.maxItems,
            prioritizeByFrequency: true
          }
        );

        // Convert enhanced vocabulary back to standard format
        return enhanced.map(this.convertEnhancedToStandard);
      }

      return basicVocabulary;

    } catch (error) {
      this.logProcessingMetrics('vocabulary', Date.now() - startTime, false, error.message);
      throw error;
    }
  }

  private convertEnhancedToStandard(enhanced: LatinVocabularyAnalysis): VocabCandidate {
    return {
      word: enhanced.word,
      lemma: enhanced.lemma,
      definition: enhanced.dictionaryData.primaryDefinition,
      partOfSpeech: enhanced.morphology.partOfSpeech.major,
      frequency: enhanced.frequencyData.corpusFrequency,
      difficulty: enhanced.pedagogicalInfo.difficultyLevel,
      morphology: enhanced.morphology.morphologicalFeatures,
      examples: enhanced.dictionaryData.usageExamples.map(ex => ex.english)
    };
  }

  /**
   * Get detailed vocabulary analysis for teaching purposes
   */
  async getDetailedVocabularyAnalysis(text: string): Promise<LatinVocabularyAnalysis[]> {
    const basicVocab = await this.extractVocabularyWithLLM(text, {
      maxItems: 20,
      includeFrequency: true,
      includeMorphology: true
    });

    return await this.vocabularyEnhancer.enhanceVocabulary(basicVocab, text, {
      includeCulturalContext: true,
      includeEtymology: true,
      prioritizeByFrequency: true
    });
  }
}
```

### Performance Monitoring

```typescript
// Vocabulary enhancement performance monitor
export class VocabularyEnhancementMonitor {
  private enhancementTimes: number[] = [];
  private qualityScores: number[] = [];

  recordEnhancement(processingTime: number, qualityScore: number, vocabularyCount: number): void {
    this.enhancementTimes.push(processingTime / vocabularyCount); // Per word time
    this.qualityScores.push(qualityScore);
  }

  getPerformanceReport(): {
    avgTimePerWord: number;
    avgQualityScore: number;
    enhancementCount: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
  } {
    const avgTimePerWord = this.enhancementTimes.reduce((a, b) => a + b, 0) / this.enhancementTimes.length;
    const avgQualityScore = this.qualityScores.reduce((a, b) => a + b, 0) / this.qualityScores.length;

    // Simple trend analysis
    const recentScores = this.qualityScores.slice(-5);
    const earlierScores = this.qualityScores.slice(-10, -5);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > earlierAvg + 0.1) trend = 'improving';
    else if (recentAvg < earlierAvg - 0.1) trend = 'declining';

    return {
      avgTimePerWord,
      avgQualityScore,
      enhancementCount: this.enhancementTimes.length,
      performanceTrend: trend
    };
  }
}
```

### Acceptance Criteria

- [ ] **Morphological Analysis**: 95%+ accuracy in morphological feature identification
- [ ] **Frequency Data**: Accurate frequency rankings for 500+ common Latin words
- [ ] **Pedagogical Value**: Teaching priority scores align with Latin curriculum standards
- [ ] **Dictionary Integration**: Enhanced definitions from Latin dictionary service
- [ ] **Cultural Context**: Appropriate cultural information for relevant vocabulary
- [ ] **Performance**: <1s additional processing time per vocabulary enhancement
- [ ] **Data Quality**: Expert validation rate >90% for enhanced vocabulary
- [ ] **Coverage**: Morphological analysis covers all major Latin word classes

### Testing Strategy

```typescript
// Test suite for vocabulary enhancement
describe('LatinVocabularyEnhancer', () => {
  const enhancer = new LatinVocabularyEnhancer();

  test('should enhance vocabulary with morphological data', async () => {
    const basicVocab = [
      { word: 'puellam', lemma: 'puella', definition: 'girl', partOfSpeech: 'noun' }
    ];

    const enhanced = await enhancer.enhanceVocabulary(basicVocab, 'Poeta puellam amat.');

    expect(enhanced[0].morphology.morphologicalFeatures.case).toBe('accusative');
    expect(enhanced[0].morphology.morphologicalFeatures.number).toBe('singular');
    expect(enhanced[0].morphology.morphologicalFeatures.gender).toBe('feminine');
  });

  test('should provide frequency analysis', async () => {
    const basicVocab = [
      { word: 'sum', lemma: 'sum', definition: 'I am', partOfSpeech: 'verb' }
    ];

    const enhanced = await enhancer.enhanceVocabulary(basicVocab, 'Sum discipulus.');

    expect(enhanced[0].frequencyData.relativeFrequency).toBe('very_high');
    expect(enhanced[0].frequencyData.corpusFrequency).toBeGreaterThan(500);
  });

  test('should generate pedagogical metadata', async () => {
    const basicVocab = [
      { word: 'imperium', lemma: 'imperium', definition: 'command, empire', partOfSpeech: 'noun' }
    ];

    const enhanced = await enhancer.enhanceVocabulary(basicVocab, 'Romanum imperium magnum erat.');

    expect(enhanced[0].pedagogicalInfo.teachingPriority).toBeGreaterThan(5);
    expect(enhanced[0].culturalContext).toBeDefined();
    expect(enhanced[0].culturalContext?.historicalPeriod).toContain('Roman');
  });
});
```

### Risk Mitigation

**Data Quality**:
- Expert validation workflow for enhanced vocabulary
- Quality scoring system for automatic validation
- Fallback to basic vocabulary if enhancement fails

**Performance**:
- Caching for morphological analysis and frequency data
- Batch processing for vocabulary enhancement
- Timeout handling for LLM-based processing

**Accuracy**:
- Cross-validation with multiple Latin resources
- Expert review of morphological patterns
- Continuous monitoring of enhancement quality