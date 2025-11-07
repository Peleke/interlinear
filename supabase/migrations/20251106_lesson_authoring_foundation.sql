-- Migration: Lesson Authoring Foundation
-- Created: 2025-11-06
-- Epic: EPIC-01.1 & EPIC-01.2
-- Description: Add status, author_id, and language columns to lessons table
--
-- Issue: #8 (Status & Authorship Schema)
-- Issue: #9 (Multi-Language Support Schema)

-- =============================================================================
-- LESSON TABLE MODIFICATIONS
-- =============================================================================

-- Add status column (draft|published|archived)
ALTER TABLE public.lessons
  ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived'));

-- Add author_id column (FK to auth.users)
ALTER TABLE public.lessons
  ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add language column for multi-language support (Spanish, Icelandic)
ALTER TABLE public.lessons
  ADD COLUMN language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('es', 'is'));

-- Make overview nullable (draft-first approach)
ALTER TABLE public.lessons
  ALTER COLUMN overview DROP NOT NULL;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on status for filtering (draft vs published)
CREATE INDEX idx_lessons_status ON public.lessons(status);

-- Index on author_id for author queries
CREATE INDEX idx_lessons_author_id ON public.lessons(author_id);

-- Index on language for filtering by language
CREATE INDEX idx_lessons_language ON public.lessons(language);

-- Composite index for common query: author's drafts by language
CREATE INDEX idx_lessons_author_status_language
  ON public.lessons(author_id, status, language);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

-- Create trigger function (if not exists from other migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to lessons table
DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BACKFILL EXISTING DATA
-- =============================================================================

-- Set language='es' for all existing lessons (Spanish default)
UPDATE public.lessons
SET language = 'es'
WHERE language IS NULL;

-- Note: author_id will be NULL for existing lessons
-- This is intentional - they were created before authorship tracking
-- Future enhancement: backfill with admin user if needed

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.lessons.status IS 'Lesson lifecycle: draft (author only) | published (all users) | archived (hidden)';
COMMENT ON COLUMN public.lessons.author_id IS 'User who created this lesson. NULL for legacy lessons.';
COMMENT ON COLUMN public.lessons.language IS 'Lesson language: es (Spanish) | is (Icelandic)';
COMMENT ON COLUMN public.lessons.overview IS 'Lesson overview (nullable to support draft-first workflow)';
