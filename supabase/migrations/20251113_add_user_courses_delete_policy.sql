-- Migration: Add DELETE policy for user_courses
-- Created: 2025-11-13
-- Description: Allow users to delete their own enrollment records (for unenrollment)

-- Users can delete their own enrollments
CREATE POLICY "Users can delete own enrollments"
  ON public.user_courses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);