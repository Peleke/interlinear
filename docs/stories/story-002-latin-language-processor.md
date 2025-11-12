# STORY 002: Latin Language Processor Implementation

**Story ID**: STORY-002
**Points**: 5
**Priority**: Critical
**Epic**: EPIC-LANG-001
**Security Impact**: High - New LLM API integration with user content
**Performance Impact**: <10s processing time for typical Latin lesson

## User Story

**As a** Latin educator
**I want** to extract vocabulary from Latin texts
**So that** I can create lessons from primary sources like Caesar

## Technical Implementation

### File-by-File Specification

#### 1. Latin Language Processor (`lib/content-generation/tools/latin-language-processor.ts`)

**NEW FILE - 400 lines**

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
import { openai } from '../../mastra/providers/openai';
import { latinDictionaryService } from '../../services/latin-dictionary';
import { z } from 'zod';

// Response schemas for LLM outputs
const LatinVocabResponseSchema = z.object({
  vocabulary: z.array(z.object({
    word: z.string(),
    lemma: z.string(),
    partOfSpeech: z.string(),
    definition: z.string(),
    morphology: z.object({
      case: z.string().optional(),
      number: z.string().optional(),
      gender: z.string().optional(),
      tense: z.string().optional(),
      mood: z.string().optional(),
      voice: z.string().optional(),
      person: z.string().optional()
    }).optional(),
    frequency: z.number().optional(),
    difficulty: z.enum(['basic', 'intermediate', 'advanced']).optional()
  }))
});

const LatinGrammarResponseSchema = z.object({
  concepts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    complexity: z.enum(['basic', 'intermediate', 'advanced']),
    examples: z.array(z.object({
      text: z.string(),
      translation: z.string().optional(),
      explanation: z.string()
    })),
    category: z.string(),
    textEvidence: z.string()
  }))
});

interface LatinProcessingCache {
  vocabulary: Map<string, VocabCandidate[]>;
  grammar: Map<string, GrammarConcept[]>;
  exercises: Map<string, Exercise[]>;
}

export class LatinLanguageProcessor extends BaseLanguageProcessor {
  readonly language = 'la' as const;
  readonly capabilities: ProcessingCapabilities = {
    vocabulary: true,
    grammar: true,
    exercises: true,
    morphology: true,
    syntaxAnalysis: true,
    customExerciseTypes: ['parsing', 'case_identification', 'translation_analysis', 'syntax_trees']
  };

  private cache: LatinProcessingCache = {
    vocabulary: new Map(),
    grammar: new Map(),
    exercises: new Map()
  };

  private readonly maxRetries = 3;
  private readonly timeoutMs = 30000; // 30 seconds

  async validateInput(text: string): Promise<ValidationResult> {
    const baseValidation = await super.validateInput(text);

    if (baseValidation.isValid) {
      // Latin-specific validation
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for basic Latin characteristics
      const latinChars = /^[a-zA-ZāēīōūĀĒĪŌŪæoeAE\s.,;:!?()[\]"-]+$/;
      if (!latinChars.test(text)) {
        warnings.push('Text contains non-Latin characters that may affect processing');
      }

      // Check for common Latin words to confirm language
      const commonLatinWords = /\b(et|in|ad|de|ex|cum|per|pro|sub|ab|ob)\b/gi;
      const matches = text.match(commonLatinWords);

      if (!matches || matches.length < Math.max(1, text.split(/\s+/).length * 0.05)) {
        warnings.push('Text may not be Latin - consider checking language setting');
      }

      return {
        isValid: errors.length === 0,
        errors: [...baseValidation.errors, ...errors],
        warnings: [...baseValidation.warnings, ...warnings]
      };
    }

    return baseValidation;
  }

  async extractVocabulary(text: string, options: VocabOptions): Promise<VocabCandidate[]> {
    const startTime = Date.now();

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

      // Check cache first
      const cacheKey = this.createCacheKey(text, options);
      if (this.cache.vocabulary.has(cacheKey)) {
        return this.cache.vocabulary.get(cacheKey)!;
      }

      // Sanitize input
      const sanitizedText = this.sanitizeInput(text);

      // Extract vocabulary using LLM
      const vocabulary = await this.extractVocabularyWithLLM(sanitizedText, options);

      // Enrich with dictionary data
      const enrichedVocabulary = await this.enrichWithDictionary(vocabulary);

      // Cache result
      this.cache.vocabulary.set(cacheKey, enrichedVocabulary);

      // Log metrics
      this.logProcessingMetrics('vocabulary', Date.now() - startTime, true);

      return enrichedVocabulary;

    } catch (error) {
      this.logProcessingMetrics('vocabulary', Date.now() - startTime, false, error.message);

      if (error.code) throw error; // Re-throw ProcessingError

      throw this.createProcessingError(
        `Latin vocabulary extraction failed: ${error.message}`,
        'PROCESSING_FAILED',
        'vocabulary',
        true
      );
    }
  }

