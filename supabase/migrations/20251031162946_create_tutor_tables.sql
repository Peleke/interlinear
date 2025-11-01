-- Epic 6: AI Tutor Mode - Database Schema
-- Story 6.1: Database Migrations for Tutor Sessions

-- ============================================================================
-- TABLE: tutor_sessions
-- ============================================================================
-- Stores AI tutor conversation sessions linked to library texts

CREATE TABLE public.tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID NOT NULL REFERENCES public.library_texts(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_tokens INT DEFAULT 0,

  -- Constraints
  CONSTRAINT valid_level CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT valid_tokens CHECK (total_tokens >= 0)
);

-- ============================================================================
-- TABLE: dialog_turns
-- ============================================================================
-- Stores individual conversation turns within a tutor session

CREATE TABLE public.dialog_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  ai_message TEXT NOT NULL,
  user_response TEXT,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_turn CHECK (turn_number > 0),
  CONSTRAINT valid_turn_tokens CHECK (tokens_used >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_sessions_user_id ON public.tutor_sessions(user_id);
CREATE INDEX idx_sessions_text_id ON public.tutor_sessions(text_id);
CREATE INDEX idx_turns_session_id ON public.dialog_turns(session_id);
CREATE INDEX idx_sessions_completed ON public.tutor_sessions(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialog_turns ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can view own sessions
CREATE POLICY "Users can view own sessions"
  ON public.tutor_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Sessions: Users can insert own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.tutor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sessions: Users can update own sessions
CREATE POLICY "Users can update own sessions"
  ON public.tutor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Turns: Users can view own turns (via session ownership)
CREATE POLICY "Users can view own turns"
  ON public.dialog_turns FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.tutor_sessions WHERE id = session_id));

-- Turns: Users can insert own turns (via session ownership)
CREATE POLICY "Users can insert own turns"
  ON public.dialog_turns FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.tutor_sessions WHERE id = session_id));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tutor_sessions IS 'AI tutor conversation sessions linked to library texts';
COMMENT ON TABLE public.dialog_turns IS 'Individual conversation turns within tutor sessions';
COMMENT ON COLUMN public.tutor_sessions.level IS 'CEFR level: A1, A2, B1, B2, C1, C2';
COMMENT ON COLUMN public.tutor_sessions.total_tokens IS 'Total OpenAI tokens consumed in this session';
COMMENT ON COLUMN public.dialog_turns.turn_number IS 'Sequential turn number starting from 1';
COMMENT ON COLUMN public.dialog_turns.tokens_used IS 'OpenAI tokens consumed in this turn';
