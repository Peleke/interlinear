# Vocabulary Integration Specification (Option B: Linked Vocabulary)

**Goal**: Connect lesson vocabulary to user vocabulary for intelligent authoring and automatic learner tracking

**Approach**: Linked vocabulary with language support (Icelandic-ready)

---

## Schema Changes

### 1. Add Language Support to Both Vocab Tables

```sql
-- Migration: Add language support and lesson tracking
-- File: supabase/migrations/YYYYMMDD_vocabulary_integration.sql

-- ============================================================================
-- LESSON VOCABULARY: Add language support
-- ============================================================================
ALTER TABLE public.lesson_vocabulary_items
  ADD COLUMN language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'is')),  -- Spanish, Icelandic (add more as needed)
  ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0,  -- How many lessons use this word
  ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);  -- Track who created it

-- Update unique constraint to include language
ALTER TABLE public.lesson_vocabulary_items
  DROP CONSTRAINT lesson_vocabulary_items_spanish_english_key;

ALTER TABLE public.lesson_vocabulary_items
  ADD CONSTRAINT lesson_vocabulary_items_unique_per_language
    UNIQUE(spanish, english, language);

-- Index for language filtering
CREATE INDEX idx_lesson_vocabulary_items_language
  ON public.lesson_vocabulary_items(language);

-- ============================================================================
-- USER VOCABULARY: Add lesson tracking and language support
-- ============================================================================
ALTER TABLE public.vocabulary
  ADD COLUMN language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'is')),
  ADD COLUMN source_lesson_id TEXT REFERENCES public.lessons(id),  -- Which lesson introduced this
  ADD COLUMN lesson_vocabulary_id UUID REFERENCES public.lesson_vocabulary_items(id),  -- Link to lesson vocab
  ADD COLUMN learned_from_lesson BOOLEAN DEFAULT false;  -- True if auto-added from lesson completion

-- Update unique constraint to include language
ALTER TABLE public.vocabulary
  DROP CONSTRAINT vocabulary_user_id_word_key;

ALTER TABLE public.vocabulary
  ADD CONSTRAINT vocabulary_unique_per_language
    UNIQUE(user_id, word, language);

-- Indexes for new queries
CREATE INDEX idx_vocabulary_language ON public.vocabulary(language);
CREATE INDEX idx_vocabulary_source_lesson ON public.vocabulary(source_lesson_id);
CREATE INDEX idx_vocabulary_lesson_vocab_id ON public.vocabulary(lesson_vocabulary_id);

-- ============================================================================
-- JUNCTION TABLE: Track lesson vocab reuse
-- ============================================================================
-- Add metadata to lesson_vocabulary junction
ALTER TABLE public.lesson_vocabulary
  ADD COLUMN introduced_order INTEGER,  -- Order introduced in lesson (for first-time words)
  ADD COLUMN notes TEXT;  -- Author notes about why this vocab is here

-- ============================================================================
-- TRIGGER: Update usage_count when vocab is linked to lessons
-- ============================================================================
CREATE OR REPLACE FUNCTION update_vocab_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lesson_vocabulary_items
    SET usage_count = usage_count + 1
    WHERE id = NEW.vocabulary_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lesson_vocabulary_items
    SET usage_count = usage_count - 1
    WHERE id = OLD.vocabulary_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocab_usage_count_trigger
  AFTER INSERT OR DELETE ON public.lesson_vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION update_vocab_usage_count();

-- ============================================================================
-- RLS UPDATES: Allow authors to see vocab stats
-- ============================================================================
-- Authors can see usage_count and created_by info
-- (Existing SELECT policies already allow this)

```

---

## API Endpoints (New/Modified)

### Vocabulary Autocomplete for Authoring

```typescript
// File: app/api/lessons/vocabulary/search/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const language = searchParams.get('language') || 'es'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Search lesson_vocabulary_items
  const { data, error } = await supabase
    .from('lesson_vocabulary_items')
    .select('*, usage_count')
    .eq('language', language)
    .or(`spanish.ilike.%${query}%,english.ilike.%${query}%`)
    .order('usage_count', { ascending: false })  // Most-used first
    .limit(10)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    suggestions: data.map(item => ({
      ...item,
      reusable: item.usage_count > 0,
      badge: item.usage_count > 0 ? `Used in ${item.usage_count} lesson${item.usage_count > 1 ? 's' : ''}` : null
    }))
  })
}
```

