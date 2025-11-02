-- Migration: Lesson Content Table
-- Created: 2025-11-02
-- Description: Create lesson_content table for storing lesson content blocks

-- =============================================================================
-- LESSON CONTENT TABLE
-- =============================================================================
-- Stores content blocks for lessons (markdown, interlinear, vocabulary, grammar)
CREATE TABLE IF NOT EXISTS public.lesson_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL, -- References lessons.id (TEXT type)
  content_type TEXT NOT NULL CHECK (content_type IN ('markdown', 'interlinear', 'vocabulary', 'grammar')),
  content TEXT, -- The actual content (markdown, text, etc.)
  sequence_order INTEGER NOT NULL, -- Order of content blocks within lesson
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique sequence within each lesson
  UNIQUE(lesson_id, sequence_order)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_lesson_content_lesson_id ON public.lesson_content(lesson_id);
CREATE INDEX idx_lesson_content_sequence ON public.lesson_content(lesson_id, sequence_order);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;

-- Public read access (all authenticated users can view lesson content)
CREATE POLICY "lesson_content_select_policy"
  ON public.lesson_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "lesson_content_insert_policy"
  ON public.lesson_content
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "lesson_content_update_policy"
  ON public.lesson_content
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "lesson_content_delete_policy"
  ON public.lesson_content
  FOR DELETE
  TO service_role
  USING (true);
