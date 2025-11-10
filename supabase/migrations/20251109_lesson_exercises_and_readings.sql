-- Migration: Lesson Exercises and Readings Tables
-- Created: 2025-11-09
-- Epic: EPIC-03
-- Description: Create lesson_exercises and ensure lesson_readings exists with proper structure

-- =============================================================================
-- LESSON EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL, -- References lessons.id
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('fill_blank', 'multiple_choice', 'translation')),
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB, -- For multiple_choice: array of options
  spanish_text TEXT, -- For translation exercises
  english_text TEXT, -- For translation exercises
  direction TEXT, -- For translation: 'es_to_en' or 'en_to_es'
  xp_value INTEGER NOT NULL DEFAULT 10,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LESSON READINGS TABLE (ensure exists with correct structure)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL, -- References lessons.id
  reading_id UUID, -- References library_readings.id (optional for linked readings)
  title TEXT NOT NULL,
  author TEXT,
  source TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'is', 'en')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson_id ON public.lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_type ON public.lesson_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_sequence ON public.lesson_exercises(lesson_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_lesson_readings_lesson_id ON public.lesson_readings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_readings_reading_id ON public.lesson_readings(reading_id);
CREATE INDEX IF NOT EXISTS idx_lesson_readings_order ON public.lesson_readings(lesson_id, display_order);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lesson_exercises_updated_at ON public.lesson_exercises;
CREATE TRIGGER update_lesson_exercises_updated_at
  BEFORE UPDATE ON public.lesson_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_readings_updated_at ON public.lesson_readings;
CREATE TRIGGER update_lesson_readings_updated_at
  BEFORE UPDATE ON public.lesson_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_readings ENABLE ROW LEVEL SECURITY;

-- Public read for published lessons (will join with lessons table)
DROP POLICY IF EXISTS "Public read access for exercises" ON public.lesson_exercises;
CREATE POLICY "Public read access for exercises"
  ON public.lesson_exercises FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for readings" ON public.lesson_readings;
CREATE POLICY "Public read access for readings"
  ON public.lesson_readings FOR SELECT
  USING (true);

-- Authors can insert/update/delete their own lesson's exercises
DROP POLICY IF EXISTS "Authors can manage exercises" ON public.lesson_exercises;
CREATE POLICY "Authors can manage exercises"
  ON public.lesson_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_exercises.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );

-- Authors can manage their own lesson's readings
DROP POLICY IF EXISTS "Authors can manage readings" ON public.lesson_readings;
CREATE POLICY "Authors can manage readings"
  ON public.lesson_readings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_readings.lesson_id
      AND lessons.author_id = auth.uid()
    )
  );