### Populate User Vocabulary on Lesson Completion

```typescript
// File: app/api/lessons/[id]/complete/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const lessonId = params.id

  // 1. Get all vocabulary from this lesson
  const { data: lessonVocab, error: vocabError } = await supabase
    .from('lesson_vocabulary')
    .select(`
      vocabulary_id,
      lesson_vocabulary_items!inner(
        spanish,
        english,
        language,
        part_of_speech
      )
    `)
    .eq('lesson_id', lessonId)

  if (vocabError) return Response.json({ error: vocabError.message }, { status: 500 })

  // 2. Insert into user vocabulary (upsert to avoid duplicates)
  const vocabToInsert = lessonVocab.map(item => ({
    user_id: user.id,
    word: item.lesson_vocabulary_items.spanish,
    language: item.lesson_vocabulary_items.language,
    source_lesson_id: lessonId,
    lesson_vocabulary_id: item.vocabulary_id,
    learned_from_lesson: true,
    click_count: 0,  // Will increment if user clicks in reader
    definition: null,  // Will populate if user looks up
  }))

  const { error: insertError } = await supabase
    .from('vocabulary')
    .upsert(vocabToInsert, {
      onConflict: 'user_id,word,language',
      ignoreDuplicates: true  // Don't overwrite if already exists
    })

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  // 3. Mark lesson as completed (existing logic would go here)
  // ... your existing completion logic ...

  return Response.json({
    success: true,
    vocabularyAdded: vocabToInsert.length
  })
}
```

---

## Frontend Integration

### VocabularyManager Component (Authoring UI)

