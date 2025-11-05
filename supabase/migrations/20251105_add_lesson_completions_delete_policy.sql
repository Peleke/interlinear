-- Add DELETE policy for lesson_completions table
-- This allows authenticated users to delete their own lesson completions
-- Required for the "Mark as Incomplete" feature

CREATE POLICY "Users can delete own completions"
ON lesson_completions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