  private async extractVocabularyWithLLM(text: string, options: VocabOptions): Promise<VocabCandidate[]> {
    const prompt = this.buildVocabularyPrompt(text, options);

    const completion = await this.callLLMWithRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Latin language and pedagogy. Analyze Latin text for vocabulary extraction.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for consistency
        max_tokens: 4000
      });
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from LLM');
    }

    // Parse and validate response
    const parsed = JSON.parse(responseText);
    const validated = LatinVocabResponseSchema.parse(parsed);

    return validated.vocabulary.map(item => ({
      word: item.word,
      lemma: item.lemma,
      definition: item.definition,
      partOfSpeech: item.partOfSpeech,
      frequency: item.frequency,
      difficulty: item.difficulty || this.inferDifficulty(item.lemma),
      morphology: item.morphology
    }));
  }

  private buildVocabularyPrompt(text: string, options: VocabOptions): string {
    return `Analyze this Latin text and extract vocabulary for language learning:

TEXT: "${text}"

Extract up to ${options.maxItems} vocabulary items. For each word:
1. Identify the exact form as it appears in the text
2. Determine the lemma (dictionary form)
3. Provide part of speech (noun, verb, adjective, etc.)
4. Give a clear English definition
5. If applicable, analyze morphology (case, number, gender for nouns; tense, mood, voice for verbs)
6. Estimate difficulty level based on frequency in classical texts

Focus on:
- Words that are pedagogically important for Latin learners
- Forms that demonstrate important grammar concepts
- Vocabulary that students would need to look up

Avoid:
- Extremely common words (et, in, de) unless they have interesting grammar
- Proper nouns unless historically significant
- Words that appear only once unless they're particularly important

Return as JSON with this structure:
{
  "vocabulary": [
    {
      "word": "exact form in text",
      "lemma": "dictionary form",
      "partOfSpeech": "noun/verb/adjective/etc",
      "definition": "clear English definition",
      "morphology": {
        "case": "nominative/genitive/etc (if applicable)",
        "number": "singular/plural (if applicable)",
        "gender": "masculine/feminine/neuter (if applicable)",
        "tense": "present/imperfect/etc (if applicable)",
        "mood": "indicative/subjunctive/etc (if applicable)",
        "voice": "active/passive (if applicable)",
        "person": "1st/2nd/3rd (if applicable)"
      },
      "difficulty": "basic/intermediate/advanced"
    }
  ]
}`;
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

      // Check cache first
      const cacheKey = this.createCacheKey(text, options);
      if (this.cache.grammar.has(cacheKey)) {
        return this.cache.grammar.get(cacheKey)!;
      }

      const sanitizedText = this.sanitizeInput(text);
      const concepts = await this.identifyGrammarWithLLM(sanitizedText, options);

      // Filter by complexity level
      const filteredConcepts = concepts.filter(concept =>
        options.complexityLevel === 'all' || concept.complexity === options.complexityLevel
      );

      this.cache.grammar.set(cacheKey, filteredConcepts);
      this.logProcessingMetrics('grammar', Date.now() - startTime, true);

      return filteredConcepts;

    } catch (error) {
      this.logProcessingMetrics('grammar', Date.now() - startTime, false, error.message);

      if (error.code) throw error;

      throw this.createProcessingError(
        `Latin grammar identification failed: ${error.message}`,
        'PROCESSING_FAILED',
        'grammar',
        true
      );
    }
  }

  private async identifyGrammarWithLLM(text: string, options: GrammarOptions): Promise<GrammarConcept[]> {
    const prompt = this.buildGrammarPrompt(text, options);

    const completion = await this.callLLMWithRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Latin grammarian and teacher. Identify and explain grammatical concepts in Latin texts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 4000
      });
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from LLM');
    }

    const parsed = JSON.parse(responseText);
    const validated = LatinGrammarResponseSchema.parse(parsed);

    return validated.concepts;
  }

  private buildGrammarPrompt(text: string, options: GrammarOptions): string {
    return `Analyze this Latin text for grammatical concepts that would be valuable for Latin students:

TEXT: "${text}"

Identify up to ${options.maxConcepts} significant grammatical concepts. Focus on:

SYNTAX:
- Ablative absolute constructions
- Indirect statements (accusative with infinitive)
- Purpose clauses (ut + subjunctive)
- Result clauses
- Relative clauses and their antecedents
- Participial phrases
- Conditional statements

MORPHOLOGY:
- Significant case usage (ablative of means, dative of interest, etc.)
- Passive periphrastic constructions
- Deponent verbs
- Irregular verb forms
- Comparative and superlative forms

STYLE:
- Chiasmus or other rhetorical devices
- Historical present
- Ellipsis or understood elements

For each concept found:
1. Give it a clear pedagogical name
2. Provide a student-friendly explanation
3. Show the specific text evidence
4. Include examples with translations
5. Categorize complexity level
6. Note the grammatical category

${options.includeExamples ? 'Include clear examples with translations.' : 'Focus on explanations rather than extensive examples.'}

Return as JSON:
{
  "concepts": [
    {
      "id": "unique_concept_id",
      "name": "Grammatical Concept Name",
      "description": "Student-friendly explanation",
      "complexity": "basic/intermediate/advanced",
      "examples": [
        {
          "text": "Latin text example",
          "translation": "English translation",
          "explanation": "Why this illustrates the concept"
        }
      ],
      "category": "syntax/morphology/style",
      "textEvidence": "Specific words/phrases from the original text"
    }
  ]
}`;
  }

  async generateExercises(context: ExerciseContext): Promise<Exercise[]> {
    const startTime = Date.now();

    try {
      // Validate context
      if (!context.vocabulary.length && !context.grammarConcepts.length) {
        throw this.createProcessingError(
          'Cannot generate exercises without vocabulary or grammar concepts',
          'INVALID_INPUT',
          'exercises'
        );
      }

      // Check cache
      const cacheKey = this.createCacheKey(JSON.stringify(context), {});
      if (this.cache.exercises.has(cacheKey)) {
        return this.cache.exercises.get(cacheKey)!;
      }

      const exercises = await this.generateExercisesWithLLM(context);

      this.cache.exercises.set(cacheKey, exercises);
      this.logProcessingMetrics('exercises', Date.now() - startTime, true);

      return exercises;

    } catch (error) {
      this.logProcessingMetrics('exercises', Date.now() - startTime, false, error.message);

      if (error.code) throw error;

      throw this.createProcessingError(
        `Latin exercise generation failed: ${error.message}`,
        'PROCESSING_FAILED',
        'exercises',
        true
      );
    }
  }

  private async generateExercisesWithLLM(context: ExerciseContext): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    for (const exerciseType of context.exerciseTypes) {
      const exercisePrompt = this.buildExercisePrompt(exerciseType, context);

      const completion = await this.callLLMWithRetry(async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert Latin teacher creating ${exerciseType} exercises.`
            },
            {
              role: 'user',
              content: exercisePrompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 3000
        });
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const exerciseData = JSON.parse(responseText);
        const processedExercises = this.processExerciseResponse(exerciseData, exerciseType, context.targetDifficulty);
        exercises.push(...processedExercises);
      }
    }

    return exercises.slice(0, context.maxExercises);
  }

  private buildExercisePrompt(exerciseType: ExerciseType, context: ExerciseContext): string {
    const vocab = context.vocabulary.slice(0, 10); // Limit for prompt size
    const grammar = context.grammarConcepts.slice(0, 5);

    switch (exerciseType) {
      case 'translation':
        return this.buildTranslationExercisePrompt(vocab, grammar, context.targetDifficulty);
      case 'parsing':
        return this.buildParsingExercisePrompt(vocab, context.targetDifficulty);
      case 'multiple_choice':
        return this.buildMultipleChoicePrompt(vocab, grammar, context.targetDifficulty);
      default:
        return this.buildGenericExercisePrompt(exerciseType, vocab, grammar, context.targetDifficulty);
    }
  }

  private buildTranslationExercisePrompt(vocab: VocabCandidate[], grammar: GrammarConcept[], difficulty: string): string {
    return `Create a Latin translation exercise using this vocabulary and grammar:

VOCABULARY: ${JSON.stringify(vocab.map(v => ({ word: v.word, lemma: v.lemma, definition: v.definition })))}

GRAMMAR CONCEPTS: ${JSON.stringify(grammar.map(g => ({ name: g.name, description: g.description })))}

TARGET DIFFICULTY: ${difficulty}

Create ONE translation exercise (Latin to English) that:
1. Uses 60-80% of the provided vocabulary
2. Incorporates at least one grammar concept
3. Is appropriate for ${difficulty} level students
4. Has one clear, correct translation (avoid ambiguity)
5. Tests understanding, not just word substitution

Return as JSON:
{
  "exercises": [
    {
      "question": "Latin sentence to translate",
      "correctAnswer": "Expected English translation",
      "explanation": "Why this translation is correct, highlighting grammar/vocabulary",
      "hints": ["Helpful hint 1", "Helpful hint 2"],
      "commonMistakes": ["Common wrong translation", "Another common error"]
    }
  ]
}`;
  }

  private buildParsingExercisePrompt(vocab: VocabCandidate[], difficulty: string): string {
    const verbsAndNouns = vocab.filter(v =>
      v.partOfSpeech.toLowerCase().includes('verb') ||
      v.partOfSpeech.toLowerCase().includes('noun')
    );

    return `Create Latin parsing exercises using these words:

WORDS: ${JSON.stringify(verbsAndNouns.map(v => ({ word: v.word, lemma: v.lemma, pos: v.partOfSpeech })))}

TARGET DIFFICULTY: ${difficulty}

Create 2-3 parsing exercises where students identify:
- For nouns: case, number, gender
- For verbs: tense, mood, voice, person, number

Return as JSON:
{
  "exercises": [
    {
      "question": "Parse the word: [Latin word]",
      "correctAnswer": "case: ablative, number: singular, gender: masculine",
      "explanation": "Detailed parsing explanation",
      "hints": ["Look at the ending", "Consider the context"]
    }
  ]
}`;
  }

  private buildMultipleChoicePrompt(vocab: VocabCandidate[], grammar: GrammarConcept[], difficulty: string): string {
    return `Create multiple choice questions about Latin grammar and vocabulary:

VOCABULARY: ${JSON.stringify(vocab.slice(0, 8))}
GRAMMAR: ${JSON.stringify(grammar.slice(0, 3))}

Create 1-2 multiple choice questions testing vocabulary definitions or grammar concepts.
Each question should have 4 options with one clearly correct answer.

Return as JSON:
{
  "exercises": [
    {
      "question": "What does 'caesar' mean?",
      "options": ["emperor", "general", "soldier", "citizen"],
      "correctAnswer": "emperor",
      "explanation": "Caesar originally meant emperor in Latin"
    }
  ]
}`;
  }

  private buildGenericExercisePrompt(exerciseType: ExerciseType, vocab: VocabCandidate[], grammar: GrammarConcept[], difficulty: string): string {
    return `Create a ${exerciseType} exercise for Latin students at ${difficulty} level using provided vocabulary and grammar concepts.`;
  }

  private processExerciseResponse(data: any, exerciseType: ExerciseType, difficulty: string): Exercise[] {
    if (!data.exercises || !Array.isArray(data.exercises)) {
      return [];
    }

    return data.exercises.map((ex: any, index: number) => ({
      id: `${exerciseType}_${Date.now()}_${index}`,
      type: exerciseType,
      question: ex.question || '',
      correctAnswer: ex.correctAnswer || ex.answer || '',
      distractors: ex.options ? ex.options.filter((opt: string) => opt !== ex.correctAnswer) : [],
      explanation: ex.explanation || '',
      difficulty: difficulty as any,
      metadata: {
        grammarFocus: ex.grammarFocus || [],
        vocabularyFocus: ex.vocabularyFocus || [],
        estimatedTime: this.estimateExerciseTime(exerciseType)
      }
    }));
  }

  // Utility methods
  private async enrichWithDictionary(vocabulary: VocabCandidate[]): Promise<VocabCandidate[]> {
    // Enhance definitions with dictionary service
    const enriched: VocabCandidate[] = [];

    for (const vocab of vocabulary) {
      try {
        const dictEntry = await latinDictionaryService.lookup(vocab.lemma);
        enriched.push({
          ...vocab,
          definition: dictEntry?.definition || vocab.definition,
          examples: dictEntry?.examples || vocab.examples || []
        });
      } catch {
        // Fallback to original if dictionary lookup fails
        enriched.push(vocab);
      }
    }

    return enriched;
  }

  private async callLLMWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM call timeout')), this.timeoutMs)
        );

        return await Promise.race([operation(), timeout]);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw this.createProcessingError(
      `LLM call failed after ${this.maxRetries} attempts: ${lastError!.message}`,
      'API_ERROR',
      'vocabulary',
      false
    );
  }

  private createCacheKey(text: string, options: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(text + JSON.stringify(options))
      .digest('hex');
    return hash;
  }

  private inferDifficulty(lemma: string): 'basic' | 'intermediate' | 'advanced' {
    // Simple heuristic - enhance with frequency data
    const basicWords = ['sum', 'habeo', 'do', 'video', 'venio', 'homo', 'rex', 'dies'];
    const intermediateWords = ['bellum', 'civitas', 'imperium', 'virtus', 'gloria'];

    if (basicWords.includes(lemma)) return 'basic';
    if (intermediateWords.includes(lemma)) return 'intermediate';
    return 'advanced';
  }

  private estimateExerciseTime(exerciseType: ExerciseType): number {
    const timeEstimates = {
      'translation': 180, // 3 minutes
      'parsing': 120,     // 2 minutes
      'multiple_choice': 60, // 1 minute
      'fill_blank': 90,   // 1.5 minutes
      'matching': 120     // 2 minutes
    };

    return timeEstimates[exerciseType] || 90;
  }

  async estimateProcessingTime(text: string): Promise<number> {
    const wordCount = text.split(/\s+/).length;
    // Latin processing is more expensive due to LLM calls
    return Math.max(2000, wordCount * 200); // 200ms per word, minimum 2 seconds
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test with simple Latin phrase
      const testText = "Caesar Galliam vincit.";
      const vocab = await this.extractVocabulary(testText, {
        maxItems: 3,
        includeFrequency: false,
        includeMorphology: false
      });

      return vocab.length > 0;
    } catch {
      return false;
    }
  }

  private logProcessingMetrics(type: string, timeMs: number, success: boolean, error?: string): void {
    // TODO: Implement metrics logging to database
    console.log(`Latin processing - ${type}: ${timeMs}ms, success: ${success}`, error ? `error: ${error}` : '');
  }
}
```

#### 2. LLM Integration Service (`lib/content-generation/services/llm-integration.ts`)

**NEW FILE - 150 lines**

```typescript
import { openai } from '../../mastra/providers/openai';
import rateLimit from 'express-rate-limit';

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMIntegrationService {
  private readonly defaultModel = 'gpt-4o';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 30000;

  // Rate limiting for API calls
  private rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many LLM requests, please try again later'
  });

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      this.validateRequest(request);

      const completion = await this.callWithRetry(async () => {
        return await openai.chat.completions.create({
          model: request.model || this.defaultModel,
          messages: request.messages,
          temperature: request.temperature ?? 0.1,
          max_tokens: request.maxTokens ?? 4000,
          response_format: request.responseFormat,
          // Security: Add user identifier for monitoring
          user: this.getCurrentUserId()
        });
      });

      const response: LLMResponse = {
        content: completion.choices[0]?.message?.content || '',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        model: completion.model
      };

      // Log usage metrics
      this.logUsageMetrics(response, Date.now() - startTime);

      return response;

    } catch (error) {
      this.logError(error as Error, request);
      throw error;
    }
  }

  private validateRequest(request: LLMRequest): void {
    // Security: Validate input content
    for (const message of request.messages) {
      if (typeof message.content !== 'string') {
        throw new Error('Message content must be string');
      }

      if (message.content.length > 50000) {
        throw new Error('Message content exceeds maximum length');
      }

      // Check for potential injection patterns
      const suspiciousPatterns = [
        /ignore.{0,20}previous.{0,20}instructions/i,
        /system.{0,10}prompt/i,
        /<script[^>]*>/i,
        /javascript:/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(message.content)) {
          throw new Error('Message content contains potentially dangerous patterns');
        }
      }
    }

    // Validate model
    const allowedModels = ['gpt-4o', 'gpt-4o-mini'];
    if (request.model && !allowedModels.includes(request.model)) {
      throw new Error(`Model ${request.model} is not allowed`);
    }

    // Validate temperature
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    // Validate max tokens
    if (request.maxTokens !== undefined && (request.maxTokens < 1 || request.maxTokens > 8000)) {
      throw new Error('Max tokens must be between 1 and 8000');
    }
  }

  private async callWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Set timeout for each attempt
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM API timeout')), this.timeoutMs)
        );

        return await Promise.race([operation(), timeout]);

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error as Error)) {
          break;
        }

        if (attempt < this.maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt - 1) * 1000;
          const jitter = Math.random() * 500;
          const delay = Math.min(baseDelay + jitter, 10000);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`LLM API failed after ${this.maxRetries} attempts: ${lastError!.message}`);
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Don't retry on authentication, permission, or validation errors
    return message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('invalid') ||
           message.includes('bad request');
  }

  private getCurrentUserId(): string {
    // TODO: Implement user context retrieval
    return 'system'; // Placeholder
  }

  private logUsageMetrics(response: LLMResponse, processingTimeMs: number): void {
    // TODO: Implement proper metrics logging
    console.log('LLM Usage:', {
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      processingTimeMs
    });
  }

  private logError(error: Error, request: LLMRequest): void {
    // TODO: Implement proper error logging
    console.error('LLM Error:', {
      error: error.message,
      model: request.model,
      messageCount: request.messages.length
    });
  }
}

export const llmIntegrationService = new LLMIntegrationService();
```

### Security Implementation

#### Input Sanitization and Validation

```typescript
// Enhanced security for Latin processor
class LatinSecurityValidator {
  static sanitizeLatinText(text: string): string {
    return text
      // Remove HTML/XML tags
      .replace(/<[^>]*>/g, '')
      // Remove potentially dangerous URLs
      .replace(/https?:\/\/[^\s]+/g, '[URL removed]')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  static validateLatinContent(text: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check text length
    if (text.length > 10000) {
      issues.push('Text exceeds maximum length of 10,000 characters');
    }

    // Check for suspicious patterns
    const dangerousPatterns = [
      { pattern: /javascript:/gi, message: 'Contains JavaScript URL' },
      { pattern: /on\w+\s*=/gi, message: 'Contains event handlers' },
      { pattern: /<script[^>]*>/gi, message: 'Contains script tags' },
      { pattern: /eval\s*\(/gi, message: 'Contains eval function' }
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(text)) {
        issues.push(message);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
```

### Database Schema

```sql
-- Latin processing metrics
CREATE TABLE latin_processing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    processing_type TEXT NOT NULL CHECK (processing_type IN ('vocabulary', 'grammar', 'exercises')),
    text_length INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM usage tracking
CREATE TABLE llm_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_estimate DECIMAL(10, 4),
    processing_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_latin_processing_user_type ON latin_processing_metrics(user_id, processing_type);
CREATE INDEX idx_llm_usage_user_date ON llm_usage_metrics(user_id, created_at);
```

### Caching Strategy

```typescript
// Redis-based caching for Latin processing
import Redis from 'ioredis';

class LatinProcessingCache {
  private redis: Redis;
  private readonly TTL = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async getVocabulary(textHash: string): Promise<VocabCandidate[] | null> {
    const cached = await this.redis.get(`latin:vocab:${textHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setVocabulary(textHash: string, vocabulary: VocabCandidate[]): Promise<void> {
    await this.redis.setex(
      `latin:vocab:${textHash}`,
      this.TTL,
      JSON.stringify(vocabulary)
    );
  }

  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Acceptance Criteria

- [ ] **Vocabulary Extraction**: Extract 15-20 vocabulary items from Caesar excerpt
- [ ] **Morphology Analysis**: 95%+ accuracy on standard Latin forms
- [ ] **Dictionary Integration**: Enrich vocabulary with dictionary service
- [ ] **Performance**: <10 seconds processing time for typical lesson
- [ ] **Security**: All inputs sanitized, no data leakage to LLM logs
- [ ] **Error Handling**: Graceful failure with retry logic
- [ ] **Caching**: 80%+ cache hit rate for repeated content
- [ ] **Health Checks**: Processor validates operational status

### Testing Strategy

```typescript
// Integration tests for Latin processor
describe('LatinLanguageProcessor', () => {
  const processor = new LatinLanguageProcessor();

  test('should extract vocabulary from Caesar text', async () => {
    const text = 'Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae.';
    const vocab = await processor.extractVocabulary(text, {
      maxItems: 10,
      includeFrequency: true,
      includeMorphology: true
    });

    expect(vocab.length).toBeGreaterThan(5);
    expect(vocab).toContainEqual(expect.objectContaining({
      lemma: 'Gallia',
      partOfSpeech: expect.stringContaining('noun')
    }));
  });

  test('should handle malformed input gracefully', async () => {
    const invalidText = '<script>alert("xss")</script>';

    await expect(processor.extractVocabulary(invalidText, {
      maxItems: 10,
      includeFrequency: false,
      includeMorphology: false
    })).rejects.toThrow('Invalid input');
  });
});
```

### Monitoring and Alerts

```typescript
// Monitoring configuration
const latinProcessorAlerts = {
  processingTimeHigh: {
    condition: 'processing_time_ms > 15000',
    action: 'Send alert to engineering team'
  },

  errorRateHigh: {
    condition: 'error_rate > 0.05 over 5 minutes',
    action: 'Escalate to on-call engineer'
  },

  llmCostHigh: {
    condition: 'daily_tokens > 1000000',
    action: 'Alert finance team'
  }
};
```

This implementation provides a robust, secure, and performant Latin language processor that integrates with the existing content generation system while maintaining the flexibility to add additional languages in the future.