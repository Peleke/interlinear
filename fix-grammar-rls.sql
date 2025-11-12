-- Quick Fix: Add INSERT/UPDATE/DELETE policies for grammar_concepts
-- Run this directly in your Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authors can create grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can update grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can delete grammar concepts" ON public.grammar_concepts;

-- INSERT: Authenticated users can create grammar concepts
CREATE POLICY "Authors can create grammar concepts"
  ON public.grammar_concepts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Authenticated users can update grammar concepts
CREATE POLICY "Authors can update grammar concepts"
  ON public.grammar_concepts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Authenticated users can delete grammar concepts
CREATE POLICY "Authors can delete grammar concepts"
  ON public.grammar_concepts
  FOR DELETE
  TO authenticated
  USING (true);
