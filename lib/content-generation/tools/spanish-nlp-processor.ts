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
import { identifyGrammar } from './identify-grammar';
import { generateExercises } from './generate-exercises';

/**
 * Spanish NLP Processor
 *
 * Wraps existing Spanish NLP functionality in the new LanguageProcessor interface.
 * Maintains full compatibility with current Spanish processing while enabling
 * the new language-agnostic architecture.
 *
 * Uses NLP.js for fast vocabulary analysis and GPT-4 for grammar/exercises.
 */
export class SpanishNLPProcessor extends BaseLanguageProcessor {
  readonly language = 'es' as const;

  readonly capabilities: ProcessingCapabilities = {
    vocabulary: true,
    grammar: true,
    exercises: true,
    morphology: true,
    syntaxAnalysis: true,
    customExerciseTypes: ['conjugation', 'subjunctive_practice', 'ser_estar', 'por_para']
  };

  async validateInput(text: string): Promise<ValidationResult> {
    const baseValidation = await super.validateInput(text);

    // Spanish-specific validation
    if (baseValidation.isValid) {
      // Check if text appears to be Spanish
      const spanishIndicators = /\b(el|la|los|las|un|una|en|de|que|y|o|con|por|para|es|está|son|están|ser|estar|tener|hacer|decir|ir|venir|ver|saber|poder|querer|dar|volver)\b/gi;
      const matches = text.match(spanishIndicators);
      const wordCount = text.split(/\s+/).length;

      if (!matches || matches.length < Math.max(1, wordCount * 0.1)) {
        baseValidation.warnings.push('Text may not be Spanish - consider checking language setting');
      }

      // Check for overly complex text that might confuse NLP.js
      if (wordCount > 500) {
        baseValidation.warnings.push('Text is quite long - processing may take longer than usual');
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

      // Sanitize input
      const sanitizedText = this.sanitizeInput(text);

      // Use existing Spanish NLP logic
      const candidates = await extractSpanishVocabCandidates(sanitizedText, options.maxItems);

      // Transform to standard interface format
      const vocabCandidates: VocabCandidate[] = candidates.map(candidate => ({
        word: candidate.word,
        lemma: candidate.stem || candidate.word, // Use stem as lemma fallback
        definition: `${candidate.word} (frequency: ${candidate.frequency})`, // Placeholder - would normally fetch from dictionary
        partOfSpeech: this.inferPartOfSpeech(candidate.word),
        frequency: candidate.frequency,
        difficulty: this.determineDifficulty(candidate),
        morphology: options.includeMorphology ? {
          stem: candidate.stem,
          normalized: candidate.normalized
        } : undefined,
        examples: [] // Would normally generate examples
      }));

      // Apply difficulty filter if specified
      if (options.difficultyFilter) {
        return vocabCandidates.filter(candidate =>
          candidate.difficulty === options.difficultyFilter
        );
      }

      return vocabCandidates.slice(0, options.maxItems);

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
      const validation = await this.validateInput(text);
      if (!validation.isValid) {
        throw this.createProcessingError(
          `Invalid input: ${validation.errors.join(', ')}`,
          'INVALID_INPUT',
          'grammar'
        );
      }

      const sanitizedText = this.sanitizeInput(text);

      // Use existing grammar identification
      const grammarResult = await identifyGrammar({
        content: sanitizedText,
        targetLevel: 'B1', // Default level - could be made configurable
        language: 'es',
        maxConcepts: options.maxConcepts
      });

      // Transform to standard interface format
      const concepts: GrammarConcept[] = grammarResult.concepts.map(concept => ({
        id: concept.name,
        name: concept.display_name,
        description: concept.description,
        complexity: this.mapCEFRToComplexity(concept.cefr_level),
        examples: options.includeExamples ? [{
          text: concept.example_from_text || 'No example available',
          translation: 'Translation would be generated here',
          explanation: concept.content
        }] : [],
        category: this.categorizeGrammarConcept(concept.name)
      }));

      // Filter by complexity level if specified
      if (options.complexityLevel !== 'all') {
        return concepts.filter(concept => concept.complexity === options.complexityLevel);
      }

      return concepts;

    } catch (error) {
      if (error.code) throw error;

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
      const exercises: Exercise[] = [];

      // Generate exercises for each requested type
      for (const exerciseType of context.exerciseTypes) {
        try {
          const exerciseResult = await generateExercises({
            content: context.originalText,
            type: this.mapExerciseType(exerciseType),
            count: Math.floor(context.maxExercises / context.exerciseTypes.length) || 1,
            targetLevel: this.mapDifficultyToCEFR(context.targetDifficulty),
            language: 'es'
          });

          // Transform generated exercises to standard format
          const transformedExercises = exerciseResult.exercises.map((exercise, index) => ({
            id: `es_${exerciseType}_${Date.now()}_${index}`,
            type: exerciseType,
            question: exercise.prompt,
            correctAnswer: exercise.correct_answer,
            distractors: exercise.options || [],
            explanation: exercise.explanation,
            difficulty: context.targetDifficulty,
            metadata: {
              grammarFocus: this.extractGrammarFocus(exercise, context),
              vocabularyFocus: this.extractVocabularyFocus(exercise, context),
              estimatedTime: this.estimateExerciseTime(exerciseType)
            }
          }));

          exercises.push(...transformedExercises);
        } catch (error) {
          // Log error but continue with other exercise types
          console.warn(`Failed to generate ${exerciseType} exercises:`, error.message);
        }
      }

      if (exercises.length === 0) {
        throw new Error('Failed to generate any exercises');
      }

      return exercises.slice(0, context.maxExercises);

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
    // Spanish processing is very fast with NLP.js for vocabulary
    const wordCount = text.split(/\s+/).length;

    // Base time: 20ms per word for vocabulary (NLP.js)
    // Additional time for grammar/exercises if needed: ~2-3 seconds
    const vocabularyTime = Math.max(500, wordCount * 20);
    const baseTime = vocabularyTime + 2000; // Add 2s for potential LLM calls

    return baseTime;
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test with simple Spanish text
      const testText = "El gato come pescado en la cocina.";

      const vocab = await this.extractVocabulary(testText, {
        maxItems: 3,
        includeFrequency: false,
        includeMorphology: false
      });

      // Should extract at least one vocabulary item
      return vocab.length > 0 && vocab[0].word !== undefined;
    } catch {
      return false;
    }
  }

  // Private helper methods
  private inferPartOfSpeech(word: string): string {
    // Simple heuristic-based POS tagging
    // This is a placeholder - ideally would use NLP.js POS tagger
    if (word.match(/^(el|la|los|las|un|una)$/)) return 'determiner';
    if (word.match(/ar$|er$|ir$/)) return 'verb';
    if (word.match(/mente$/)) return 'adverb';
    if (word.match(/ción$|sión$|dad$|tad$/)) return 'noun';
    if (word.match(/oso$|osa$|ivo$|iva$/)) return 'adjective';

    return 'noun'; // Default fallback
  }

  private determineDifficulty(candidate: any): 'basic' | 'intermediate' | 'advanced' {
    // Frequency-based difficulty assessment
    if (candidate.frequency && candidate.frequency > 50) return 'basic';
    if (candidate.frequency && candidate.frequency > 10) return 'intermediate';
    return 'advanced';
  }

  private mapCEFRToComplexity(cefrLevel: string): 'basic' | 'intermediate' | 'advanced' {
    switch (cefrLevel) {
      case 'A1':
      case 'A2':
        return 'basic';
      case 'B1':
      case 'B2':
        return 'intermediate';
      case 'C1':
      case 'C2':
        return 'advanced';
      default:
        return 'basic';
    }
  }

  private mapDifficultyToCEFR(difficulty: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    switch (difficulty) {
      case 'basic': return 'A2';
      case 'intermediate': return 'B1';
      case 'advanced': return 'C1';
      default: return 'A2';
    }
  }

  private mapExerciseType(type: string): 'translation' | 'multiple_choice' | 'fill_blank' {
    switch (type) {
      case 'translation': return 'translation';
      case 'multiple_choice': return 'multiple_choice';
      case 'fill_blank': return 'fill_blank';
      case 'parsing': return 'multiple_choice'; // Fallback to multiple choice
      case 'matching': return 'multiple_choice'; // Fallback to multiple choice
      default: return 'translation';
    }
  }

  private categorizeGrammarConcept(conceptName: string): string {
    if (conceptName.includes('tense') || conceptName.includes('verb')) return 'verbs';
    if (conceptName.includes('noun') || conceptName.includes('gender')) return 'nouns';
    if (conceptName.includes('adjective')) return 'adjectives';
    if (conceptName.includes('subjunctive')) return 'moods';
    if (conceptName.includes('preposition')) return 'prepositions';
    return 'syntax';
  }

  private extractGrammarFocus(exercise: any, context: ExerciseContext): string[] {
    // Extract grammar concepts that this exercise focuses on
    return context.grammarConcepts.map(concept => concept.name);
  }

  private extractVocabularyFocus(exercise: any, context: ExerciseContext): string[] {
    // Extract vocabulary that this exercise focuses on
    return context.vocabulary.slice(0, 5).map(vocab => vocab.word);
  }

  private estimateExerciseTime(exerciseType: string): number {
    const baseTime = {
      'translation': 120,      // 2 minutes
      'fill_blank': 60,        // 1 minute
      'multiple_choice': 45,   // 45 seconds
      'parsing': 90,           // 1.5 minutes
      'matching': 75           // 75 seconds
    };

    return baseTime[exerciseType] || 60;
  }
}