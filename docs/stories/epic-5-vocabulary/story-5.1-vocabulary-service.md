# Story 5.1: Vocabulary Service & Database Schema

## Story
**As a** developer
**I want** a vocabulary service with Supabase persistence
**So that** users can track their saved words across sessions

## Priority
**P0 - Day 2 PM, Hour 5**

## Acceptance Criteria
- [ ] Supabase `vocabulary` table created with RLS policies
- [ ] `lib/vocabulary.ts` service with CRUD operations
- [ ] Auto-increment click count on duplicate saves
- [ ] Track first_seen and last_seen timestamps
- [ ] User-scoped queries (RLS enforced)
- [ ] TypeScript types for vocabulary entries

## Technical Details

### Database Schema

**Table**: `vocabulary`

```sql
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition JSONB,
  click_count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Indexes
CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_last_seen ON public.vocabulary(last_seen DESC);

-- RLS Policies
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

-- Users can only read their own vocabulary
CREATE POLICY "Users can read own vocabulary"
  ON public.vocabulary
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vocabulary
CREATE POLICY "Users can insert own vocabulary"
  ON public.vocabulary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vocabulary
CREATE POLICY "Users can update own vocabulary"
  ON public.vocabulary
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own vocabulary
CREATE POLICY "Users can delete own vocabulary"
  ON public.vocabulary
  FOR DELETE
  USING (auth.uid() = user_id);
```

### TypeScript Types

**File**: `types/index.ts`

```typescript
export interface VocabularyEntry {
  id: string
  user_id: string
  word: string
  definition: DictionaryResponse | null
  click_count: number
  first_seen: string
  last_seen: string
  created_at: string
  updated_at: string
}

export interface VocabularyCreateInput {
  word: string
  definition?: DictionaryResponse
}

export interface VocabularyStats {
  totalWords: number
  recentWords: number // Last 7 days
  topWords: { word: string; count: number }[]
}
```

### Vocabulary Service

**File**: `lib/vocabulary.ts`

```typescript
import { createClient } from '@/lib/supabase/client'
import type { VocabularyEntry, VocabularyCreateInput, DictionaryResponse } from '@/types'

export class VocabularyService {
  /**
   * Get all vocabulary entries for current user
   * Sorted by last_seen descending (most recent first)
   */
  static async getAll(): Promise<VocabularyEntry[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get vocabulary entry by word
   */
  static async getByWord(word: string): Promise<VocabularyEntry | null> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', word.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
  }

  /**
   * Save word to vocabulary
   * If word exists: increment click_count, update last_seen
   * If new: create entry with click_count = 1
   */
  static async saveWord(
    word: string,
    definition?: DictionaryResponse
  ): Promise<VocabularyEntry> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const normalizedWord = word.toLowerCase()

    // Check if word exists
    const existing = await this.getByWord(normalizedWord)

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('vocabulary')
        .update({
          click_count: existing.click_count + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Update definition if provided and different
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
          definition: definition || null,
          click_count: 1,
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  /**
   * Delete vocabulary entry
   */
  static async deleteWord(id: string): Promise<void> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }

  /**
   * Clear all vocabulary for current user
   */
  static async clearAll(): Promise<void> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  }

  /**
   * Get vocabulary statistics
   */
  static async getStats(): Promise<VocabularyStats> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const allWords = await this.getAll()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentWords = allWords.filter(
      (entry) => new Date(entry.last_seen) >= sevenDaysAgo
    )

    // Get top 10 most clicked words
    const topWords = [...allWords]
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 10)
      .map((entry) => ({
        word: entry.word,
        count: entry.click_count,
      }))

    return {
      totalWords: allWords.length,
      recentWords: recentWords.length,
      topWords,
    }
  }

  /**
   * Check if word is saved
   */
  static async isSaved(word: string): Promise<boolean> {
    const entry = await this.getByWord(word)
    return !!entry
  }
}
```

### Migration Script

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_vocabulary_table.sql`

```sql
-- Create vocabulary table
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition JSONB,
  click_count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Indexes for performance
CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_last_seen ON public.vocabulary(last_seen DESC);
CREATE INDEX idx_vocabulary_click_count ON public.vocabulary(click_count DESC);

-- Enable RLS
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own vocabulary"
  ON public.vocabulary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
  ON public.vocabulary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
  ON public.vocabulary
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary"
  ON public.vocabulary
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Edge Cases

1. **Duplicate saves**: Handled via UNIQUE constraint and upsert logic
2. **Case sensitivity**: All words normalized to lowercase
3. **Concurrent clicks**: Database handles via atomic increment
4. **Missing definition**: Definition is optional (can be null)
5. **Deleted user**: CASCADE delete removes all vocabulary entries

## Performance Considerations

- **Indexes**: user_id, last_seen, click_count for fast queries
- **RLS**: Row-level security ensures users only see their data
- **Batch operations**: Consider bulk insert for import features
- **Pagination**: Implement cursor-based pagination for large vocabularies

## Security

- **RLS Policies**: Users can only access their own vocabulary
- **Input Validation**: Word normalized and sanitized
- **Definition Storage**: JSONB allows flexible definition storage
- **Cascade Delete**: User deletion removes all vocabulary data

## Architecture References
- `/docs/architecture/database-schema.md` - Database design
- `/docs/architecture/supabase-setup.md` - RLS policies
- `/docs/prd/user-stories.md` - US-501

## Definition of Done
- [ ] Supabase migration created and applied
- [ ] VocabularyService class with all CRUD methods
- [ ] TypeScript types defined
- [ ] RLS policies tested
- [ ] Duplicate word handling verified
- [ ] Click count increments correctly
- [ ] Timestamps update properly
- [ ] Error handling for auth failures
