-- Migration: Epic 6 - Course Management & Lesson Organization (Fixed)
-- Created: 2025-11-10
-- Description: Modify courses table for author management, create junction table for lesson ordering
--              Uses UUID for all IDs to maintain compatibility with existing schema

-- =============================================================================
-- COURSES TABLE MODIFICATIONS (for author-based course management)
-- =============================================================================

-- Add author tracking column
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add language column for course language
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es';

-- Rename level to difficulty_level for consistency with PRD (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.courses RENAME COLUMN level TO difficulty_level;
  END IF;
END $$;

-- Drop old unique constraint on difficulty_level (learner courses had UNIQUE, author courses don't)
ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_level_key;

-- Update existing courses to have a creator (set to first user or null for now)
-- In production, you'd backfill this properly
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    UPDATE public.courses SET created_by = first_user_id WHERE created_by IS NULL;
  END IF;
END $$;

-- Make created_by NOT NULL after backfilling
ALTER TABLE public.courses
  ALTER COLUMN created_by SET NOT NULL;

-- =============================================================================
-- LESSON_COURSE_ORDERING JUNCTION TABLE (many-to-many with ordering)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_course_ordering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: lesson can only appear once per course
  UNIQUE(course_id, lesson_id),

  -- Constraint: no duplicate ordering within course
  UNIQUE(course_id, display_order)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_lesson_course_ordering_course
  ON public.lesson_course_ordering(course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_course_ordering_lesson
  ON public.lesson_course_ordering(lesson_id);

CREATE INDEX IF NOT EXISTS idx_courses_created_by
  ON public.courses(created_by);

CREATE INDEX IF NOT EXISTS idx_courses_created_at
  ON public.courses(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES - COURSES (Author Isolation)
-- =============================================================================

-- Drop old public read policies
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;

-- Enable RLS (should already be enabled, but ensure it)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Authors can view their own courses
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Authors can insert their own courses
CREATE POLICY "Users can insert own courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Authors can update their own courses
CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Authors can delete their own courses
CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES - LESSON_COURSE_ORDERING
-- =============================================================================

ALTER TABLE public.lesson_course_ordering ENABLE ROW LEVEL SECURITY;

-- Users can view lesson orderings for own courses
CREATE POLICY "Users can view lesson orderings for own courses"
  ON public.lesson_course_ordering FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- Users can manage lesson orderings for own courses
CREATE POLICY "Users can manage lesson orderings for own courses"
  ON public.lesson_course_ordering FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lesson_course_ordering.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.lesson_course_ordering IS 'Many-to-many relationship for lessons in courses with display ordering';
COMMENT ON COLUMN public.lesson_course_ordering.display_order IS 'Position of lesson within course (1-indexed)';
COMMENT ON COLUMN public.courses.created_by IS 'Author who created this course';
COMMENT ON COLUMN public.courses.language IS 'Target language for this course (es, is, etc.)';
