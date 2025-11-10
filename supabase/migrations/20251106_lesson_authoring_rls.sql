-- Migration: Lesson Authoring RLS Policies
-- Created: 2025-11-06
-- Epic: EPIC-01.3 & EPIC-01.4
-- Description: Row-level security for draft/published lessons and components
--
-- Issue: #10 (Author Permission RLS Policies)
-- Issue: #11 (Component Table RLS Updates)

-- =============================================================================
-- LESSONS TABLE RLS POLICIES
-- =============================================================================

-- Enable RLS on lessons table (if not already enabled)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (if any)
DROP POLICY IF EXISTS "Authors can view own draft lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can update own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can delete own draft lessons" ON public.lessons;

-- SELECT: Authors see their own drafts + everyone sees published
CREATE POLICY "Authors can view own draft lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = author_id OR status = 'published'
  );

-- INSERT: Authenticated users can create lessons (author_id must be self)
CREATE POLICY "Authors can create lessons"
  ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- UPDATE: Authors can only update their own lessons
CREATE POLICY "Authors can update own lessons"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- DELETE: Authors can only delete their own DRAFT lessons (not published)
CREATE POLICY "Authors can delete own draft lessons"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id AND status = 'draft'
  );

-- =============================================================================
-- COMPONENT TABLES RLS POLICIES
-- =============================================================================

-- LESSON DIALOGS
-- ============================================================================
ALTER TABLE public.lesson_dialogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lesson dialogs" ON public.lesson_dialogs;
DROP POLICY IF EXISTS "Authors can manage lesson dialogs" ON public.lesson_dialogs;

-- SELECT: Inherit lesson visibility (join with lessons table)
CREATE POLICY "Users can view lesson dialogs"
  ON public.lesson_dialogs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own lesson dialogs
CREATE POLICY "Authors can manage lesson dialogs"
  ON public.lesson_dialogs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_dialogs.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- DIALOG EXCHANGES
-- ============================================================================
ALTER TABLE public.dialog_exchanges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view dialog exchanges" ON public.dialog_exchanges;
DROP POLICY IF EXISTS "Authors can manage dialog exchanges" ON public.dialog_exchanges;

-- SELECT: Inherit dialog visibility (join through dialogs → lessons)
CREATE POLICY "Users can view dialog exchanges"
  ON public.dialog_exchanges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own dialog exchanges
CREATE POLICY "Authors can manage dialog exchanges"
  ON public.dialog_exchanges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lesson_dialogs
      JOIN public.lessons ON lessons.id = lesson_dialogs.lesson_id
      WHERE lesson_dialogs.id = dialog_exchanges.dialog_id
        AND lessons.author_id = auth.uid()
    )
  );

-- LESSON VOCABULARY (junction table)
-- ============================================================================
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lesson vocabulary" ON public.lesson_vocabulary;
DROP POLICY IF EXISTS "Authors can manage lesson vocabulary" ON public.lesson_vocabulary;

-- SELECT: Inherit lesson visibility
CREATE POLICY "Users can view lesson vocabulary"
  ON public.lesson_vocabulary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_vocabulary.lesson_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own lesson vocabulary
CREATE POLICY "Authors can manage lesson vocabulary"
  ON public.lesson_vocabulary
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_vocabulary.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_vocabulary.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- EXERCISES
-- ============================================================================
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authors can manage exercises" ON public.exercises;

-- SELECT: Inherit lesson visibility
CREATE POLICY "Users can view exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = exercises.lesson_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own exercises
CREATE POLICY "Authors can manage exercises"
  ON public.exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = exercises.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = exercises.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- LESSON GRAMMAR CONCEPTS (junction table)
-- ============================================================================
ALTER TABLE public.lesson_grammar_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lesson grammar" ON public.lesson_grammar_concepts;
DROP POLICY IF EXISTS "Authors can manage lesson grammar" ON public.lesson_grammar_concepts;

-- SELECT: Inherit lesson visibility
CREATE POLICY "Users can view lesson grammar"
  ON public.lesson_grammar_concepts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_grammar_concepts.lesson_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own lesson grammar
CREATE POLICY "Authors can manage lesson grammar"
  ON public.lesson_grammar_concepts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_grammar_concepts.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_grammar_concepts.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- LESSON READINGS (junction table)
-- ============================================================================
ALTER TABLE public.lesson_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lesson readings" ON public.lesson_readings;
DROP POLICY IF EXISTS "Authors can manage lesson readings" ON public.lesson_readings;

-- SELECT: Inherit lesson visibility
CREATE POLICY "Users can view lesson readings"
  ON public.lesson_readings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_readings.lesson_id
        AND (lessons.author_id = auth.uid() OR lessons.status = 'published')
    )
  );

-- INSERT/UPDATE/DELETE: Authors can manage their own lesson readings
CREATE POLICY "Authors can manage lesson readings"
  ON public.lesson_readings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_readings.lesson_id
        AND lessons.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_readings.lesson_id
        AND lessons.author_id = auth.uid()
    )
  );

-- =============================================================================
-- SECURITY VERIFICATION QUERIES (for testing)
-- =============================================================================

-- Run these queries to verify RLS is working correctly:
-- (Replace :user_id_a and :user_id_b with actual test user IDs)

-- Test 1: Author A can see their own drafts
-- SELECT * FROM lessons WHERE author_id = :user_id_a;

-- Test 2: Author B cannot see Author A's drafts
-- SELECT * FROM lessons WHERE author_id = :user_id_a; -- Should return empty

-- Test 3: Everyone can see published lessons
-- SELECT * FROM lessons WHERE status = 'published';

-- Test 4: Author cannot delete published lesson
-- DELETE FROM lessons WHERE id = :published_lesson_id; -- Should fail

-- Test 5: Author can delete own draft
-- DELETE FROM lessons WHERE id = :draft_lesson_id AND author_id = :user_id; -- Should succeed

COMMENT ON TABLE public.lessons IS 'Lessons with RLS: authors see own drafts, everyone sees published';
