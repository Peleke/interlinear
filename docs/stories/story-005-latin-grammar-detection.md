# STORY 005: Latin Grammar Concept Detection

**Story ID**: STORY-005
**Points**: 3
**Priority**: High
**Epic**: EPIC-LATIN-002
**Security Impact**: Low - Extends existing secure LLM infrastructure
**Performance Impact**: <3s additional processing for grammar analysis

## User Story

**As a** Latin educator
**I want** to automatically identify grammar concepts in Latin texts
**So that** I can teach specific constructions found in the reading

## Technical Implementation

### File-by-File Specification

#### 1. Latin Grammar Detection Engine (`lib/content-generation/tools/latin-grammar-detector.ts`)

**NEW FILE - 600 lines**

```typescript
import { z } from 'zod';
import { llmIntegrationService } from '../services/llm-integration';
import { GrammarConcept, LatinMorphologyAnalysis } from '../interfaces/language-processor';

// Schema for validating LLM responses
const LatinGrammarDetectionSchema = z.object({
  concepts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(['syntax', 'morphology', 'style', 'historical']),
    complexity: z.enum(['basic', 'intermediate', 'advanced']),
    textEvidence: z.string(),
    explanation: z.string(),
    examples: z.array(z.object({
      latin: z.string(),
      english: z.string(),
      analysis: z.string(),
      pedagogicalNote: z.string().optional()
    })),
    relatedConcepts: z.array(z.string()).default([]),
    commonMistakes: z.array(z.string()).default([]),
    pedagogicalPriority: z.number().min(1).max(10).default(5)
  }))
});

// Grammar concept detector interface
export interface GrammarDetector {
  readonly conceptId: string;
  readonly category: 'syntax' | 'morphology' | 'style' | 'historical';
  readonly complexity: 'basic' | 'intermediate' | 'advanced';

  detect(text: string, vocabulary: LatinMorphologyAnalysis[]): Promise<GrammarMatch[]>;
  buildConcept(matches: GrammarMatch[]): Promise<GrammarConcept>;
}

export interface GrammarMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  analysis: string;
  pedagogicalNote?: string;
}

/**
 * Main Latin Grammar Detection Engine
 * Orchestrates multiple specialized detectors for different grammar concepts
 */
export class LatinGrammarDetector {
  private readonly detectors: Map<string, GrammarDetector>;
  private readonly conceptWeights: Map<string, number>;

  constructor() {
    this.detectors = this.initializeDetectors();
    this.conceptWeights = this.initializeWeights();
  }

  async detectAllConcepts(
    text: string,
    vocabulary: LatinMorphologyAnalysis[],
    options: {
      maxConcepts?: number;
      complexityFilter?: 'basic' | 'intermediate' | 'advanced' | 'all';
      categoryFilter?: string[];
      minimumConfidence?: number;
    } = {}
  ): Promise<GrammarConcept[]> {

    const {
      maxConcepts = 10,
      complexityFilter = 'all',
      categoryFilter = [],
      minimumConfidence = 0.7
    } = options;

    const concepts: GrammarConcept[] = [];
    const detectionPromises: Promise<GrammarConcept | null>[] = [];

    // Run detectors in parallel for performance
    for (const [conceptId, detector] of this.detectors) {
      // Apply filters
      if (complexityFilter !== 'all' && detector.complexity !== complexityFilter) {
        continue;
      }

      if (categoryFilter.length > 0 && !categoryFilter.includes(detector.category)) {
        continue;
      }

      const detectionPromise = this.runDetector(detector, text, vocabulary, minimumConfidence);
      detectionPromises.push(detectionPromise);
    }

    // Wait for all detections to complete
    const detectionResults = await Promise.all(detectionPromises);

    // Filter out null results and sort by pedagogical priority
    const validConcepts = detectionResults
      .filter((concept): concept is GrammarConcept => concept !== null)
      .sort((a, b) => this.comparePedagogicalPriority(a, b));

    return validConcepts.slice(0, maxConcepts);
  }

  private async runDetector(
    detector: GrammarDetector,
    text: string,
    vocabulary: LatinMorphologyAnalysis[],
    minimumConfidence: number
  ): Promise<GrammarConcept | null> {
    try {
      const matches = await detector.detect(text, vocabulary);

      // Filter by confidence threshold
      const highConfidenceMatches = matches.filter(match => match.confidence >= minimumConfidence);

      if (highConfidenceMatches.length === 0) {
        return null;
      }

      const concept = await detector.buildConcept(highConfidenceMatches);
      return concept;

    } catch (error) {
      console.error(`Grammar detector ${detector.conceptId} failed:`, error);
      return null;
    }
  }

  private comparePedagogicalPriority(a: GrammarConcept, b: GrammarConcept): number {
    const weightA = this.conceptWeights.get(a.id) || 5;
    const weightB = this.conceptWeights.get(b.id) || 5;

    // Higher weight = higher priority
    return weightB - weightA;
  }

  private initializeDetectors(): Map<string, GrammarDetector> {
    return new Map([
      ['ablative_absolute', new AblativeAbsoluteDetector()],
      ['indirect_statement', new IndirectStatementDetector()],
      ['relative_clause', new RelativeClauseDetector()],
      ['purpose_clause', new PurposeClauseDetector()],
      ['result_clause', new ResultClauseDetector()],
      ['participial_phrase', new ParticipialPhraseDetector()],
      ['passive_periphrastic', new PassivePeriphrasticDetector()],
      ['subjunctive_sequence', new SubjunctiveSequenceDetector()],
      ['conditional_statement', new ConditionalStatementDetector()],
      ['case_usage_patterns', new CaseUsageDetector()],
      ['deponent_verbs', new DeponentVerbDetector()],
      ['irregular_verbs', new IrregularVerbDetector()]
    ]);
  }

  private initializeWeights(): Map<string, number> {
    // Pedagogical priority weights (1-10, higher is more important)
    return new Map([
      ['ablative_absolute', 9],
      ['indirect_statement', 8],
      ['relative_clause', 7],
      ['purpose_clause', 8],
      ['result_clause', 7],
      ['participial_phrase', 6],
      ['passive_periphrastic', 7],
      ['subjunctive_sequence', 6],
      ['conditional_statement', 5],
      ['case_usage_patterns', 8],
      ['deponent_verbs', 6],
      ['irregular_verbs', 7]
    ]);
  }
}

/**
 * Ablative Absolute Construction Detector
 * Identifies participial constructions in ablative case expressing time, cause, condition
 */
class AblativeAbsoluteDetector implements GrammarDetector {
  readonly conceptId = 'ablative_absolute';
  readonly category = 'syntax';
  readonly complexity = 'intermediate';

  async detect(text: string, vocabulary: LatinMorphologyAnalysis[]): Promise<GrammarMatch[]> {
    const matches: GrammarMatch[] = [];

    // Use LLM for sophisticated pattern recognition
    const prompt = `
    Identify ablative absolute constructions in this Latin text: "${text}"

    An ablative absolute consists of:
    1. A noun or pronoun in ablative case
    2. A participle (present, perfect, or future) agreeing in ablative
    3. Expresses time, cause, condition, or concession
    4. Is grammatically independent from the main clause

    Vocabulary context: ${JSON.stringify(vocabulary.slice(0, 20))}

    For each construction found, provide:
    - Exact Latin text of the construction
    - Position in original text (start and end character indices)
    - Analysis explaining the grammatical relationship
    - Function (temporal, causal, conditional, concessive)
    - Confidence score (0.0-1.0)

    Return as JSON:
    {
      "matches": [
        {
          "text": "ablative absolute phrase",
          "startIndex": 0,
          "endIndex": 20,
          "confidence": 0.95,
          "analysis": "detailed grammatical analysis",
          "function": "temporal/causal/conditional/concessive"
        }
      ]
    }`;

    try {
      const response = await llmIntegrationService.generateCompletion({
        messages: [
          { role: 'system', content: 'You are an expert Latin grammarian identifying syntactic patterns.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        temperature: 0.1,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.content);

      if (parsed.matches && Array.isArray(parsed.matches)) {
        for (const match of parsed.matches) {
          if (this.validateMatch(match)) {
            matches.push({
              text: match.text,
              startIndex: match.startIndex,
              endIndex: match.endIndex,
              confidence: match.confidence,
              analysis: match.analysis,
              pedagogicalNote: `Ablative absolute expressing ${match.function || 'circumstance'}`
            });
          }
        }
      }

    } catch (error) {
      console.error('Ablative absolute detection failed:', error);
    }

    return matches;
  }

  async buildConcept(matches: GrammarMatch[]): Promise<GrammarConcept> {
    const examples = matches.slice(0, 3).map(match => ({
      text: match.text,
      translation: '', // Would be filled by translation service
      explanation: match.analysis
    }));

    return {
      id: this.conceptId,
      name: 'Ablative Absolute',
      description: 'A grammatically independent construction in the ablative case, typically consisting of a noun and participle, expressing time, cause, condition, or concession.',
      category: this.category,
      complexity: this.complexity,
      examples,
      relatedConcepts: ['participial_phrase', 'ablative_case_usage'],
      textEvidence: matches.map(m => m.text).join('; ')
    };
  }

  private validateMatch(match: any): boolean {
    return (
      typeof match.text === 'string' &&
      typeof match.startIndex === 'number' &&
      typeof match.endIndex === 'number' &&
      typeof match.confidence === 'number' &&
      match.confidence >= 0 && match.confidence <= 1 &&
      typeof match.analysis === 'string'
    );
  }
}

/**
 * Indirect Statement (Accusative + Infinitive) Detector
 */
class IndirectStatementDetector implements GrammarDetector {
  readonly conceptId = 'indirect_statement';
  readonly category = 'syntax';
  readonly complexity = 'intermediate';

  async detect(text: string, vocabulary: LatinMorphologyAnalysis[]): Promise<GrammarMatch[]> {
    const prompt = `
    Identify indirect statement constructions (accusative + infinitive) in this Latin text: "${text}"

    Look for patterns where:
    1. A verb of speaking, thinking, or perceiving (e.g., dico, puto, video)
    2. Is followed by an accusative noun/pronoun (subject of indirect statement)
    3. And an infinitive verb (predicate of indirect statement)
    4. The construction reports what someone said, thought, or perceived

    Common verbs: dico, audio, puto, scio, video, sentio, intellego, narro, etc.

    Vocabulary context: ${JSON.stringify(vocabulary.slice(0, 20))}

    Return as JSON with matches array.`;

    // Implementation similar to AblativeAbsoluteDetector...
    return this.processLLMResponse(prompt);
  }

  async buildConcept(matches: GrammarMatch[]): Promise<GrammarConcept> {
    return {
      id: this.conceptId,
      name: 'Indirect Statement',
      description: 'A construction using accusative + infinitive to report what someone said, thought, or perceived, commonly following verbs of speaking, thinking, or perceiving.',
      category: this.category,
      complexity: this.complexity,
      examples: matches.slice(0, 3).map(match => ({
        text: match.text,
        translation: '',
        explanation: match.analysis
      })),
      relatedConcepts: ['accusative_case', 'infinitive_usage', 'reported_speech'],
      textEvidence: matches.map(m => m.text).join('; ')
    };
  }

  private async processLLMResponse(prompt: string): Promise<GrammarMatch[]> {
    // Shared implementation for LLM response processing
    try {
      const response = await llmIntegrationService.generateCompletion({
        messages: [
          { role: 'system', content: 'You are an expert Latin grammarian identifying syntactic patterns.' },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        temperature: 0.1,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.content);
      return this.parseMatches(parsed);

    } catch (error) {
      console.error(`Grammar detection failed for ${this.conceptId}:`, error);
      return [];
    }
  }

  private parseMatches(parsed: any): GrammarMatch[] {
    const matches: GrammarMatch[] = [];

    if (parsed.matches && Array.isArray(parsed.matches)) {
      for (const match of parsed.matches) {
        if (this.validateMatch(match)) {
          matches.push({
            text: match.text,
            startIndex: match.startIndex,
            endIndex: match.endIndex,
            confidence: match.confidence,
            analysis: match.analysis,
            pedagogicalNote: match.pedagogicalNote
          });
        }
      }
    }

    return matches;
  }

  private validateMatch(match: any): boolean {
    return (
      typeof match.text === 'string' &&
      typeof match.analysis === 'string' &&
      typeof match.confidence === 'number' &&
      match.confidence >= 0 && match.confidence <= 1
    );
  }
}

/**
 * Purpose Clause Detector (ut + subjunctive)
 */
class PurposeClauseDetector implements GrammarDetector {
  readonly conceptId = 'purpose_clause';
  readonly category = 'syntax';
  readonly complexity = 'intermediate';

  async detect(text: string, vocabulary: LatinMorphologyAnalysis[]): Promise<GrammarMatch[]> {
    const prompt = `
    Identify purpose clauses in this Latin text: "${text}"

    Purpose clauses:
    1. Usually introduced by "ut" (positive) or "ne" (negative)
    2. Use subjunctive mood
    3. Express the purpose or intention of the main action
    4. Answer "why?" or "for what purpose?"

    Look for:
    - "ut + subjunctive" for positive purpose
    - "ne + subjunctive" for negative purpose (to prevent)
    - Relative clauses of purpose (qui + subjunctive)

    Vocabulary context: ${JSON.stringify(vocabulary.slice(0, 20))}

    Return as JSON with matches array.`;

    return this.processLLMResponse(prompt);
  }

  async buildConcept(matches: GrammarMatch[]): Promise<GrammarConcept> {
    return {
      id: this.conceptId,
      name: 'Purpose Clause',
      description: 'A subordinate clause, typically introduced by "ut" (positive) or "ne" (negative) with subjunctive mood, expressing the purpose or intention of the main action.',
      category: this.category,
      complexity: this.complexity,
      examples: matches.slice(0, 3).map(match => ({
        text: match.text,
        translation: '',
        explanation: match.analysis
      })),
      relatedConcepts: ['subjunctive_mood', 'subordinate_clauses', 'result_clause'],
      textEvidence: matches.map(m => m.text).join('; ')
    };
  }

  private async processLLMResponse(prompt: string): Promise<GrammarMatch[]> {
    // Shared implementation...
    return [];
  }
}

/**
 * Case Usage Pattern Detector
 * Identifies significant uses of cases (ablative of means, dative of interest, etc.)
 */
class CaseUsageDetector implements GrammarDetector {
  readonly conceptId = 'case_usage_patterns';
  readonly category = 'morphology';
  readonly complexity = 'basic';

  async detect(text: string, vocabulary: LatinMorphologyAnalysis[]): Promise<GrammarMatch[]> {
    // Focus on vocabulary with interesting case usage
    const caseVocabulary = vocabulary.filter(v =>
      v.morphology?.case && v.morphology.case !== 'nominative'
    );

    if (caseVocabulary.length === 0) {
      return [];
    }

    const prompt = `
    Analyze interesting case usage patterns in this Latin text: "${text}"

    Focus on non-nominative case usage that demonstrates important grammatical concepts:

    ABLATIVE USES:
    - Ablative of means/instrument (without preposition)
    - Ablative of manner (cum + ablative or ablative alone)
    - Ablative of time when
    - Ablative of place where (with preposition)

    DATIVE USES:
    - Dative of interest/advantage
    - Dative with special verbs (faveo, parco, impero, etc.)
    - Dative of possession

    GENITIVE USES:
    - Genitive of possession
    - Objective/subjective genitive
    - Partitive genitive

    ACCUSATIVE USES:
    - Direct object (standard)
    - Accusative of time how long
    - Accusative of place to which

    Relevant vocabulary: ${JSON.stringify(caseVocabulary)}

    Identify specific instances where case usage demonstrates these concepts.

    Return as JSON with matches array.`;

    return this.processLLMResponse(prompt);
  }

  async buildConcept(matches: GrammarMatch[]): Promise<GrammarConcept> {
    return {
      id: this.conceptId,
      name: 'Case Usage Patterns',
      description: 'Specific uses of Latin cases (nominative, genitive, dative, accusative, ablative, vocative) that express particular relationships and meanings beyond basic subject-object patterns.',
      category: this.category,
      complexity: this.complexity,
      examples: matches.slice(0, 4).map(match => ({
        text: match.text,
        translation: '',
        explanation: match.analysis
      })),
      relatedConcepts: ['noun_declension', 'prepositions', 'verb_complementation'],
      textEvidence: matches.map(m => m.text).join('; ')
    };
  }

  private async processLLMResponse(prompt: string): Promise<GrammarMatch[]> {
    // Implementation...
    return [];
  }
}

// Additional detector classes would follow similar patterns...

/**
 * Grammar Concept Validation and Quality Assurance
 */
export class LatinGrammarValidator {
  static validateConcepts(concepts: GrammarConcept[]): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    for (const concept of concepts) {
      // Validate required fields
      if (!concept.id) issues.push('Missing concept ID');
      if (!concept.name) issues.push('Missing concept name');
      if (!concept.description) issues.push(`Missing description for ${concept.name}`);
      if (!concept.textEvidence) issues.push(`No text evidence for ${concept.name}`);

      // Validate examples
      if (!concept.examples || concept.examples.length === 0) {
        suggestions.push(`Add examples for ${concept.name}`);
      } else {
        for (const example of concept.examples) {
          if (!example.text) issues.push(`Empty example text in ${concept.name}`);
          if (!example.explanation) issues.push(`Missing explanation in ${concept.name} example`);
        }
      }

      // Validate complexity appropriateness
      if (concept.complexity === 'basic' && concept.name.includes('absolute')) {
        suggestions.push(`${concept.name} might be too complex for 'basic' level`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }

  static prioritizeConcepts(concepts: GrammarConcept[]): GrammarConcept[] {
    // Sort by pedagogical importance and complexity
    return concepts.sort((a, b) => {
      const complexityOrder = { basic: 1, intermediate: 2, advanced: 3 };
      const priorityOrder = {
        'case_usage_patterns': 1,
        'indirect_statement': 2,
        'ablative_absolute': 3,
        'purpose_clause': 4,
        'relative_clause': 5
      };

      const priorityA = priorityOrder[a.id as keyof typeof priorityOrder] || 10;
      const priorityB = priorityOrder[b.id as keyof typeof priorityOrder] || 10;

      if (priorityA !== priorityB) return priorityA - priorityB;

      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });
  }
}

// Export main detector and utilities
export { LatinGrammarDetector, LatinGrammarValidator };
```

