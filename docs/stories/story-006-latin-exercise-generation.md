# STORY 006: Latin Exercise Generation

**Story ID**: STORY-006
**Points**: 3
**Priority**: High
**Epic**: EPIC-LATIN-002
**Security Impact**: Low - Uses existing secure LLM infrastructure
**Performance Impact**: <2s per exercise type for generation

## User Story

**As a** Latin educator
**I want** to generate Latin-specific exercises
**So that** students can practice translation and grammatical analysis

## Technical Implementation

### File-by-File Specification

#### 1. Latin Exercise Generation Engine (`lib/content-generation/tools/latin-exercise-generator.ts`)

**NEW FILE - 800 lines**

```typescript
import { z } from 'zod';
import {
  Exercise,
  ExerciseType,
  ExerciseContext,
  VocabCandidate,
  GrammarConcept,
  ProcessingError
} from '../interfaces/language-processor';
import { llmIntegrationService } from '../services/llm-integration';
import { LatinMorphologyAnalysis } from './latin-language-processor';

// Latin-specific exercise types
export type LatinExerciseType = ExerciseType | 'parsing' | 'case_identification' | 'translation_analysis' | 'syntax_trees';

// Enhanced exercise interface for Latin
export interface LatinExercise extends Exercise {
  type: LatinExerciseType;
  latinSpecific?: {
    morphologyFocus?: string[];
    syntaxFocus?: string[];
    casesFocus?: string[];
    expectedAnalysis?: string;
    commonMistakes?: string[];
    parsingTarget?: {
      word: string;
      expectedParsing: Record<string, string>;
    };
  };
}

// Exercise generation options for Latin
export interface LatinExerciseOptions {
  exerciseTypes: LatinExerciseType[];
  targetDifficulty: 'basic' | 'intermediate' | 'advanced';
  focusAreas: ('vocabulary' | 'grammar' | 'translation' | 'morphology')[];
  maxExercisesPerType: number;
  includeCulturalContext: boolean;
  adaptToStudentLevel: boolean;
}

// Validation schemas
const LatinExerciseResponseSchema = z.object({
  exercises: z.array(z.object({
    type: z.string(),
    question: z.string(),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    explanation: z.string(),
    distractors: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional(),
    difficulty: z.enum(['basic', 'intermediate', 'advanced']),
    morphologyFocus: z.array(z.string()).optional(),
    syntaxFocus: z.array(z.string()).optional(),
    expectedAnalysis: z.string().optional(),
    commonMistakes: z.array(z.string()).optional(),
    culturalContext: z.string().optional()
  }))
});

/**
 * Main Latin Exercise Generation Engine
 * Specializes in creating pedagogically sound Latin language exercises
 */
export class LatinExerciseGenerator {
  private readonly exerciseFactories: Map<LatinExerciseType, ExerciseFactory>;

  constructor() {
    this.exerciseFactories = this.initializeFactories();
  }

  async generateExercises(context: ExerciseContext, options: Partial<LatinExerciseOptions> = {}): Promise<LatinExercise[]> {
    const latinOptions: LatinExerciseOptions = {
      exerciseTypes: (context.exerciseTypes as LatinExerciseType[]) || ['translation', 'parsing'],
      targetDifficulty: context.targetDifficulty,
      focusAreas: ['vocabulary', 'grammar'],
      maxExercisesPerType: Math.ceil(context.maxExercises / (context.exerciseTypes.length || 1)),
      includeCulturalContext: true,
      adaptToStudentLevel: true,
      ...options
    };

    const exercises: LatinExercise[] = [];

    // Generate exercises by type in parallel for performance
    const generationPromises = latinOptions.exerciseTypes.map(async (exerciseType) => {
      const factory = this.exerciseFactories.get(exerciseType);
      if (!factory) {
        console.warn(`No factory found for exercise type: ${exerciseType}`);
        return [];
      }

      try {
        return await factory.generateExercises(context, latinOptions);
      } catch (error) {
        console.error(`Failed to generate ${exerciseType} exercises:`, error);
        return [];
      }
    });

    const exerciseArrays = await Promise.all(generationPromises);

    // Flatten and limit results
    for (const exerciseArray of exerciseArrays) {
      exercises.push(...exerciseArray);
    }

    // Sort by pedagogical priority and difficulty progression
    const sortedExercises = this.sortExercisesByPedagogy(exercises, context.targetDifficulty);

    return sortedExercises.slice(0, context.maxExercises);
  }

  private initializeFactories(): Map<LatinExerciseType, ExerciseFactory> {
    return new Map([
      ['translation', new LatinTranslationFactory()],
      ['parsing', new LatinParsingFactory()],
      ['case_identification', new CaseIdentificationFactory()],
      ['multiple_choice', new LatinMultipleChoiceFactory()],
      ['translation_analysis', new TranslationAnalysisFactory()],
      ['fill_blank', new LatinFillBlankFactory()],
      ['matching', new LatinMatchingFactory()],
      ['syntax_trees', new SyntaxTreeFactory()]
    ]);
  }

  private sortExercisesByPedagogy(exercises: LatinExercise[], targetDifficulty: string): LatinExercise[] {
    // Pedagogical priority: basic concepts first, building complexity
    const typePriority: Record<LatinExerciseType, number> = {
      'case_identification': 1,
      'parsing': 2,
      'fill_blank': 3,
      'multiple_choice': 4,
      'translation': 5,
      'translation_analysis': 6,
      'matching': 7,
      'syntax_trees': 8
    };

    return exercises.sort((a, b) => {
      // Sort by type priority first
      const priorityA = typePriority[a.type as LatinExerciseType] || 10;
      const priorityB = typePriority[b.type as LatinExerciseType] || 10;

      if (priorityA !== priorityB) return priorityA - priorityB;

      // Then by difficulty progression
      const difficultyOrder = { basic: 1, intermediate: 2, advanced: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }
}

/**
 * Base class for exercise factories
 */
abstract class ExerciseFactory {
  abstract readonly exerciseType: LatinExerciseType;

  async generateExercises(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise[]> {
    const count = Math.min(options.maxExercisesPerType, 3);
    const exercises: LatinExercise[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const exercise = await this.generateSingleExercise(context, options);
        if (exercise) {
          exercises.push(exercise);
        }
      } catch (error) {
        console.error(`Failed to generate ${this.exerciseType} exercise ${i + 1}:`, error);
      }
    }

    return exercises;
  }

  protected abstract generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null>;

  protected async callLLMForExercise(prompt: string): Promise<any> {
    const response = await llmIntegrationService.generateCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Latin teacher creating pedagogically sound exercises for Latin language learners.'
        },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o',
      temperature: 0.3, // Slightly higher for creative exercise generation
      responseFormat: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }
}

/**
 * Latin Translation Exercise Factory
 * Creates translation exercises with grammatical analysis requirements
 */
class LatinTranslationFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'translation';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    const relevantVocab = context.vocabulary.slice(0, 12);
    const relevantGrammar = context.grammarConcepts.slice(0, 3);

    const prompt = `
    Create a Latin to English translation exercise using this vocabulary and grammar:

    VOCABULARY (use 60-80% of these words):
    ${JSON.stringify(relevantVocab.map(v => ({ word: v.word, lemma: v.lemma, definition: v.definition })))}

    GRAMMAR CONCEPTS TO INCORPORATE:
    ${JSON.stringify(relevantGrammar.map(g => ({ name: g.name, description: g.description })))}

    TARGET DIFFICULTY: ${options.targetDifficulty}

    Requirements:
    1. Create a Latin sentence that uses most of the vocabulary
    2. Incorporate at least one grammar concept naturally
    3. Sentence should be 8-15 words for ${options.targetDifficulty} level
    4. Avoid ambiguous constructions that allow multiple valid translations
    5. Provide a model translation that demonstrates understanding of grammar
    6. Include hints for challenging grammatical elements
    7. List common mistakes students might make

    ${options.includeCulturalContext ? 'Include brief cultural context if relevant to Roman life/history.' : ''}

    Return as JSON:
    {
      "exercises": [{
        "type": "translation",
        "question": "Translate the following Latin sentence into English:",
        "latinSentence": "the sentence to translate",
        "correctAnswer": "the expected English translation",
        "explanation": "detailed explanation of grammar and vocabulary choices",
        "hints": ["hint about challenging element 1", "hint about element 2"],
        "difficulty": "${options.targetDifficulty}",
        "grammarFocus": ["list", "of", "grammar", "concepts"],
        "vocabularyFocus": ["key", "vocabulary", "words"],
        "commonMistakes": ["common translation error 1", "common error 2"],
        "culturalContext": "brief cultural note if applicable"
      }]
    }`;

    try {
      const response = await this.callLLMForExercise(prompt);
      const validated = LatinExerciseResponseSchema.parse(response);

      if (validated.exercises.length === 0) return null;

      const exerciseData = validated.exercises[0];

      return {
        id: `latin_translation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'translation',
        question: `${exerciseData.question}\n\n**${(exerciseData as any).latinSentence}**`,
        correctAnswer: exerciseData.correctAnswer,
        explanation: exerciseData.explanation,
        difficulty: exerciseData.difficulty,
        metadata: {
          grammarFocus: exerciseData.syntaxFocus || [],
          vocabularyFocus: exerciseData.morphologyFocus || [],
          estimatedTime: this.estimateTranslationTime(options.targetDifficulty)
        },
        latinSpecific: {
          syntaxFocus: exerciseData.syntaxFocus || [],
          commonMistakes: exerciseData.commonMistakes || [],
          morphologyFocus: exerciseData.morphologyFocus || []
        }
      };

    } catch (error) {
      console.error('Translation exercise generation failed:', error);
      return null;
    }
  }

  private estimateTranslationTime(difficulty: string): number {
    const baseTimes = { basic: 120, intermediate: 180, advanced: 240 };
    return baseTimes[difficulty as keyof typeof baseTimes] || 180;
  }
}

