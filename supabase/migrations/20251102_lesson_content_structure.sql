-- Migration: Lesson Content Structure
-- Created: 2025-11-02
-- Description: Add grammar_concepts, vocabulary, and lesson relationship tables

-- =============================================================================
-- LESSON VOCABULARY ITEMS TABLE (Normalized, shared across lessons)
-- Note: Different from user-specific 'vocabulary' table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spanish TEXT NOT NULL,
  english TEXT NOT NULL,
  part_of_speech TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Natural key for lookup-or-create
  UNIQUE(spanish, english)
);

-- =============================================================================
-- GRAMMAR CONCEPTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.grammar_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  -- e.g., "verb_ser_present"
  display_name TEXT NOT NULL,  -- e.g., "El verbo SER - Present Tense"
  description TEXT,
  content TEXT,  -- Rich markdown content
  associated_vocab_ids UUID[],  -- Array of lesson_vocabulary_items.id
  related_grammar_ids UUID[],   -- Array of grammar_concepts.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LESSON VOCABULARY (Junction Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_vocabulary (
  lesson_id TEXT NOT NULL, -- References lessons.id (TEXT from course_system)
  vocabulary_id UUID NOT NULL REFERENCES public.lesson_vocabulary_items(id) ON DELETE CASCADE,
  is_new BOOLEAN NOT NULL DEFAULT true,  -- New in this lesson vs review
  PRIMARY KEY (lesson_id, vocabulary_id)
);

-- =============================================================================
-- LESSON GRAMMAR CONCEPTS (Junction Table)
-- =============================================================================
-- Note: This replaces the old lesson_grammar_points table
-- We'll keep both for now to avoid breaking existing code
CREATE TABLE IF NOT EXISTS public.lesson_grammar_concepts (
  lesson_id TEXT NOT NULL, -- References lessons.id (TEXT from course_system)
  grammar_concept_id UUID NOT NULL REFERENCES public.grammar_concepts(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, grammar_concept_id)
);

-- =============================================================================
-- LESSON DIALOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_dialogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL, -- References lessons.id
  context TEXT NOT NULL,  -- Dialog context/setting
  setting TEXT,  -- Physical setting description
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DIALOG EXCHANGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dialog_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialog_id UUID NOT NULL REFERENCES public.lesson_dialogs(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,  -- Order in dialog
  speaker TEXT NOT NULL,  -- Speaker name
  spanish TEXT NOT NULL,
  english TEXT NOT NULL,

  UNIQUE(dialog_id, sequence_order)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_lesson_vocabulary_items_spanish ON public.lesson_vocabulary_items(spanish);
CREATE INDEX idx_lesson_vocabulary_items_english ON public.lesson_vocabulary_items(english);
CREATE INDEX idx_grammar_concepts_name ON public.grammar_concepts(name);
CREATE INDEX idx_lesson_vocabulary_lesson_id ON public.lesson_vocabulary(lesson_id);
CREATE INDEX idx_lesson_vocabulary_vocab_id ON public.lesson_vocabulary(vocabulary_id);
CREATE INDEX idx_lesson_grammar_concepts_lesson_id ON public.lesson_grammar_concepts(lesson_id);
CREATE INDEX idx_lesson_grammar_concepts_concept_id ON public.lesson_grammar_concepts(grammar_concept_id);
CREATE INDEX idx_lesson_dialogs_lesson_id ON public.lesson_dialogs(lesson_id);
CREATE INDEX idx_dialog_exchanges_dialog_id ON public.dialog_exchanges(dialog_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Lesson Vocabulary Items: Public read (all users can view)
ALTER TABLE public.lesson_vocabulary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson vocabulary items"
  ON public.lesson_vocabulary_items FOR SELECT
  TO authenticated
  USING (true);

-- Grammar Concepts: Public read
ALTER TABLE public.grammar_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grammar concepts"
  ON public.grammar_concepts FOR SELECT
  TO authenticated
  USING (true);

-- Lesson Vocabulary: Public read
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson vocabulary"
  ON public.lesson_vocabulary FOR SELECT
  TO authenticated
  USING (true);

-- Lesson Grammar Concepts: Public read
ALTER TABLE public.lesson_grammar_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson grammar concepts"
  ON public.lesson_grammar_concepts FOR SELECT
  TO authenticated
  USING (true);

-- Lesson Dialogs: Public read
ALTER TABLE public.lesson_dialogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson dialogs"
  ON public.lesson_dialogs FOR SELECT
  TO authenticated
  USING (true);

-- Dialog Exchanges: Public read
ALTER TABLE public.dialog_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dialog exchanges"
  ON public.dialog_exchanges FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_lesson_vocabulary_items_updated_at
  BEFORE UPDATE ON public.lesson_vocabulary_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grammar_concepts_updated_at
  BEFORE UPDATE ON public.grammar_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.lesson_vocabulary_items IS 'Normalized vocabulary items used across lessons (separate from user vocabulary)';
COMMENT ON TABLE public.grammar_concepts IS 'Grammar concept definitions with rich content';
COMMENT ON TABLE public.lesson_vocabulary IS 'Junction table linking lessons to vocabulary items';
COMMENT ON TABLE public.lesson_grammar_concepts IS 'Junction table linking lessons to grammar concepts';
COMMENT ON TABLE public.lesson_dialogs IS 'Dialog contexts for each lesson';
COMMENT ON TABLE public.dialog_exchanges IS 'Individual dialog exchanges within a dialog';

COMMENT ON COLUMN public.lesson_vocabulary_items.spanish IS 'Spanish word or phrase';
COMMENT ON COLUMN public.lesson_vocabulary_items.english IS 'English translation';
COMMENT ON COLUMN public.grammar_concepts.name IS 'Unique identifier for grammar concept (e.g., verb_ser_present)';
COMMENT ON COLUMN public.grammar_concepts.content IS 'Markdown content explaining the grammar concept';
COMMENT ON COLUMN public.lesson_vocabulary.is_new IS 'True if this is the first lesson introducing this vocabulary';
