import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const language = url.searchParams.get('language') || 'spanish';
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!['spanish', 'latin'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Use "spanish" or "latin"' },
        { status: 400 }
      );
    }

    console.log(`📖 Fetching Word of Day for ${language} on ${date}`);

    // Fetch word from database
    const { data: wordData, error } = await supabase
      .from('daily_words')
      .select('*')
      .eq('date', date)
      .eq('language', language)
      .single();

    if (error || !wordData) {
      console.log(`📭 No word found for ${date} (${language})`);

      // Fallback: try to get the most recent word for this language
      const { data: recentWord } = await supabase
        .from('daily_words')
        .select('*')
        .eq('language', language)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (recentWord) {
        return NextResponse.json({
          success: true,
          data: recentWord,
          message: `Showing most recent ${language} word (${recentWord.date})`
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'No Word of Day found',
          message: `No ${language} word available for ${date}. Try generating one first.`,
          suggestion: `POST /api/generate-word-of-day with {"language": "${language}", "date": "${date}"}`
        },
        { status: 404 }
      );
    }

    console.log(`✅ Found word: ${wordData.word}`);

    // Return word data with cache headers
    const response = NextResponse.json({
      success: true,
      data: {
        id: wordData.id,
        date: wordData.date,
        language: wordData.language,
        word: wordData.word,
        pronunciation: wordData.pronunciation,
        partOfSpeech: wordData.part_of_speech,
        definitions: wordData.definitions,
        staticContent: wordData.llm_content,
        generatedAt: wordData.generated_at
      }
    });

    // Add cache headers (cache for 1 hour)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;

  } catch (error) {
    console.error('❌ Error fetching Word of Day:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Support for user preferences - get word based on user's preferred language
export async function POST(request: NextRequest) {
  try {
    const { userId, date = new Date().toISOString().split('T')[0] } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`👤 Fetching personalized Word of Day for user ${userId}`);

    // Get user's preferred language
    const { data: userPrefs } = await supabase
      .from('user_wod_preferences')
      .select('preferred_language')
      .eq('user_id', userId)
      .single();

    const preferredLanguage = userPrefs?.preferred_language || 'spanish';

    // Fetch word for user's preferred language
    const { data: wordData, error } = await supabase
      .from('daily_words')
      .select('*')
      .eq('date', date)
      .eq('language', preferredLanguage)
      .single();

    if (error || !wordData) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Word of Day found',
          preferredLanguage,
          message: `No ${preferredLanguage} word available for ${date}`,
          suggestion: `Generate a word first or check your language preferences`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: wordData.id,
        date: wordData.date,
        language: wordData.language,
        word: wordData.word,
        pronunciation: wordData.pronunciation,
        partOfSpeech: wordData.part_of_speech,
        definitions: wordData.definitions,
        staticContent: wordData.llm_content,
        generatedAt: wordData.generated_at
      },
      userPreferences: {
        preferredLanguage,
        userId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching personalized Word of Day:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}