-- Migration: Assign legacy lessons to system user
-- Created: 2025-11-09
-- Description: Updates all lessons with NULL author_id to be owned by system user

-- =============================================================================
-- ASSIGN LEGACY LESSONS TO SYSTEM USER
-- =============================================================================

-- Update all lessons without an author to be owned by system user
UPDATE public.lessons
SET author_id = '00000000-0000-0000-0000-000000000000'
WHERE author_id IS NULL;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show count of system-owned lessons
DO $$
DECLARE
  system_lesson_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO system_lesson_count
  FROM public.lessons
  WHERE author_id = '00000000-0000-0000-0000-000000000000';

  RAISE NOTICE 'System user now owns % lessons', system_lesson_count;
END $$;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.lessons IS 'Lessons table: author_id NULL = legacy (now system-owned), UUID = user-created';
