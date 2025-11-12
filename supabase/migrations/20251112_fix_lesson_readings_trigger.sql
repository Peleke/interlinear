-- Fix lesson_readings updated_at trigger issue
-- The trigger is trying to set updated_at column that may not exist in the actual table

-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_lesson_readings_updated_at ON public.lesson_readings;

-- Create a safer trigger that only sets updated_at if the column exists
CREATE OR REPLACE FUNCTION safe_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set updated_at if the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new safe trigger for lesson_readings
CREATE TRIGGER safe_update_lesson_readings_updated_at
  BEFORE UPDATE ON public.lesson_readings
  FOR EACH ROW
  EXECUTE FUNCTION safe_update_updated_at_column();