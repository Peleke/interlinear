import { NextRequest, NextResponse } from 'next/server';
import { generateFreshSentences } from '@/lib/mastra/workflows/wordOfDayGeneration';

export async function POST(request: NextRequest) {
  try {
    const { word, language, definitions, count = 3 } = await request.json();

    if (!word || !language || !definitions) {
      return NextResponse.json(
        { error: 'Missing required fields: word, language, definitions' },
        { status: 400 }
      );
    }

    if (!['spanish', 'latin'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Use "spanish" or "latin"' },
        { status: 400 }
      );
    }

    console.log(`🔄 Generating fresh sentences for ${language} word: ${word}`);

    const result = await generateFreshSentences({
      word,
      language: language as 'spanish' | 'latin',
      definitions,
      count: Math.min(count, 5) // Max 5 sentences
    });

    if (!result.success) {
      throw new Error('Failed to generate fresh sentences');
    }

    return NextResponse.json({
      success: true,
      sentences: result.sentences,
      word,
      language,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating fresh sentences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate sentences',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}