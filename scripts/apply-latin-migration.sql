-- Apply Latin language support migration manually
-- This script can be run directly in your database

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

-- Update comments to reflect Latin support
COMMENT ON COLUMN public.lessons.language IS 'Lesson language: es (Spanish) | is (Icelandic) | la (Latin)';
COMMENT ON COLUMN public.courses.language IS 'Course language: es (Spanish) | is (Icelandic) | la (Latin)';

-- Verify the constraints were applied
SELECT conname, consrc FROM pg_constraint WHERE conname LIKE '%language_check%';