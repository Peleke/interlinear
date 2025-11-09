-- Migration: Make course_id nullable for standalone lessons
-- Created: 2025-11-09
-- Epic: EPIC-04 (Authoring UI)
-- Description: Allow lessons to exist without being part of a course

-- =============================================================================
-- LESSON TABLE MODIFICATIONS
-- =============================================================================

-- Make course_id nullable to support standalone lessons
ALTER TABLE public.lessons
  ALTER COLUMN course_id DROP NOT NULL;

-- Drop the unique constraint that required course_id
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_course_id_sequence_order_key;

-- Add a new partial unique constraint: unique sequence_order within course (when course_id is not null)
CREATE UNIQUE INDEX idx_lessons_course_sequence
  ON public.lessons(course_id, sequence_order)
  WHERE course_id IS NOT NULL;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.lessons.course_id IS 'Course this lesson belongs to. NULL for standalone lessons.';
