-- Migration: Add INSERT/UPDATE/DELETE policies for grammar_concepts
-- Created: 2025-11-11
-- Epic: EPIC-7 (LLM Content Generation)
-- Description: Allow authenticated users to create/modify grammar concepts
--
-- Issue: Bug 7.5.8 - RLS policy blocking grammar concept creation

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authors can create grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can update grammar concepts" ON public.grammar_concepts;
DROP POLICY IF EXISTS "Authors can delete grammar concepts" ON public.grammar_concepts;

-- INSERT: Authenticated users can create grammar concepts
-- (Grammar concepts are shared resources, not user-owned)
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
-- (In production, might want to restrict this further)
CREATE POLICY "Authors can delete grammar concepts"
  ON public.grammar_concepts
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.grammar_concepts IS 'Grammar concepts with RLS: authenticated users can CRUD, everyone can read';
