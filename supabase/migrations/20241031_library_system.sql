-- Create library_texts table
CREATE TABLE public.library_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 50000)
);

-- Update vocabulary table
ALTER TABLE public.vocabulary
ADD COLUMN source_text_id UUID REFERENCES public.library_texts(id) ON DELETE SET NULL,
ADD COLUMN original_sentence TEXT;

-- Create indexes for performance
CREATE INDEX idx_library_texts_user_id ON public.library_texts(user_id);
CREATE INDEX idx_library_texts_created_at ON public.library_texts(created_at DESC);
CREATE INDEX idx_vocabulary_source_text_id ON public.vocabulary(source_text_id);

-- Enable Row Level Security
ALTER TABLE public.library_texts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_texts
CREATE POLICY "Users can view own texts"
  ON public.library_texts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own texts"
  ON public.library_texts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own texts"
  ON public.library_texts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own texts"
  ON public.library_texts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.library_texts IS 'User-saved texts for language learning';
COMMENT ON COLUMN public.vocabulary.source_text_id IS 'Links vocabulary word to source text';
COMMENT ON COLUMN public.vocabulary.original_sentence IS 'Sentence where word was encountered';