```tsx
// File: components/author/VocabularyManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface VocabSuggestion {
  id: string
  spanish: string
  english: string
  usage_count: number
  reusable: boolean
  badge: string | null
}

export function VocabularyManager({
  lessonId,
  language = 'es'
}: {
  lessonId: string
  language?: 'es' | 'is'
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<VocabSuggestion[]>([])
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([])
      return
    }

    fetch(`/api/lessons/vocabulary/search?q=${debouncedSearch}&language=${language}`)
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions))
  }, [debouncedSearch, language])

  const addVocab = async (vocab: VocabSuggestion) => {
    // POST to /api/lessons/:id/vocabulary
    await fetch(`/api/lessons/${lessonId}/vocabulary`, {
      method: 'POST',
      body: JSON.stringify({
        vocabulary_id: vocab.id,  // Reuse existing
        is_new: vocab.usage_count === 0  // Mark as new if never used
      })
    })
  }

  return (
    <div className="vocabulary-manager">
      <input
        type="text"
        placeholder={`Search ${language === 'es' ? 'Spanish' : 'Icelandic'} vocabulary...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map(suggestion => (
            <li key={suggestion.id} onClick={() => addVocab(suggestion)}>
              <span className="word">{suggestion.spanish}</span>
              <span className="translation">{suggestion.english}</span>
              {suggestion.badge && (
                <span className="badge reused">⭐ {suggestion.badge}</span>
              )}
              {!suggestion.reusable && (
                <span className="badge new">✨ New word</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Existing vocab list, add new vocab form, etc. */}
    </div>
  )
}
```

### Language Selector in Lesson Metadata

```tsx
// File: components/author/MetadataPanel.tsx
export function MetadataPanel({ lessonId }: { lessonId: string }) {
  return (
    <div className="metadata-panel">
      <label>
        Language
        <select name="language">
          <option value="es">Spanish</option>
          <option value="is">Icelandic</option>
        </select>
      </label>

      {/* Other metadata fields... */}
    </div>
  )
}
```

---

## VocabularyService Updates

```typescript
// File: lib/vocabulary.ts (additions)

export class VocabularyService {
  // ... existing methods ...

  /**
   * Get vocabulary from a specific lesson
   */
  static async getByLesson(lessonId: string): Promise<VocabularyEntry[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get vocabulary by language
   */
  static async getByLanguage(language: 'es' | 'is'): Promise<VocabularyEntry[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('language', language)
      .order('last_seen', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Save word to vocabulary (updated to support language)
   */
  static async saveWord(
    word: string,
    definition?: DictionaryResponse,
    sourceTextId?: string,
    originalSentence?: string,
    language: 'es' | 'is' = 'es',  // NEW PARAM
    lessonVocabId?: string  // NEW PARAM - link to lesson vocab if from lesson
  ): Promise<VocabularyEntry> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const normalizedWord = word.toLowerCase()

    // Check if word exists for this language
    const { data: existing } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', normalizedWord)
      .eq('language', language)
      .maybeSingle()

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('vocabulary')
        .update({
          click_count: existing.click_count + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(definition && { definition }),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: user.id,
          word: normalizedWord,
          language,
          definition: definition || null,
          click_count: 1,
          lesson_vocabulary_id: lessonVocabId || null,
          source_text_id: null,
          original_sentence: originalSentence,
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}
```

---

## Analytics Queries (Author Intelligence)

### Show which lessons use a vocabulary word

```sql
-- Query: Get all lessons using a specific vocabulary item
SELECT
  l.id,
  l.title,
  lv.is_new,
  l.sequence_order
FROM lesson_vocabulary lv
JOIN lessons l ON lv.lesson_id = l.id
WHERE lv.vocabulary_id = :vocab_id
ORDER BY l.sequence_order;
```

### Show vocabulary reuse statistics

```sql
-- Query: Find most reused vocabulary items
SELECT
  lvi.spanish,
  lvi.english,
  lvi.usage_count,
  lvi.language,
  COUNT(DISTINCT v.user_id) as learned_by_users
FROM lesson_vocabulary_items lvi
LEFT JOIN vocabulary v ON v.lesson_vocabulary_id = lvi.id
WHERE lvi.language = :language
GROUP BY lvi.id
ORDER BY lvi.usage_count DESC
LIMIT 20;
```

### Show lesson completion vocab impact

```sql
-- Query: How many users learned vocab from this lesson
SELECT
  l.title,
  COUNT(DISTINCT v.user_id) as users_learned,
  COUNT(DISTINCT v.word) as unique_words
FROM lessons l
JOIN vocabulary v ON v.source_lesson_id = l.id
WHERE v.learned_from_lesson = true
GROUP BY l.id
ORDER BY users_learned DESC;
```

---

## Migration Strategy

### Step 1: Schema Migration (Non-Breaking)
```bash
# Run migration to add new columns (all have defaults)
npm run supabase:migration:apply
```

### Step 2: Backfill Existing Data (Optional)
```sql
-- Set language='es' for all existing Spanish content
UPDATE lesson_vocabulary_items SET language = 'es';
UPDATE vocabulary SET language = 'es';
```

### Step 3: Update VocabularyService
- Add `language` parameter to `saveWord()`
- Existing calls default to `'es'` (backward compatible)

### Step 4: Update Lesson Completion Flow
- Integrate `/api/lessons/:id/complete` endpoint
- Auto-populate user vocabulary on completion

### Step 5: Author UI Enhancements
- Add language selector to lesson metadata
- Implement vocabulary autocomplete with reuse badges
- Show "Already in N lessons" indicators

---

## Future Enhancements (Path to Option C)

When ready for **Option C (Master Vocabulary Database)**:

1. Create `master_vocabulary` table
2. Migrate `lesson_vocabulary_items` → `master_vocabulary`
3. Add FK from both `lesson_vocabulary_items` and `vocabulary` → `master_vocabulary`
4. Enable AI-generated examples, audio, frequency data
5. Build "Shared Vocabulary Intelligence" features

This migration path is seamless because we're already linking the two vocab systems!

---

## Benefits Summary

✅ **For Authors:**
- See which vocab is already in other lessons
- Autocomplete suggestions ranked by usage
- Avoid duplicate/similar vocab entries
- Language support (Icelandic ready)

✅ **For Learners:**
- Automatic vocab tracking on lesson completion
- See which lesson introduced each word
- Filter vocab by language
- Spaced repetition opportunities (old lesson vocab)

✅ **For Analytics:**
- Track vocab reuse across lessons
- See which words students struggle with
- Optimize lesson difficulty based on vocab data

✅ **For Future Features:**
- Social learning: Compare vocab with friends
- Teacher dashboards: Class vocab analytics
- Adaptive lessons: Skip known vocab
- Multi-language support: Seamless Icelandic integration