#### 2. Grammar Concept Database Schema (`supabase/migrations/20241112_latin_grammar_concepts.sql`)

**NEW FILE - Database schema for Latin grammar concepts**

```sql
-- Create enum for grammar concept categories
CREATE TYPE grammar_concept_category AS ENUM ('syntax', 'morphology', 'style', 'historical');

-- Create enum for complexity levels
CREATE TYPE complexity_level AS ENUM ('basic', 'intermediate', 'advanced');

-- Main table for grammar concepts
CREATE TABLE latin_grammar_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

    -- Concept identification
    concept_id TEXT NOT NULL, -- e.g., 'ablative_absolute', 'indirect_statement'
    concept_name TEXT NOT NULL,
    category grammar_concept_category NOT NULL,
    complexity complexity_level NOT NULL,

    -- Content
    description TEXT NOT NULL,
    text_evidence TEXT NOT NULL,
    explanation TEXT,

    -- Pedagogical metadata
    pedagogical_priority INTEGER DEFAULT 5 CHECK (pedagogical_priority >= 1 AND pedagogical_priority <= 10),
    estimated_study_time INTEGER, -- in minutes
    prerequisites TEXT[], -- array of prerequisite concept IDs

    -- Quality metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    detection_method TEXT DEFAULT 'llm_analysis',

    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Examples table for grammar concepts
CREATE TABLE grammar_concept_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grammar_concept_id UUID REFERENCES latin_grammar_concepts(id) ON DELETE CASCADE,

    -- Example content
    latin_text TEXT NOT NULL,
    english_translation TEXT,
    grammatical_analysis TEXT NOT NULL,
    pedagogical_note TEXT,

    -- Context
    source_text TEXT, -- original context where found
    position_start INTEGER,
    position_end INTEGER,

    -- Metadata
    difficulty_level complexity_level DEFAULT 'intermediate',
    example_type TEXT DEFAULT 'authentic', -- 'authentic', 'constructed', 'modified'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Related concepts table (many-to-many)
CREATE TABLE grammar_concept_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id UUID REFERENCES latin_grammar_concepts(id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES latin_grammar_concepts(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('related', 'prerequisite', 'builds_on', 'contrasts_with')),
    strength INTEGER DEFAULT 1 CHECK (strength >= 1 AND strength <= 5),

    UNIQUE(source_concept_id, target_concept_id, relationship_type)
);

-- Common mistakes/misconceptions table
CREATE TABLE grammar_concept_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grammar_concept_id UUID REFERENCES latin_grammar_concepts(id) ON DELETE CASCADE,

    mistake_description TEXT NOT NULL,
    correction_explanation TEXT NOT NULL,
    example_incorrect TEXT,
    example_correct TEXT,
    frequency_score INTEGER DEFAULT 1 CHECK (frequency_score >= 1 AND frequency_score <= 10),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detection performance metrics
CREATE TABLE grammar_detection_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Detection context
    lesson_id UUID REFERENCES lessons(id),
    text_analyzed TEXT NOT NULL,
    text_length INTEGER NOT NULL,

    -- Results
    concepts_detected INTEGER NOT NULL,
    total_processing_time_ms INTEGER NOT NULL,
    llm_calls_made INTEGER NOT NULL,
    total_tokens_used INTEGER,

    -- Quality metrics
    average_confidence DECIMAL(3,2),
    concepts_validated INTEGER, -- manually validated concepts
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,

    -- System info
    model_version TEXT,
    detector_version TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_latin_grammar_lesson ON latin_grammar_concepts(lesson_id);
CREATE INDEX idx_latin_grammar_concept_id ON latin_grammar_concepts(concept_id);
CREATE INDEX idx_latin_grammar_category ON latin_grammar_concepts(category);
CREATE INDEX idx_latin_grammar_complexity ON latin_grammar_concepts(complexity);
CREATE INDEX idx_grammar_examples_concept ON grammar_concept_examples(grammar_concept_id);
CREATE INDEX idx_grammar_relationships_source ON grammar_concept_relationships(source_concept_id);
CREATE INDEX idx_grammar_relationships_target ON grammar_concept_relationships(target_concept_id);
CREATE INDEX idx_grammar_mistakes_concept ON grammar_concept_mistakes(grammar_concept_id);
CREATE INDEX idx_grammar_detection_metrics_lesson ON grammar_detection_metrics(lesson_id);
CREATE INDEX idx_grammar_detection_metrics_created ON grammar_detection_metrics(created_at);

-- Views for common queries
CREATE VIEW grammar_concept_summary AS
SELECT
    lgc.id,
    lgc.lesson_id,
    lgc.concept_id,
    lgc.concept_name,
    lgc.category,
    lgc.complexity,
    lgc.description,
    lgc.pedagogical_priority,
    COUNT(gce.id) as example_count,
    COUNT(gcm.id) as common_mistakes_count,
    lgc.confidence_score,
    lgc.created_at
FROM latin_grammar_concepts lgc
LEFT JOIN grammar_concept_examples gce ON lgc.id = gce.grammar_concept_id
LEFT JOIN grammar_concept_mistakes gcm ON lgc.id = gcm.grammar_concept_id
GROUP BY lgc.id;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_latin_grammar_concepts_updated_at
    BEFORE UPDATE ON latin_grammar_concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Integration with Latin Language Processor (`lib/content-generation/tools/latin-language-processor.ts`)

**MODIFY EXISTING FILE - Enhance with advanced grammar detection**

```typescript
// Add to existing LatinLanguageProcessor class

