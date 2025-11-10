-- Rollback Migration: Vocabulary Integration (EPIC-02)
-- Created: 2025-11-09
-- Purpose: Revert EPIC-02 changes (Stories 2.1-2.3)
--
-- USE WITH CAUTION: This will remove language columns, usage counts, and triggers

-- =============================================================================
-- REMOVE TRIGGER (Story 2.3)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_update_vocabulary_usage_count ON public.lesson_vocabulary;
DROP FUNCTION IF EXISTS update_vocabulary_usage_count();

-- =============================================================================
-- REMOVE INDEXES (Stories 2.1 & 2.2)
-- =============================================================================

-- Lesson Vocabulary Items indexes
DROP INDEX IF EXISTS public.idx_lesson_vocabulary_items_search;
DROP INDEX IF EXISTS public.idx_lesson_vocabulary_items_usage_count;
DROP INDEX IF EXISTS public.idx_lesson_vocabulary_items_language;

-- User Vocabulary indexes
DROP INDEX IF EXISTS public.idx_vocabulary_user_language;
DROP INDEX IF EXISTS public.idx_vocabulary_learned_from_lesson;
DROP INDEX IF EXISTS public.idx_vocabulary_lesson_vocab;
DROP INDEX IF EXISTS public.idx_vocabulary_source_lesson;
DROP INDEX IF EXISTS public.idx_vocabulary_language;

-- =============================================================================
-- REMOVE CONSTRAINTS (Stories 2.1 & 2.2)
-- =============================================================================

-- Drop new unique constraints
ALTER TABLE public.lesson_vocabulary_items
  DROP CONSTRAINT IF EXISTS lesson_vocabulary_items_unique_per_language;

ALTER TABLE public.vocabulary
  DROP CONSTRAINT IF EXISTS vocabulary_unique_per_language;

-- =============================================================================
-- REMOVE COLUMNS - LESSON VOCABULARY ITEMS (Story 2.1)
-- =============================================================================

ALTER TABLE public.lesson_vocabulary_items
  DROP COLUMN IF EXISTS created_by_user_id;

ALTER TABLE public.lesson_vocabulary_items
  DROP COLUMN IF EXISTS usage_count;

ALTER TABLE public.lesson_vocabulary_items
  DROP COLUMN IF EXISTS language;

-- Restore old unique constraint
ALTER TABLE public.lesson_vocabulary_items
  ADD CONSTRAINT lesson_vocabulary_items_spanish_english_key
    UNIQUE (spanish, english);

-- =============================================================================
-- REMOVE COLUMNS - USER VOCABULARY (Story 2.2)
-- =============================================================================

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS english;

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS spanish;

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS learned_from_lesson;

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS lesson_vocabulary_id;

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS source_lesson_id;

ALTER TABLE public.vocabulary
  DROP COLUMN IF EXISTS language;

-- Restore old unique constraint
ALTER TABLE public.vocabulary
  ADD CONSTRAINT vocabulary_user_id_word_key
    UNIQUE (user_id, word);

-- =============================================================================
-- REMOVE COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.lesson_vocabulary_items.language IS NULL;
COMMENT ON COLUMN public.lesson_vocabulary_items.usage_count IS NULL;
COMMENT ON COLUMN public.lesson_vocabulary_items.created_by_user_id IS NULL;

COMMENT ON COLUMN public.vocabulary.language IS NULL;
COMMENT ON COLUMN public.vocabulary.source_lesson_id IS NULL;
COMMENT ON COLUMN public.vocabulary.lesson_vocabulary_id IS NULL;
COMMENT ON COLUMN public.vocabulary.learned_from_lesson IS NULL;
COMMENT ON COLUMN public.vocabulary.spanish IS NULL;
COMMENT ON COLUMN public.vocabulary.english IS NULL;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify rollback success:
-- \d lesson_vocabulary_items  -- Should show original schema
-- \d vocabulary  -- Should show original schema
-- SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_vocabulary_usage_count';  -- Should be empty