/**
 * Latin Parsing Exercise Factory
 * Creates exercises for identifying morphological features
 */
class LatinParsingFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'parsing';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Focus on vocabulary with interesting morphology
    const parseableVocab = context.vocabulary.filter(v =>
      v.morphology && (
        v.partOfSpeech.toLowerCase().includes('noun') ||
        v.partOfSpeech.toLowerCase().includes('verb') ||
        v.partOfSpeech.toLowerCase().includes('adjective')
      )
    ).slice(0, 8);

    if (parseableVocab.length === 0) return null;

    const prompt = `
    Create a Latin parsing exercise using these words with morphological information:

    WORDS TO USE:
    ${JSON.stringify(parseableVocab.map(v => ({
      word: v.word,
      lemma: v.lemma,
      partOfSpeech: v.partOfSpeech,
      morphology: v.morphology
    })))}

    TARGET DIFFICULTY: ${options.targetDifficulty}

    Create a parsing exercise where students must identify:
    - For NOUNS: case, number, gender, declension
    - For VERBS: person, number, tense, mood, voice
    - For ADJECTIVES: case, number, gender, degree

    Requirements:
    1. Choose 1-2 words that demonstrate important morphological concepts
    2. Provide the word in context (short phrase or sentence)
    3. Ask for complete parsing information
    4. Include explanation of how to arrive at the answer
    5. Note any irregular forms or special considerations

    Return as JSON:
    {
      "exercises": [{
        "type": "parsing",
        "question": "Parse the underlined word in this context: [context with **word** marked]",
        "targetWord": "the word to parse",
        "correctAnswer": "case: ablative, number: singular, gender: masculine",
        "explanation": "step-by-step parsing explanation",
        "hints": ["look at the ending", "consider the context"],
        "difficulty": "${options.targetDifficulty}",
        "morphologyFocus": ["case", "number", "gender"],
        "commonMistakes": ["confused with different case", "incorrect gender assignment"]
      }]
    }`;

    try {
      const response = await this.callLLMForExercise(prompt);
      const validated = LatinExerciseResponseSchema.parse(response);

      if (validated.exercises.length === 0) return null;

      const exerciseData = validated.exercises[0];

      return {
        id: `latin_parsing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'parsing',
        question: exerciseData.question,
        correctAnswer: exerciseData.correctAnswer,
        explanation: exerciseData.explanation,
        difficulty: exerciseData.difficulty,
        metadata: {
          grammarFocus: ['morphology'],
          vocabularyFocus: [(exerciseData as any).targetWord],
          estimatedTime: 90
        },
        latinSpecific: {
          morphologyFocus: exerciseData.morphologyFocus || [],
          commonMistakes: exerciseData.commonMistakes || [],
          parsingTarget: {
            word: (exerciseData as any).targetWord,
            expectedParsing: this.parseCorrectAnswer(exerciseData.correctAnswer as string)
          }
        }
      };

    } catch (error) {
      console.error('Parsing exercise generation failed:', error);
      return null;
    }
  }

  private parseCorrectAnswer(answer: string): Record<string, string> {
    const parsing: Record<string, string> = {};
    const parts = answer.split(',');

    for (const part of parts) {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key && value) {
        parsing[key] = value;
      }
    }

    return parsing;
  }
}

/**
 * Case Identification Exercise Factory
 * Creates exercises focused on identifying and explaining case usage
 */
class CaseIdentificationFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'case_identification';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Focus on vocabulary in interesting cases
    const caseVocab = context.vocabulary.filter(v =>
      v.morphology?.case && v.morphology.case !== 'nominative'
    );

    const prompt = `
    Create a case identification exercise focusing on meaningful case usage:

    VOCABULARY WITH CASE INFORMATION:
    ${JSON.stringify(caseVocab.slice(0, 6))}

    GRAMMAR CONCEPTS:
    ${JSON.stringify(context.grammarConcepts.map(g => g.name))}

    Create an exercise where students must:
    1. Identify the case of a Latin word
    2. Explain WHY that case is used (function, not just form)

    Focus on meaningful case usage like:
    - Ablative of means/manner
    - Dative of interest/possession
    - Genitive of description/possession
    - Accusative of time/place

    Return as JSON with exercises array.`;

    try {
      const response = await this.callLLMForExercise(prompt);
      const validated = LatinExerciseResponseSchema.parse(response);

      if (validated.exercises.length === 0) return null;

      const exerciseData = validated.exercises[0];

      return {
        id: `case_id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'case_identification',
        question: exerciseData.question,
        correctAnswer: exerciseData.correctAnswer,
        explanation: exerciseData.explanation,
        difficulty: exerciseData.difficulty,
        metadata: {
          grammarFocus: ['case_usage'],
          vocabularyFocus: [],
          estimatedTime: 75
        },
        latinSpecific: {
          casesFocus: ['ablative', 'dative', 'genitive', 'accusative'],
          commonMistakes: exerciseData.commonMistakes || []
        }
      };

    } catch (error) {
      console.error('Case identification exercise generation failed:', error);
      return null;
    }
  }
}