import { LatinGrammarDetector, LatinGrammarValidator } from './latin-grammar-detector';

export class LatinLanguageProcessor extends BaseLanguageProcessor {
  // ... existing code ...

  private grammarDetector: LatinGrammarDetector;

  constructor() {
    super();
    this.grammarDetector = new LatinGrammarDetector();
  }

  async identifyGrammar(text: string, options: GrammarOptions): Promise<GrammarConcept[]> {
    const startTime = Date.now();

    try {
      const validation = await this.validateInput(text);
      if (!validation.isValid) {
        throw this.createProcessingError(
          `Invalid input: ${validation.errors.join(', ')}`,
          'INVALID_INPUT',
          'grammar'
        );
      }

      // Get vocabulary context for grammar detection
      const vocabulary = await this.extractVocabulary(text, {
        maxItems: 30,
        includeFrequency: false,
        includeMorphology: true
      });

      // Use advanced grammar detector
      const detectedConcepts = await this.grammarDetector.detectAllConcepts(
        text,
        vocabulary as any, // Convert to LatinMorphologyAnalysis[]
        {
          maxConcepts: options.maxConcepts,
          complexityFilter: options.complexityLevel,
          minimumConfidence: 0.7
        }
      );

      // Validate and prioritize concepts
      const validation = LatinGrammarValidator.validateConcepts(detectedConcepts);
      if (!validation.valid) {
        console.warn('Grammar concept validation issues:', validation.issues);
      }

      const prioritizedConcepts = LatinGrammarValidator.prioritizeConcepts(detectedConcepts);

      // Log performance metrics
      this.logGrammarDetectionMetrics(
        text,
        prioritizedConcepts.length,
        Date.now() - startTime,
        true
      );

      return prioritizedConcepts;

    } catch (error) {
      this.logGrammarDetectionMetrics(text, 0, Date.now() - startTime, false, error.message);
      throw error;
    }
  }

