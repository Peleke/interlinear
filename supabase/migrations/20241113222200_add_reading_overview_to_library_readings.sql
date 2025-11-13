-- Add reading_overview column to library_readings table (CORRECT TABLE!)
-- This allows custom markdown descriptions for readings instead of generic ones

-- First, remove the column from the wrong table (lesson_readings)
ALTER TABLE lesson_readings
DROP COLUMN IF EXISTS reading_overview;

-- Add the column to the correct table (library_readings)
ALTER TABLE library_readings
ADD COLUMN IF NOT EXISTS reading_overview TEXT;

COMMENT ON COLUMN library_readings.reading_overview IS 'Custom markdown description for reading (overrides generic description when present)';