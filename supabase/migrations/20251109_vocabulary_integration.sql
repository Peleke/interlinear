-- Migration: Vocabulary Integration (EPIC-02 Stories 2.1 & 2.2)
-- Created: 2025-11-09
-- Description: Add language support and lesson tracking to vocabulary tables
--
-- GitHub Issues:
-- - Story 2.1: Lesson Vocabulary Language Support
-- - Story 2.2: User Vocabulary Lesson Tracking

-- =============================================================================
-- STORY 2.1: LESSON VOCABULARY ITEMS - LANGUAGE SUPPORT
-- =============================================================================

-- Add language column for multi-language support (Spanish, Icelandic)
ALTER TABLE public.lesson_vocabulary_items
  ADD COLUMN language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'is'));

-- Add usage count to track how many lessons use this word
ALTER TABLE public.lesson_vocabulary_items
  ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;

-- Add created_by to track who created the vocab item
ALTER TABLE public.lesson_vocabulary_items
  ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old unique constraint (spanish, english)
ALTER TABLE public.lesson_vocabulary_items
  DROP CONSTRAINT lesson_vocabulary_items_spanish_english_key;

-- Add new unique constraint including language
-- This allows same spanish/english pair in different languages
ALTER TABLE public.lesson_vocabulary_items
  ADD CONSTRAINT lesson_vocabulary_items_unique_per_language
    UNIQUE (spanish, english, language);

-- Create index on language for filtering
CREATE INDEX idx_lesson_vocabulary_items_language
  ON public.lesson_vocabulary_items(language);

-- Create index on usage_count for sorting popular words
CREATE INDEX idx_lesson_vocabulary_items_usage_count
  ON public.lesson_vocabulary_items(usage_count DESC);

-- Create composite index for autocomplete queries
CREATE INDEX idx_lesson_vocabulary_items_search
  ON public.lesson_vocabulary_items(language, spanish text_pattern_ops, usage_count DESC);

-- =============================================================================
-- STORY 2.2: USER VOCABULARY - LESSON TRACKING
-- =============================================================================

-- Note: user vocabulary table uses column name 'word' not 'spanish'
-- We need to preserve backwards compatibility

-- Add language column
ALTER TABLE public.vocabulary
  ADD COLUMN language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'is'));

-- Add source_lesson_id to track which lesson introduced this word
ALTER TABLE public.vocabulary
  ADD COLUMN source_lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL;

-- Add lesson_vocabulary_id to link to lesson vocab item
ALTER TABLE public.vocabulary
  ADD COLUMN lesson_vocabulary_id UUID
    REFERENCES public.lesson_vocabulary_items(id) ON DELETE SET NULL;

-- Add learned_from_lesson flag (auto-populated vs manual click)
ALTER TABLE public.vocabulary
  ADD COLUMN learned_from_lesson BOOLEAN NOT NULL DEFAULT false;

-- Add spanish and english columns for consistency with lesson vocab
-- These will store the same data as 'word' and definition->translations
-- but make queries simpler
ALTER TABLE public.vocabulary
  ADD COLUMN spanish TEXT;

ALTER TABLE public.vocabulary
  ADD COLUMN english TEXT;

-- Backfill spanish/english from existing data
-- word contains the spanish term
-- definition is JSONB, need to handle nested structure properly
UPDATE public.vocabulary
SET
  spanish = word,
  english = COALESCE(
    definition->'translations'->>0,  -- JSONB -> operator for array access
    definition->>'translation',      -- Direct field access
    'translation missing'
  )
WHERE spanish IS NULL OR english IS NULL;

-- Make spanish/english NOT NULL after backfill
ALTER TABLE public.vocabulary
  ALTER COLUMN spanish SET NOT NULL;

ALTER TABLE public.vocabulary
  ALTER COLUMN english SET NOT NULL;

-- Drop old unique constraint (user_id, word)
ALTER TABLE public.vocabulary
  DROP CONSTRAINT vocabulary_user_id_word_key;

-- Add new unique constraint with language
-- User can have same word in different languages
ALTER TABLE public.vocabulary
  ADD CONSTRAINT vocabulary_unique_per_language
    UNIQUE (user_id, word, language);

-- Create indexes for new columns
CREATE INDEX idx_vocabulary_language
  ON public.vocabulary(language);

CREATE INDEX idx_vocabulary_source_lesson
  ON public.vocabulary(source_lesson_id)
  WHERE source_lesson_id IS NOT NULL;

CREATE INDEX idx_vocabulary_lesson_vocab
  ON public.vocabulary(lesson_vocabulary_id)
  WHERE lesson_vocabulary_id IS NOT NULL;

CREATE INDEX idx_vocabulary_learned_from_lesson
  ON public.vocabulary(learned_from_lesson)
  WHERE learned_from_lesson = true;

-- Composite index for common queries
CREATE INDEX idx_vocabulary_user_language
  ON public.vocabulary(user_id, language);

-- =============================================================================
-- BACKFILL EXISTING DATA
-- =============================================================================

-- Backfill lesson_vocabulary_items: all existing items are Spanish
UPDATE public.lesson_vocabulary_items
SET language = 'es'
WHERE language = 'es'; -- Already defaulted, but explicit for clarity

-- Backfill vocabulary: all existing user vocab is Spanish
UPDATE public.vocabulary
SET language = 'es'
WHERE language = 'es'; -- Already defaulted, but explicit for clarity

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.lesson_vocabulary_items.language IS 'Lesson vocabulary language: es (Spanish) | is (Icelandic)';
COMMENT ON COLUMN public.lesson_vocabulary_items.usage_count IS 'Number of lessons using this vocabulary item';
COMMENT ON COLUMN public.lesson_vocabulary_items.created_by_user_id IS 'User who created this vocab item (NULL for system-created)';

COMMENT ON COLUMN public.vocabulary.language IS 'User vocabulary language: es (Spanish) | is (Icelandic)';
COMMENT ON COLUMN public.vocabulary.source_lesson_id IS 'Lesson that introduced this word (NULL if manually added)';
COMMENT ON COLUMN public.vocabulary.lesson_vocabulary_id IS 'Link to lesson vocab item (NULL if manually added)';
COMMENT ON COLUMN public.vocabulary.learned_from_lesson IS 'True if auto-populated from lesson completion, false if manually clicked';
COMMENT ON COLUMN public.vocabulary.spanish IS 'Spanish word/phrase (denormalized from word for consistency)';
COMMENT ON COLUMN public.vocabulary.english IS 'English translation (denormalized from definition for consistency)';
