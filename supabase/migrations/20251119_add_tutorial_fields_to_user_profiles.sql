-- Migration: Add Tutorial Fields to User Profiles
-- Created: 2025-11-19
-- Description: Add tutorial state tracking fields to user_profiles table

-- Add tutorial tracking fields to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tutorial_step INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_tutorial_seen TIMESTAMPTZ DEFAULT NULL;

-- Create an index for tutorial queries (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_tutorial_completed
  ON public.user_profiles(tutorial_completed)
  WHERE tutorial_completed = FALSE;

-- Comments for documentation
COMMENT ON COLUMN public.user_profiles.tutorial_completed IS 'Whether the user has completed the onboarding tutorial';
COMMENT ON COLUMN public.user_profiles.tutorial_step IS 'Current step in tutorial (1-4), NULL if not active';
COMMENT ON COLUMN public.user_profiles.last_tutorial_seen IS 'Timestamp of last tutorial interaction';