  private async logGrammarDetectionMetrics(
    text: string,
    conceptsDetected: number,
    processingTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    // TODO: Save to grammar_detection_metrics table
    const metrics = {
      text_analyzed: text,
      text_length: text.length,
      concepts_detected: conceptsDetected,
      total_processing_time_ms: processingTime,
      llm_calls_made: this.getLLMCallCount(), // Track LLM usage
      success,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    };

    console.log('Latin grammar detection metrics:', metrics);
  }
}
```

### Performance Monitoring

```typescript
// Grammar detection performance monitor
export class GrammarDetectionMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordDetection(conceptId: string, processingTime: number, confidence: number): void {
    if (!this.metrics.has(conceptId)) {
      this.metrics.set(conceptId, []);
    }

    this.metrics.get(conceptId)!.push(processingTime);
  }

  getAverageProcessingTime(conceptId: string): number {
    const times = this.metrics.get(conceptId) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
  }

  getPerformanceReport(): Record<string, { avgTime: number; detectionCount: number }> {
    const report: Record<string, { avgTime: number; detectionCount: number }> = {};

    for (const [conceptId, times] of this.metrics) {
      report[conceptId] = {
        avgTime: this.getAverageProcessingTime(conceptId),
        detectionCount: times.length
      };
    }

    return report;
  }
}
```

### Acceptance Criteria

- [ ] **Concept Detection**: Detect 8/10 major grammar concepts in Caesar/Cicero texts
- [ ] **Accuracy**: 85%+ accuracy on expert-validated test corpus
- [ ] **Performance**: <3s additional processing time for grammar analysis
- [ ] **Pedagogical Quality**: Concepts prioritized by teaching importance
- [ ] **Examples**: Each concept includes 2-3 clear examples with analysis
- [ ] **Relationships**: Related concepts properly linked
- [ ] **Validation**: Built-in quality validation for detected concepts
- [ ] **Metrics**: Comprehensive performance and quality metrics

### Testing Strategy

```typescript
// Test suite for Latin grammar detection
describe('LatinGrammarDetector', () => {
  const detector = new LatinGrammarDetector();

  test('should detect ablative absolute in Caesar', async () => {
    const text = 'His rebus gestis, Caesar in Galliam profectus est.';
    const mockVocab: LatinMorphologyAnalysis[] = [
      { lemma: 'res', word: 'rebus', morphology: { case: 'ablative', number: 'plural' } },
      { lemma: 'gero', word: 'gestis', morphology: { case: 'ablative', participle: 'perfect' } }
    ];

    const concepts = await detector.detectAllConcepts(text, mockVocab);

    expect(concepts).toContainEqual(expect.objectContaining({
      id: 'ablative_absolute',
      name: 'Ablative Absolute',
      category: 'syntax'
    }));
  });

  test('should detect indirect statement patterns', async () => {
    const text = 'Caesar dicit hostes venire.';
    const concepts = await detector.detectAllConcepts(text, []);

    expect(concepts).toContainEqual(expect.objectContaining({
      id: 'indirect_statement',
      name: 'Indirect Statement'
    }));
  });

  test('should prioritize concepts by pedagogical importance', async () => {
    const concepts = await detector.detectAllConcepts(
      'Caesar, qui Galliam vincit, dicit hostes His rebus gestis venire.',
      []
    );

    // Case usage should come before complex syntax
    const caseUsageIndex = concepts.findIndex(c => c.id === 'case_usage_patterns');
    const ablativeIndex = concepts.findIndex(c => c.id === 'ablative_absolute');

    if (caseUsageIndex !== -1 && ablativeIndex !== -1) {
      expect(caseUsageIndex).toBeLessThan(ablativeIndex);
    }
  });
});
```

### Risk Mitigation

**Detection Accuracy**:
- Expert validation of test corpus
- Confidence thresholds for concept inclusion
- Human review workflow for generated concepts

**Performance**:
- Parallel detection processing
- Caching for repeated patterns
- Timeout handling for LLM calls

**Quality Control**:
- Built-in validation rules
- Pedagogical expert review
- Continuous monitoring of detection quality