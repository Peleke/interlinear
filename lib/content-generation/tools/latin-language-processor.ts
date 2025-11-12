import {
  BaseLanguageProcessor,
  LanguageProcessor,
  ProcessingCapabilities,
  ValidationResult,
  VocabCandidate,
  GrammarConcept,
  Exercise,
  VocabOptions,
  GrammarOptions,
  ExerciseContext,
  ProcessingError
} from '../interfaces/language-processor';

/**
 * LLM-based Latin language processor
 *
 * Unlike modern languages, Latin requires sophisticated morphological analysis
 * and grammatical understanding that's best handled by large language models
 * rather than traditional NLP libraries.
 */
export class LatinLanguageProcessor extends BaseLanguageProcessor {
  readonly language = 'la' as const;

  readonly capabilities: ProcessingCapabilities = {
    vocabulary: true,
    grammar: true,
    exercises: true,
    morphology: true,
    syntaxAnalysis: true,
    customExerciseTypes: ['declension_practice', 'conjugation', 'parsing', 'translation', 'case_identification']
  };

  async validateInput(text: string): Promise<ValidationResult> {
    const baseValidation = await super.validateInput(text);

    // Latin-specific validation
    if (baseValidation.isValid) {
      // Check if text appears to be Latin
      const latinIndicators = /\b(et|sed|est|sunt|qui|quae|quod|cum|in|ad|de|ex|per|ab|post|ante|sub|super|inter|trans|contra|sine|pro|propter|causa|gratia|magnus|magna|magnum|bonus|bona|bonum|multus|multa|multum|omnis|omnes|omnia|nullus|nulla|nullum|alius|alia|aliud|ipse|ipsa|ipsum|hic|haec|hoc|ille|illa|illud|is|ea|id|ego|tu|nos|vos|eum|eam|ei|eius|eorum|earum|mihi|tibi|nobis|vobis|me|te|se|sui|sibi|suus|sua|suum|meus|mea|meum|tuus|tua|tuum|noster|nostra|nostrum|vester|vestra|vestrum)\b/gi;
      const matches = text.match(latinIndicators);
      const wordCount = text.split(/\s+/).length;

      if (!matches || matches.length < Math.max(1, wordCount * 0.05)) {
        baseValidation.warnings.push('Text may not be Latin - consider checking language setting');
      }

      // Check for Medieval/Church Latin vs Classical indicators
      const medievalIndicators = /\b(ecclesia|dominus|sanctus|benedictus|pax|gloria|alleluia|amen)\b/gi;
      const medievalMatches = text.match(medievalIndicators);
      if (medievalMatches && medievalMatches.length > 0) {
        baseValidation.warnings.push('Text appears to contain Medieval/Church Latin - analysis assumes Classical Latin conventions');
      }

      // Warn about potentially complex poetry or technical texts
      if (text.includes('—') || text.match(/\d+\.\d+/)) {
        baseValidation.warnings.push('Text may contain poetry or complex citations - processing may require additional context');
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

      // Use LLM for Latin vocabulary analysis
      const vocabPrompt = this.buildVocabularyPrompt(sanitizedText, options);
      const llmResponse = await this.callLLMForProcessing(vocabPrompt, 'vocabulary');

      // Parse LLM response and validate structure
      const vocabData = this.parseLLMVocabularyResponse(llmResponse);

      // Transform to standard interface format
      const vocabCandidates: VocabCandidate[] = vocabData.words.map((word: any) => ({
        word: word.word,
        lemma: word.lemma,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
        frequency: word.frequency || this.estimateLatinFrequency(word.word),
        difficulty: this.determineLatinDifficulty(word),
        morphology: options.includeMorphology ? {
          stem: word.stem,
          case: word.case,
          number: word.number,
          gender: word.gender,
          tense: word.tense,
          mood: word.mood,
          voice: word.voice,
          normalized: word.lemma
        } : undefined,
        examples: word.examples || []
      }));

      // Apply difficulty filter if specified
      if (options.difficultyFilter) {
        const filtered = vocabCandidates.filter(candidate =>
          candidate.difficulty === options.difficultyFilter
        );
        return filtered.slice(0, options.maxItems);
      }

      return vocabCandidates.slice(0, options.maxItems);

    } catch (error: any) {
      if (error.code) throw error; // Re-throw ProcessingError

      throw this.createProcessingError(
        `Latin vocabulary extraction failed: ${error.message}`,
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

      // Use LLM for Latin grammar analysis
      const grammarPrompt = this.buildGrammarPrompt(sanitizedText, options);
      const llmResponse = await this.callLLMForProcessing(grammarPrompt, 'grammar');

      const grammarData = this.parseLLMGrammarResponse(llmResponse);

      // Transform to standard interface format
      const concepts: GrammarConcept[] = grammarData.concepts.map((concept: any) => ({
        id: concept.id,
        name: concept.name,
        description: concept.description,
        complexity: concept.complexity,
        examples: options.includeExamples ? concept.examples : [],
        category: this.categorizeLatinGrammarConcept(concept.name)
      }));

      // Filter by complexity level if specified
      if (options.complexityLevel !== 'all') {
        return concepts.filter(concept => concept.complexity === options.complexityLevel);
      }

      return concepts.slice(0, options.maxConcepts);

    } catch (error: any) {
      if (error.code) throw error;

      throw this.createProcessingError(
        `Latin grammar identification failed: ${error.message}`,
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
          const exercisePrompt = this.buildExercisePrompt(context, exerciseType);
          const llmResponse = await this.callLLMForProcessing(exercisePrompt, 'exercises');
          const exerciseData = this.parseLLMExerciseResponse(llmResponse, exerciseType);

          // Transform generated exercises to standard format
          const transformedExercises = exerciseData.exercises.map((exercise: any, index: number) => ({
            id: `la_${exerciseType}_${Date.now()}_${index}`,
            type: exerciseType,
            question: exercise.question,
            correctAnswer: exercise.correctAnswer,
            distractors: exercise.distractors || [],
            explanation: exercise.explanation,
            difficulty: context.targetDifficulty,
            metadata: {
              grammarFocus: exercise.grammarFocus || [],
              vocabularyFocus: exercise.vocabularyFocus || [],
              estimatedTime: this.estimateLatinExerciseTime(exerciseType)
            }
          }));

          exercises.push(...transformedExercises);
        } catch (error: any) {
          // Log error but continue with other exercise types
          console.warn(`Failed to generate ${exerciseType} exercises:`, error.message);
        }
      }

      if (exercises.length === 0) {
        throw new Error('Failed to generate any exercises');
      }

      return exercises.slice(0, context.maxExercises);

    } catch (error: any) {
      throw this.createProcessingError(
        `Latin exercise generation failed: ${error.message}`,
        'PROCESSING_FAILED',
        'exercises',
        true
      );
    }
  }

  async estimateProcessingTime(text: string): Promise<number> {
    // Latin processing requires LLM calls which are slower
    const wordCount = text.split(/\s+/).length;

    // Base time: 200ms per word for LLM processing
    // Additional time for complex morphological analysis: ~5-10 seconds
    const baseTime = Math.max(2000, wordCount * 200);
    const complexityTime = Math.min(10000, wordCount * 100); // Cap at 10 seconds

    return baseTime + complexityTime;
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test with simple Latin text
      const testText = "Marcus in via ambulat et rosam pulchram videt.";

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

  // Private LLM integration methods
  private async callLLMForProcessing(prompt: string, type: 'vocabulary' | 'grammar' | 'exercises'): Promise<string> {
    // Use mock responses in test environment
    if (process.env.NODE_ENV === 'test') {
      return this.getMockLLMResponse(type);
    }

    // Use OpenAI for Latin processing
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      if (!process.env.OPENAI_API_KEY) {
        console.error('[Latin] Missing OPENAI_API_KEY environment variable');
        throw new Error('OPENAI_API_KEY environment variable is required for Latin processing');
      }

      console.log(`[Latin] Making LLM call for ${type} processing...`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using same model as other parts of the app
        messages: [
          {
            role: 'system',
            content: 'You are an expert Latin scholar and teacher. Provide accurate, educational analysis of Latin texts. Always respond with valid JSON as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        max_tokens: 4000,  // Increased for longer Latin texts - was 2000
        response_format: { type: 'json_object' } // Ensure JSON response
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        console.error('[Latin] Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }

      console.log(`[Latin] Received LLM response for ${type}, length:`, response.length);
      return response;

    } catch (error: any) {
      // Handle API errors gracefully
      if (error.code === 'insufficient_quota') {
        throw this.createProcessingError(
          'OpenAI API quota exceeded. Please check your usage limits.',
          'API_ERROR',
          type,
          true
        );
      } else if (error.code === 'rate_limit_exceeded') {
        throw this.createProcessingError(
          'OpenAI API rate limit exceeded. Please try again later.',
          'API_ERROR',
          type,
          true
        );
      } else if (error.message?.includes('API key')) {
        throw this.createProcessingError(
          'Invalid or missing OpenAI API key configuration',
          'API_ERROR',
          type,
          false
        );
      } else {
        throw this.createProcessingError(
          `Latin LLM processing failed: ${error.message}`,
          'API_ERROR',
          type,
          true
        );
      }
    }
  }

  private buildVocabularyPrompt(text: string, options: VocabOptions): string {
    const maxItems = options.maxItems || 20;
    return `Extract EXACTLY ${maxItems} vocabulary words from this Latin text. NO MORE, NO LESS.

"${text}"

JSON format - SIMPLE ONLY:
{
  "words": [
    {
      "word": "puella",
      "lemma": "puella",
      "definition": "girl",
      "partOfSpeech": "noun",
      "difficulty": "beginner"
    }
  ]
}

RULES:
1. EXACTLY ${maxItems} words - count them!
2. NO extra fields (no stem, case, examples, frequency, morphology)
3. Focus on nouns, verbs, adjectives - skip particles like -que, -ne
4. difficulty: "beginner" | "intermediate" | "advanced"
5. Keep definitions SHORT (1-3 words max)

COUNT YOUR WORDS. STOP AT ${maxItems}.`;
  }

  private buildGrammarPrompt(text: string, options: GrammarOptions): string {
    return `Analyze this Latin text for grammatical concepts:

"${text}"

Please provide a JSON response with the following structure:
{
  "concepts": [
    {
      "id": "unique_identifier",
      "name": "Concept name (e.g., 'Ablative Absolute', 'Subjunctive of Purpose')",
      "description": "Clear explanation of the grammatical concept",
      "complexity": "basic|intermediate|advanced",
      "examples": [
        {
          "text": "example from the text",
          "translation": "English translation",
          "explanation": "why this demonstrates the concept"
        }
      ]
    }
  ]
}

Focus on concepts suitable for ${options.complexityLevel} learners.
Limit to ${options.maxConcepts} most significant concepts.
${options.includeExamples ? 'Include detailed examples with explanations.' : 'Minimal examples.'}`;
  }

  private buildExercisePrompt(context: ExerciseContext, exerciseType: string): string {
    const vocabularyList = context.vocabulary.map(v => `${v.word} (${v.definition})`).join(', ');
    const grammarList = context.grammarConcepts.map(g => g.name).join(', ');

    return `Generate ${exerciseType} exercises for this Latin text:

"${context.originalText}"

Vocabulary focus: ${vocabularyList}
Grammar focus: ${grammarList}
Target difficulty: ${context.targetDifficulty}

Please provide a JSON response with the following structure:
{
  "exercises": [
    {
      "question": "exercise question or prompt",
      "correctAnswer": "correct answer",
      "distractors": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
      "explanation": "why the correct answer is right",
      "grammarFocus": ["grammar concepts this tests"],
      "vocabularyFocus": ["vocabulary this tests"]
    }
  ]
}

Exercise type guidelines:
- declension_practice: Focus on noun/adjective endings and cases
- conjugation: Focus on verb forms and tenses
- parsing: Ask students to identify grammatical forms
- translation: Provide Latin for translation to English
- case_identification: Test knowledge of case usage

Generate ${Math.floor(context.maxExercises / context.exerciseTypes.length) || 1} exercises.`;
  }

  private parseLLMVocabularyResponse(response: string): any {
    try {
      console.log('[Latin] Raw LLM response:', response.substring(0, 500) + '...');

      // Try to extract JSON from response if it's wrapped in markdown or other text
      let jsonText = response.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
        jsonText = jsonText.slice(7, -3).trim();
      } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
      }

      const parsed = JSON.parse(jsonText);

      // Validate structure - ensure we have words array
      if (!parsed.words || !Array.isArray(parsed.words)) {
        console.log('[Latin] Parsed response missing words array:', parsed);
        throw new Error('Response missing words array');
      }

      console.log('[Latin] Successfully parsed', parsed.words.length, 'vocabulary items');
      return parsed;
    } catch (error: any) {
      console.error('[Latin] LLM response parsing failed:', error.message);
      console.error('[Latin] Raw response:', response);
      throw this.createProcessingError(
        `Failed to parse LLM vocabulary response: ${error.message}`,
        'PROCESSING_FAILED',
        'vocabulary'
      );
    }
  }

  private parseLLMGrammarResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error: any) {
      throw this.createProcessingError(
        'Failed to parse LLM grammar response',
        'PROCESSING_FAILED',
        'grammar'
      );
    }
  }

  private parseLLMExerciseResponse(response: string, exerciseType: string): any {
    try {
      return JSON.parse(response);
    } catch (error: any) {
      throw this.createProcessingError(
        `Failed to parse LLM ${exerciseType} exercise response`,
        'PROCESSING_FAILED',
        'exercises'
      );
    }
  }

  private getMockLLMResponse(type: 'vocabulary' | 'grammar' | 'exercises'): string {
    // Mock responses for testing
    switch (type) {
      case 'vocabulary':
        return JSON.stringify({
          words: [
            {
              word: "Marcus",
              lemma: "Marcus",
              definition: "Marcus (a Roman name)",
              partOfSpeech: "noun",
              stem: "Marc",
              case: "nominative",
              number: "singular",
              gender: "masculine",
              frequency: 75
            }
          ]
        });
      case 'grammar':
        return JSON.stringify({
          concepts: [
            {
              id: "nominative_subject",
              name: "Nominative Case Subject",
              description: "The nominative case is used for the subject of the sentence",
              complexity: "basic",
              examples: []
            }
          ]
        });
      case 'exercises':
        return JSON.stringify({
          exercises: [
            {
              question: "What case is 'Marcus' in the sentence?",
              correctAnswer: "nominative",
              distractors: ["accusative", "genitive", "dative"],
              explanation: "Marcus is the subject, so it takes nominative case"
            }
          ]
        });
      default:
        return '{}';
    }
  }

  // Helper methods for Latin-specific processing
  private estimateLatinFrequency(word: string): number {
    // Basic frequency estimation based on common Latin patterns
    const commonWords = ['est', 'sunt', 'et', 'in', 'ad', 'de', 'cum', 'qui', 'quae', 'quod'];
    if (commonWords.includes(word.toLowerCase())) return 95;

    const frequentEndings = ['-us', '-a', '-um', '-is', '-es', '-nt', '-t'];
    if (frequentEndings.some(ending => word.endsWith(ending))) return 60;

    return 30; // Default for uncommon words
  }

  private determineLatinDifficulty(word: any): 'basic' | 'intermediate' | 'advanced' {
    // Latin difficulty assessment based on morphological complexity
    const frequency = word.frequency || 0;
    const hasComplexMorphology = word.case && word.case !== 'nominative' && word.case !== 'accusative';

    if (frequency > 70) return 'basic';
    if (frequency > 30 && !hasComplexMorphology) return 'intermediate';
    return 'advanced';
  }

  private categorizeLatinGrammarConcept(conceptName: string): string {
    const concept = conceptName.toLowerCase();

    if (concept.includes('case') || concept.includes('declension')) return 'cases';
    if (concept.includes('tense') || concept.includes('conjugation') || concept.includes('verb')) return 'verbs';
    if (concept.includes('subjunctive') || concept.includes('mood')) return 'moods';
    if (concept.includes('participle') || concept.includes('gerund') || concept.includes('supine')) return 'verbals';
    if (concept.includes('ablative') && concept.includes('absolute')) return 'advanced_syntax';
    if (concept.includes('indirect') && concept.includes('statement')) return 'syntax';
    if (concept.includes('purpose') || concept.includes('result') || concept.includes('conditional')) return 'clauses';

    return 'syntax';
  }

  private estimateLatinExerciseTime(exerciseType: string): number {
    const baseTime: Record<string, number> = {
      'declension_practice': 90,    // 1.5 minutes - morphology practice
      'conjugation': 75,            // 75 seconds - verb forms
      'parsing': 120,               // 2 minutes - analysis required
      'translation': 180,           // 3 minutes - full comprehension
      'case_identification': 60     // 1 minute - pattern recognition
    };

    return baseTime[exerciseType] || 90;
  }
}