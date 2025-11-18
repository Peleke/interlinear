/**
 * Word of Day Generation Utilities
 * Functions for generating fresh sentences and content for daily words
 */

import { createOpenAIProvider } from '../providers/openai';

interface GenerateFreshSentencesInput {
  word: string;
  language: 'spanish' | 'latin';
  definitions: string[];
  count?: number;
}

interface GenerateFreshSentencesOutput {
  success: boolean;
  sentences?: Array<{
    sentence: string;
    translation: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  error?: string;
}

/**
 * Generate fresh example sentences for a word of the day
 */
export async function generateFreshSentences(
  input: GenerateFreshSentencesInput
): Promise<GenerateFreshSentencesOutput> {
  try {
    const { word, language, definitions, count = 3 } = input;

    console.log(`🔄 Generating ${count} fresh sentences for ${language} word: ${word}`);

    const openai = createOpenAIProvider();

    const prompt = language === 'spanish'
      ? `Genera ${count} frases de ejemplo originales y variadas para la palabra española "${word}".

Definiciones: ${definitions.join(', ')}

Requisitos:
- Frases completamente nuevas y naturales
- Diferentes niveles de dificultad (principiante, intermedio, avanzado)
- Contextos variados (formal, informal, literario, coloquial)
- Traducción clara al inglés
- Muestra diferentes usos de la palabra

Formato JSON:
{
  "sentences": [
    {
      "sentence": "Frase en español",
      "translation": "English translation",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}`
      : `Generate ${count} original and varied example sentences for the Latin word "${word}".

Definitions: ${definitions.join(', ')}

Requirements:
- Completely new and natural phrases
- Different difficulty levels (beginner, intermediate, advanced)
- Varied contexts (classical, medieval, ecclesiastical)
- Clear English translation
- Show different uses of the word

JSON format:
{
  "sentences": [
    {
      "sentence": "Latin sentence",
      "translation": "English translation",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher creativity for varied sentences
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Try to parse JSON response
    let parsedResponse;
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', response.choices[0]?.message?.content);
      throw new Error('Invalid JSON response from LLM');
    }

    if (!parsedResponse.sentences || !Array.isArray(parsedResponse.sentences)) {
      throw new Error('Invalid response format - missing sentences array');
    }

    // Validate each sentence object
    const validSentences = parsedResponse.sentences.filter(
      (s: any) => s.sentence && s.translation && s.difficulty
    );

    if (validSentences.length === 0) {
      throw new Error('No valid sentences generated');
    }

    console.log(`✅ Generated ${validSentences.length} fresh sentences for "${word}"`);

    return {
      success: true,
      sentences: validSentences,
    };

  } catch (error) {
    console.error('❌ Error generating fresh sentences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a completely new word of the day entry
 */
export async function generateWordOfDay(
  language: 'spanish' | 'latin',
  date: string
): Promise<any> {
  // This would be implemented for generating new words
  // For now, just throw an error since it's not needed for the fix
  throw new Error('generateWordOfDay not implemented yet - use admin endpoints');
}