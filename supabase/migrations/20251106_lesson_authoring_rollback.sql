-- Rollback Migration: Lesson Authoring Foundation
-- Created: 2025-11-06
-- Purpose: Revert EPIC-01 changes (Stories 1.1-1.4)
--
-- USE WITH CAUTION: This will remove status, author_id, language columns
-- and all RLS policies. Only use if absolutely necessary.

-- =============================================================================
-- REMOVE RLS POLICIES (Story 1.3 & 1.4)
-- =============================================================================

-- Lessons table policies
DROP POLICY IF EXISTS "Authors can view own draft lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can update own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can delete own draft lessons" ON public.lessons;

-- Component table policies
DROP POLICY IF EXISTS "Users can view lesson dialogs" ON public.lesson_dialogs;
DROP POLICY IF EXISTS "Authors can manage lesson dialogs" ON public.lesson_dialogs;
DROP POLICY IF EXISTS "Users can view dialog exchanges" ON public.dialog_exchanges;
DROP POLICY IF EXISTS "Authors can manage dialog exchanges" ON public.dialog_exchanges;
DROP POLICY IF EXISTS "Users can view lesson vocabulary" ON public.lesson_vocabulary;
DROP POLICY IF EXISTS "Authors can manage lesson vocabulary" ON public.lesson_vocabulary;
DROP POLICY IF EXISTS "Users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authors can manage exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view lesson grammar" ON public.lesson_grammar_concepts;
DROP POLICY IF EXISTS "Authors can manage lesson grammar" ON public.lesson_grammar_concepts;
DROP POLICY IF EXISTS "Users can view lesson readings" ON public.lesson_readings;
DROP POLICY IF EXISTS "Authors can manage lesson readings" ON public.lesson_readings;

-- Note: RLS remains enabled on tables, but no policies active
-- To fully disable RLS: ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- REMOVE TRIGGERS (Story 1.1)
-- =============================================================================

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;

-- Note: update_updated_at_column() function may be used by other tables,
-- so we do NOT drop it. Manual cleanup if needed:
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- =============================================================================
-- REMOVE INDEXES (Story 1.1 & 1.2)
-- =============================================================================

DROP INDEX IF EXISTS public.idx_lessons_author_status_language;
DROP INDEX IF EXISTS public.idx_lessons_language;
DROP INDEX IF EXISTS public.idx_lessons_author_id;
DROP INDEX IF EXISTS public.idx_lessons_status;

-- =============================================================================
-- REMOVE COLUMNS (Story 1.1 & 1.2)
-- =============================================================================

-- Remove language column
ALTER TABLE public.lessons
  DROP COLUMN IF EXISTS language;

-- Remove author_id column
ALTER TABLE public.lessons
  DROP COLUMN IF EXISTS author_id;

-- Remove status column
ALTER TABLE public.lessons
  DROP COLUMN IF EXISTS status;

-- Restore overview NOT NULL constraint
ALTER TABLE public.lessons
  ALTER COLUMN overview SET NOT NULL;

-- =============================================================================
-- REMOVE COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.lessons.overview IS NULL;
COMMENT ON TABLE public.lessons IS NULL;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify rollback success:
-- \d lessons  -- Should show original schema
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lessons';  -- Should be empty
