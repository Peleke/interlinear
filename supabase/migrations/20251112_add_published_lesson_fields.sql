-- Add published lesson fields to support publishing workflow
-- Related to Issue #48: Lesson Publish System (Phase 2)

-- Add published lesson tracking fields
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_published_at ON public.lessons(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_author_id ON public.lessons(author_id);

-- Add RLS policy for published lesson visibility
-- Authors can see all their lessons (published and unpublished)
-- Learners can only see published lessons

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authors can view all their lessons" ON public.lessons;
DROP POLICY IF EXISTS "Learners can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can edit their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authors can delete their own lessons" ON public.lessons;

-- Create comprehensive RLS policies
CREATE POLICY "Authors can view all their lessons" ON public.lessons
  FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Learners can view published lessons" ON public.lessons
  FOR SELECT
  USING (
    published_at IS NOT NULL
    AND author_id != auth.uid()
  );

CREATE POLICY "Authors can edit their own unpublished lessons" ON public.lessons
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND published_at IS NULL
  )
  WITH CHECK (
    author_id = auth.uid()
    AND published_at IS NULL
  );

CREATE POLICY "Authors can delete their own unpublished lessons" ON public.lessons
  FOR DELETE
  USING (
    author_id = auth.uid()
    AND published_at IS NULL
  );

CREATE POLICY "Authors can insert lessons" ON public.lessons
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Enable RLS on lessons table
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON COLUMN public.lessons.published_at IS 'Timestamp when lesson was published. NULL means unpublished/draft.';
COMMENT ON COLUMN public.lessons.published_by IS 'User ID who published the lesson. Can be different from author_id if admins publish.';
COMMENT ON COLUMN public.lessons.version IS 'Version number for lesson revisions. Increments on republish.';
COMMENT ON COLUMN public.lessons.author_id IS 'User ID of lesson author/creator.';