/**
 * Multiple Choice Exercise Factory for Latin
 * Creates multiple choice questions about vocabulary, grammar, and culture
 */
class LatinMultipleChoiceFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'multiple_choice';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    const topics = ['vocabulary', 'grammar', 'morphology'];
    if (options.includeCulturalContext) topics.push('culture');

    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

    const prompt = `
    Create a multiple choice question about Latin ${selectedTopic}:

    AVAILABLE VOCABULARY: ${JSON.stringify(context.vocabulary.slice(0, 8))}
    AVAILABLE GRAMMAR: ${JSON.stringify(context.grammarConcepts.slice(0, 3))}

    Requirements:
    1. Create one clear question with 4 answer choices
    2. Only ONE choice should be completely correct
    3. Distractors should be plausible but clearly wrong
    4. Include explanation of why the correct answer is right
    5. Target difficulty: ${options.targetDifficulty}

    Topic focus: ${selectedTopic}

    Return as JSON with exercises array containing question, options, correctAnswer, and explanation.`;

    try {
      const response = await this.callLLMForExercise(prompt);
      const exerciseData = response.exercises?.[0];

      if (!exerciseData) return null;

      return {
        id: `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'multiple_choice',
        question: exerciseData.question,
        correctAnswer: exerciseData.correctAnswer,
        distractors: exerciseData.options?.filter((opt: string) => opt !== exerciseData.correctAnswer) || [],
        explanation: exerciseData.explanation,
        difficulty: options.targetDifficulty,
        metadata: {
          grammarFocus: selectedTopic === 'grammar' ? [selectedTopic] : [],
          vocabularyFocus: selectedTopic === 'vocabulary' ? ['vocabulary'] : [],
          estimatedTime: 45
        },
        latinSpecific: {
          morphologyFocus: selectedTopic === 'morphology' ? ['morphology'] : []
        }
      };

    } catch (error) {
      console.error('Multiple choice exercise generation failed:', error);
      return null;
    }
  }
}

/**
 * Additional exercise factories would follow similar patterns...
 */

// Fill blank, matching, translation analysis, and syntax tree factories
class LatinFillBlankFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'fill_blank';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Implementation for fill-in-the-blank exercises
    return null;
  }
}

class LatinMatchingFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'matching';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Implementation for matching exercises
    return null;
  }
}

class TranslationAnalysisFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'translation_analysis';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Implementation for translation analysis exercises
    return null;
  }
}

class SyntaxTreeFactory extends ExerciseFactory {
  readonly exerciseType: LatinExerciseType = 'syntax_trees';

  protected async generateSingleExercise(context: ExerciseContext, options: LatinExerciseOptions): Promise<LatinExercise | null> {
    // Implementation for syntax tree exercises
    return null;
  }
}

// Export main generator
export { LatinExerciseGenerator, LatinExercise, LatinExerciseOptions };
```

#### 2. Exercise Quality Validation (`lib/content-generation/tools/latin-exercise-validator.ts`)

**NEW FILE - 300 lines**

```typescript
import { LatinExercise } from './latin-exercise-generator';

export interface ExerciseQualityMetrics {
  score: number; // 0-1
  pedagogicalValue: number;
  difficulty: number;
  clarity: number;
  authenticity: number;
  issues: string[];
  suggestions: string[];
}

export class LatinExerciseValidator {
  /**
   * Validates exercise quality from multiple pedagogical perspectives
   */
  static validateExercise(exercise: LatinExercise): ExerciseQualityMetrics {
    const metrics: ExerciseQualityMetrics = {
      score: 0,
      pedagogicalValue: 0,
      difficulty: 0,
      clarity: 0,
      authenticity: 0,
      issues: [],
      suggestions: []
    };

    // Validate content completeness
    this.validateCompleteness(exercise, metrics);

    // Validate pedagogical alignment
    this.validatePedagogicalValue(exercise, metrics);

    // Validate difficulty appropriateness
    this.validateDifficulty(exercise, metrics);

    // Validate question clarity
    this.validateClarity(exercise, metrics);

    // Validate Latin authenticity
    this.validateAuthenticity(exercise, metrics);

    // Calculate overall score
    metrics.score = (
      metrics.pedagogicalValue +
      metrics.difficulty +
      metrics.clarity +
      metrics.authenticity
    ) / 4;

    return metrics;
  }

  private static validateCompleteness(exercise: LatinExercise, metrics: ExerciseQualityMetrics): void {
    if (!exercise.question) metrics.issues.push('Missing question');
    if (!exercise.correctAnswer) metrics.issues.push('Missing correct answer');
    if (!exercise.explanation) metrics.issues.push('Missing explanation');

    if (exercise.type === 'multiple_choice' && (!exercise.distractors || exercise.distractors.length < 2)) {
      metrics.issues.push('Multiple choice needs at least 2 distractors');
    }

    if (exercise.type === 'parsing' && !exercise.latinSpecific?.parsingTarget) {
      metrics.issues.push('Parsing exercise needs specific parsing target');
    }
  }

  private static validatePedagogicalValue(exercise: LatinExercise, metrics: ExerciseQualityMetrics): void {
    let score = 0.5; // Base score

    // Check for grammar focus
    if (exercise.metadata.grammarFocus && exercise.metadata.grammarFocus.length > 0) {
      score += 0.2;
    }

    // Check for vocabulary focus
    if (exercise.metadata.vocabularyFocus && exercise.metadata.vocabularyFocus.length > 0) {
      score += 0.1;
    }

    // Check for Latin-specific elements
    if (exercise.latinSpecific) {
      if (exercise.latinSpecific.morphologyFocus) score += 0.1;
      if (exercise.latinSpecific.commonMistakes) score += 0.1;
    }

    // Penalty for vague explanations
    if (exercise.explanation && exercise.explanation.length < 20) {
      score -= 0.2;
      metrics.suggestions.push('Provide more detailed explanation');
    }

    metrics.pedagogicalValue = Math.min(1, Math.max(0, score));
  }

  private static validateDifficulty(exercise: LatinExercise, metrics: ExerciseQualityMetrics): void {
    let score = 0.7; // Assume appropriate difficulty

    // Check question complexity vs stated difficulty
    const wordCount = exercise.question.split(' ').length;

    if (exercise.difficulty === 'basic' && wordCount > 15) {
      score -= 0.2;
      metrics.suggestions.push('Question may be too complex for basic level');
    }

    if (exercise.difficulty === 'advanced' && wordCount < 10) {
      score -= 0.1;
      metrics.suggestions.push('Question may be too simple for advanced level');
    }

    // Check for difficulty progression in parsing
    if (exercise.type === 'parsing') {
      const morphologyCount = exercise.latinSpecific?.morphologyFocus?.length || 0;

      if (exercise.difficulty === 'basic' && morphologyCount > 3) {
        score -= 0.2;
        metrics.suggestions.push('Too many morphological elements for basic parsing');
      }
    }

    metrics.difficulty = Math.min(1, Math.max(0, score));
  }

  private static validateClarity(exercise: LatinExercise, metrics: ExerciseQualityMetrics): void {
    let score = 0.8; // Start with good clarity

    // Check question clarity
    if (!exercise.question.includes('?')) {
      score -= 0.1;
      metrics.suggestions.push('Question should be phrased as a clear question');
    }

    // Check for ambiguous instructions
    const ambiguousTerms = ['some', 'several', 'many', 'few', 'most'];
    const hasAmbiguousTerms = ambiguousTerms.some(term =>
      exercise.question.toLowerCase().includes(term)
    );

    if (hasAmbiguousTerms) {
      score -= 0.2;
      metrics.suggestions.push('Avoid ambiguous quantifiers in questions');
    }

    // Check explanation clarity
    if (exercise.explanation && exercise.explanation.split('.').length < 2) {
      score -= 0.1;
      metrics.suggestions.push('Explanation should have multiple sentences');
    }

    metrics.clarity = Math.min(1, Math.max(0, score));
  }

  private static validateAuthenticity(exercise: LatinExercise, metrics: ExerciseQualityMetrics): void {
    let score = 0.7; // Assume reasonable authenticity

    // Check for Latin text presence where appropriate
    if (exercise.type === 'translation' && !exercise.question.match(/[a-zA-Z]{3,}/)) {
      score -= 0.3;
      metrics.issues.push('Translation exercise should contain Latin text');
    }

    // Check for realistic Latin constructions
    if (exercise.question.includes('Latin:') || exercise.question.includes('**')) {
      score += 0.1; // Good formatting
    }

    // Check for cultural context where beneficial
    if (exercise.latinSpecific?.commonMistakes && exercise.latinSpecific.commonMistakes.length > 0) {
      score += 0.2;
    }

    metrics.authenticity = Math.min(1, Math.max(0, score));
  }

  /**
   * Batch validation for multiple exercises
   */
  static validateExerciseBatch(exercises: LatinExercise[]): {
    overallQuality: number;
    exerciseMetrics: ExerciseQualityMetrics[];
    batchIssues: string[];
    recommendations: string[];
  } {
    const exerciseMetrics = exercises.map(ex => this.validateExercise(ex));
    const overallQuality = exerciseMetrics.reduce((sum, m) => sum + m.score, 0) / exercises.length;

    const batchIssues: string[] = [];
    const recommendations: string[] = [];

    // Check type diversity
    const types = new Set(exercises.map(ex => ex.type));
    if (types.size === 1) {
      batchIssues.push('No exercise type diversity');
    }

    // Check difficulty progression
    const difficulties = exercises.map(ex => ex.difficulty);
    const hasProgression = difficulties.includes('basic') &&
                          (difficulties.includes('intermediate') || difficulties.includes('advanced'));

    if (!hasProgression && exercises.length > 3) {
      recommendations.push('Consider including exercises of varying difficulty levels');
    }

    // Check grammar coverage
    const grammarConcepts = new Set(
      exercises.flatMap(ex => ex.metadata.grammarFocus || [])
    );

    if (grammarConcepts.size === 0) {
      batchIssues.push('No grammar concepts covered in exercise set');
    }

    return {
      overallQuality,
      exerciseMetrics,
      batchIssues,
      recommendations
    };
  }
}
```

#### 3. Database Schema for Exercise Metadata (`supabase/migrations/20241112_latin_exercises.sql`)

**NEW FILE - Exercise-specific database schema**

```sql
-- Extend existing exercises table for Latin-specific data
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS latin_specific_data JSONB;

-- Create index for Latin exercises
CREATE INDEX IF NOT EXISTS idx_exercises_language ON exercises(language);

-- Create table for exercise performance tracking
CREATE TABLE latin_exercise_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,

    -- Performance metrics
    student_attempts INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2), -- 0.00 to 1.00
    average_time_seconds INTEGER,
    common_mistakes JSONB, -- Array of common wrong answers

    -- Quality metrics
    teacher_rating INTEGER CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
    pedagogical_effectiveness DECIMAL(3,2),
    difficulty_accuracy DECIMAL(3,2), -- How well perceived difficulty matches actual

    -- Usage tracking
    times_assigned INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for exercise generation metrics
CREATE TABLE exercise_generation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Generation context
    lesson_id UUID REFERENCES lessons(id),
    exercise_types_requested TEXT[],
    vocabulary_count INTEGER,
    grammar_concepts_count INTEGER,
    target_difficulty TEXT,

    -- Results
    exercises_generated INTEGER,
    exercises_validated INTEGER,
    average_quality_score DECIMAL(3,2),
    generation_time_ms INTEGER,

    -- LLM usage
    llm_calls_made INTEGER,
    total_tokens_used INTEGER,
    cost_estimate DECIMAL(6,2),

    -- Quality breakdown
    pedagogical_score DECIMAL(3,2),
    difficulty_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    authenticity_score DECIMAL(3,2),

    -- Issues and improvements
    validation_issues JSONB,
    quality_suggestions JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_exercise_performance_exercise ON latin_exercise_performance(exercise_id);
CREATE INDEX idx_exercise_performance_rating ON latin_exercise_performance(teacher_rating);
CREATE INDEX idx_generation_metrics_lesson ON exercise_generation_metrics(lesson_id);
CREATE INDEX idx_generation_metrics_quality ON exercise_generation_metrics(average_quality_score);
CREATE INDEX idx_generation_metrics_created ON exercise_generation_metrics(created_at);

-- Create view for exercise analytics
CREATE VIEW latin_exercise_analytics AS
SELECT
    e.id,
    e.type,
    e.difficulty,
    e.language,
    lep.student_attempts,
    lep.success_rate,
    lep.average_time_seconds,
    lep.teacher_rating,
    lep.pedagogical_effectiveness,
    lep.times_assigned,
    COALESCE(
        jsonb_array_length(e.latin_specific_data->'morphologyFocus'), 0
    ) as morphology_focus_count,
    COALESCE(
        jsonb_array_length(e.latin_specific_data->'syntaxFocus'), 0
    ) as syntax_focus_count,
    e.created_at
FROM exercises e
LEFT JOIN latin_exercise_performance lep ON e.id = lep.exercise_id
WHERE e.language = 'la';

-- Trigger for updating performance metrics
CREATE OR REPLACE FUNCTION update_exercise_performance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_latin_exercise_performance_updated_at
    BEFORE UPDATE ON latin_exercise_performance
    FOR EACH ROW EXECUTE FUNCTION update_exercise_performance();
```

### Performance Monitoring

```typescript
// Exercise generation performance monitor
export class ExerciseGenerationMonitor {
  private generationTimes: Map<LatinExerciseType, number[]> = new Map();
  private qualityScores: Map<LatinExerciseType, number[]> = new Map();

  recordGeneration(
    exerciseType: LatinExerciseType,
    generationTime: number,
    qualityScore: number
  ): void {
    // Track generation times
    if (!this.generationTimes.has(exerciseType)) {
      this.generationTimes.set(exerciseType, []);
    }
    this.generationTimes.get(exerciseType)!.push(generationTime);

    // Track quality scores
    if (!this.qualityScores.has(exerciseType)) {
      this.qualityScores.set(exerciseType, []);
    }
    this.qualityScores.get(exerciseType)!.push(qualityScore);
  }

  getPerformanceReport(): Record<string, {
    avgGenerationTime: number;
    avgQualityScore: number;
    generationCount: number;
    qualityStdDev: number;
  }> {
    const report: any = {};

    for (const [type, times] of this.generationTimes) {
      const quality = this.qualityScores.get(type) || [];

      report[type] = {
        avgGenerationTime: times.reduce((a, b) => a + b, 0) / times.length,
        avgQualityScore: quality.reduce((a, b) => a + b, 0) / quality.length,
        generationCount: times.length,
        qualityStdDev: this.calculateStdDev(quality)
      };
    }

    return report;
  }

  private calculateStdDev(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
}
```

### Acceptance Criteria

- [ ] **Exercise Generation**: Generate 5 distinct Latin exercise types per lesson
- [ ] **Quality Validation**: All exercises pass pedagogical quality checks
- [ ] **Performance**: <2s generation time per exercise type
- [ ] **Accuracy**: 90%+ expert validation rate for generated content
- [ ] **Pedagogical Value**: Exercises target appropriate difficulty levels
- [ ] **Latin Specificity**: Morphology and syntax correctly integrated
- [ ] **Variety**: Multiple exercise types with balanced difficulty progression
- [ ] **Student Engagement**: Exercises are clear, focused, and achievable

### Testing Strategy

```typescript
// Test suite for Latin exercise generation
describe('LatinExerciseGenerator', () => {
  const generator = new LatinExerciseGenerator();

  test('should generate translation exercises with grammar focus', async () => {
    const context = createMockContext(['translation']);
    const exercises = await generator.generateExercises(context);

    expect(exercises).toHaveLength(1);
    expect(exercises[0].type).toBe('translation');
    expect(exercises[0].question).toContain('Latin');
    expect(exercises[0].latinSpecific?.syntaxFocus).toBeDefined();
  });

  test('should generate parsing exercises with morphology data', async () => {
    const context = createMockContext(['parsing']);
    const exercises = await generator.generateExercises(context);

    expect(exercises[0].type).toBe('parsing');
    expect(exercises[0].latinSpecific?.parsingTarget).toBeDefined();
    expect(exercises[0].latinSpecific?.morphologyFocus).toBeDefined();
  });

  test('should validate exercise quality', () => {
    const mockExercise = createMockLatinExercise();
    const metrics = LatinExerciseValidator.validateExercise(mockExercise);

    expect(metrics.score).toBeGreaterThan(0.7);
    expect(metrics.issues).toHaveLength(0);
  });
});
```

### Risk Mitigation

**Content Quality**:
- Built-in validation system for all generated exercises
- Expert review workflow for new exercise types
- Student performance feedback loop for continuous improvement

**Performance**:
- Parallel exercise generation by type
- Caching for common vocabulary/grammar combinations
- Timeout handling for LLM calls

**Pedagogical Effectiveness**:
- Alignment with Latin curriculum standards
- Progressive difficulty scaling
- Integration with existing assessment frameworks