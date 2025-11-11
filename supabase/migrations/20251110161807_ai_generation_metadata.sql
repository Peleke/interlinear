-- Migration: AI Content Generation Metadata
-- Epic 7: LLM Content Generation - Mastra Architecture
-- Description: Adds AI metadata tracking to existing tables and creates generation logs table
-- See: docs/prd/EPIC_7_MASTRA_ARCHITECTURE.md

-- ============================================================================
-- 1. Add AI metadata columns to existing content tables
-- ============================================================================

-- Lesson vocabulary items: Track AI-generated vocabulary
-- Table name: lesson_vocabulary_items (from 20251102_lesson_content_structure.sql)
ALTER TABLE public.lesson_vocabulary_items
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

COMMENT ON COLUMN public.lesson_vocabulary_items.ai_generated IS 'Whether this vocabulary item was AI-generated';
COMMENT ON COLUMN public.lesson_vocabulary_items.ai_metadata IS 'AI generation metadata: {model, workflow_run_id, prompt_version, timestamp, human_edited, confidence_score}';

-- Grammar concepts: Track AI-generated grammar concepts
-- Table name: grammar_concepts (from 20251102_lesson_content_structure.sql)
ALTER TABLE public.grammar_concepts
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

COMMENT ON COLUMN public.grammar_concepts.ai_generated IS 'Whether this grammar concept was AI-generated';
COMMENT ON COLUMN public.grammar_concepts.ai_metadata IS 'AI generation metadata: {model, workflow_run_id, prompt_version, timestamp, human_edited, confidence_score}';

-- Exercises: Track AI-generated exercises
-- Table name: exercises (from 20251102_course_system.sql)
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

COMMENT ON COLUMN public.exercises.ai_generated IS 'Whether this exercise was AI-generated';
COMMENT ON COLUMN public.exercises.ai_metadata IS 'AI generation metadata: {model, workflow_run_id, prompt_version, timestamp, human_edited, confidence_score}';

-- ============================================================================
-- 2. Create AI generation logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE SET NULL,
  reading_id UUID REFERENCES public.library_readings(id) ON DELETE SET NULL,

  -- Workflow tracking
  workflow_run_id TEXT NOT NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('vocabulary', 'grammar', 'exercises', 'full-workflow')),
  workflow_step TEXT,  -- e.g., 'extractVocabulary', 'identifyGrammar'

  -- Model usage
  model TEXT NOT NULL,  -- e.g., 'claude-sonnet-3.5', 'gpt-4-turbo'
  provider TEXT NOT NULL,  -- e.g., 'anthropic', 'openai'
  prompt_version TEXT DEFAULT 'v1.0',

  -- Token usage (for cost tracking)
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,

  -- Cost tracking
  estimated_cost_usd DECIMAL(10, 6),  -- Calculated from token counts + model pricing

  -- Performance
  duration_seconds INTEGER,  -- Time taken for generation step

  -- Status
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,

  -- User review outcome (for quality tracking)
  approved BOOLEAN,  -- Did user approve the generated content?
  rejection_reason TEXT,  -- Why was it rejected (if applicable)
  items_edited INTEGER DEFAULT 0,  -- How many items did user edit before approving

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.ai_generation_logs IS 'Tracks all AI content generation attempts for cost monitoring, quality analytics, and debugging';

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_workflow_run_id ON public.ai_generation_logs(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_lesson_id ON public.ai_generation_logs(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_logs_generation_type ON public.ai_generation_logs(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON public.ai_generation_logs(success);

-- Composite index for common query pattern: user's recent successful generations
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_success_date
  ON public.ai_generation_logs(user_id, success, created_at DESC);

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own AI generation logs
CREATE POLICY "Users can view own AI logs"
  ON public.ai_generation_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: System can insert AI logs (authenticated users only)
CREATE POLICY "System can insert AI logs"
  ON public.ai_generation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own logs (for review outcomes)
CREATE POLICY "Users can update own AI logs"
  ON public.ai_generation_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. Create helper functions
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_ai_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_generation_logs_updated_at
  BEFORE UPDATE ON public.ai_generation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_log_updated_at();

-- Function: Calculate estimated cost from token usage
-- Pricing as of 2025-01-10 (update as needed):
-- - Claude Sonnet 3.5: $3/1M input, $15/1M output
-- - GPT-4 Turbo: $10/1M input, $30/1M output
CREATE OR REPLACE FUNCTION calculate_generation_cost(
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
)
RETURNS DECIMAL(10, 6) AS $$
DECLARE
  input_cost DECIMAL(10, 6);
  output_cost DECIMAL(10, 6);
BEGIN
  -- Claude Sonnet 3.5 pricing
  IF p_model LIKE '%claude-sonnet%' THEN
    input_cost := (p_prompt_tokens::DECIMAL / 1000000) * 3;
    output_cost := (p_completion_tokens::DECIMAL / 1000000) * 15;

  -- GPT-4 Turbo pricing
  ELSIF p_model LIKE '%gpt-4-turbo%' THEN
    input_cost := (p_prompt_tokens::DECIMAL / 1000000) * 10;
    output_cost := (p_completion_tokens::DECIMAL / 1000000) * 30;

  -- GPT-4o pricing (cheaper alternative)
  ELSIF p_model LIKE '%gpt-4o%' THEN
    input_cost := (p_prompt_tokens::DECIMAL / 1000000) * 2.5;
    output_cost := (p_completion_tokens::DECIMAL / 1000000) * 10;

  -- Default: Conservative estimate
  ELSE
    input_cost := (p_prompt_tokens::DECIMAL / 1000000) * 5;
    output_cost := (p_completion_tokens::DECIMAL / 1000000) * 20;
  END IF;

  RETURN input_cost + output_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_generation_cost IS 'Calculate estimated USD cost from token usage based on model pricing';

-- ============================================================================
-- 6. Create materialized view for cost analytics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.ai_generation_stats AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) AS date,
  generation_type,
  model,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful_requests,
  COUNT(*) FILTER (WHERE approved = TRUE) AS approved_by_user,
  SUM(total_tokens) AS total_tokens_used,
  SUM(estimated_cost_usd) AS total_cost_usd,
  AVG(duration_seconds) AS avg_duration_seconds,
  AVG(items_edited) FILTER (WHERE approved = TRUE) AS avg_items_edited
FROM public.ai_generation_logs
GROUP BY user_id, DATE_TRUNC('day', created_at), generation_type, model;

CREATE UNIQUE INDEX idx_ai_stats_unique
  ON public.ai_generation_stats(user_id, date, generation_type, model);

COMMENT ON MATERIALIZED VIEW public.ai_generation_stats IS 'Daily aggregated AI generation statistics per user for analytics dashboard';

-- Refresh policy: Refresh stats daily
CREATE OR REPLACE FUNCTION refresh_ai_generation_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ai_generation_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Example ai_metadata structure:
-- {
--   "model": "claude-sonnet-3.5",
--   "provider": "anthropic",
--   "workflow_run_id": "wf_abc123xyz",
--   "workflow_step": "extractVocabulary",
--   "prompt_version": "v1.0",
--   "generation_timestamp": "2025-01-10T12:00:00Z",
--   "human_edited": false,
--   "confidence_score": 0.95,
--   "prompt_tokens": 1500,
--   "completion_tokens": 800
-- }
