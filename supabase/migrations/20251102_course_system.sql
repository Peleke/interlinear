-- Migration: Course System Schema
-- Created: 2025-11-02
-- Description: Create course system tables, extend user profiles, add RLS policies and triggers

-- =============================================================================
-- USER PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  last_activity_date TIMESTAMPTZ,
  goals TEXT[] DEFAULT '{}', -- ['travel', 'conversation', etc.]
  assessed_level TEXT CHECK (assessed_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'UTC', -- IANA timezone string (e.g., 'America/New_York')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- COURSES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')) UNIQUE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LESSONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY, -- Custom ID from YAML for idempotency
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  xp_value INTEGER NOT NULL DEFAULT 100,
  sequence_order INTEGER NOT NULL,
  grammar_content JSONB NOT NULL DEFAULT '{"markdown": ""}',
  vocabulary JSONB NOT NULL DEFAULT '[]', -- Array of {word, translation, example}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique ordering within course
  UNIQUE(course_id, sequence_order)
);

-- =============================================================================
-- GRAMMAR POINTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.grammar_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  overview TEXT NOT NULL,
  examples TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LESSON GRAMMAR POINTS (JUNCTION TABLE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_grammar_points (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  grammar_point_id UUID NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, grammar_point_id)
);

-- =============================================================================
-- EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fill_blank', 'multiple_choice', 'translation')),
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB, -- Array of strings for multiple choice
  xp_value INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LESSON COMPLETIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  xp_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- User can only complete a lesson once
  UNIQUE(user_id, lesson_id)
);

-- =============================================================================
-- EXERCISE ATTEMPTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GRAMMAR MASTERY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.grammar_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grammar_point_id UUID NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  last_practiced TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One mastery record per user per grammar point
  UNIQUE(user_id, grammar_point_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_sequence ON public.lessons(course_id, sequence_order);
CREATE INDEX idx_exercises_lesson_id ON public.exercises(lesson_id);
CREATE INDEX idx_lesson_completions_user_id ON public.lesson_completions(user_id);
CREATE INDEX idx_lesson_completions_lesson_id ON public.lesson_completions(lesson_id);
CREATE INDEX idx_exercise_attempts_user_id ON public.exercise_attempts(user_id);
CREATE INDEX idx_exercise_attempts_exercise_id ON public.exercise_attempts(exercise_id);
CREATE INDEX idx_grammar_mastery_user_id ON public.grammar_mastery(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- User Profiles: Users can only access their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Courses: Public read, admin write
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

-- Lessons: Public read, admin write
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

-- Grammar Points: Public read, admin write
ALTER TABLE public.grammar_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view grammar points"
  ON public.grammar_points FOR SELECT
  TO authenticated
  USING (true);

-- Lesson Grammar Points: Public read, admin write
ALTER TABLE public.lesson_grammar_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson grammar points"
  ON public.lesson_grammar_points FOR SELECT
  TO authenticated
  USING (true);

-- Exercises: Public read, admin write
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- Lesson Completions: Users can only access their own completions
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON public.lesson_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Exercise Attempts: Users can only access their own attempts
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.exercise_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.exercise_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grammar Mastery: Users can only access their own mastery data
ALTER TABLE public.grammar_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mastery"
  ON public.grammar_mastery FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mastery"
  ON public.grammar_mastery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mastery"
  ON public.grammar_mastery FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
