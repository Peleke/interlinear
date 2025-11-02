-- =============================================================================
-- Lesson Readings System
-- =============================================================================
-- Purpose: Associate lessons with pre-loaded reading texts that users can
-- interact with (click words, listen, etc.) like the /reader view
-- =============================================================================

-- Step 1: Add exercise text fields (spanish_text, english_text)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS spanish_text TEXT,
ADD COLUMN IF NOT EXISTS english_text TEXT;

COMMENT ON COLUMN exercises.spanish_text IS 'The Spanish text to translate (for ES→EN exercises)';
COMMENT ON COLUMN exercises.english_text IS 'The English text to translate (for EN→ES exercises)';

-- Step 2: Create library_readings table for lesson-associated texts
-- These are NOT user-specific, they're curated content for lessons
CREATE TABLE IF NOT EXISTS library_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  author TEXT,
  source TEXT,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  difficulty_level TEXT, -- A1, A2, B1, B2, C1, C2
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE library_readings IS 'Pre-loaded reading texts for lessons (not user-specific)';
COMMENT ON COLUMN library_readings.content IS 'Full text content with word-level tokenization support';
COMMENT ON COLUMN library_readings.difficulty_level IS 'CEFR level (A1-C2) matching lesson levels';

-- Step 3: Create junction table to associate lessons with readings
CREATE TABLE IF NOT EXISTS lesson_readings (
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  reading_id UUID REFERENCES library_readings(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (lesson_id, reading_id)
);

COMMENT ON TABLE lesson_readings IS 'Associates lessons with related reading texts';
COMMENT ON COLUMN lesson_readings.is_required IS 'Whether completing this reading is required for lesson completion';

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_readings_difficulty ON library_readings(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_library_readings_language ON library_readings(language);
CREATE INDEX IF NOT EXISTS idx_lesson_readings_lesson ON lesson_readings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_readings_reading ON lesson_readings(reading_id);

-- Step 5: Enable RLS (Row Level Security)
ALTER TABLE library_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_readings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to READ library_readings and lesson_readings
CREATE POLICY "Allow authenticated users to read library readings"
  ON library_readings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read lesson-reading associations"
  ON lesson_readings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can INSERT/UPDATE/DELETE (managed via seed scripts)
CREATE POLICY "Only service role can modify library readings"
  ON library_readings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can modify lesson-reading associations"
  ON lesson_readings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
