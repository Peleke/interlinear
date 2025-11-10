-- Migration: Fix lessons RLS to allow NULL author_id (system lessons)
-- Created: 2025-11-09
-- Description: Update RLS policies to treat NULL author_id as system curriculum

-- =============================================================================
-- DROP OLD POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Authors can view own draft lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can view appropriate lessons" ON public.lessons;

-- =============================================================================
-- CREATE NEW POLICIES FOR LESSONS
-- =============================================================================

-- SELECT: Users can view their own lessons OR published lessons OR system lessons (NULL author_id)
CREATE POLICY "Users can view appropriate lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = author_id -- Own lessons (any status)
    OR status = 'published' -- All published lessons
    OR author_id IS NULL -- System curriculum (legacy lessons)
  );

-- INSERT: User must be author (no NULL allowed for new lessons)
-- (Keep existing policy)

-- UPDATE: Users can ONLY update their own lessons (NOT system lessons)
DROP POLICY IF EXISTS "Authors can update own lessons" ON public.lessons;
CREATE POLICY "Authors can update own lessons"
  ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- DELETE: Users can ONLY delete their own draft lessons (NOT system lessons)
DROP POLICY IF EXISTS "Authors can delete own draft lessons" ON public.lessons;
CREATE POLICY "Authors can delete own draft lessons"
  ON public.lessons
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id AND status = 'draft'
  );

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Users can view appropriate lessons" ON public.lessons IS
  'Users see: own lessons (any status), all published lessons, and system curriculum (author_id IS NULL)';

COMMENT ON POLICY "Authors can update own lessons" ON public.lessons IS
  'Users can ONLY edit their own lessons. System lessons (author_id IS NULL) are read-only.';

COMMENT ON POLICY "Authors can delete own draft lessons" ON public.lessons IS
  'Users can ONLY delete their own draft lessons. System lessons (author_id IS NULL) cannot be deleted.';
