-- Create vocabulary table
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition JSONB,
  click_count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Indexes for performance
CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_last_seen ON public.vocabulary(last_seen DESC);
CREATE INDEX idx_vocabulary_click_count ON public.vocabulary(click_count DESC);

-- Enable RLS
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own vocabulary"
  ON public.vocabulary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
  ON public.vocabulary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
  ON public.vocabulary
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary"
  ON public.vocabulary
  FOR DELETE
  USING (auth.uid() = user_id);
