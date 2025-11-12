-- Migration: Add Latin language support
-- Created: 2025-11-12
-- Epic: EPIC-07 (LLM Content Generation)
-- Description: Add Latin ('la') to language constraints across the schema

-- =============================================================================
-- LESSONS TABLE - Add Latin support
-- =============================================================================

-- Drop the existing language constraint
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_language_check;

-- Add new constraint that includes Latin
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_language_check
    CHECK (language IN ('es', 'is', 'la'));

-- =============================================================================
-- COURSES TABLE - Add Latin support
-- =============================================================================

-- Check if courses table has language constraint and update it
ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_language_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_language_check
    CHECK (language IN ('es', 'is', 'la'));

-- =============================================================================
-- LIBRARY_READINGS TABLE - Add Latin support (if exists)
-- =============================================================================

-- Update library readings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_readings') THEN
    ALTER TABLE public.library_readings
      DROP CONSTRAINT IF EXISTS library_readings_language_check;

    ALTER TABLE public.library_readings
      ADD CONSTRAINT library_readings_language_check
        CHECK (language IN ('es', 'is', 'la', 'en'));
  END IF;
END $$;

-- =============================================================================
-- VOCABULARY TABLES - Add Latin support
-- =============================================================================

-- Update lesson_vocabulary_items if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_vocabulary_items') THEN
    ALTER TABLE public.lesson_vocabulary_items
      DROP CONSTRAINT IF EXISTS lesson_vocabulary_items_language_check;

    ALTER TABLE public.lesson_vocabulary_items
      ADD CONSTRAINT lesson_vocabulary_items_language_check
        CHECK (language IN ('es', 'is', 'la'));
  END IF;
END $$;

-- =============================================================================
-- DIALOG TABLES - Add Latin support
-- =============================================================================

-- Update dialog exchanges if they have language constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dialog_exchanges') THEN
    -- Dialog exchanges typically have the target language (Spanish, Latin)
    -- Check if there's a constraint and update it
    ALTER TABLE public.dialog_exchanges
      DROP CONSTRAINT IF EXISTS dialog_exchanges_language_check;

    -- Note: Dialog exchanges don't typically have a language column
    -- They have spanish/english columns instead
    -- This is just a safety check
  END IF;
END $$;

-- =============================================================================
-- EXERCISES TABLES - Add Latin support
-- =============================================================================

-- Note: The exercises table doesn't have a direct language column
-- Language is inherited from the parent lesson
-- No changes needed here

-- =============================================================================
-- UPDATE COMMENTS AND DOCUMENTATION
-- =============================================================================

-- Update comments to reflect Latin support
COMMENT ON COLUMN public.lessons.language IS 'Lesson language: es (Spanish) | is (Icelandic) | la (Latin)';
COMMENT ON COLUMN public.courses.language IS 'Course language: es (Spanish) | is (Icelandic) | la (Latin)';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- This query can be used to verify the constraints were applied correctly
-- SELECT conname, consrc FROM pg_constraint WHERE conname LIKE '%language_check%';