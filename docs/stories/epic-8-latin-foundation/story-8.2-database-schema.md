# Story 8.2: Database Schema Creation

## Story
**As a** developer
**I want to** create database tables for the hybrid dictionary cache
**So that** we can store enriched dictionary entries with CLTK morphological data

## Priority
**P0 - Epic 8, Story 2**

## Estimated Time
1 hour

## Dependencies
Story 8.1 (need to understand data structure)

## Acceptance Criteria
- [ ] Database migration creates all required tables
- [ ] `dictionary_entries` table exists with proper columns
- [ ] `translation_cache` table exists (for future Norwegian translations)
- [ ] `cltk_analysis_cache` table exists (for CLTK results)
- [ ] Indexes created for performance
- [ ] RLS policies configured

## Technical Details

### Tables to Create

**1. dictionary_entries** (main cache)
- Language-agnostic design (supports 'la', 'on', 'grc', etc.)
- Stores word, lemma, POS, gender, declension
- JSONB inflections field for morphology
- Lookup count for popularity tracking

**2. translation_cache**
- For non-English source dictionaries (future: Norwegian → English)
- Source/target language pairs
- Translation service tracking

**3. cltk_analysis_cache**
- Expensive CLTK computations
- Full analysis JSON
- Denormalized quick-access fields

### Migration File
**File**: `supabase/migrations/20251110_latin_dictionary_schema.sql`

See EPIC-BREAKDOWN-LATIN.md Story 8.2 for complete SQL schema.

## Testing Checklist
- [ ] Tables created successfully
- [ ] Can insert test entry
- [ ] Can query by language
- [ ] Unique constraint works (duplicate word fails)
- [ ] Indexes exist
- [ ] Functions work: `SELECT * FROM get_dictionary_stats('la')`

## Architecture References
- `/docs/PRD-v3-LATIN.md` - Hybrid dictionary architecture
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.2 details

## Definition of Done
- [ ] Migration file created and tested locally
- [ ] All three tables created with proper columns
- [ ] Indexes and constraints in place
- [ ] RLS policies configured
- [ ] Utility functions created (stats, popular words)
- [ ] Migration applied to Supabase successfully

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Created migration file
- [ ] Defined dictionary_entries schema
- [ ] Defined translation_cache schema
- [ ] Defined cltk_analysis_cache schema
- [ ] Created indexes
- [ ] Created RLS policies
- [ ] Created utility functions
- [ ] Applied migration

### Status
**Status**: Draft
