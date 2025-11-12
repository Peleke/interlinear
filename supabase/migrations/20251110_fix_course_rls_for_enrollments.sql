-- Migration: Fix Course RLS for Student Enrollments
-- Created: 2025-11-10
-- Description: Allow students to view courses they're enrolled in via user_courses table

-- Add policy for students to view enrolled courses
CREATE POLICY "Users can view enrolled courses"
  ON public.courses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_courses
      WHERE user_courses.course_id = courses.id
      AND user_courses.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view enrolled courses" ON public.courses IS
  'Allows students to view courses they are enrolled in via user_courses junction table';
