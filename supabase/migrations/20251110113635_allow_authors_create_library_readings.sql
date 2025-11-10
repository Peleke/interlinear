-- Migration: Allow Authors to Create Library Readings
-- Created: 2025-11-10
-- Epic: EPIC-05
-- Description: Allow authenticated authors to create library_readings via API

-- Drop the restrictive service_role-only policy
DROP POLICY IF EXISTS "Only service role can modify library readings" ON library_readings;

-- Create separate policies for different operations
-- Authors can INSERT their own library readings
CREATE POLICY "Authors can create library readings"
  ON library_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authors can UPDATE/DELETE library readings they created
-- (We'll track ownership via a new column in a future migration if needed,
--  for now allow all authenticated users to manage all readings)
CREATE POLICY "Authors can update library readings"
  ON library_readings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authors can delete library readings"
  ON library_readings
  FOR DELETE
  TO authenticated
  USING (true);

-- Service role retains full access
CREATE POLICY "Service role full access to library readings"
  ON library_readings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
