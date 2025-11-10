# EPIC-02: Vocabulary Integration - Migration Guide

## Overview

Two migrations to apply for EPIC-02 (Stories 2.1, 2.2, 2.3):

1. **20251109_vocabulary_integration.sql** - Language support & lesson tracking
2. **20251109_vocabulary_usage_count_trigger.sql** - Auto-increment usage counts

## Application Methods

### Method 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/20251109_vocabulary_integration.sql`
3. Paste and run
4. Copy content from `supabase/migrations/20251109_vocabulary_usage_count_trigger.sql`
5. Paste and run

### Method 2: psql / Database Tool

```bash
# If you have direct database access
psql $DATABASE_URL < supabase/migrations/20251109_vocabulary_integration.sql
psql $DATABASE_URL < supabase/migrations/20251109_vocabulary_usage_count_trigger.sql
```

### Method 3: Supabase CLI (when linked)

```bash
npx supabase db push
```

## What Changes

### lesson_vocabulary_items Table
**New Columns:**
- `language` TEXT ('es'|'is') - defaults to 'es'
- `usage_count` INTEGER - tracks lesson usage
- `created_by_user_id` UUID - who created this vocab

**Constraint Changes:**
- Old: UNIQUE(spanish, english)
- New: UNIQUE(spanish, english, language)

**New Indexes:**
- `idx_lesson_vocabulary_items_language`
- `idx_lesson_vocabulary_items_usage_count`
- `idx_lesson_vocabulary_items_search` (composite)

### vocabulary Table (User Vocab)
**New Columns:**
- `language` TEXT ('es'|'is') - defaults to 'es'
- `source_lesson_id` TEXT - which lesson introduced this word
- `lesson_vocabulary_id` UUID - link to lesson vocab item
- `learned_from_lesson` BOOLEAN - auto-populated vs manual
- `spanish` TEXT - denormalized from `word`
- `english` TEXT - denormalized from `definition`

**Constraint Changes:**
- Old: UNIQUE(user_id, word)
- New: UNIQUE(user_id, word, language)

**New Indexes:**
- `idx_vocabulary_language`
- `idx_vocabulary_source_lesson`
- `idx_vocabulary_lesson_vocab`
- `idx_vocabulary_learned_from_lesson`
- `idx_vocabulary_user_language` (composite)

### Triggers
**New Function:** `update_vocabulary_usage_count()`
- Auto-increments `usage_count` when vocab linked to lesson
- Auto-decrements when unlinked

**New Trigger:** `trigger_update_vocabulary_usage_count`
- Fires on INSERT/DELETE in `lesson_vocabulary` table

## Verification

### After Migration 1
```sql
-- Check lesson_vocabulary_items schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_vocabulary_items'
  AND column_name IN ('language', 'usage_count', 'created_by_user_id')
ORDER BY column_name;

-- Check vocabulary schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vocabulary'
  AND column_name IN ('language', 'source_lesson_id', 'spanish', 'english')
ORDER BY column_name;
```

### After Migration 2
```sql
-- Verify trigger exists
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_vocabulary_usage_count';

-- Verify usage counts are correct
SELECT
  lvi.spanish,
  lvi.english,
  lvi.usage_count,
  (SELECT COUNT(*) FROM lesson_vocabulary WHERE vocabulary_id = lvi.id) AS actual_count
FROM lesson_vocabulary_items lvi
WHERE lvi.usage_count > 0
LIMIT 10;
```

## Rollback

If needed, run:
```sql
-- File: supabase/migrations/20251109_vocabulary_integration_rollback.sql
```

**Warning**: Rollback will:
- Remove all language columns
- Remove usage counts
- Remove lesson tracking
- Restore old unique constraints
- Delete trigger

## Testing Checklist

After migration:
- [ ] Can create Spanish vocab (language='es')
- [ ] Can create Icelandic vocab (language='is')
- [ ] Usage count increments when vocab linked to lesson
- [ ] Usage count decrements when unlinked
- [ ] User can have same word in different languages
- [ ] Existing data still accessible (backfilled to 'es')

## Next Steps

1. Apply migrations
2. Run verification queries
3. Update GitHub issues #13-18 (EPIC-02 stories)
4. Begin Story 2.4: Vocabulary Autocomplete API
