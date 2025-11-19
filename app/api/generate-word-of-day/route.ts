import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSpanishWordOfDay, generateLatinWordOfDay } from '@/lib/mastra/tools/wordOfDay';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const MERRIAM_WEBSTER_API_KEY = process.env.MERRIAM_WEBSTER_API_KEY;
    const { language = 'spanish', date = new Date().toISOString().split('T')[0] } = await request.json();

    if (!['spanish', 'latin'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language. Use "spanish" or "latin"' }, { status: 400 });
    }

    console.log(`🎲 Generating Word of Day for ${language} on ${date}`);

    // Check if word already exists for this date/language
    const { data: existing } = await supabase
      .from('daily_words')
      .select('*')
      .eq('date', date)
      .eq('language', language)
      .single();

    if (existing) {
      console.log(`📚 Word already exists for ${date} (${language}): ${existing.word}`);
      return NextResponse.json({
        success: true,
        message: 'Word already exists for this date',
        data: existing
      });
    }

    let wordData;

    if (language === 'spanish') {
      // Spanish: Use MW API + LLM workflow
      wordData = await generateSpanishWord(date);
    } else {
      // Latin: Full LLM generation workflow
      wordData = await generateLatinWord(date);
    }

    // Store in database with separated content structure
    const { data: savedWord, error } = await supabase
      .from('daily_words')
      .insert({
        date,
        language,
        word: wordData.word,
        pronunciation: wordData.pronunciation,
        part_of_speech: wordData.partOfSpeech,
        definitions: wordData.definitions,
        static_content: wordData.staticContent, // Etymology, usage notes (not examples)
        source_data: wordData.sourceData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save word: ${error.message}`);
    }

    console.log(`✅ Saved Word of Day: ${wordData.word}`);

    return NextResponse.json({
      success: true,
      message: 'Word of Day generated successfully',
      data: savedWord
    });

  } catch (error) {
    console.error('❌ Error generating Word of Day:', error);
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

async function generateSpanishWord(date: string) {
  try {
    // Use direct function call (bypass hanging workflow)
    const result = await generateSpanishWordOfDay({ date });

    if (!result.success) {
      throw new Error(result.error || 'Spanish word generation failed');
    }

    return result.data;
  } catch (error) {
    console.error('❌ Error in generateSpanishWord:', error);
    throw error;
  }
}

async function generateLatinWord(date: string) {
  try {
    // Use direct function call (bypass hanging workflow)
    const result = await generateLatinWordOfDay({ date });

    if (!result.success) {
      throw new Error(result.error || 'Latin word generation failed');
    }

    return result.data;
  } catch (error) {
    console.error('❌ Error in generateLatinWord:', error);
    throw error;
  }
}

// Helper functions for MW API data extraction
function extractPronunciation(mwData: any): string | null {
  if (!mwData || !Array.isArray(mwData) || mwData.length === 0) return null;
  const entry = mwData[0];
  return entry.hwi?.prs?.[0]?.mw || null;
}

function extractPartOfSpeech(mwData: any): string | null {
  if (!mwData || !Array.isArray(mwData) || mwData.length === 0) return null;
  const entry = mwData[0];
  return entry.fl || null;
}

function extractDefinitions(mwData: any): string[] | null {
  if (!mwData || !Array.isArray(mwData) || mwData.length === 0) return null;
  const entry = mwData[0];
  return entry.shortdef ? entry.shortdef.slice(0, 3) : null;
}

function generateStaticSpanishContent(word: string, mwData: any): string {
  // Generate static etymology/usage content (not examples)
  return `## 📚 Etimología y Origen
Esta palabra española tiene raíces interesantes en la evolución del idioma.

## 💡 Notas de Uso
Información sobre cómo usar "${word}" de manera efectiva en el español moderno.

*Ejemplos dinámicos disponibles con el botón de refrescar.*`;
}