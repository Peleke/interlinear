-- EPIC-07: Story 7.1 - AI Generations Table for LLM Content Generation
-- Tracks all AI-generated content (vocabulary, grammar, exercises) with cost and metadata

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('vocabulary', 'grammar', 'exercises', 'complete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'streaming', 'completed', 'failed', 'cancelled')),
  input_data JSONB NOT NULL,
  output_data JSONB,
  tokens_used INTEGER CHECK (tokens_used >= 0),
  cost_usd DECIMAL(10,6) CHECK (cost_usd >= 0),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_ai_generations_lesson_id ON ai_generations(lesson_id);
CREATE INDEX idx_ai_generations_type_status ON ai_generations(generation_type, status);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX idx_ai_generations_created_by ON ai_generations(created_by) WHERE created_by IS NOT NULL;

-- Composite index for lesson generation history
CREATE INDEX idx_ai_generations_lesson_history ON ai_generations(lesson_id, generation_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Authors can view their own generation history
CREATE POLICY "Authors can view own generations"
  ON ai_generations
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    lesson_id IN (
      SELECT id FROM lessons WHERE created_by = auth.uid()
    )
  );

-- Policy: Authors can create generations for their own lessons
CREATE POLICY "Authors can create generations"
  ON ai_generations
  FOR INSERT
  WITH CHECK (
    lesson_id IN (
      SELECT id FROM lessons WHERE created_by = auth.uid()
    )
  );

-- Policy: Authors can update their own generations
CREATE POLICY "Authors can update own generations"
  ON ai_generations
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    lesson_id IN (
      SELECT id FROM lessons WHERE created_by = auth.uid()
    )
  );

-- Function to calculate cost tracking statistics
CREATE OR REPLACE FUNCTION get_generation_cost_stats(
  p_author_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_generations BIGINT,
  total_cost_usd DECIMAL,
  avg_cost_per_generation DECIMAL,
  total_tokens BIGINT,
  by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_generations,
    COALESCE(SUM(cost_usd), 0)::DECIMAL as total_cost_usd,
    COALESCE(AVG(cost_usd), 0)::DECIMAL as avg_cost_per_generation,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    jsonb_object_agg(
      generation_type,
      jsonb_build_object(
        'count', count,
        'cost', cost,
        'tokens', tokens
      )
    ) as by_type
  FROM (
    SELECT
      generation_type,
      COUNT(*)::BIGINT as count,
      COALESCE(SUM(cost_usd), 0)::DECIMAL as cost,
      COALESCE(SUM(tokens_used), 0)::BIGINT as tokens
    FROM ai_generations
    WHERE
      created_at BETWEEN p_start_date AND p_end_date
      AND status = 'completed'
      AND (p_author_id IS NULL OR created_by = p_author_id)
    GROUP BY generation_type
  ) subquery;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_generation_cost_stats TO authenticated;

COMMENT ON TABLE ai_generations IS 'Tracks AI-generated lesson content with cost and metadata';
COMMENT ON COLUMN ai_generations.generation_type IS 'Type of content: vocabulary, grammar, exercises, or complete';
COMMENT ON COLUMN ai_generations.status IS 'Current status: pending, streaming, completed, failed, cancelled';
COMMENT ON COLUMN ai_generations.input_data IS 'Input parameters for generation (reading text, target CEFR, etc)';
COMMENT ON COLUMN ai_generations.output_data IS 'Generated content in structured format';
COMMENT ON COLUMN ai_generations.tokens_used IS 'Total tokens consumed (input + output)';
COMMENT ON COLUMN ai_generations.cost_usd IS 'Cost in USD based on model pricing';
