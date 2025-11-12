-- Fix lesson_readings updated_at trigger issue
-- The actual table has no updated_at column, so remove the broken trigger

-- Drop the broken trigger that tries to set non-existent updated_at column
DROP TRIGGER IF EXISTS update_lesson_readings_updated_at ON public.lesson_readings;

-- The table structure is:
-- lesson_id, reading_id, display_order, is_required, created_at
-- No updated_at column exists, so no trigger needed