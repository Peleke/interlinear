-- Generation Jobs Table for Async Content Generation Tracking
-- Epic 7: LLM Content Generation
-- Issue #45: Generate Lesson from Reading

-- Create generation_jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  reading_id UUID REFERENCES library_readings(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  progress JSONB DEFAULT '{}'::jsonb, -- {vocabulary: {status: 'completed', count: 12}, grammar: {status: 'processing'}, ...}
  results JSONB DEFAULT '{}'::jsonb,  -- Final results with counts and execution times
  error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_generation_jobs_lesson ON generation_jobs(lesson_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_by ON generation_jobs(created_by);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Authors can view their own generation jobs
CREATE POLICY "Authors can view own generation jobs"
  ON generation_jobs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Authors can create generation jobs
CREATE POLICY "Authors can create generation jobs"
  ON generation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Authors can update their own generation jobs (for status updates)
CREATE POLICY "Authors can update own generation jobs"
  ON generation_jobs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Comment
COMMENT ON TABLE generation_jobs IS 'Tracks async content generation jobs for lessons';
COMMENT ON COLUMN generation_jobs.progress IS 'Real-time progress tracking: {vocabulary: {status, count}, grammar: {status, count}, ...}';
COMMENT ON COLUMN generation_jobs.results IS 'Final results after completion: {vocabulary: {count, executionTime}, ...}';
