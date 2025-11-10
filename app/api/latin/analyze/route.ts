/**
 * Latin Analysis API Route
 *
 * POST /api/latin/analyze
 * Analyzes Latin word(s) using hybrid service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatinAnalysisService } from '@/services/LatinAnalysisService';

export const runtime = 'nodejs';

interface AnalyzeRequest {
  word?: string;
  text?: string;
  options?: {
    includeMorphology?: boolean;
    includeDictionary?: boolean;
    cacheResults?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { word, text, options = {} } = body;

    if (!word && !text) {
      return NextResponse.json(
        { error: 'Either "word" or "text" is required' },
        { status: 400 }
      );
    }

    const service = getLatinAnalysisService();

    // Initialize service if not already done
    try {
      await service.initialize();
    } catch (error) {
      console.error('Service initialization error:', error);
      // Continue anyway - service might already be initialized
    }

    // Analyze single word or text
    if (word) {
      const result = await service.analyzeWord(word, options);
      return NextResponse.json(result);
    } else {
      const results = await service.analyzeText(text!, options);
      return NextResponse.json({ words: results });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { error: 'Query parameter "word" is required' },
      { status: 400 }
    );
  }

  try {
    const service = getLatinAnalysisService();
    await service.initialize();

    const result = await service.analyzeWord(word);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
