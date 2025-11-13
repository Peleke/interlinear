-- Add reading_overview column to lesson_readings table
-- This will store markdown text that replaces the generic description in lesson views

ALTER TABLE lesson_readings
ADD COLUMN reading_overview TEXT;

-- Add comment for documentation
COMMENT ON COLUMN lesson_readings.reading_overview IS 'Markdown description that replaces generic text in lesson preview and detail views when present';