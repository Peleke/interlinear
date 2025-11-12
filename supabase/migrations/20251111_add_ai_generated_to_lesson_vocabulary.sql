-- Migration: Add AI metadata to lesson_vocabulary junction table
-- Date: 2025-11-11
-- Description: Add ai_generated and ai_metadata columns to lesson_vocabulary for tracking

ALTER TABLE public.lesson_vocabulary
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

COMMENT ON COLUMN public.lesson_vocabulary.ai_generated IS 'Whether this vocabulary-lesson association was AI-generated';
COMMENT ON COLUMN public.lesson_vocabulary.ai_metadata IS 'AI generation metadata for this specific lesson association';
