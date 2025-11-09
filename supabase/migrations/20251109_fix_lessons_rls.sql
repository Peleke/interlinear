-- Migration: Fix lessons RLS to allow system lessons
-- Created: 2025-11-09
-- Description: Update RLS policies to properly handle system-owned curriculum

-- =============================================================================
-- DROP OLD POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Authors can view own draft lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

-- =============================================================================
-- CREATE NEW POLICIES FOR LESSONS
-- =============================================================================

-- SELECT: Users can view their own lessons OR published lessons (including system)
CREATE POLICY "Users can view appropriate lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = author_id -- Own lessons
    OR status = 'published' -- All published lessons (curriculum + user)
  );

-- INSERT policy remains the same (user must be author)
-- UPDATE policy remains the same (user must be author)
-- DELETE policy remains the same (user must be author of draft)

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Users can view appropriate lessons" ON public.lessons IS
  'Users see their own lessons (any status) and all published lessons (curriculum + user-created)';
