/**
 * Vocabulary Autocomplete API
 * EPIC-02 Story 2.4: Vocabulary Autocomplete API
 * GitHub Issue: TBD
 *
 * Returns vocabulary suggestions with usage counts for lesson authoring.
 * Searches lesson_vocabulary_items and ranks by popularity.
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface VocabularySuggestion {
  id: string;
  spanish: string;
  english: string;
  language: 'es' | 'is';
  usage_count: number;
  reusable: boolean;
  badge: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const language = (searchParams.get('language') || 'es') as 'es' | 'is';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50

    // Validate language
    if (!['es', 'is'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be "es" or "is".' },
        { status: 400 }
      );
    }

    // Build search query
    // Search for matches in spanish OR english, filtered by language
    const { data: items, error: searchError } = await supabase
      .from('lesson_vocabulary_items')
      .select('id, spanish, english, language, usage_count')
      .eq('language', language)
      .or(`spanish.ilike.%${query}%,english.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .order('spanish', { ascending: true }) // Secondary sort by spanish alphabetically
      .limit(limit);

    if (searchError) {
      console.error('Vocabulary search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search vocabulary' },
        { status: 500 }
      );
    }

    // Format suggestions with badges
    const suggestions: VocabularySuggestion[] = (items || []).map((item) => ({
      id: item.id,
      spanish: item.spanish,
      english: item.english,
      language: item.language as 'es' | 'is',
      usage_count: item.usage_count || 0,
      reusable: item.usage_count > 0,
      badge:
        item.usage_count > 0
          ? `Used in ${item.usage_count} lesson${item.usage_count === 1 ? '' : 's'}`
          : 'New word',
    }));

    return NextResponse.json({
      suggestions,
      query,
      language,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Unexpected error in vocabulary search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
