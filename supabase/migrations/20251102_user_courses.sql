-- User course enrollments
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON public.user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_enrolled_at ON public.user_courses(enrolled_at DESC);

-- RLS Policies
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.user_courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can enroll themselves
CREATE POLICY "Users can enroll themselves"
  ON public.user_courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollment (for last_accessed_at)
CREATE POLICY "Users can update own enrollments"
  ON public.user_courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_courses_updated_at
  BEFORE UPDATE ON public.user_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_courses_updated_at();
