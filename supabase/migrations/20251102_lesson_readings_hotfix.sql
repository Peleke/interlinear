-- Add UNIQUE constraint to library_readings.title for upsert support
ALTER TABLE library_readings
ADD CONSTRAINT library_readings_title_unique UNIQUE (title);
